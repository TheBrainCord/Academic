// Recursive-descent parser for a teaching subset of Arduino C++.
//
// Supported: setup()/loop() and helper functions, typed variable
// declarations (int/float/double/bool/long/unsigned/byte/char/String/const,
// including "unsigned long"-style multi-word types), if/else, for, while,
// return, break/continue, ++/--/+=/-=, the usual operators, and calls
// including member calls like Serial.println(...).
//
// Not supported: pointers, structs/classes, arrays, switch, ternary — these
// rarely appear in first IoT sketches and would bloat the grammar.

import type { Expr, Stmt } from './ast'
import { SketchSyntaxError } from './ast'
import { tokenize, type Token } from './lexer'

const TYPE_KEYWORDS = new Set([
  'void', 'int', 'float', 'double', 'bool', 'boolean', 'char', 'long', 'short',
  'unsigned', 'byte', 'String', 'const', 'static', 'auto', 'word', 'size_t',
])

const RESERVED = new Set(['if', 'else', 'for', 'while', 'return', 'break', 'continue', ...TYPE_KEYWORDS])

class Parser {
  private pos = 0
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]
  }
  private at(value: string): boolean {
    const t = this.peek()
    return (t.type === 'OP' || t.type === 'IDENT') && t.value === value
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

  // --- Top level --------------------------------------------------------

  parseProgram(): Stmt[] {
    const body: Stmt[] = []
    while (this.peek().type !== 'EOF') {
      body.push(...this.parseDeclaration())
    }
    return body
  }

  /** A type keyword run followed by name → function decl or var decl(s). */
  private parseDeclaration(): Stmt[] {
    const line = this.peek().line
    if (this.peek().type === 'IDENT' && (TYPE_KEYWORDS.has(this.peek().value) || this.isTypeName())) {
      // Consume type keyword run (e.g. "unsigned long", "const int").
      while (this.peek().type === 'IDENT' && TYPE_KEYWORDS.has(this.peek().value)) this.advance()
      if (this.peek().type !== 'IDENT') {
        throw new SketchSyntaxError('Expected a name after type', this.peek().line)
      }
      const name = this.advance().value
      if (this.at('(')) {
        return [this.parseFunctionDecl(name, line)]
      }
      return this.parseVarDeclList(name, line)
    }
    // Fallback: treat as a statement (handles top-level expressions, rare).
    return [this.parseStatement()]
  }

  /** Heuristic: IDENT IDENT ( -> custom return type, e.g. "MyType foo(...)". Rare; only "String" is in TYPE_KEYWORDS already. */
  private isTypeName(): boolean {
    return false
  }

  private parseFunctionDecl(name: string, line: number): Stmt {
    this.expect('(')
    const params: string[] = []
    while (!this.at(')')) {
      // Parameter: [type tokens] name
      while (this.peek().type === 'IDENT' && TYPE_KEYWORDS.has(this.peek().value)) this.advance()
      if (this.peek().type === 'IDENT') params.push(this.advance().value)
      // skip array brackets like int arr[]
      while (this.match('[')) {
        while (!this.at(']')) this.advance()
        this.expect(']')
      }
      if (!this.match(',')) break
    }
    this.expect(')')
    const body = this.parseBlock()
    return { type: 'FunctionDecl', name, params, body: body.body, line }
  }

  private parseVarDeclList(firstName: string, line: number): Stmt[] {
    const out: Stmt[] = []
    let name = firstName
    for (;;) {
      let init: Expr | null = null
      // skip array size like [5]
      while (this.match('[')) {
        while (!this.at(']')) this.advance()
        this.expect(']')
      }
      if (this.match('=')) init = this.parseExpression()
      out.push({ type: 'VarDecl', name, init, line })
      if (this.match(',')) {
        if (this.peek().type !== 'IDENT') throw new SketchSyntaxError('Expected variable name', this.peek().line)
        name = this.advance().value
        continue
      }
      break
    }
    this.expect(';')
    return out
  }

  // --- Statements ---------------------------------------------------------

  private parseBlock(): { type: 'Block'; body: Stmt[] } {
    this.expect('{')
    const body: Stmt[] = []
    while (!this.at('}')) body.push(...this.parseBlockItem())
    this.expect('}')
    return { type: 'Block', body }
  }

  private parseBlockItem(): Stmt[] {
    const t = this.peek()
    if (t.type === 'IDENT' && TYPE_KEYWORDS.has(t.value)) {
      const line = t.line
      while (this.peek().type === 'IDENT' && TYPE_KEYWORDS.has(this.peek().value)) this.advance()
      const name = this.advance().value
      return this.parseVarDeclList(name, line)
    }
    return [this.parseStatement()]
  }

  private parseStatement(): Stmt {
    const t = this.peek()
    const line = t.line

    if (this.at('{')) return this.parseBlock()

    if (t.type === 'IDENT' && t.value === 'if') {
      this.advance()
      this.expect('(')
      const test = this.parseExpression()
      this.expect(')')
      const consequent = this.parseStatement()
      let alternate: Stmt | null = null
      if (t.type === 'IDENT' && this.peek().type === 'IDENT' && this.peek().value === 'else') {
        this.advance()
        alternate = this.parseStatement()
      }
      return { type: 'If', test, consequent, alternate, line }
    }

    if (t.type === 'IDENT' && t.value === 'for') {
      this.advance()
      this.expect('(')
      const init = this.at(';') ? null : this.parseForClauseStmt()
      this.expect(';')
      const test = this.at(';') ? null : this.parseExpression()
      this.expect(';')
      const update = this.at(')') ? null : ({ type: 'ExprStmt', expr: this.parseExpression(), line } as Stmt)
      this.expect(')')
      const body = this.parseStatement()
      return { type: 'For', init, test, update, body, line }
    }

    if (t.type === 'IDENT' && t.value === 'while') {
      this.advance()
      this.expect('(')
      const test = this.parseExpression()
      this.expect(')')
      const body = this.parseStatement()
      return { type: 'While', test, body, line }
    }

    if (t.type === 'IDENT' && t.value === 'return') {
      this.advance()
      const value = this.at(';') ? null : this.parseExpression()
      this.expect(';')
      return { type: 'Return', value, line }
    }

    if (t.type === 'IDENT' && t.value === 'break') {
      this.advance()
      this.expect(';')
      return { type: 'Break', line }
    }
    if (t.type === 'IDENT' && t.value === 'continue') {
      this.advance()
      this.expect(';')
      return { type: 'Continue', line }
    }

    if (this.match(';')) return { type: 'Block', body: [] }

    const expr = this.parseExpression()
    this.expect(';')
    return { type: 'ExprStmt', expr, line }
  }

  /** for(...) init clause: either a typed declaration or an expression. */
  private parseForClauseStmt(): Stmt {
    const t = this.peek()
    const line = t.line
    if (t.type === 'IDENT' && TYPE_KEYWORDS.has(t.value)) {
      while (this.peek().type === 'IDENT' && TYPE_KEYWORDS.has(this.peek().value)) this.advance()
      const name = this.advance().value
      let init: Expr | null = null
      if (this.match('=')) init = this.parseExpression()
      return { type: 'VarDecl', name, init, line }
    }
    return { type: 'ExprStmt', expr: this.parseExpression(), line }
  }

  // --- Expressions (precedence climbing) -----------------------------------

  private parseExpression(): Expr {
    return this.parseAssignment()
  }

  private parseAssignment(): Expr {
    const left = this.parseLogicalOr()
    const t = this.peek()
    if (t.type === 'OP' && ['=', '+=', '-=', '*=', '/=', '%='].includes(t.value)) {
      this.advance()
      const value = this.parseAssignment()
      return { type: 'Assign', op: t.value as '=' | '+=' | '-=' | '*=' | '/=' | '%=', target: left, value }
    }
    return left
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd()
    while (this.at('||')) {
      this.advance()
      left = { type: 'Logical', op: '||', left, right: this.parseLogicalAnd() }
    }
    return left
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseEquality()
    while (this.at('&&')) {
      this.advance()
      left = { type: 'Logical', op: '&&', left, right: this.parseEquality() }
    }
    return left
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
    while (this.at('*') || this.at('/') || this.at('%')) {
      const op = this.advance().value
      left = { type: 'Binary', op, left, right: this.parseUnary() }
    }
    return left
  }

  private parseUnary(): Expr {
    if (this.at('!') || this.at('-') || this.at('+')) {
      const op = this.advance().value as '!' | '-' | '+'
      return { type: 'Unary', op, argument: this.parseUnary() }
    }
    if (this.at('++') || this.at('--')) {
      const op = this.advance().value as '++' | '--'
      return { type: 'Update', op, argument: this.parseUnary(), prefix: true }
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
      } else if (this.at('++') || this.at('--')) {
        const op = this.advance().value as '++' | '--'
        expr = { type: 'Update', op, argument: expr, prefix: false }
      } else {
        break
      }
    }
    return expr
  }

  /** Call arguments, tolerating C++ `name=value` default-arg style (rare but harmless to accept). */
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
    if (t.type === 'IDENT' && (t.value === 'true' || t.value === 'false')) {
      this.advance()
      return { type: 'BoolLiteral', value: t.value === 'true' }
    }
    if (t.type === 'IDENT' && !RESERVED.has(t.value)) {
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

export function parseArduino(source: string): Stmt[] {
  const tokens = tokenize(source, 'c')
  return new Parser(tokens).parseProgram()
}
