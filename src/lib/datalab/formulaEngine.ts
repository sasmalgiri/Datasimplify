/**
 * Safe formula engine for DataLab custom layers.
 * No eval() — uses tokenizer + recursive descent parser + evaluator.
 *
 * Supported tokens:
 *   price, volume, sma(N), ema(N), rsi(N)
 *   +, -, *, /, (, ), numbers
 *
 * Example formulas:
 *   price / sma(200)
 *   rsi(14) - 50
 *   volume * price
 *   (price - sma(50)) / sma(50) * 100
 */

import { computeSMA, computeEMA, computeRSI } from './calculations';

// ─── Tokenizer ─────────────────────────────────────────

type TokenType =
  | 'NUMBER' | 'IDENT' | 'FUNC' | 'LPAREN' | 'RPAREN'
  | 'PLUS' | 'MINUS' | 'MUL' | 'DIV' | 'COMMA' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set(['price', 'volume']);
const FUNCTIONS = new Set(['sma', 'ema', 'rsi']);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    // Skip whitespace
    if (/\s/.test(s[i])) { i++; continue; }

    // Number (int or float)
    if (/[0-9.]/.test(s[i])) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++; }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Identifier or function
    if (/[a-zA-Z_]/.test(s[i])) {
      let ident = '';
      while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) { ident += s[i]; i++; }
      const lower = ident.toLowerCase();
      if (FUNCTIONS.has(lower)) {
        tokens.push({ type: 'FUNC', value: lower });
      } else if (KEYWORDS.has(lower)) {
        tokens.push({ type: 'IDENT', value: lower });
      } else {
        throw new Error(`Unknown identifier: "${ident}"`);
      }
      continue;
    }

    // Single-character tokens
    switch (s[i]) {
      case '(': tokens.push({ type: 'LPAREN', value: '(' }); break;
      case ')': tokens.push({ type: 'RPAREN', value: ')' }); break;
      case '+': tokens.push({ type: 'PLUS', value: '+' }); break;
      case '-': tokens.push({ type: 'MINUS', value: '-' }); break;
      case '*': tokens.push({ type: 'MUL', value: '*' }); break;
      case '/': tokens.push({ type: 'DIV', value: '/' }); break;
      case ',': tokens.push({ type: 'COMMA', value: ',' }); break;
      default: throw new Error(`Unexpected character: "${s[i]}"`);
    }
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ─── AST Nodes ─────────────────────────────────────────

type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'ident'; name: string }
  | { type: 'func'; name: string; args: number[] }
  | { type: 'binop'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: '-'; operand: ASTNode };

// ─── Parser (recursive descent) ────────────────────────

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private expect(type: TokenType): Token {
    const t = this.advance();
    if (t.type !== type) throw new Error(`Expected ${type} but got ${t.type} ("${t.value}")`);
    return t;
  }

  parse(): ASTNode {
    const node = this.parseExpr();
    this.expect('EOF');
    return node;
  }

  // expr → term (('+' | '-') term)*
  private parseExpr(): ASTNode {
    let left = this.parseTerm();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.advance().value as '+' | '-';
      const right = this.parseTerm();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  // term → unary (('*' | '/') unary)*
  private parseTerm(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().type === 'MUL' || this.peek().type === 'DIV') {
      const op = this.advance().value as '*' | '/';
      const right = this.parseUnary();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  // unary → '-' unary | primary
  private parseUnary(): ASTNode {
    if (this.peek().type === 'MINUS') {
      this.advance();
      return { type: 'unary', op: '-', operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  // primary → NUMBER | IDENT | FUNC '(' NUMBER ')' | '(' expr ')'
  private parsePrimary(): ASTNode {
    const t = this.peek();

    if (t.type === 'NUMBER') {
      this.advance();
      return { type: 'number', value: parseFloat(t.value) };
    }

    if (t.type === 'IDENT') {
      this.advance();
      return { type: 'ident', name: t.value };
    }

    if (t.type === 'FUNC') {
      const name = this.advance().value;
      this.expect('LPAREN');
      const args: number[] = [];
      if (this.peek().type !== 'RPAREN') {
        const argToken = this.expect('NUMBER');
        args.push(parseFloat(argToken.value));
        while (this.peek().type === 'COMMA') {
          this.advance();
          const nextArg = this.expect('NUMBER');
          args.push(parseFloat(nextArg.value));
        }
      }
      this.expect('RPAREN');
      return { type: 'func', name, args };
    }

    if (t.type === 'LPAREN') {
      this.advance();
      const node = this.parseExpr();
      this.expect('RPAREN');
      return node;
    }

    throw new Error(`Unexpected token: ${t.type} ("${t.value}")`);
  }
}

// ─── Evaluator ─────────────────────────────────────────

interface FormulaContext {
  price: number[];
  volume: (number | null)[];
}

function resolveArray(node: ASTNode, ctx: FormulaContext): (number | null)[] {
  const len = ctx.price.length;

  switch (node.type) {
    case 'number': {
      return new Array(len).fill(node.value);
    }
    case 'ident': {
      if (node.name === 'price') return [...ctx.price];
      if (node.name === 'volume') return [...ctx.volume];
      throw new Error(`Unknown reference: ${node.name}`);
    }
    case 'func': {
      const period = node.args[0] ?? 14;
      if (node.name === 'sma') return computeSMA(ctx.price, Math.round(period));
      if (node.name === 'ema') return computeEMA(ctx.price, Math.round(period));
      if (node.name === 'rsi') return computeRSI(ctx.price, Math.round(period));
      throw new Error(`Unknown function: ${node.name}`);
    }
    case 'unary': {
      const arr = resolveArray(node.operand, ctx);
      return arr.map((v) => (v != null ? -v : null));
    }
    case 'binop': {
      const left = resolveArray(node.left, ctx);
      const right = resolveArray(node.right, ctx);
      return left.map((l, i) => {
        const r = right[i];
        if (l == null || r == null) return null;
        switch (node.op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return r !== 0 ? l / r : null;
        }
      });
    }
  }
}

// ─── Public API ────────────────────────────────────────

/**
 * Validate a formula expression. Returns null if valid, error message if invalid.
 */
export function validateFormula(expression: string): string | null {
  try {
    const tokens = tokenize(expression);
    new Parser(tokens).parse();
    return null;
  } catch (err: any) {
    return err.message || 'Invalid formula';
  }
}

/**
 * Evaluate a formula against price/volume data.
 * Returns an array of values aligned to the price array's indices.
 */
export function evaluateFormula(
  expression: string,
  ctx: FormulaContext,
): (number | null)[] {
  const tokens = tokenize(expression);
  const ast = new Parser(tokens).parse();
  return resolveArray(ast, ctx);
}
