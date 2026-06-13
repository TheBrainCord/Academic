// Tree-walking interpreter shared by both language front-ends.
//
// Both Arduino's loop() and Python's `while True:` are handled the same way:
// every loop iteration calls ctx.tick(), which advances the virtual clock
// (via delay()/time.sleep()) and counts statement-execution steps. When
// either budget is exhausted, a HaltSignal unwinds cleanly back to
// runProgram() — this is "the sketch ran for a while and we stopped it",
// not an error.

import type { Expr, Stmt } from './ast'

export type RuntimeValue =
  | number
  | string
  | boolean
  | null
  | undefined
  | RuntimeFunction
  | RuntimeObject

export interface RuntimeObject {
  kind: 'object'
  name: string
  props: Map<string, RuntimeValue>
}

export interface NativeFunction {
  kind: 'native'
  name: string
  call: (args: RuntimeValue[], line: number) => RuntimeValue
}

export interface UserFunction {
  kind: 'user'
  name: string
  params: string[]
  body: Stmt[]
}

export type RuntimeFunction = NativeFunction | UserFunction

export function nativeFn(name: string, call: (args: RuntimeValue[], line: number) => RuntimeValue): NativeFunction {
  return { kind: 'native', name, call }
}

export function makeObject(name: string, props: Record<string, RuntimeValue>): RuntimeObject {
  return { kind: 'object', name, props: new Map(Object.entries(props)) }
}

export class SketchRuntimeError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.name = 'SketchRuntimeError'
    this.line = line
  }
}

/** Thrown when the step/time budget runs out — caught at the top level. */
class HaltSignal {}
class ReturnSignal {
  constructor(public value: RuntimeValue) {}
}
class BreakSignal {}
class ContinueSignal {}

export class Env {
  vars = new Map<string, RuntimeValue>()
  constructor(public parent: Env | null = null) {}

  get(name: string, line: number): RuntimeValue {
    let env: Env | null = this
    while (env) {
      if (env.vars.has(name)) return env.vars.get(name)
      env = env.parent
    }
    throw new SketchRuntimeError(`'${name}' is not defined`, line)
  }

  set(name: string, value: RuntimeValue, line: number): void {
    let env: Env | null = this
    while (env) {
      if (env.vars.has(name)) {
        env.vars.set(name, value)
        return
      }
      env = env.parent
    }
    throw new SketchRuntimeError(`'${name}' is not defined`, line)
  }

  define(name: string, value: RuntimeValue): void {
    this.vars.set(name, value)
  }
}

export interface RunBudget {
  maxSteps: number
  /** Virtual milliseconds of delay()/sleep() before the run stops. */
  maxVirtualMs: number
}

export interface RunOutcome {
  /** false if the sketch never called delay()/sleep() and hit the step cap. */
  advancedTime: boolean
  steps: number
  virtualMs: number
}

/**
 * Host hooks the interpreter calls into. advanceTime is invoked by
 * delay()/time.sleep(); the runtime layer uses it to update sensor/actuator
 * state for the new virtual tick.
 */
export interface InterpreterHost {
  advanceTime: (ms: number) => void
}

export class Interpreter {
  globals = new Env()
  steps = 0
  virtualMs = 0
  advancedTime = false

  constructor(private host: InterpreterHost, private budget: RunBudget) {}

  defineGlobal(name: string, value: RuntimeValue): void {
    this.globals.define(name, value)
  }

  advanceTime(ms: number): void {
    this.virtualMs += Math.max(0, ms)
    this.advancedTime = true
    this.host.advanceTime(ms)
    this.checkBudget()
  }

  private checkBudget(): void {
    this.steps++
    if (this.virtualMs >= this.budget.maxVirtualMs) throw new HaltSignal()
    if (this.steps >= this.budget.maxSteps) {
      if (!this.advancedTime) {
        throw new SketchRuntimeError(
          'Your program never calls delay() / time.sleep() — it would run forever without pausing. Add a short delay inside loop().',
          0,
        )
      }
      throw new HaltSignal()
    }
  }

  /** Run setup-style statements once, then call `loop` repeatedly. */
  runProgram(setupBody: Stmt[], loopBody: Stmt[] | null): RunOutcome {
    try {
      for (const stmt of setupBody) this.exec(stmt, this.globals)
      if (loopBody) {
        for (;;) {
          this.checkBudget()
          for (const stmt of loopBody) this.exec(stmt, this.globals)
        }
      }
    } catch (e) {
      if (!(e instanceof HaltSignal)) throw e
    }
    return { advancedTime: this.advancedTime, steps: this.steps, virtualMs: this.virtualMs }
  }

  // --- Statements -----------------------------------------------------------

  exec(stmt: Stmt, env: Env): void {
    this.checkBudget()
    switch (stmt.type) {
      case 'VarDecl':
        env.define(stmt.name, stmt.init ? this.eval(stmt.init, env) : undefined)
        return
      case 'ExprStmt':
        this.eval(stmt.expr, env)
        return
      case 'Block': {
        const child = new Env(env)
        for (const s of stmt.body) this.exec(s, child)
        return
      }
      case 'If': {
        if (truthy(this.eval(stmt.test, env))) this.exec(stmt.consequent, env)
        else if (stmt.alternate) this.exec(stmt.alternate, env)
        return
      }
      case 'While': {
        while (truthy(this.eval(stmt.test, env))) {
          try {
            this.exec(stmt.body, env)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (e instanceof ContinueSignal) continue
            throw e
          }
        }
        return
      }
      case 'For': {
        const child = new Env(env)
        if (stmt.init) this.exec(stmt.init, child)
        while (stmt.test === null || truthy(this.eval(stmt.test, child))) {
          try {
            this.exec(stmt.body, child)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (!(e instanceof ContinueSignal)) throw e
          }
          if (stmt.update) this.exec(stmt.update, child)
        }
        return
      }
      case 'ForRange': {
        const start = asNumber(this.eval(stmt.start, env), stmt.line)
        const stop = asNumber(this.eval(stmt.stop, env), stmt.line)
        const step = stmt.step ? asNumber(this.eval(stmt.step, env), stmt.line) : 1
        if (step === 0) throw new SketchRuntimeError('range() step cannot be 0', stmt.line)
        const child = new Env(env)
        child.define(stmt.name, start)
        for (
          let v = start;
          step > 0 ? v < stop : v > stop;
          v += step
        ) {
          child.vars.set(stmt.name, v)
          try {
            this.exec(stmt.body, child)
          } catch (e) {
            if (e instanceof BreakSignal) break
            if (!(e instanceof ContinueSignal)) throw e
          }
        }
        return
      }
      case 'Return':
        throw new ReturnSignal(stmt.value ? this.eval(stmt.value, env) : undefined)
      case 'Break':
        throw new BreakSignal()
      case 'Continue':
        throw new ContinueSignal()
      case 'FunctionDecl':
        env.define(stmt.name, { kind: 'user', name: stmt.name, params: stmt.params, body: stmt.body })
        return
    }
  }

  // --- Expressions -----------------------------------------------------------

  eval(expr: Expr, env: Env): RuntimeValue {
    switch (expr.type) {
      case 'NumberLiteral':
        return expr.value
      case 'StringLiteral':
        return expr.value
      case 'BoolLiteral':
        return expr.value
      case 'NullLiteral':
        return null
      case 'Identifier':
        return env.get(expr.name, 0)
      case 'Member': {
        const obj = this.eval(expr.object, env)
        if (obj && typeof obj === 'object' && obj.kind === 'object') {
          if (!obj.props.has(expr.property)) {
            throw new SketchRuntimeError(`'${obj.name}' has no member '${expr.property}'`, 0)
          }
          return obj.props.get(expr.property)
        }
        throw new SketchRuntimeError(`Cannot read '.${expr.property}' of this value`, 0)
      }
      case 'Call': {
        const callee = this.eval(expr.callee, env)
        const args = expr.args.map((a) => this.eval(a, env))
        return this.callFunction(callee, args, expr.line)
      }
      case 'Unary': {
        const v = this.eval(expr.argument, env)
        if (expr.op === '-') return -asNumber(v, 0)
        if (expr.op === '+') return asNumber(v, 0)
        return !truthy(v)
      }
      case 'Update': {
        const current = asNumber(this.eval(expr.argument, env), 0)
        const next = expr.op === '++' ? current + 1 : current - 1
        this.assignTo(expr.argument, next, env)
        return expr.prefix ? next : current
      }
      case 'Binary':
        return this.evalBinary(expr.op, this.eval(expr.left, env), this.eval(expr.right, env))
      case 'Logical': {
        const left = this.eval(expr.left, env)
        if (expr.op === '&&') return truthy(left) ? this.eval(expr.right, env) : left
        return truthy(left) ? left : this.eval(expr.right, env)
      }
      case 'Assign': {
        let value: RuntimeValue
        if (expr.op === '=') {
          value = this.eval(expr.value, env)
        } else {
          const current = this.eval(expr.target, env)
          const rhs = this.eval(expr.value, env)
          const op = expr.op[0]
          value = this.evalBinary(op, current, rhs)
        }
        this.assignTo(expr.target, value, env)
        return value
      }
    }
  }

  private assignTo(target: Expr, value: RuntimeValue, env: Env): void {
    if (target.type === 'Identifier') {
      env.set(target.name, value, 0)
      return
    }
    if (target.type === 'Member') {
      const obj = this.eval(target.object, env)
      if (obj && typeof obj === 'object' && obj.kind === 'object') {
        obj.props.set(target.property, value)
        return
      }
    }
    throw new SketchRuntimeError('Invalid assignment target', 0)
  }

  callFunction(callee: RuntimeValue, args: RuntimeValue[], line: number): RuntimeValue {
    if (!callee || typeof callee !== 'object' || (callee.kind !== 'native' && callee.kind !== 'user')) {
      throw new SketchRuntimeError('Tried to call something that is not a function', line)
    }
    if (callee.kind === 'native') return callee.call(args, line)
    const fnEnv = new Env(this.globals)
    callee.params.forEach((p, i) => fnEnv.define(p, args[i]))
    try {
      for (const stmt of callee.body) this.exec(stmt, fnEnv)
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value
      throw e
    }
    return undefined
  }

  private evalBinary(op: string, l: RuntimeValue, r: RuntimeValue): RuntimeValue {
    if (op === '+' && (typeof l === 'string' || typeof r === 'string')) {
      return `${stringify(l)}${stringify(r)}`
    }
    switch (op) {
      case '+':
        return asNumber(l, 0) + asNumber(r, 0)
      case '-':
        return asNumber(l, 0) - asNumber(r, 0)
      case '*':
        return asNumber(l, 0) * asNumber(r, 0)
      case '/':
        return asNumber(l, 0) / asNumber(r, 0)
      case '%':
        return asNumber(l, 0) % asNumber(r, 0)
      case '//':
        return Math.floor(asNumber(l, 0) / asNumber(r, 0))
      case '==':
        return l === r
      case '!=':
        return l !== r
      case '<':
        return asNumber(l, 0) < asNumber(r, 0)
      case '<=':
        return asNumber(l, 0) <= asNumber(r, 0)
      case '>':
        return asNumber(l, 0) > asNumber(r, 0)
      case '>=':
        return asNumber(l, 0) >= asNumber(r, 0)
      default:
        throw new SketchRuntimeError(`Unknown operator '${op}'`, 0)
    }
  }
}

export function truthy(v: RuntimeValue): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  return Boolean(v)
}

export function asNumber(v: RuntimeValue, line: number): number {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  throw new SketchRuntimeError(`Expected a number but got ${describe(v)}`, line)
}

export function stringify(v: RuntimeValue): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (typeof v === 'object' && v.kind === 'object') return `[${v.name}]`
  return String(v)
}

function describe(v: RuntimeValue): string {
  if (v === null) return 'null'
  if (v === undefined) return 'nothing'
  if (typeof v === 'object') return v.kind === 'object' ? `object ${v.name}` : `function ${v.name}`
  return typeof v
}
