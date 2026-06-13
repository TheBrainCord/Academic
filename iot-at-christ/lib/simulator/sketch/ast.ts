// Shared AST for both the Arduino C++ subset and the MicroPython subset.
// Both language front-ends (arduino-parser.ts, micropython-parser.ts) parse
// into these same node types, so a single interpreter (interpreter.ts) can
// run either language.

export type Expr =
  | { type: 'NumberLiteral'; value: number }
  | { type: 'StringLiteral'; value: string }
  | { type: 'BoolLiteral'; value: boolean }
  | { type: 'NullLiteral' }
  | { type: 'Identifier'; name: string }
  /** object.property — e.g. Serial.println, GPIO.HIGH */
  | { type: 'Member'; object: Expr; property: string }
  | { type: 'Call'; callee: Expr; args: Expr[]; line: number }
  | { type: 'Unary'; op: '-' | '+' | '!'; argument: Expr }
  /** ++x / x++ / --x / x-- */
  | { type: 'Update'; op: '++' | '--'; argument: Expr; prefix: boolean }
  | { type: 'Binary'; op: string; left: Expr; right: Expr }
  | { type: 'Logical'; op: '&&' | '||'; left: Expr; right: Expr }
  /** x = v, x += v, x -= v, x *= v, x /= v */
  | { type: 'Assign'; op: '=' | '+=' | '-=' | '*=' | '/=' | '%='; target: Expr; value: Expr }

export type Stmt =
  | { type: 'VarDecl'; name: string; init: Expr | null; line: number }
  | { type: 'ExprStmt'; expr: Expr; line: number }
  | { type: 'Block'; body: Stmt[] }
  | { type: 'If'; test: Expr; consequent: Stmt; alternate: Stmt | null; line: number }
  /** C-style for(init; test; update) */
  | { type: 'For'; init: Stmt | null; test: Expr | null; update: Stmt | null; body: Stmt; line: number }
  /** Python `for name in range(...)` */
  | {
      type: 'ForRange'
      name: string
      start: Expr
      stop: Expr
      step: Expr | null
      body: Stmt
      line: number
    }
  | { type: 'While'; test: Expr; body: Stmt; line: number }
  | { type: 'Return'; value: Expr | null; line: number }
  | { type: 'FunctionDecl'; name: string; params: string[]; body: Stmt[]; line: number }
  | { type: 'Break'; line: number }
  | { type: 'Continue'; line: number }

export interface SketchProgram {
  body: Stmt[]
}

export class SketchSyntaxError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.name = 'SketchSyntaxError'
    this.line = line
  }
}
