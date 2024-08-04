import * as fs from 'fs';
import {Queue} from './queue'

const fileContent = fs.readFileSync("example.jss").toString()

let content = ""
let variables:Variable[] = []
let functions: FunctionDefinition[] = []






enum TokenType {
  IDENTIFIER,
  EQUAL,
  TYPE,
  PLUSPLUS,
  MINUSMINUS,
  EXPO,
  NEWLINE,
  SEMICOLON,
  STRING,
  OR,
  AND,
  NOT,
  PLUS,
  MINUS,
  MULTIPLY,
  DIVIDE,
  OPAREN,
  CPAREN,
  OBRACE,
  CBRACE,
  PLUSEQUAL,
  MINUSEQUAL,
  MULTIPLYEQUAL,
  DIVIDEEQUAL,
  RETURN,
  RTYPE,
  FTYPE,
  COMMA
}
  

type VariableType = "number" | "boolean" | "void" | "string" | "any"

type Variable = {
  name:string,
  type: VariableType  
}

type Token = {
    type:TokenType,
    val:string
}

type FunctionDefinition = {
  name: string;
  returnType: VariableType;
  body: Token[];
  inputVars:Variable[]
};


function isLetter(str:string):boolean {
  return new RegExp("[a-zA-Z]").test(str);
}

function isNumber(str:string): boolean{
  return new RegExp("^[0-9]+$|^-[0-9]+$").test(str)
}

function chop(n:number):string{
  let token = content.substring(0,n)
  content = content.substring(n,content.length)
  return token
}

function chopWhile(cond:(str:string) => boolean):string{
  let n = 0;
  while (n < content.length && cond(content.charAt(n))){
      n++;
  }
  return chop(n)

}






function lex(code:string):string[]{
  content = code;
  let tokens: string[] = [];
  for(let i = 0;i<code.length;i++){
      if(isLetter(code[i])){
          tokens.push(chopWhile((str:string) => isLetter(str)))
      }

      else if(isNumber(code[i])){
          tokens.push(chopWhile((str:string) => isNumber(str)))  
      }  
      
      else if(code[i] == "-"){
        if(isNumber(code[i+1])){
          // Include the minus sign in the token
          tokens.push(chop(1) + chopWhile((str:string) => isNumber(str)));
        } else {
          tokens.push(chop(1));
        }
      }
      

      else if(code[i] != "") tokens.push(chop(1))
  } 
  return tokens
}

function tokenize(content:string[]):Token[]{
  let tokens:Token[] = []
  for(let i = 0;i<content.length;i++){
    if((/\b(?:number|string|void|boolean|any)\b/g).test(content[i])){     
      for(let j = i;j<content.length;j++){
        if(content[j] == "="){
          tokens.push({type:TokenType.TYPE,val:content[i]})
          break
        }
        else if(content[j] == "("){
          tokens.push({type:TokenType.RTYPE,val:content[i]})
          break
        }
        else if(content[j] == ")"){
          tokens.push({type:TokenType.FTYPE,val:content[i]})
          break          
        }
      }
    }
    else if(content[i] == `"`){
      let text = ""
      i++
      while(content[i] != `"`){
        text += content[i]
        i++
      }
      tokens.push({type:TokenType.STRING,val:text})
    }
    else if(content[i] == "="){
      if(content[i+1] != "=" && content[i] != ">")
        tokens.push({type:TokenType.EQUAL,val:content[i]})
    }
    else if(content[i] == ","){
      tokens.push({type:TokenType.COMMA,val:content[i]})
    }
    else if(content[i] == "+"){
      if(content[i+1] == "+"){
        tokens.push({type:TokenType.PLUSPLUS,val:"++"})
      }
      else if(content[i+1] == "="){
        tokens.push({type:TokenType.PLUSEQUAL,val:"+="})
        i++
      }
      else{
        tokens.push({type:TokenType.PLUS,val:content[i]})
      }
    }
    else if(content[i] == "-"){
      if(content[i+1] == "-"){
        tokens.push({type:TokenType.MINUSMINUS,val:"--"})
      }
      else if(content[i+1] == "="){
        tokens.push({type:TokenType.MINUSEQUAL,val:"-="})
        i++
      }
      else{
        tokens.push({type:TokenType.MINUS,val:content[i]})
      }
    }
    else if(content[i] == "*"){
      if(content[i+1] == "*"){
        tokens.push({type:TokenType.EXPO,val:"**"})
      }
      else if(content[i+1] == "="){
        tokens.push({type:TokenType.MULTIPLYEQUAL,val:"*="})
        i++
      }
      else{
        tokens.push({type:TokenType.MULTIPLY,val:content[i]})
      }
    }
    else if(content[i] == "/"){
      if(content[i+1] == "/"){
        while(content[i] != "\n"  && i < content.length) i++
      }
      else if(content[i+1] == "="){
        tokens.push({type:TokenType.DIVIDEEQUAL,val:"/="})
        i++
      }
      else{
        tokens.push({type:TokenType.DIVIDE,val:content[i]})
      }
    }
    else if(content[i] == "("){
      tokens.push({type:TokenType.OPAREN,val:content[i]})
    }
    else if(content[i] == ")"){
      tokens.push({type:TokenType.CPAREN,val:content[i]})
    }
    else if(content[i] == "{"){
      tokens.push({type:TokenType.OBRACE,val:content[i]})
    }
    else if(content[i] == "}"){
      tokens.push({type:TokenType.CBRACE,val:content[i]})
    }
    else if(content[i] == "!"){
      if(content[i+1] != "="){
        tokens.push({type:TokenType.NOT,val:content[i]})
      }
    }
    else if(content[i] == "&"){
      if(content[i+1] == "&"){
        tokens.push({type:TokenType.AND,val:"&&"})
      }
    }
    else if(content[i] == "|"){
      if(content[i+1] == "|"){
        tokens.push({type:TokenType.OR,val:"||"})
      }
    }
    else if(content[i] == "return"){
      tokens.push({type:TokenType.RETURN,val:content[i]})
    }
    else if(content[i] == ";"){
      tokens.push({type:TokenType.SEMICOLON,val:content[i]})
    }
    else if(content[i] == "\n"){
      tokens.push({type:TokenType.NEWLINE,val:content[i]})
    }
    else{
      tokens.push({type:TokenType.IDENTIFIER,val:content[i]})
    }
  }
  return tokens
}

function transpile(tokens:Token[]): string{
    let result = ""
    for(let token of tokens){
        if(token.type == TokenType.TYPE){
            result += "let"
        }
        else if(token.type == TokenType.STRING){
          result += `"${token.val}"`
        }
        else if(token.type == TokenType.RTYPE){
          result += "function"
        }
        else if(token.type == TokenType.FTYPE){
          continue
        }
        else{
            result += token.val
        }
    }
    return result
}

function analyzeFunctions(tokens: Token[]): FunctionDefinition[] {
  let functions: FunctionDefinition[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === TokenType.RTYPE && tokens[i + 1].type === TokenType.IDENTIFIER && tokens[i + 2].type === TokenType.OPAREN) {
      let returnType = tokens[i].val as VariableType;
      let vars:Variable[] = []
      let functionName = tokens[i + 1].val;
      i += 3; // Skip to after '('
      let inputTokens:Token[] = []
      for(let j = i;j<tokens.length && tokens[j].type != TokenType.CPAREN;j++){
        inputTokens.push(tokens[j])
      }
      vars = analyzeVariables(inputTokens)
      let originIndex = i
      while(tokens[originIndex].type != TokenType.OBRACE && originIndex < tokens.length) originIndex++
      originIndex++
      while (tokens[i].type != TokenType.CBRACE && i < tokens.length) {
        i++;
      }
      let functionBody = tokens.slice(originIndex, i); // Extract function body
      functions.push({ name: functionName, returnType, body: functionBody ,inputVars:vars});
    }
  }
  return functions;
}

function analyzeVariables(tokens: Token[]): Variable[]{
  let variables: Variable[] = []
  for(let i = 0;i<tokens.length-1;i++){
    let token = tokens[i]
    if((/\b(?:number|string|void|boolean|any)\b/g).test(token.val)){
      if(i+2<tokens.length){
        if(tokens[i+1].type == TokenType.IDENTIFIER && tokens[i+2].type != TokenType.OPAREN){
          variables.push({name:tokens[i+1].val,type:tokens[i].val as VariableType})
        }
      }
      else{
        if(tokens[i+1].type == TokenType.IDENTIFIER){
          variables.push({name:tokens[i+1].val,type:tokens[i].val as VariableType})
        }
      }
    }
  }
  return variables
}

function  join(inner:Variable[],outer:Variable[]):Variable[]{
  let joined = inner
  let innerNames = inner.map(variable => variable.name)
  for(let variable of outer){
    if(!innerNames.includes(variable.name)) joined.push(variable)
  }
  return joined
}

function checkFunctionForErrors(func: FunctionDefinition): void {
  let returnStatements = func.body.filter(token => token.type === TokenType.RETURN);
  
  if(returnStatements.length == 0 && func.returnType != "void"){
    throw new Error(`Function ${func.name} of type ${func.returnType} must return something`)
  }


  for (let returnStatement of returnStatements) {
    let right : Token[] = []
    for(let i = func.body.indexOf(returnStatement) + 1;i<func.body.length && func.body[i].type != TokenType.NEWLINE && func.body[i].type != TokenType.SEMICOLON;i++){
      right.push(func.body[i])
    }
    if(func.returnType == "void"){
      if(right.length != 0 && right[0].type != TokenType.SEMICOLON){
        throw new Error(`Void function ${func.name} cant return a value`)
      }
      continue
    }
    if(right.length == 0 || (right.length <= 1 && right[0]?.type == TokenType.SEMICOLON)){
      throw new Error(`Function ${func.name} of type ${func.returnType} must return a value`)
    }
    let returnType = evaluateType(right,join(analyzeVariables(func.body).concat(func.inputVars),variables));
    if (returnType !== func.returnType) {
      throw new Error(`Function ${func.name} should return ${func.returnType} but returns ${returnType}`);
    }
  }
}

function checkFunctionsForErrors(functions: FunctionDefinition[]): void {
  for (let func of functions) {
    checkFunctionForErrors(func);
  }
}

const getFunctionType = (funcName:string):VariableType => {
  const func = functions.find(f => f.name == funcName)
  if (!func) {
    throw new Error(`Undefined function: ${funcName}`);
  }
  return func.returnType
}
const getFunction = (funcName:string):FunctionDefinition | undefined=> {
  const func = functions.find(f => f.name == funcName)
  if (!func) {
    return undefined
  }
  return func
}


const getVariable = (varName: string): Variable | undefined => {
  const variable = variables.find(v => v.name === varName);
  if (!variable) {
    return undefined
  }
  return variable;
};

function evaluateType(tokens: Token[], variables: Variable[]): VariableType {
  // Helper functions to determine the type of a token
  const isNumberToken = (token: Token) => {
    return isNumber(token.val);
  };

  const isStringToken = (token: Token) => {
    return token.type === TokenType.STRING;
  };

  const isBooleanToken = (token: Token) => {
    return token.val === "true" || token.val === "false";
  };

  const isBooleanOperator = (token: Token) => {
    return token.type === TokenType.AND || token.type === TokenType.OR || token.type === TokenType.NOT;
  };

  const isIdentifier = (token: Token) => {
    return token.type === TokenType.IDENTIFIER;
  };

  // Function to get the type of a variable
  const getVariableType = (varName: string): VariableType => {
    const variable = variables.find(v => v.name === varName);
    if (!variable) {
      throw new Error(`Undefined variable: ${varName}`);
    }
    return variable.type;
  };



  // Helper function to evaluate expressions within parentheses
  const evaluateExpression = (exprTokens: Token[]): VariableType => {
    let currentType: VariableType | null = null;
    for (let i = 0; i < exprTokens.length; i++) {
      let token = exprTokens[i];
      if (isNumberToken(token)) {
        if (currentType === null) {
          currentType = "number";
        } else if (currentType !== "number") {
          throw new Error(`Type mismatch: expected ${currentType} but found number`);
        }
      } else if (isStringToken(token)) {
        if (currentType === null) {
          currentType = "string";
        } else if (currentType !== "string") {
          throw new Error(`Type mismatch: expected ${currentType} but found string`);
        }
      } else if (isBooleanToken(token)) {
        if (currentType === null) {
          currentType = "boolean";
        } else if (currentType !== "boolean") {
          throw new Error(`Type mismatch: expected ${currentType} but found boolean`);
        }
      } else if (isIdentifier(token)) {
          if(i+1 < exprTokens.length && exprTokens[i+1].type == TokenType.OPAREN){
            let funcType = getFunctionType(token.val)
            if (currentType === null) {
              currentType = funcType;
            } else if (currentType !== funcType) {
              throw new Error(`Type mismatch: expected ${currentType} but found ${funcType}`);
            }
            while(exprTokens[i].type != TokenType.CPAREN) i++
          }
          else {
            const varType = getVariableType(token.val);
            if (currentType === null) {
              currentType = varType;
            } else if (currentType !== varType) {
              throw new Error(`Type mismatch: expected ${currentType} but found ${varType}`);
            }
          }
      } else if ([ TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE].includes(token.type)) {
        if (currentType != "number") {
          throw new Error(`Type mismatch: operator ${token.val} is not applicable for type ${currentType}`);
        }
      } else if(TokenType.PLUS == token.type){
        if(currentType != "number" && currentType != "string") {
          throw new Error(`Type mismatch: operator ${token.val} is not applicable for type ${currentType}`);
        }
      } 
      else if (isBooleanOperator(token)) {
        if (currentType === null) {
          currentType = "boolean";
        } else if (currentType !== "boolean") {
          throw new Error(`Type mismatch: expected ${currentType} but found boolean operator`);
        }
      }else if (token.type === TokenType.OPAREN) {
        let parenTokens: Token[] = [];
        let balance = 1;
        while (balance > 0) {
          i++;
          if (i >= exprTokens.length) throw new Error("Mismatched parentheses");
          if (exprTokens[i].type === TokenType.OPAREN) balance++;
          if (exprTokens[i].type === TokenType.CPAREN) balance--;
          if (balance > 0) parenTokens.push(exprTokens[i]);
        }
        const parenType = evaluateExpression(parenTokens);
        if (currentType === null) {
          currentType = parenType;
        } else if (currentType !== parenType) {
          throw new Error(`Type mismatch: expected ${currentType} but found ${parenType}`);
        }
      } else {
        throw new Error(`Unsupported token type: ${token.val}`);
      }
    }

    if (currentType === null) {
      throw new Error(`Unable to evaluate type of the expression`);
    }

    return currentType;
  };

  return evaluateExpression(tokens);
}

function isEmpty2DArray<T>(array: T[][]): boolean {
  for (let i = 0; i < array.length; i++) {
    if (array[i].length > 0) {
      return false;
    }
  }
  return true;
}


function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) {
      return false;
  }

  for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
          return false;
      }
  }

  return true;
}


function displayToken(tok:Token):string{
  return `Type: ${TokenType[tok.type]} -> Val: ${tok.val}`
}

function checkForErrors(tokens: Token[],variables:Variable[]){
  for(let i = 1;i<tokens.length;i++){
    let variable = tokens[i-1]
    let variableType = variables.find(v => v.name === variable.val)?.type;
    if(variableType == "any") continue
    if(tokens[i].type == TokenType.IDENTIFIER){
      
      if(tokens[i+1]?.type == TokenType.OPAREN && tokens[i-1]?.type != TokenType.RTYPE){ // Check Function Inputs
        console.log(displayToken(tokens[i]) + "\n")
        if(tokens[i].val == "log") continue // TODO : support default js libraary
        let funcInputArgs:Token[][] = []
        let balance = 1
        let cursor = i+2
        for(let j = i+2;j<tokens.length && balance != 0;j++){
          if(tokens[j].type == TokenType.OPAREN) balance++
          if(tokens[j].type == TokenType.CPAREN) balance--
          if(tokens[j].type == TokenType.COMMA) {
            funcInputArgs.push(tokens.slice(cursor,j).filter(el => el.type != TokenType.COMMA))
            cursor = j
          }
          if(balance == 0) funcInputArgs.push(tokens.slice(cursor,j).filter(el => el.type != TokenType.COMMA)) // IF ENCOUNTER END THEN ALSO SLICE THE REST
           
        }
        let func = getFunction(tokens[i].val)
        if(func == undefined) throw new Error(`Trying to call unknown function: ${tokens[i].val}`)
        let funcVars = func!.inputVars.map(variable => variable.type)

        
        if(isEmpty2DArray(funcInputArgs) && funcVars.length != 0)  throw new Error(`Function ${func.name} must be called with args ${funcVars.length == 0 ? "no arguments" : funcVars} but was called with no arguments`)
        else {
          let funcInputTypes = funcInputArgs.map(el => evaluateType(el,variables))
          if(!arraysEqual(funcInputTypes,funcVars)){
            throw new Error(`Function ${func!.name} must be called with args  ${funcVars.length == 0 ? "no arguments" : funcVars} but was called with ${funcInputTypes.length == 0 ? "no arguments" : funcInputTypes}`)
          }
        }
       
       
      }
    }
    if(tokens[i].type == TokenType.EQUAL){
      let right:Token[] = []
      for(let j = i+1;j<tokens.length && tokens[j].type != TokenType.NEWLINE && tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(tokens[j])
      }
      if(evaluateType(right,variables) != variableType){
        throw new Error(`Cannot assign variable ${variable.val} to value ${right.map((el) => el.val).toString()} types dont match ${variableType} => ${evaluateType(right,variables)}`)
      }
    }
    else if(tokens[i].type == TokenType.PLUSPLUS){
      if(variableType != "number"){
        throw new Error(`Can only increment numbers not variable ${variable.val} of type ${variableType}`)
      }
    }
    else if(tokens[i].type == TokenType.MINUSMINUS){
      if(variableType != "number"){
        throw new Error(`Can only decrement numbers not variable ${variable.val} of type ${variableType}`)
      }
    }
    else if(tokens[i].type == TokenType.PLUSEQUAL){
      if(variableType != "number" && variableType != "string"){
        throw new Error(`Can only  plusequal numbers or strings not variable ${variable.val} of type ${variableType}`)
      }
      let right:Token[] = []
      for(let j = i+1;j<tokens.length && tokens[j].type != TokenType.NEWLINE && tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(tokens[j])
      }
      if(evaluateType(right,variables) != variableType){
        throw new Error(`Cannot increment variable ${variable.val} with ${evaluateType(right,variables)}`)
      }
    }
    else if(tokens[i].type == TokenType.MINUSEQUAL){
      if(variableType != "number"){
        throw new Error(`Can only minusequal numbers not variable ${variable.val} of type ${variableType}`)
      }
    }
    else if(tokens[i].type == TokenType.MULTIPLYEQUAL){
      if(variableType != "number"){
        throw new Error(`Can only multiplyequal numbers not variable ${variable.val} of type ${variableType}`)
      }
    }
    else if(tokens[i].type == TokenType.DIVIDEEQUAL){
      if(variableType != "number"){
        throw new Error(`Can only divideequal numbers not variable ${variable.val} of type ${variableType}`)
      }
    }
  }

}


const rawStatements = lex(fileContent).filter((el) => el != "")
const statements = rawStatements.filter((el) => el != " " && el != "\r")

const tokens = tokenize(statements)
const rawTokens = tokenize(rawStatements)




// Token type to string for better readability
const tokenTypeToString = (type: TokenType) => TokenType[type];





variables = analyzeVariables(tokens)
functions = analyzeFunctions(tokens)

checkFunctionsForErrors(functions)



checkForErrors(tokens,variables)

let jsCode = transpile(rawTokens)
fs.writeFileSync("example.js",jsCode)
