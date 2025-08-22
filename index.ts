import * as fs from 'fs';




let content = ""
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
  OBRACKET,
  CBRACKET,
  PLUSEQUAL,
  MINUSEQUAL,
  MULTIPLYEQUAL,
  DIVIDEEQUAL,
  RETURN,
  RTYPE,
  FTYPE,
  COMMA,
  DOT,
  STRUCT,
  COLON
}
  



let variableTypes = ["number" , "boolean" , "void" , "string" , "any"]



type VariableType = typeof variableTypes[number]

type Variable = {
  name:string,
  type: VariableType  
}

type Token = {
  type:TokenType,
  val:string
}

type Struct = {
  name:string
  vars:Variable[]
}

type FunctionDefinition = {
  name: string;
  returnType: VariableType;
  inputVars:Variable[],
  scope:Scope
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


function analyzeStructs(tokens:Token[]): Struct[]{
    let structs :Struct[]= []

    for(let i = 0;i<tokens.length;i++){
      if(tokens[i].type == TokenType.STRUCT){
        let struct : Struct = {name:"",vars:[]}
        struct.name = tokens[i+1].val
        let structTokens:Token[] = []
        i+=3
        while(tokens[i].type != TokenType.CBRACE){
          structTokens.push(tokens[i])
          i++
        }
        
        struct.vars = analyzeVariables(structTokens)
        variableTypes.push(struct.name)
        structs.push(struct)
       
      }
    }

    return structs
}

function getStruct(name:string,vars:Variable[]):Struct{
  let variable = vars.find((variable) => variable.name == name)
  let type:VariableType;
  if(!variable){
    let func =  getFunction(name)
    if(!func) throw new Error(`Identifier ${name} is neither a function nor a variable`)
    else type = func.returnType
  }
  else{
    type = variable.type
  }
  for(let struct of structs){
    if(struct.name == type) return struct
  }
  throw new Error("Could not find struct " + name)
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
    if(variableTypes.includes(content[i])){  
      let type = content[i]  
      i++ 
      while(content[i] == "[" || content[i] == "]")   {
        type += content[i]
        i++
      }
      i--
      for(let j = i;j<content.length;j++){
        if(content[j] == "="){
          tokens.push({type:TokenType.TYPE,val:type})
          break
        }
        else if(content[j] == "("){
          tokens.push({type:TokenType.RTYPE,val:type})
          break
        }
        else if(content[j] == ")"){
          tokens.push({type:TokenType.FTYPE,val:type})
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
    else if(content[i] == "["){
      tokens.push({type:TokenType.OBRACKET,val:content[i]})
    }
    else if(content[i] == "]"){
      tokens.push({type:TokenType.CBRACKET,val:content[i]})
    }
    else if(content[i] == "!"){
      if(content[i+1] != "="){
        tokens.push({type:TokenType.NOT,val:content[i]})
      }
    }
    else if(content[i] == "&"){
      if(content[i+1] != "&"){
        tokens.push({type:TokenType.AND,val:"&"})
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
    else if(content[i] == "struct"){
      tokens.push({type:TokenType.STRUCT,val:content[i]})
    }
    else if(content[i] == ";"){
      tokens.push({type:TokenType.SEMICOLON,val:content[i]})
    }
    else if(content[i] == "."){
      tokens.push({type:TokenType.DOT,val:content[i]})
    }
    else if(content[i] == ":"){
      tokens.push({type:TokenType.COLON,val:content[i]})
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
    for(let i = 0;i<tokens.length;i++){
        let token = tokens[i]
        if(token.type == TokenType.TYPE){
            result += "let"
        }
        else if(token.type == TokenType.STRUCT){
          while(tokens[i].type != TokenType.CBRACE) i++
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
      let c = i + 1
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
      let scope = findScope(rootScope,c,i)
      functions.push({ name: functionName, returnType,inputVars:vars,scope: scope!});
    }
  }
  return functions;
}

function findScope(root: Scope, beginIdx: number, endIdx: number): Scope | undefined {
  if (root.beginIdx === beginIdx && root.endIdx === endIdx) {
    return root;
  }

  for (const child of root.children) {
    const found = findScope(child, beginIdx, endIdx);
    if (found) return found;
  }

  return undefined;
}

function analyzeVariables(tokens: Token[]): Variable[]{
  let variables: Variable[] = []
  for(let i = 0;i<tokens.length-1;i++){
    let token = tokens[i]
  
    if(variableTypes.includes(token.val.replaceAll("[]",""))){
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
  let returnStatements = func.scope.tokens.filter(token => token.type === TokenType.RETURN);
  
  if(returnStatements.length == 0 && func.returnType != "void"){
    throw new Error(`Function ${func.name} of type ${func.returnType} must return something`)
  }


  for (let returnStatement of returnStatements) {
    let right : Token[] = []
    for(let i = func.scope.tokens.indexOf(returnStatement) + 1;i<func.scope.tokens.length && func.scope.tokens[i].type != TokenType.NEWLINE && func.scope.tokens[i].type != TokenType.SEMICOLON;i++){
      if(func.scope.tokens[i].type == TokenType.OBRACE){
        while(i < func.scope.tokens.length && func.scope.tokens[i].type != TokenType.CBRACE) {
          right.push(func.scope.tokens[i])
          i++
        }
      }
      else if(func.scope.tokens[i].type == TokenType.OBRACKET){
        while(i < func.scope.tokens.length && func.scope.tokens[i].type != TokenType.CBRACKET) {
          right.push(func.scope.tokens[i])
          i++
        }
      }
      else right.push(func.scope.tokens[i])
    }
    if(func.returnType == "void"){
      if(right.length != 0 && right[0].type != TokenType.SEMICOLON){
        throw new Error(`Void function ${func.name} cant return a value`)
      }
      continue
    }
    console.log(right)
    if(right.length == 0 || (right.length <= 1 && right[0]?.type == TokenType.SEMICOLON)){
      throw new Error(`Function ${func.name} of type ${func.returnType} must return a value`)
    }
    let returnType = evaluateType(right.filter(el => el.type != TokenType.NEWLINE),func.scope.getAllVariables());
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

const getFunctionType = (funcName:string):VariableType | undefined => {
  const func = functions.find(f => f.name == funcName)
  if (!func) {
    return undefined
  }
  return func.returnType + "()"
}
const getFunction = (funcName:string):FunctionDefinition | undefined=> {
  const func = functions.find(f => f.name == funcName)
  if (!func) {
    return undefined
  }
  return func
}

function splitByRespectingNesting(tokens: Token[],splitter:TokenType,nester:TokenType,unnester:TokenType): Token[][] {
  const result: Token[][] = [];
  let current: Token[] = [];
  let depth = 0;

  for (const tok of tokens) {
    if (tok.type === nester) {
      depth++;
      current.push(tok);
    } else if (tok.type === unnester) {
      depth--;
      current.push(tok);
    } else if (tok.type === splitter && depth === 0) {
      // Only split at top-level commas
      result.push(current);
      current = [];
    } else {
      current.push(tok);
    }
  }

  if (current.length > 0) {
    result.push(current);
  }

  return result;
}





function evaluateType(tokens: Token[], variables: Variable[]): VariableType {
  // Helper functions to determine the type of a token
  const isNumberToken = (token: Token) => {
    return isNumber(token.val) && token.type != TokenType.STRING;
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
  const getVariableType = (varName: string): VariableType | undefined=> {
    const variable = variables.find(v => v.name === varName);
    if (!variable) {
      return undefined
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
       
      } 
      else if(token.type == TokenType.TYPE){
        if(currentType != null) throw new Error("I dont see this happening")
        else currentType = token.val as VariableType
      }
      else if(token.type == TokenType.OBRACKET){
          let arrType:VariableType;
          let arrTokens:Token[] = []
          i++
          let balance  = 1
          while(balance != 0 && i < exprTokens.length) {
            
            if(exprTokens[i].type == TokenType.OBRACKET) balance++
            if(exprTokens[i].type == TokenType.CBRACKET) balance--  
            if(balance != 0) arrTokens.push(exprTokens[i])
            i++
          }
          if(arrTokens.length == 0) return "any"
          console.log(arrTokens)
          let values :Token[][] = splitByRespectingNesting(arrTokens,TokenType.COMMA,TokenType.OBRACKET,TokenType.CBRACKET)
          console.log(values)
          arrType = evaluateType(values[0],variables)
          for(let value of values){
            if(evaluateType(value,variables) != arrType) arrType = "any"
          }
          if(currentType != null) throw new Error("I dont see this happening")
          else currentType = arrType + "[]" as VariableType

        }else if(token.type == TokenType.CBRACKET) continue
        else if (isBooleanToken(token)) {
        if (currentType === null) {
          currentType = "boolean";
        } else if (currentType !== "boolean") {
          throw new Error(`Type mismatch: expected ${currentType} but found boolean`);
        }
      }else if(token.type == TokenType.OBRACE){
        let structTokens : Token[] = []
        i++
        while(i < exprTokens.length && exprTokens[i].type != TokenType.CBRACE){
          structTokens.push(exprTokens[i])
          i++
        }
        let keyValuePairs = splitByRespectingNesting(structTokens,TokenType.COMMA,TokenType.OBRACKET,TokenType.CBRACKET).map(el => el.filter(el => el.type != TokenType.NEWLINE))
        let keys:string[] = []
        let types : VariableType[] = []
        for(let keyValuePair of keyValuePairs){
          let keyValuePairSplit= splitByRespectingNesting(keyValuePair,TokenType.COLON,TokenType.OBRACE,TokenType.CBRACE)
          keys.push(keyValuePairSplit[0][0].val)
          types.push(evaluateType(keyValuePairSplit[1],variables))
        }
        let matchingStruct:Struct|undefined = undefined;
        for(let struct of structs){
          if(arraysEqual(struct.vars.map(el => el.name),keys) && arraysEqual(struct.vars.map(el => el.type),types)) {
            matchingStruct = struct
          }
        }
        if(matchingStruct == undefined) throw new Error(`No matching struct found for keys ${keys.join(" ")}`)
        return matchingStruct.name

      } 
      else if (isIdentifier(token)) {
          let exprType:VariableType | undefined = undefined
          let currentToken : Token = token
          while(i < exprTokens.length && [TokenType.OPAREN,TokenType.OBRACKET,TokenType.IDENTIFIER,TokenType.DOT].includes(exprTokens[i].type)){
            if(exprTokens[i].type == TokenType.OPAREN){
              if(exprType == undefined) throw new Error("I dont see this happening")
              if(!exprType.endsWith("()")) throw new Error(`Cant call on type ${exprType}`)
              exprType = exprType.slice(0,exprType.length-2)
              while(exprTokens[i].type != TokenType.CPAREN) i++
            }
            else if(isIdentifier(exprTokens[i])){
              if(!isNumberToken(exprTokens[i])) {
                exprType = getVariableType(exprTokens[i].val)
                if(exprType == undefined){
                  exprType = getFunctionType(exprTokens[i].val)
                  if(exprType == undefined){
                    throw new Error(`Identifier ${exprTokens[i].val} is neither a function nor a variable`)
                  }
                  else{
                    currentToken = exprTokens[i]
                  }
                }
                else{
                  currentToken = exprTokens[i]
                }
              }
            }
            else if(exprTokens[i].type == TokenType.DOT){
              let struct = getStruct(currentToken.val,variables)
              let found = false
              for(let variable of struct.vars){
                
                if(variable.name == exprTokens[i+1].val) {
                  exprType = variable.type
                  found = true
                }
                
              }
              if(!found) throw new Error(`Property ${exprTokens[i+1].val} does not exist on struct of type ${struct.name}`)
              currentToken = exprTokens[i+1]
              i+=1
            }
            else if(exprTokens[i].type == TokenType.OBRACKET){
              if(!exprType) throw new Error("Cant index nothing")
              if(!exprType.endsWith("[]")) throw new Error(`Cant index non array type ${token.val}`)
              else{
                exprType = exprType.slice(0,exprType.length - 2)
                while(exprTokens[i].type != TokenType.CBRACKET) i++
              }
            }
          
            i++           
          }
          if(exprType == undefined) throw new Error("Error whilst trying to evaluate identifier expression")
          if(currentType == null) currentType = exprType
          else if(currentType != exprType) throw new Error(`Type mismatch ${currentType} : ${exprType}`)

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

function checkForErrors(scope:Scope){
  for(let i = 1;i<scope.tokens.length;i++){
    if(scope.tokens[i].type == TokenType.IDENTIFIER){
      
      if(scope.tokens[i+1]?.type == TokenType.OPAREN && scope.tokens[i-1]?.type != TokenType.RTYPE){ // Check Function Inputs
        if(scope.tokens[i].val == "log") continue // TODO : support default js libraary
        let funcInputArgs:Token[][] = []
        let cursor = i+2
        let parenBalance = 1; // starting from the opening '('
        let bracketBalance = 0; // track [ ]

        for (let j = i + 2; j < scope.tokens.length && parenBalance != 0; j++) {
            const tok = scope.tokens[j];

            if (tok.type === TokenType.OPAREN) parenBalance++;
            else if (tok.type === TokenType.CPAREN) parenBalance--;
            else if (tok.type === TokenType.OBRACKET) bracketBalance++;
            else if (tok.type === TokenType.CBRACKET) bracketBalance--;

            // only split on commas at top-level of this function argument
            if (tok.type === TokenType.COMMA && bracketBalance === 0 && parenBalance > 0) {
                funcInputArgs.push(
                    scope.tokens.slice(cursor, j).filter(el => el.type != TokenType.COMMA)
                );
                cursor = j + 1; // skip the comma
            }

            if (parenBalance === 0) {
                funcInputArgs.push(
                    scope.tokens.slice(cursor, j).filter(el => el.type != TokenType.COMMA)
                );
            }
        }
        let func = getFunction(scope.tokens[i].val)
        if(func == undefined) throw new Error(`Trying to call unknown function: ${scope.tokens[i].val}`)
        let funcVars = func!.inputVars.map(variable => variable.type)

        
        if(isEmpty2DArray(funcInputArgs) && funcVars.length != 0)  throw new Error(`Function ${func.name} must be called with args ${funcVars.length == 0 ? "no arguments" : funcVars} but was called with no arguments`)
        else if(!isEmpty2DArray(funcInputArgs)){
          let funcInputTypes = funcInputArgs.map(el => evaluateType(el,scope.getAllVariables()))
          if(!arraysEqual(funcInputTypes,funcVars)){
            throw new Error(`Function ${func.name} must be called with args  ${funcVars.length == 0 ? "no arguments" : funcVars} but was called with ${funcInputTypes.length == 0 ? "no arguments" : funcInputTypes}`)
          }
        }
       
       
      }
    }
    else if(scope.tokens[i].type == TokenType.OBRACKET && (scope.tokens[i-1].type == TokenType.IDENTIFIER || scope.tokens[i-1].type == TokenType.CBRACKET)){
      let arrAccessTokens : Token[] = []
      i++
      while(scope.tokens[i].type != TokenType.CBRACKET){
        arrAccessTokens.push(scope.tokens[i])
        i++
      }
      if(evaluateType(arrAccessTokens,scope.getAllVariables()) != "number") throw new Error(`Array must be indexed with number but was indexed with ${arrAccessTokens.map(el => el.val).join("")}`)
    }
    else if(scope.tokens[i].type == TokenType.EQUAL){
      let right:Token[] = []
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      for(let j = i+1;j<scope.tokens.length && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j++){
        if(scope.tokens[j].type == TokenType.OBRACE){
          let balance = 1
          while(balance != 0 && j<scope.tokens.length) {
            if(scope.tokens[j].type == TokenType.OBRACE) balance++
            if(scope.tokens[j].type == TokenType.CBRACE) balance--
            right.push(scope.tokens[j])
            j++
          }
        }
        else right.push(scope.tokens[j])
      }
      if(evaluateType(left,scope.getAllVariables()) == "any") continue
      if(evaluateType(right,scope.getAllVariables()) != evaluateType(left,scope.getAllVariables()) && !evaluateType(right,scope.getAllVariables()).startsWith("any")){
        throw new Error(`Cannot assign ${left.map(el => el.val).join("")} to value ${right.map((el) => el.val).join("")} types dont match ${evaluateType(left,scope.getAllVariables())} => ${evaluateType(right,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.PLUSPLUS){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number"){
        throw new Error(`Can only increment numbers not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.MINUSMINUS){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number"){
        throw new Error(`Can only decrement not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.PLUSEQUAL){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number" && evaluateType(left,scope.getAllVariables()) != "string"){
        throw new Error(`Can only  plusequal numbers or strings not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
      let right:Token[] = []
      for(let j = i+1;j<scope.tokens.length && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(scope.tokens[j])
      }
      if(evaluateType(right,scope.getAllVariables()) != evaluateType(left,scope.getAllVariables())){
        throw new Error(`Cannot increment variable ${left.map(el => el.val).join("")} with ${evaluateType(right,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.MINUSEQUAL){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number" && evaluateType(left,scope.getAllVariables()) != "string"){
        throw new Error(`Can only  minusequal numbers or strings not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
      let right:Token[] = []
      for(let j = i+1;j<scope.tokens.length && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(scope.tokens[j])
      }
      if(evaluateType(right,scope.getAllVariables()) != evaluateType(left,scope.getAllVariables())){
        throw new Error(`Cannot decrement variable ${left.map(el => el.val).toString()} with ${evaluateType(right,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.MULTIPLYEQUAL){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number" && evaluateType(left,scope.getAllVariables()) != "string"){
        throw new Error(`Can only  multiplyequal numbers or strings not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
      let right:Token[] = []
      for(let j = i+1;j<scope.tokens.length && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(scope.tokens[j])
      }
      if(evaluateType(right,scope.getAllVariables()) != evaluateType(left,scope.getAllVariables())){
        throw new Error(`Cannot multiply variable ${left.map(el => el.val).join("")} with ${evaluateType(right,scope.getAllVariables())}`)
      }
    }
    else if(scope.tokens[i].type == TokenType.DIVIDEEQUAL){
      let left:Token[] = []
      for(let j  = i-1;j>=0 && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j--) left.unshift(scope.tokens[j])
      if(evaluateType(left,scope.getAllVariables()) != "number" && evaluateType(left,scope.getAllVariables()) != "string"){
        throw new Error(`Can only  divideequal numbers or strings not ${left.map(el => el.val).join("")} of type ${evaluateType(left,scope.getAllVariables())}`)
      }
      let right:Token[] = []
      for(let j = i+1;j<scope.tokens.length && scope.tokens[j].type != TokenType.NEWLINE && scope.tokens[j].type != TokenType.SEMICOLON;j++){
        right.push(scope.tokens[j])
      }
      if(evaluateType(right,scope.getAllVariables()) != evaluateType(left,scope.getAllVariables())){
        throw new Error(`Cannot divide variable ${left.map(el => el.val).toString()} with ${evaluateType(right,scope.getAllVariables())}`)
      }
    }
  }
  for(let childScope of scope.children){
    checkForErrors(childScope)
  }

}

function findMatchingCBrace(tokens:Token[],beginIdx:number,skipFirstO:boolean) : number{
  for(let i =  beginIdx;i<tokens.length;i++){
    let balance = 1
    if(tokens[i].type == TokenType.CBRACE) balance--
    if(tokens[i].type == TokenType.OBRACE && !skipFirstO) balance++
    if(balance == 0) return i
  }
  return -1
}

class Scope{
  tokens:Token[] = []
  variables: Variable[] = []
  children:Scope[] = []
  parent:Scope | undefined = undefined 
  beginIdx:number
  endIdx:number


  constructor(inputTokens:Token[],beginIdx:number,endIdx:number,ignoreFirstOBrace:boolean = false){
    this.beginIdx = beginIdx
    this.endIdx = endIdx
    for(let i = beginIdx;i<endIdx;i++){
      let token = inputTokens[i]
      if(token.type == TokenType.RTYPE){
        let matchingCBraceIdx = findMatchingCBrace(inputTokens,i,true)
        let childScope = new Scope(inputTokens,i+1,matchingCBraceIdx,true)
        this.children.push(childScope)
        childScope.parent = this
        i = matchingCBraceIdx == - 1 ? i : matchingCBraceIdx
      }
      else if(token.type == TokenType.OBRACE && inputTokens[i-1]?.type != TokenType.EQUAL && !ignoreFirstOBrace){
        let matchingCBraceIdx = findMatchingCBrace(inputTokens,i,false)
        let childScope = new Scope(inputTokens,i+1,matchingCBraceIdx)
        this.children.push(childScope)
        childScope.parent = this
        i = matchingCBraceIdx == - 1 ? i : matchingCBraceIdx
      }
      else this.tokens.push(token)
    }
    this.variables = analyzeVariables(this.tokens)
  }

  
  

  

  getAllVariables():Variable[]{
      if(this.parent == undefined) return this.variables
      return join(this.variables,this.parent.getAllVariables())
  }
}






const fileContent = fs.readFileSync("example.jss").toString()

const rawStatements = lex(fileContent).filter((el) => el != "")
const statements = rawStatements.filter((el) => el != " " && el != "\r")

let allTokens = tokenize(statements)
let structs = analyzeStructs(allTokens.filter(el => el.type != TokenType.NEWLINE))
allTokens = tokenize(statements)
let rootScope = new Scope(allTokens,0,allTokens.length)








const rawTokens = tokenize(rawStatements)







functions = analyzeFunctions(allTokens)

checkFunctionsForErrors(functions)



checkForErrors(rootScope)

let jsCode = transpile(rawTokens)
fs.writeFileSync("example.js",jsCode)
