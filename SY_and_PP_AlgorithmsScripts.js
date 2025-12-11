
'use strict';
// --- Utility: Tokenizer for both calculators ---
// Converts input string into array of tokens (numbers/operators/parentheses)
function tokenize(expr) {
	const tokens = [];
	let i = 0;
	while (i < expr.length) {
		const c = expr[i];
		if (c === ' ' || c === '\t' || c === '\n') {
			i++; // Skip whitespace
		} else if (/[0-9.]/.test(c)) {
			let num = c;
			i++;
			while (i < expr.length && /[0-9.]/.test(expr[i])) {
				num += expr[i++]; // Build number token
			}
			if (num.split('.').length > 2) throw new Error('Invalid number: ' + num);
			tokens.push({ type: 'number', value: parseFloat(num) }); // Push number token
		} else if (/[+\-*/^()]/.test(c)) {
			tokens.push({ type: 'operator', value: c }); // Push operator/parenthesis token
			i++;
		} else {
			throw new Error('Invalid character: ' + c); // Error for invalid character
		}
	}
	return tokens;
}


	// --- Shunting Yard Calculator Implementation ---
	// Operator precedence and associativity table
	const SY_OPS = {
		'+': { precedence: 2, assoc: 'L' },
		'-': { precedence: 2, assoc: 'L' },
		'*': { precedence: 3, assoc: 'L' },
		'/': { precedence: 3, assoc: 'L' },
		'^': { precedence: 4, assoc: 'R' }
	};


	// Convert infix tokens to postfix (RPN) using Shunting Yard algorithm
	function shuntingYard(tokens) {
		const output = [];
		const stack = [];
		for (const token of tokens) {
			if (token.type === 'number') {
				output.push(token); // Numbers go directly to output
			} else if (token.type === 'operator') {
				if (token.value === '(') {
					stack.push(token); // Left parenthesis goes on stack
				} else if (token.value === ')') {
					// Pop operators until matching '('
					while (stack.length && stack[stack.length-1].value !== '(') {
						output.push(stack.pop());
					}
					if (!stack.length) throw new Error('Mismatched parentheses');
					stack.pop(); // Remove '('
				} else {
					// Pop operators with higher/equal precedence
					while (stack.length && stack[stack.length-1].type === 'operator' &&
						stack[stack.length-1].value !== '(' &&
						(
							(SY_OPS[token.value].assoc === 'L' && SY_OPS[token.value].precedence <= SY_OPS[stack[stack.length-1].value].precedence) ||
							(SY_OPS[token.value].assoc === 'R' && SY_OPS[token.value].precedence < SY_OPS[stack[stack.length-1].value].precedence)
						)
					) {
						output.push(stack.pop());
					}
					stack.push(token); // Push current operator
				}
			}
		}
		// Pop any remaining operators from stack
		while (stack.length) {
			if (stack[stack.length-1].value === '(' || stack[stack.length-1].value === ')') {
				throw new Error('Mismatched parentheses');
			}
			output.push(stack.pop());
		}
		return output;
	}


	// Evaluate RPN (postfix) tokens
	function evaluateRPN(rpnTokens) {
		const stack = [];
		for (const token of rpnTokens) {
			if (token.type === 'number') {
				stack.push(token.value); // Push numbers onto stack
			} else if (token.type === 'operator') {
				if (stack.length < 2) throw new Error('Insufficient operands');
				const b = stack.pop(); // Right operand
				const a = stack.pop(); // Left operand
				let res;
				switch (token.value) {
					case '+': res = a + b; break; // Addition
					case '-': res = a - b; break; // Subtraction
					case '*': res = a * b; break; // Multiplication
					case '/':
						if (b === 0) throw new Error('Division by zero');
						res = a / b; break; // Division
					case '^': res = Math.pow(a, b); break; // Exponentiation
					default: throw new Error('Unknown operator: ' + token.value);
				}
				stack.push(res); // Push result
			}
		}
		if (stack.length !== 1) throw new Error('Invalid expression');
		return stack[0]; // Final result
	}


	// --- Pratt Parsing Calculator Implementation ---
	// Pratt parser supports +, -, *, /, ^, parentheses
	class PrattParser {
		constructor(tokens) {
			this.tokens = tokens; // Store token array
			this.pos = 0; // Current position in token array
		}
		peek() {
			return this.tokens[this.pos]; // Look at current token
		}
		next() {
			return this.tokens[this.pos++]; // Advance and return next token
		}
		parseExpression(rbp = 0) {
			let t = this.next(); // Get next token
			let left = this.nud(t); // Get left-hand side (nud)
			while (this.peek() && rbp < this.lbp(this.peek())) {
				t = this.next(); // Get next operator
				left = this.led(t, left); // Combine with right-hand side (led)
			}
			return left; // Return AST node
		}
		nud(token) {
			if (token.type === 'number') {
				return { type: 'number', value: token.value }; // Number literal
			}
			if (token.type === 'operator') {
				if (token.value === '(') {
					const expr = this.parseExpression(); // Parse inside parentheses
					if (!this.peek() || this.next().value !== ')') throw new Error('Mismatched parentheses');
					return expr;
				}
				if (token.value === '+') {
					return this.parseExpression(5); // Unary plus
				}
				if (token.value === '-') {
					return { type: 'negate', value: this.parseExpression(5) }; // Unary minus
				}
			}
			throw new Error('Unexpected token: ' + token.value); // Error for unexpected token
		}
		lbp(token) {
			if (token.type !== 'operator') return 0;
			switch (token.value) {
				case '+': case '-': return 1; // Low precedence
				case '*': case '/': return 2; // Medium precedence
				case '^': return 3; // High precedence
				default: return 0;
			}
		}
		led(token, left) {
			if (token.type !== 'operator') throw new Error('Expected operator');
			switch (token.value) {
				case '+':
					return { type: 'add', left, right: this.parseExpression(1) }; // Addition
				case '-':
					return { type: 'sub', left, right: this.parseExpression(1) }; // Subtraction
				case '*':
					return { type: 'mul', left, right: this.parseExpression(2) }; // Multiplication
				case '/':
					return { type: 'div', left, right: this.parseExpression(2) }; // Division
				case '^':
					return { type: 'pow', left, right: this.parseExpression(3-1) }; // Exponentiation (right-associative)
				default:
					throw new Error('Unknown operator: ' + token.value);
			}
		}
	}


	// Evaluate AST produced by Pratt parser
	function evaluateAST(node) {
		switch (node.type) {
			case 'number': return node.value; // Number literal
			case 'negate': return -evaluateAST(node.value); // Unary minus
			case 'add': return evaluateAST(node.left) + evaluateAST(node.right); // Addition
			case 'sub': return evaluateAST(node.left) - evaluateAST(node.right); // Subtraction
			case 'mul': return evaluateAST(node.left) * evaluateAST(node.right); // Multiplication
			case 'div': {
				const denom = evaluateAST(node.right);
				if (denom === 0) throw new Error('Division by zero');
				return evaluateAST(node.left) / denom; // Division
			}
			case 'pow': return Math.pow(evaluateAST(node.left), evaluateAST(node.right)); // Exponentiation
			default: throw new Error('Unknown AST node: ' + node.type);
		}
	}


	// --- UI Handlers and Error Handling ---
	// Shunting Yard Calculator button click handler
	document.getElementById('sy-eval').addEventListener('click', function() {
		const input = document.getElementById('sy-input').value; // Get user input
		const resultDiv = document.getElementById('sy-result'); // Result display div
		try {
			if (!input.trim()) throw new Error('Input is empty'); // Check for empty input
			const tokens = tokenize(input); // Tokenize input
			const rpn = shuntingYard(tokens); // Convert to RPN
			const result = evaluateRPN(rpn); // Evaluate RPN
			resultDiv.textContent = result; // Show result
		} catch (e) {
			resultDiv.textContent = 'Error: ' + e.message; // Show error
		}
	});

	// Pratt Parsing Calculator button click handler
	document.getElementById('pratt-eval').addEventListener('click', function() {
		const input = document.getElementById('pratt-input').value; // Get user input
		const resultDiv = document.getElementById('pratt-result'); // Result display div
		try {
			if (!input.trim()) throw new Error('Input is empty'); // Check for empty input
			const tokens = tokenize(input); // Tokenize input
			const parser = new PrattParser(tokens); // Create parser instance
			const ast = parser.parseExpression(); // Parse to AST
			if (parser.peek()) throw new Error('Unexpected input after end of expression'); // Check for leftover tokens
			const result = evaluateAST(ast); // Evaluate AST
			resultDiv.textContent = result; // Show result
		} catch (e) {
			resultDiv.textContent = 'Error: ' + e.message; // Show error
		}
	});
