// Orchestration: parse a student's source code for the chosen language,
// split it into a "setup" (run once) and "loop" (run repeatedly) section,
// run it through the shared interpreter against the wired circuit, and
// return a result the UI can render (serial output, actuator/reading
// state, pin modes, and any syntax/runtime error with a line number).

import type { Circuit } from '@/types/simulator'
import type { Expr, Stmt } from './ast'
import { SketchSyntaxError } from './ast'
import { parseArduino } from './arduino-parser'
import { parseMicroPython } from './micropython-parser'
import { Interpreter, SketchRuntimeError, type RunOutcome } from './interpreter'
import { createRuntime, type SketchOutput } from './runtime'

export type SketchLanguage = 'arduino-cpp' | 'micropython'

export interface SketchError {
  message: string
  line: number
}

export interface SketchRunResult {
  ok: boolean
  output: SketchOutput
  outcome: RunOutcome | null
  error: SketchError | null
}

/** Generous enough for a demo run, small enough to never hang the browser. */
const RUN_BUDGET = { maxSteps: 100000, maxVirtualMs: 15000 }

function callStmt(name: string): Stmt {
  return {
    type: 'ExprStmt',
    expr: { type: 'Call', callee: { type: 'Identifier', name }, args: [], line: 0 },
    line: 0,
  }
}

/** Arduino: run every top-level declaration once (defines globals/functions), then setup() once, then loop() forever. */
function splitArduino(body: Stmt[]): { setup: Stmt[]; loop: Stmt[] | null; error: SketchError | null } {
  const hasSetup = body.some((s) => s.type === 'FunctionDecl' && s.name === 'setup')
  const hasLoop = body.some((s) => s.type === 'FunctionDecl' && s.name === 'loop')
  if (!hasSetup && !hasLoop) {
    return {
      setup: [],
      loop: null,
      error: { message: "Your sketch needs a setup() and a loop() function, just like real Arduino code.", line: 1 },
    }
  }
  const setup: Stmt[] = [...body]
  if (hasSetup) setup.push(callStmt('setup'))
  const loop = hasLoop ? [callStmt('loop')] : null
  return { setup, loop, error: null }
}

function isAlwaysTrue(expr: Expr): boolean {
  if (expr.type === 'BoolLiteral') return expr.value === true
  if (expr.type === 'NumberLiteral') return expr.value !== 0
  return false
}

/** MicroPython: statements before a trailing `while True:` / `while 1:` run once; that loop's body runs forever. */
function splitMicroPython(body: Stmt[]): { setup: Stmt[]; loop: Stmt[] | null; error: SketchError | null } {
  const last = body[body.length - 1]
  if (last && last.type === 'While' && isAlwaysTrue(last.test)) {
    const setup = body.slice(0, -1)
    const loop = last.body.type === 'Block' ? last.body.body : [last.body]
    return { setup, loop, error: null }
  }
  return { setup: body, loop: null, error: null }
}

export function runSketch(source: string, language: SketchLanguage, circuit: Circuit): SketchRunResult {
  const runtime = createRuntime(circuit, language)

  let body: Stmt[]
  try {
    body = language === 'arduino-cpp' ? parseArduino(source) : parseMicroPython(source)
  } catch (e) {
    if (e instanceof SketchSyntaxError) {
      return { ok: false, output: runtime.output, outcome: null, error: { message: e.message, line: e.line } }
    }
    throw e
  }

  const split = language === 'arduino-cpp' ? splitArduino(body) : splitMicroPython(body)
  if (split.error) {
    return { ok: false, output: runtime.output, outcome: null, error: split.error }
  }

  const interp = new Interpreter({ advanceTime: () => {} }, RUN_BUDGET)
  runtime.install(interp)

  try {
    const outcome = interp.runProgram(split.setup, split.loop)
    return { ok: true, output: runtime.output, outcome, error: null }
  } catch (e) {
    if (e instanceof SketchRuntimeError) {
      return { ok: false, output: runtime.output, outcome: null, error: { message: e.message, line: e.line } }
    }
    throw e
  }
}
