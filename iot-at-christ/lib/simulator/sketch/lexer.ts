// Shared tokenizer for both language front-ends. 'c' mode (Arduino C++
// subset) ignores layout — blocks are braces, statements end with ';'.
// 'python' mode (MicroPython subset) emits NEWLINE/INDENT/DEDENT tokens so
// the parser can use indentation for blocks.

import { SketchSyntaxError } from './ast'

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENT'
  | 'OP'
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  line: number
}

const OPERATORS_3 = ['<<=', '>>=']
const OPERATORS_2 = ['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '++', '--', '//']
const OPERATORS_1 = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '(', ')', '{', '}', '[', ']', ',', '.', ':', ';']

export function tokenize(source: string, mode: 'c' | 'python'): Token[] {
  const tokens: Token[] = []
  const indentStack = [0]
  let line = 1
  let i = 0
  let atLineStart = true

  const isDigit = (ch: string) => ch >= '0' && ch <= '9'
  const isIdentStart = (ch: string) => /[A-Za-z_]/.test(ch)
  const isIdentChar = (ch: string) => /[A-Za-z0-9_]/.test(ch)

  while (i < source.length) {
    // --- Python: compute indentation at the start of a logical line -------
    if (mode === 'python' && atLineStart) {
      let col = 0
      let j = i
      while (j < source.length && (source[j] === ' ' || source[j] === '\t')) {
        col += source[j] === '\t' ? 8 : 1
        j++
      }
      // Blank line or comment-only line — skip indentation tracking.
      if (j >= source.length || source[j] === '\n' || source[j] === '\r' || source[j] === '#') {
        i = j
        atLineStart = false
        continue
      }
      i = j
      atLineStart = false
      if (col > indentStack[indentStack.length - 1]) {
        indentStack.push(col)
        tokens.push({ type: 'INDENT', value: '', line })
      } else {
        while (col < indentStack[indentStack.length - 1]) {
          indentStack.pop()
          tokens.push({ type: 'DEDENT', value: '', line })
        }
        if (col !== indentStack[indentStack.length - 1]) {
          throw new SketchSyntaxError('Inconsistent indentation', line)
        }
      }
      continue
    }

    const ch = source[i]

    // Newlines
    if (ch === '\n') {
      if (mode === 'python') tokens.push({ type: 'NEWLINE', value: '\n', line })
      line++
      i++
      atLineStart = true
      continue
    }
    if (ch === '\r') {
      i++
      continue
    }

    // Whitespace
    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }

    // Comments
    if (mode === 'python' && ch === '#') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (mode === 'c' && ch === '#') {
      // Preprocessor directive (#include, #define) — skip the whole line.
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (mode === 'c' && ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (mode === 'c' && ch === '/' && source[i + 1] === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++
        i++
      }
      i += 2
      continue
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = ch
      let value = ''
      i++
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') {
          const next = source[i + 1]
          if (next === 'n') value += '\n'
          else if (next === 't') value += '\t'
          else if (next === '"' || next === "'" || next === '\\') value += next
          else value += next ?? ''
          i += 2
        } else {
          if (source[i] === '\n') line++
          value += source[i]
          i++
        }
      }
      i++ // closing quote
      tokens.push({ type: 'STRING', value, line })
      continue
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && isDigit(source[i + 1] ?? ''))) {
      let j = i
      while (j < source.length && isDigit(source[j])) j++
      if (source[j] === '.') {
        j++
        while (j < source.length && isDigit(source[j])) j++
      }
      tokens.push({ type: 'NUMBER', value: source.slice(i, j), line })
      i = j
      continue
    }

    // Identifiers / keywords
    if (isIdentStart(ch)) {
      let j = i
      while (j < source.length && isIdentChar(source[j])) j++
      tokens.push({ type: 'IDENT', value: source.slice(i, j), line })
      i = j
      continue
    }

    // Operators / punctuation
    const three = source.slice(i, i + 3)
    const two = source.slice(i, i + 2)
    if (OPERATORS_3.includes(three)) {
      tokens.push({ type: 'OP', value: three, line })
      i += 3
      continue
    }
    if (OPERATORS_2.includes(two)) {
      tokens.push({ type: 'OP', value: two, line })
      i += 2
      continue
    }
    if (OPERATORS_1.includes(ch)) {
      tokens.push({ type: 'OP', value: ch, line })
      i++
      continue
    }

    throw new SketchSyntaxError(`Unexpected character '${ch}'`, line)
  }

  if (mode === 'python') {
    tokens.push({ type: 'NEWLINE', value: '\n', line })
    while (indentStack.length > 1) {
      indentStack.pop()
      tokens.push({ type: 'DEDENT', value: '', line })
    }
  }
  tokens.push({ type: 'EOF', value: '', line })
  return tokens
}
