// Recursive-descent parser for a teaching subset of MicroPython
// (the style used for Raspberry Pi GPIO scripts).
//
// Supported: top-level statements, `import X` / `from X import Y as Z`
// (parsed and discarded — names still resolve via the GPIO/time/print
// builtins registered by the runtime), assignments (=, +=, -=, *=, /=),
// if/elif/else, while, `for x in range(...)`, def, return, break/continue,
// pass, and/or/not, True/False/None, member access and calls.
//
// Not supported: lists/dicts/tuples, comprehensions, classes, f-strings,
// `for x in <iterable>` over anything but range().

import type { Expr, Stmt } from './ast'
import { SketchSyntaxError } from './ast'
import { tokenize, type Token } from './lexer'

const KEYWORDS = new Set([
  'if', 'elif', 'else', 'for', 'in', 'while', 'def', 'return', 'break',
  'continue', 'import', 'from', 'as', 'pass', 'True', 'False', 'None', 'and', 'or', 'not',
])

class Parser {
  private pos = 0
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]
  }
  private at(value: string, type: Token['type'] = 'OP'): boolean {
    const t = this.peek()
    if (type === 'OP') return (t.type === 'OP' || t.type === 'IDENT') && t.value === value
    return t.type === type
  }
  private atKeyword(word: string): boolean {
    const t = this.peek()
    return t.type === 'IDENT' && t.value === word
  }
  private advance(): Token {
    return this.tokens[this.pos++]
  }
  private expect(value: string): Token {
    if (!this.at(value)) {
      throw new SketchSyntaxError(`Expected '${value}' but found '${this.peek().value || this.peek().type}'`, this.peek().line)
    }
    return this.advance()
  }
  private match(value: string): boolean {
    if (this.at(value)) {
      this.advance()
      return true
    }
    return false
  }
  private skipNewlines(): void {
    while (this.peek().type === 'NEWLINE') this.advance()
  }

  // --- Top level / blocks ---------------------------------------------------

  parseProgram(): Stmt[] {
    const body: Stmt[] = []
    this.skipNewlines()
    while (this.peek().type !== 'EOF') {
      body.push(...this.parseStatement())
      this.skipNewlines()
    }
    return body
  }

  /** `:` NEWLINE INDENT stmt* DEDENT — collapsed into a Block. */
  private parseSuite(): Stmt {
    this.expect(':')
    this.skipNewlines()
    const body: Stmt[] = []
    if (this.peek().type === 'INDENT') {
      this.advance()
      this.skipNewlines()
      while (this.peek().type !== 'DEDENT' && this.peek().type !== 'EOF') {
        body.push(...this.parseStatement())
        this.skipNewlines()
      }
      if (this.peek().type === 'DEDENT') this.advance()
    } else {
      // Single-line suite, e.g. `if x: print(x)`
      body.push(...this.parseSimpleStatement())
    }
    return { type: 'Block', body }
  }

  // --- Statements -------------------------------------------------------

  private parseStatement(): Stmt[] {
    const t = this.peek()

    if (this.atKeyword('if')) return [this.parseIf()]
    if (this.atKeyword('while')) return [this.parseWhile()]
    if (this.atKeyword('for')) return [this.parseFor()]
    if (this.atKeyword('def')) return [this.parseDef()]
    if (this.atKeyword('import') || this.atKeyword('from')) {
      while (this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF') this.advance()
      return []
    }
    return this.parseSimpleStatement()
  }

  /** A single logical line, possibly several `;`-separated simple statements. */
  private parseSimpleStatement(): Stmt[] {
    const out: Stmt[] = []
    for (;;) {
      out.push(...this.parseOneSimple())
      if (this.match(';')) continue
      break
    }
    return out
  }

  private parseOneSimple(): Stmt[] {
    const t = this.peek()
    const line = t.line

    if (this.atKeyword('pass')) {
      this.advance()
      return []
    }
    if (this.atKeyword('return')) {
      this.advance()
      const value = this.peek().type === 'NEWLINE' || this.at(';') ? null : this.parseExpression()
      return [{ type: 'Return', value, line }]
    }
    if (this.atKeyword('break')) {
      this.advance()
      return [{ type: 'Break', line }]
    }
    if (this.atKeyword('continue')) {
      this.advance()
      return [{ type: 'Continue', line }]
    }
    if (this.atKeyword('global') || this.atKeyword('nonlocal')) {
      while (this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF' && !this.at(';')) this.advance()
      return []
    }

    const expr = this.parseExpression()
    const op = this.peek()
    if (op.type === 'OP' && ['=', '+=', '-=', '*=', '/=', '%='].includes(op.value)) {
      this.advance()
      const value = this.parseExpression()
      return [{ type: 'ExprStmt', expr: { type: 'Assign', op: op.value as '=' | '+=' | '-=' | '*=' | '/=' | '%=', target: expr, value }, line }]
    }
    return [{ type: 'ExprStmt', expr, line }]
  }

  private parseIf(): Stmt {
    const line = this.peek().line
    this.advance() // if
    const test = this.parseExpression()
    const consequent = this.parseSuite()
    let alternate: Stmt | null = null
    this.skipNewlines()
    if (this.atKeyword('elif')) {
      alternate = this.parseIf2('elif')
    } else if (this.atKeyword('else')) {
      this.advance()
      alternate = this.parseSuite()
    }
    return { type: 'If', test, consequent, alternate, line }
  }

  /** elif behaves like `else { if ... }` */
  private parseIf2(keyword: string): Stmt {
    const line = this.peek().line
    this.advance() // elif
    const test = this.parseExpression()
    const consequent = this.parseSuite()
    let alternate: Stmt | null = null
    this.skipNewlines()
    if (this.atKeyword('elif')) {
      alternate = this.parseIf2('elif')
    } else if (this.atKeyword('else')) {
      this.advance()
      alternate = this.parseSuite()
    }
    return { type: 'If', test, consequent, alternate, line }
  }

  private parseWhile(): Stmt {
    const line = this.peek().line
    this.advance() // while
    const test = this.parseExpression()
    const body = this.parseSuite()
    return { type: 'While', test, body, line }
  }

  private parseFor(): Stmt {
    const line = this.peek().line
    this.advance() // for
    if (this.peek().type !== 'IDENT') throw new SketchSyntaxError('Expected a loop variable name', this.peek().line)
    const name = this.advance().value
    if (!this.atKeyword('in')) throw new SketchSyntaxError("Expected 'in'", this.peek().line)
    this.advance()
    if (!this.atKeyword('range')) {
      throw new SketchSyntaxError("Only 'for x in range(...)' loops are supported", this.peek().line)
    }
    this.advance()
    this.expect('(')
    const args: Expr[] = []
    while (!this.at(')')) {
      args.push(this.parseExpression())
      if (!this.match(',')) break
    }
    this.expect(')')
    let start: Expr = { type: 'NumberLiteral', value: 0 }
    let stop: Expr
    let step: Expr | null = null
    if (args.length === 1) stop = args[0]
    else if (args.length === 2) {
      start = args[0]
      stop = args[1]
    } else {
      start = args[0]
      stop = args[1]
      step = args[2]
    }
    const body = this.parseSuite()
    return { type: 'ForRange', name, start, stop, step, body, line }
  }

  private parseDef(): Stmt {
    const line = this.peek().line
    this.advance() // def
    if (this.peek().type !== 'IDENT') throw new SketchSyntaxError('Expected a function name', this.peek().line)
    const name = this.advance().value
    this.expect('(')
    const params: string[] = []
    while (!this.at(')')) {
      if (this.peek().type === 'IDENT') params.push(this.advance().value)
      // default values like `def f(x=1):` — skip the default expression
      if (this.match('=')) this.parseExpression()
      if (!this.match(',')) break
    }
    this.expect(')')
    const body = this.parseSuite()
    return { type: 'FunctionDecl', name, params, body: (body as { type: 'Block'; body: Stmt[] }).body, line }
  }

  // --- Expressions (precedence climbing) -----------------------------------

  private parseExpression(): Expr {
    return this.parseLogicalOr()
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd()
    while (this.atKeyword('or')) {
      this.advance()
      left = { type: 'Logical', op: '||', left, right: this.parseLogicalAnd() }
    }
    return left
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseNot()
    while (this.atKeyword('and')) {
      this.advance()
      left = { type: 'Logical', op: '&&', left, right: this.parseNot() }
    }
    return left
  }

  private parseNot(): Expr {
    if (this.atKeyword('not')) {
      this.advance()
      return { type: 'Unary', op: '!', argument: this.parseNot() }
    }
    return this.parseEquality()
  }

  private parseEquality(): Expr {
    let left = this.parseRelational()
    while (this.at('==') || this.at('!=')) {
      const op = this.advance().value
      left = { type: 'Binary', op, left, right: this.parseRelational() }
    }
    return left
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive()
    while (this.at('<') || this.at('<=') || this.at('>') || this.at('>=')) {
      const op = this.advance().value
      left = { type: 'Binary', op, left, right: this.parseAdditive() }
    }
    return left
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative()
    while (this.at('+') || this.at('-')) {
      const op = this.advance().value
      left = { type: 'Binary', op, left, right: this.parseMultiplicative() }
    }
    return left
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary()
    while (this.at('*') || this.at('/') || this.at('//') || this.at('%')) {
      const op = this.advance().value
      left = { type: 'Binary', op, left, right: this.parseUnary() }
    }
    return left
  }

  private parseUnary(): Expr {
    if (this.at('-') || this.at('+')) {
      const op = this.advance().value as '-' | '+'
      return { type: 'Unary', op, argument: this.parseUnary() }
    }
    return this.parsePostfix()
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary()
    for (;;) {
      if (this.match('.')) {
        const prop = this.advance().value
        expr = { type: 'Member', object: expr, property: prop }
      } else if (this.at('(')) {
        const line = this.peek().line
        this.advance()
        const args = this.parseCallArgs()
        this.expect(')')
        expr = { type: 'Call', callee: expr, args, line }
      } else {
        break
      }
    }
    return expr
  }

  /** Call arguments, tolerating Python `name=value` keyword args (the name is discarded). */
  private parseCallArgs(): Expr[] {
    const args: Expr[] = []
    while (!this.at(')')) {
      let arg = this.parseExpression()
      if (this.match('=')) arg = this.parseExpression()
      args.push(arg)
      if (!this.match(',')) break
    }
    return args
  }

  private parsePrimary(): Expr {
    const t = this.peek()
    if (t.type === 'NUMBER') {
      this.advance()
      return { type: 'NumberLiteral', value: Number(t.value) }
    }
    if (t.type === 'STRING') {
      this.advance()
      return { type: 'StringLiteral', value: t.value }
    }
    if (this.atKeyword('True') || this.atKeyword('False')) {
      const v = this.advance().value === 'True'
      return { type: 'BoolLiteral', value: v }
    }
    if (this.atKeyword('None')) {
      this.advance()
      return { type: 'NullLiteral' }
    }
    if (t.type === 'IDENT' && !KEYWORDS.has(t.value)) {
      this.advance()
      return { type: 'Identifier', name: t.value }
    }
    if (this.match('(')) {
      const expr = this.parseExpression()
      this.expect(')')
      return expr
    }
    throw new SketchSyntaxError(`Unexpected token '${t.value || t.type}'`, t.line)
  }
}

export function parseMicroPython(source: string): Stmt[] {
  const tokens = tokenize(source, 'python')
  return new Parser(tokens).parseProgram()
}
