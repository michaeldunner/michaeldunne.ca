/**
 * BEDMAS Expression Parser
 * Evaluates mathematical expressions to numeric values.
 * Supports: +, -, *, /, ^ (including fractional exponents), parentheses, implicit multiplication
 */

export interface ParseResult {
    value: number;
    error?: string;
}

type Token =
    | { type: 'number'; value: number }
    | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
    | { type: 'lparen' }
    | { type: 'rparen' };

/**
 * Tokenizes an expression string into tokens
 */
function tokenize(expr: string): Token[] | { error: string } {
    const tokens: Token[] = [];
    let i = 0;
    const str = expr.replace(/\s+/g, ''); // Remove whitespace

    while (i < str.length) {
        const char = str[i];

        // Number (including decimals)
        if (/[0-9.]/.test(char)) {
            let numStr = '';
            while (i < str.length && /[0-9.]/.test(str[i])) {
                numStr += str[i];
                i++;
            }
            const num = parseFloat(numStr);
            if (isNaN(num)) {
                return { error: `Invalid number: ${numStr}` };
            }
            tokens.push({ type: 'number', value: num });
            continue;
        }

        // Operators
        if (['+', '-', '*', '/', '^'].includes(char)) {
            // Handle negative numbers at start or after operator/lparen
            if (char === '-') {
                const lastToken = tokens[tokens.length - 1];
                if (!lastToken || lastToken.type === 'lparen' || lastToken.type === 'operator') {
                    // This is a unary minus, read the number
                    i++;
                    let numStr = '-';
                    while (i < str.length && /[0-9.]/.test(str[i])) {
                        numStr += str[i];
                        i++;
                    }
                    if (numStr === '-') {
                        return { error: 'Unexpected minus sign' };
                    }
                    const num = parseFloat(numStr);
                    if (isNaN(num)) {
                        return { error: `Invalid number: ${numStr}` };
                    }
                    tokens.push({ type: 'number', value: num });
                    continue;
                }
            }
            tokens.push({ type: 'operator', value: char as '+' | '-' | '*' | '/' | '^' });
            i++;
            continue;
        }

        // Parentheses
        if (char === '(') {
            // Check for implicit multiplication: number or rparen before lparen
            const lastToken = tokens[tokens.length - 1];
            if (lastToken && (lastToken.type === 'number' || lastToken.type === 'rparen')) {
                tokens.push({ type: 'operator', value: '*' });
            }
            tokens.push({ type: 'lparen' });
            i++;
            continue;
        }

        if (char === ')') {
            tokens.push({ type: 'rparen' });
            i++;
            continue;
        }

        return { error: `Unexpected character: ${char}` };
    }

    return tokens;
}

/**
 * Recursive descent parser implementing BEDMAS precedence
 */
class Parser {
    private tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private current(): Token | undefined {
        return this.tokens[this.pos];
    }

    private consume(): Token | undefined {
        return this.tokens[this.pos++];
    }

    // Entry point: handles addition and subtraction (lowest precedence)
    parseExpression(): number {
        let left = this.parseTerm();

        while (this.current()?.type === 'operator' &&
            (this.current() as any).value === '+' ||
            (this.current()?.type === 'operator' && (this.current() as any).value === '-')) {
            const op = (this.consume() as any).value;
            const right = this.parseTerm();
            if (op === '+') {
                left = left + right;
            } else {
                left = left - right;
            }
        }

        return left;
    }

    // Handles multiplication and division
    private parseTerm(): number {
        let left = this.parseExponent();

        while (this.current()?.type === 'operator' &&
            ((this.current() as any).value === '*' || (this.current() as any).value === '/')) {
            const op = (this.consume() as any).value;
            const right = this.parseExponent();
            if (op === '*') {
                left = left * right;
            } else {
                if (right === 0) {
                    throw new Error('Division by zero');
                }
                left = left / right;
            }
        }

        return left;
    }

    // Handles exponents (right associative)
    private parseExponent(): number {
        const base = this.parseFactor();

        if (this.current()?.type === 'operator' && (this.current() as any).value === '^') {
            this.consume();
            const exp = this.parseExponent(); // Right associative
            return Math.pow(base, exp);
        }

        return base;
    }

    // Handles numbers and parentheses (highest precedence)
    private parseFactor(): number {
        const token = this.current();

        if (!token) {
            throw new Error('Unexpected end of expression');
        }

        if (token.type === 'number') {
            this.consume();
            return token.value;
        }

        if (token.type === 'lparen') {
            this.consume(); // consume '('
            const result = this.parseExpression();
            if (this.current()?.type !== 'rparen') {
                throw new Error('Missing closing parenthesis');
            }
            this.consume(); // consume ')'
            return result;
        }

        throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
}

/**
 * Parses and evaluates a mathematical expression
 * Returns the numeric result or an error message
 */
export function parseExpression(expr: string): ParseResult {
    // Handle empty or whitespace-only input
    if (!expr || !expr.trim()) {
        return { value: 0 };
    }

    // Handle simple fractions (e.g., "1/2")
    const trimmed = expr.trim();

    try {
        const tokens = tokenize(trimmed);

        if ('error' in tokens) {
            return { value: 0, error: tokens.error };
        }

        if (tokens.length === 0) {
            return { value: 0 };
        }

        const parser = new Parser(tokens);
        const value = parser.parseExpression();

        if (!isFinite(value)) {
            return { value: 0, error: 'Result is not finite' };
        }

        return { value };
    } catch (e) {
        return { value: 0, error: e instanceof Error ? e.message : 'Parse error' };
    }
}
