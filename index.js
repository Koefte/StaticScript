"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var fileContent = fs.readFileSync("example.jss").toString();
var content = "";
var variables = [];
var functions = [];
var TokenType;
(function (TokenType) {
    TokenType[TokenType["IDENTIFIER"] = 0] = "IDENTIFIER";
    TokenType[TokenType["EQUAL"] = 1] = "EQUAL";
    TokenType[TokenType["TYPE"] = 2] = "TYPE";
    TokenType[TokenType["PLUSPLUS"] = 3] = "PLUSPLUS";
    TokenType[TokenType["MINUSMINUS"] = 4] = "MINUSMINUS";
    TokenType[TokenType["EXPO"] = 5] = "EXPO";
    TokenType[TokenType["NEWLINE"] = 6] = "NEWLINE";
    TokenType[TokenType["SEMICOLON"] = 7] = "SEMICOLON";
    TokenType[TokenType["STRING"] = 8] = "STRING";
    TokenType[TokenType["OR"] = 9] = "OR";
    TokenType[TokenType["AND"] = 10] = "AND";
    TokenType[TokenType["NOT"] = 11] = "NOT";
    TokenType[TokenType["PLUS"] = 12] = "PLUS";
    TokenType[TokenType["MINUS"] = 13] = "MINUS";
    TokenType[TokenType["MULTIPLY"] = 14] = "MULTIPLY";
    TokenType[TokenType["DIVIDE"] = 15] = "DIVIDE";
    TokenType[TokenType["OPAREN"] = 16] = "OPAREN";
    TokenType[TokenType["CPAREN"] = 17] = "CPAREN";
    TokenType[TokenType["OBRACE"] = 18] = "OBRACE";
    TokenType[TokenType["CBRACE"] = 19] = "CBRACE";
    TokenType[TokenType["PLUSEQUAL"] = 20] = "PLUSEQUAL";
    TokenType[TokenType["MINUSEQUAL"] = 21] = "MINUSEQUAL";
    TokenType[TokenType["MULTIPLYEQUAL"] = 22] = "MULTIPLYEQUAL";
    TokenType[TokenType["DIVIDEEQUAL"] = 23] = "DIVIDEEQUAL";
    TokenType[TokenType["RETURN"] = 24] = "RETURN";
    TokenType[TokenType["RTYPE"] = 25] = "RTYPE";
    TokenType[TokenType["FTYPE"] = 26] = "FTYPE";
    TokenType[TokenType["COMMA"] = 27] = "COMMA";
})(TokenType || (TokenType = {}));
function isLetter(str) {
    return new RegExp("[a-zA-Z]").test(str);
}
function isNumber(str) {
    return new RegExp("^[0-9]+$|^-[0-9]+$").test(str);
}
function chop(n) {
    var token = content.substring(0, n);
    content = content.substring(n, content.length);
    return token;
}
function chopWhile(cond) {
    var n = 0;
    while (n < content.length && cond(content.charAt(n))) {
        n++;
    }
    return chop(n);
}
function lex(code) {
    content = code;
    var tokens = [];
    for (var i = 0; i < code.length; i++) {
        if (isLetter(code[i])) {
            tokens.push(chopWhile(function (str) { return isLetter(str); }));
        }
        else if (isNumber(code[i])) {
            tokens.push(chopWhile(function (str) { return isNumber(str); }));
        }
        else if (code[i] == "-") {
            if (isNumber(code[i + 1])) {
                // Include the minus sign in the token
                tokens.push(chop(1) + chopWhile(function (str) { return isNumber(str); }));
            }
            else {
                tokens.push(chop(1));
            }
        }
        else if (code[i] != "")
            tokens.push(chop(1));
    }
    return tokens;
}
function tokenize(content) {
    var tokens = [];
    for (var i = 0; i < content.length; i++) {
        if ((/\b(?:number|string|void|boolean|any)\b/g).test(content[i])) {
            for (var j = i; j < content.length; j++) {
                if (content[j] == "=") {
                    tokens.push({ type: TokenType.TYPE, val: content[i] });
                    break;
                }
                else if (content[j] == "(") {
                    tokens.push({ type: TokenType.RTYPE, val: content[i] });
                    break;
                }
                else if (content[j] == ")") {
                    tokens.push({ type: TokenType.FTYPE, val: content[i] });
                    break;
                }
            }
        }
        else if (content[i] == "\"") {
            var text = "";
            i++;
            while (content[i] != "\"") {
                text += content[i];
                i++;
            }
            tokens.push({ type: TokenType.STRING, val: text });
        }
        else if (content[i] == "=") {
            if (content[i + 1] != "=" && content[i] != ">")
                tokens.push({ type: TokenType.EQUAL, val: content[i] });
        }
        else if (content[i] == ",") {
            tokens.push({ type: TokenType.COMMA, val: content[i] });
        }
        else if (content[i] == "+") {
            if (content[i + 1] == "+") {
                tokens.push({ type: TokenType.PLUSPLUS, val: "++" });
            }
            else if (content[i + 1] == "=") {
                tokens.push({ type: TokenType.PLUSEQUAL, val: "+=" });
                i++;
            }
            else {
                tokens.push({ type: TokenType.PLUS, val: content[i] });
            }
        }
        else if (content[i] == "-") {
            if (content[i + 1] == "-") {
                tokens.push({ type: TokenType.MINUSMINUS, val: "--" });
            }
            else if (content[i + 1] == "=") {
                tokens.push({ type: TokenType.MINUSEQUAL, val: "-=" });
                i++;
            }
            else {
                tokens.push({ type: TokenType.MINUS, val: content[i] });
            }
        }
        else if (content[i] == "*") {
            if (content[i + 1] == "*") {
                tokens.push({ type: TokenType.EXPO, val: "**" });
            }
            else if (content[i + 1] == "=") {
                tokens.push({ type: TokenType.MULTIPLYEQUAL, val: "*=" });
                i++;
            }
            else {
                tokens.push({ type: TokenType.MULTIPLY, val: content[i] });
            }
        }
        else if (content[i] == "/") {
            if (content[i + 1] == "/") {
                while (content[i] != "\n" && i < content.length)
                    i++;
            }
            else if (content[i + 1] == "=") {
                tokens.push({ type: TokenType.DIVIDEEQUAL, val: "/=" });
                i++;
            }
            else {
                tokens.push({ type: TokenType.DIVIDE, val: content[i] });
            }
        }
        else if (content[i] == "(") {
            tokens.push({ type: TokenType.OPAREN, val: content[i] });
        }
        else if (content[i] == ")") {
            tokens.push({ type: TokenType.CPAREN, val: content[i] });
        }
        else if (content[i] == "{") {
            tokens.push({ type: TokenType.OBRACE, val: content[i] });
        }
        else if (content[i] == "}") {
            tokens.push({ type: TokenType.CBRACE, val: content[i] });
        }
        else if (content[i] == "!") {
            if (content[i + 1] != "=") {
                tokens.push({ type: TokenType.NOT, val: content[i] });
            }
        }
        else if (content[i] == "&") {
            if (content[i + 1] == "&") {
                tokens.push({ type: TokenType.AND, val: "&&" });
            }
        }
        else if (content[i] == "|") {
            if (content[i + 1] == "|") {
                tokens.push({ type: TokenType.OR, val: "||" });
            }
        }
        else if (content[i] == "return") {
            tokens.push({ type: TokenType.RETURN, val: content[i] });
        }
        else if (content[i] == ";") {
            tokens.push({ type: TokenType.SEMICOLON, val: content[i] });
        }
        else if (content[i] == "\n") {
            tokens.push({ type: TokenType.NEWLINE, val: content[i] });
        }
        else {
            tokens.push({ type: TokenType.IDENTIFIER, val: content[i] });
        }
    }
    return tokens;
}
function transpile(tokens) {
    var result = "";
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (token.type == TokenType.TYPE) {
            result += "let";
        }
        else if (token.type == TokenType.STRING) {
            result += "\"".concat(token.val, "\"");
        }
        else if (token.type == TokenType.RTYPE) {
            result += "function";
        }
        else if (token.type == TokenType.FTYPE) {
            continue;
        }
        else {
            result += token.val;
        }
    }
    return result;
}
function analyzeFunctions(tokens) {
    var functions = [];
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].type === TokenType.RTYPE && tokens[i + 1].type === TokenType.IDENTIFIER && tokens[i + 2].type === TokenType.OPAREN) {
            var returnType = tokens[i].val;
            var vars = [];
            var functionName = tokens[i + 1].val;
            i += 3; // Skip to after '('
            var inputTokens = [];
            for (var j = i; j < tokens.length && tokens[j].type != TokenType.CPAREN; j++) {
                inputTokens.push(tokens[j]);
            }
            vars = analyzeVariables(inputTokens);
            var originIndex = i;
            while (tokens[originIndex].type != TokenType.OBRACE && originIndex < tokens.length)
                originIndex++;
            originIndex++;
            while (tokens[i].type != TokenType.CBRACE && i < tokens.length) {
                i++;
            }
            var functionBody = tokens.slice(originIndex, i); // Extract function body
            functions.push({ name: functionName, returnType: returnType, body: functionBody, inputVars: vars });
        }
    }
    return functions;
}
function analyzeVariables(tokens) {
    var variables = [];
    for (var i = 0; i < tokens.length - 1; i++) {
        var token = tokens[i];
        if ((/\b(?:number|string|void|boolean|any)\b/g).test(token.val)) {
            if (i + 2 < tokens.length) {
                if (tokens[i + 1].type == TokenType.IDENTIFIER && tokens[i + 2].type != TokenType.OPAREN) {
                    variables.push({ name: tokens[i + 1].val, type: tokens[i].val });
                }
            }
            else {
                if (tokens[i + 1].type == TokenType.IDENTIFIER) {
                    variables.push({ name: tokens[i + 1].val, type: tokens[i].val });
                }
            }
        }
    }
    return variables;
}
function join(inner, outer) {
    var joined = inner;
    var innerNames = inner.map(function (variable) { return variable.name; });
    for (var _i = 0, outer_1 = outer; _i < outer_1.length; _i++) {
        var variable = outer_1[_i];
        if (!innerNames.includes(variable.name))
            joined.push(variable);
    }
    return joined;
}
function checkFunctionForErrors(func) {
    var _a;
    var returnStatements = func.body.filter(function (token) { return token.type === TokenType.RETURN; });
    if (returnStatements.length == 0 && func.returnType != "void") {
        throw new Error("Function ".concat(func.name, " of type ").concat(func.returnType, " must return something"));
    }
    for (var _i = 0, returnStatements_1 = returnStatements; _i < returnStatements_1.length; _i++) {
        var returnStatement = returnStatements_1[_i];
        var right = [];
        for (var i = func.body.indexOf(returnStatement) + 1; i < func.body.length && func.body[i].type != TokenType.NEWLINE && func.body[i].type != TokenType.SEMICOLON; i++) {
            right.push(func.body[i]);
        }
        if (func.returnType == "void") {
            if (right.length != 0 && right[0].type != TokenType.SEMICOLON) {
                throw new Error("Void function ".concat(func.name, " cant return a value"));
            }
            continue;
        }
        if (right.length == 0 || (right.length <= 1 && ((_a = right[0]) === null || _a === void 0 ? void 0 : _a.type) == TokenType.SEMICOLON)) {
            throw new Error("Function ".concat(func.name, " of type ").concat(func.returnType, " must return a value"));
        }
        var returnType = evaluateType(right, join(analyzeVariables(func.body).concat(func.inputVars), variables));
        if (returnType !== func.returnType) {
            throw new Error("Function ".concat(func.name, " should return ").concat(func.returnType, " but returns ").concat(returnType));
        }
    }
}
function checkFunctionsForErrors(functions) {
    for (var _i = 0, functions_1 = functions; _i < functions_1.length; _i++) {
        var func = functions_1[_i];
        checkFunctionForErrors(func);
    }
}
var getFunctionType = function (funcName) {
    var func = functions.find(function (f) { return f.name == funcName; });
    if (!func) {
        throw new Error("Undefined function: ".concat(funcName));
    }
    return func.returnType;
};
var getFunction = function (funcName) {
    var func = functions.find(function (f) { return f.name == funcName; });
    if (!func) {
        return undefined;
    }
    return func;
};
var getVariable = function (varName) {
    var variable = variables.find(function (v) { return v.name === varName; });
    if (!variable) {
        return undefined;
    }
    return variable;
};
function evaluateType(tokens, variables) {
    // Helper functions to determine the type of a token
    var isNumberToken = function (token) {
        return isNumber(token.val);
    };
    var isStringToken = function (token) {
        return token.type === TokenType.STRING;
    };
    var isBooleanToken = function (token) {
        return token.val === "true" || token.val === "false";
    };
    var isBooleanOperator = function (token) {
        return token.type === TokenType.AND || token.type === TokenType.OR || token.type === TokenType.NOT;
    };
    var isIdentifier = function (token) {
        return token.type === TokenType.IDENTIFIER;
    };
    // Function to get the type of a variable
    var getVariableType = function (varName) {
        var variable = variables.find(function (v) { return v.name === varName; });
        if (!variable) {
            throw new Error("Undefined variable: ".concat(varName));
        }
        return variable.type;
    };
    // Helper function to evaluate expressions within parentheses
    var evaluateExpression = function (exprTokens) {
        var currentType = null;
        for (var i = 0; i < exprTokens.length; i++) {
            var token = exprTokens[i];
            if (isNumberToken(token)) {
                if (currentType === null) {
                    currentType = "number";
                }
                else if (currentType !== "number") {
                    throw new Error("Type mismatch: expected ".concat(currentType, " but found number"));
                }
            }
            else if (isStringToken(token)) {
                if (currentType === null) {
                    currentType = "string";
                }
                else if (currentType !== "string") {
                    throw new Error("Type mismatch: expected ".concat(currentType, " but found string"));
                }
            }
            else if (isBooleanToken(token)) {
                if (currentType === null) {
                    currentType = "boolean";
                }
                else if (currentType !== "boolean") {
                    throw new Error("Type mismatch: expected ".concat(currentType, " but found boolean"));
                }
            }
            else if (isIdentifier(token)) {
                if (i + 1 < exprTokens.length && exprTokens[i + 1].type == TokenType.OPAREN) {
                    var funcType = getFunctionType(token.val);
                    if (currentType === null) {
                        currentType = funcType;
                    }
                    else if (currentType !== funcType) {
                        throw new Error("Type mismatch: expected ".concat(currentType, " but found ").concat(funcType));
                    }
                    while (exprTokens[i].type != TokenType.CPAREN)
                        i++;
                }
                else {
                    var varType = getVariableType(token.val);
                    if (currentType === null) {
                        currentType = varType;
                    }
                    else if (currentType !== varType) {
                        throw new Error("Type mismatch: expected ".concat(currentType, " but found ").concat(varType));
                    }
                }
            }
            else if ([TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE].includes(token.type)) {
                if (currentType != "number") {
                    throw new Error("Type mismatch: operator ".concat(token.val, " is not applicable for type ").concat(currentType));
                }
            }
            else if (TokenType.PLUS == token.type) {
                if (currentType != "number" && currentType != "string") {
                    throw new Error("Type mismatch: operator ".concat(token.val, " is not applicable for type ").concat(currentType));
                }
            }
            else if (isBooleanOperator(token)) {
                if (currentType === null) {
                    currentType = "boolean";
                }
                else if (currentType !== "boolean") {
                    throw new Error("Type mismatch: expected ".concat(currentType, " but found boolean operator"));
                }
            }
            else if (token.type === TokenType.OPAREN) {
                var parenTokens = [];
                var balance = 1;
                while (balance > 0) {
                    i++;
                    if (i >= exprTokens.length)
                        throw new Error("Mismatched parentheses");
                    if (exprTokens[i].type === TokenType.OPAREN)
                        balance++;
                    if (exprTokens[i].type === TokenType.CPAREN)
                        balance--;
                    if (balance > 0)
                        parenTokens.push(exprTokens[i]);
                }
                var parenType = evaluateExpression(parenTokens);
                if (currentType === null) {
                    currentType = parenType;
                }
                else if (currentType !== parenType) {
                    throw new Error("Type mismatch: expected ".concat(currentType, " but found ").concat(parenType));
                }
            }
            else {
                throw new Error("Unsupported token type: ".concat(token.val));
            }
        }
        if (currentType === null) {
            throw new Error("Unable to evaluate type of the expression");
        }
        return currentType;
    };
    return evaluateExpression(tokens);
}
function isEmpty2DArray(array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].length > 0) {
            return false;
        }
    }
    return true;
}
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}
function displayToken(tok) {
    return "Type: ".concat(TokenType[tok.type], " -> Val: ").concat(tok.val);
}
function checkForErrors(tokens, variables) {
    var _a, _b, _c;
    var _loop_1 = function (i) {
        var variable = tokens[i - 1];
        var variableType = (_a = variables.find(function (v) { return v.name === variable.val; })) === null || _a === void 0 ? void 0 : _a.type;
        if (variableType == "any")
            return "continue";
        if (tokens[i].type == TokenType.IDENTIFIER) {
            if (((_b = tokens[i + 1]) === null || _b === void 0 ? void 0 : _b.type) == TokenType.OPAREN && ((_c = tokens[i - 1]) === null || _c === void 0 ? void 0 : _c.type) != TokenType.RTYPE) { // Check Function Inputs
                console.log(displayToken(tokens[i]) + "\n");
                if (tokens[i].val == "log")
                    return "continue"; // TODO : support default js libraary
                var funcInputArgs = [];
                var balance = 1;
                var cursor = i + 2;
                for (var j = i + 2; j < tokens.length && balance != 0; j++) {
                    if (tokens[j].type == TokenType.OPAREN)
                        balance++;
                    if (tokens[j].type == TokenType.CPAREN)
                        balance--;
                    if (tokens[j].type == TokenType.COMMA) {
                        funcInputArgs.push(tokens.slice(cursor, j).filter(function (el) { return el.type != TokenType.COMMA; }));
                        cursor = j;
                    }
                    if (balance == 0)
                        funcInputArgs.push(tokens.slice(cursor, j).filter(function (el) { return el.type != TokenType.COMMA; })); // IF ENCOUNTER END THEN ALSO SLICE THE REST
                }
                var func = getFunction(tokens[i].val);
                if (func == undefined)
                    throw new Error("Trying to call unknown function: ".concat(tokens[i].val));
                var funcVars = func.inputVars.map(function (variable) { return variable.type; });
                if (isEmpty2DArray(funcInputArgs) && funcVars.length != 0)
                    throw new Error("Function ".concat(func.name, " must be called with args ").concat(funcVars.length == 0 ? "no arguments" : funcVars, " but was called with no arguments"));
                else {
                    var funcInputTypes = funcInputArgs.map(function (el) { return evaluateType(el, variables); });
                    if (!arraysEqual(funcInputTypes, funcVars)) {
                        throw new Error("Function ".concat(func.name, " must be called with args  ").concat(funcVars.length == 0 ? "no arguments" : funcVars, " but was called with ").concat(funcInputTypes.length == 0 ? "no arguments" : funcInputTypes));
                    }
                }
            }
        }
        if (tokens[i].type == TokenType.EQUAL) {
            var right = [];
            for (var j = i + 1; j < tokens.length && tokens[j].type != TokenType.NEWLINE && tokens[j].type != TokenType.SEMICOLON; j++) {
                right.push(tokens[j]);
            }
            if (evaluateType(right, variables) != variableType) {
                throw new Error("Cannot assign variable ".concat(variable.val, " to value ").concat(right.map(function (el) { return el.val; }).toString(), " types dont match ").concat(variableType, " => ").concat(evaluateType(right, variables)));
            }
        }
        else if (tokens[i].type == TokenType.PLUSPLUS) {
            if (variableType != "number") {
                throw new Error("Can only increment numbers not variable ".concat(variable.val, " of type ").concat(variableType));
            }
        }
        else if (tokens[i].type == TokenType.MINUSMINUS) {
            if (variableType != "number") {
                throw new Error("Can only decrement numbers not variable ".concat(variable.val, " of type ").concat(variableType));
            }
        }
        else if (tokens[i].type == TokenType.PLUSEQUAL) {
            if (variableType != "number" && variableType != "string") {
                throw new Error("Can only  plusequal numbers or strings not variable ".concat(variable.val, " of type ").concat(variableType));
            }
            var right = [];
            for (var j = i + 1; j < tokens.length && tokens[j].type != TokenType.NEWLINE && tokens[j].type != TokenType.SEMICOLON; j++) {
                right.push(tokens[j]);
            }
            if (evaluateType(right, variables) != variableType) {
                throw new Error("Cannot increment variable ".concat(variable.val, " with ").concat(evaluateType(right, variables)));
            }
        }
        else if (tokens[i].type == TokenType.MINUSEQUAL) {
            if (variableType != "number") {
                throw new Error("Can only minusequal numbers not variable ".concat(variable.val, " of type ").concat(variableType));
            }
        }
        else if (tokens[i].type == TokenType.MULTIPLYEQUAL) {
            if (variableType != "number") {
                throw new Error("Can only multiplyequal numbers not variable ".concat(variable.val, " of type ").concat(variableType));
            }
        }
        else if (tokens[i].type == TokenType.DIVIDEEQUAL) {
            if (variableType != "number") {
                throw new Error("Can only divideequal numbers not variable ".concat(variable.val, " of type ").concat(variableType));
            }
        }
    };
    for (var i = 1; i < tokens.length; i++) {
        _loop_1(i);
    }
}
var rawStatements = lex(fileContent).filter(function (el) { return el != ""; });
var statements = rawStatements.filter(function (el) { return el != " " && el != "\r"; });
var tokens = tokenize(statements);
var rawTokens = tokenize(rawStatements);
// Token type to string for better readability
var tokenTypeToString = function (type) { return TokenType[type]; };
variables = analyzeVariables(tokens);
functions = analyzeFunctions(tokens);
checkFunctionsForErrors(functions);
checkForErrors(tokens, variables);
var jsCode = transpile(rawTokens);
fs.writeFileSync("example.js", jsCode);
