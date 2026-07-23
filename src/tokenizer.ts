

export enum TokenType {
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
  STYPE,
  COMMA,
  DOT,
  STRUCT,
  COLON,
  IF,
  ELSE,
  WHILE,
  FOR,
  EQEQ,
  NEQ,
  LESSTHAN,
  GREATERTHAN,
  LESSEQ,
  GREATEREQ
}

export type RawToken = {
  val: string;
  line: number;
  column: number;
};

export type Token = {
  type: TokenType;
  val: string;
  line?: number;
  column?: number;
};

class ExpectableToken {
    private token:Token;
    public constructor(token:Token){
        this.token = token;
    }
    public toBe(expectedType:TokenType):GettableToken | ExpectError{
        if(this.token.type != expectedType){
            return new ExpectError(`Expected token type ${TokenType[expectedType]}, but got ${TokenType[this.token.type]}`);
        }
        return new GettableToken(this.token);
    }
}

export class GettableToken {
    private token:Token;
    public constructor(token:Token){
        this.token = token;
    }
    public getValue():Token {
        return this.token;
    }
}

export class ExpectError {
    public message:string;
    public constructor(message:string){
        this.message = message;
    }
}

class ExpectableTokens {
    private tokens:Token[];
    public constructor(tokens:Token[]){
        this.tokens = tokens;
    }
    public toBe(expectedTypes:TokenType[]):GettableTokens | ExpectError{
        if(this.tokens.length != expectedTypes.length){
             return new ExpectError(`Expected ${expectedTypes.length} tokens, but got ${this.tokens.length}`);
        }
        for(let i = 0;i<expectedTypes.length;i++){
            if(this.tokens[i].type != expectedTypes[i]){
             return new ExpectError(`Expected token type ${TokenType[expectedTypes[i]]}, but got ${TokenType[this.tokens[i].type]}`);
            }
        }
        return new GettableTokens(this.tokens);
    }
}

export class GettableTokens {
    private tokens:Token[];
    public constructor(tokens:Token[]){
        this.tokens = tokens;
    }
    public getValues():Token[] {
        return this.tokens;
    }
}


export class Tokenizer {
    private content: (RawToken | string)[] = [];
    public constructor(content: (RawToken | string)[]){
        this.content = content;
    }

    private getVal(i: number): string {
        const item = this.content[i];
        if (!item) return "";
        return typeof item === "string" ? item : item.val;
    }

    private getPos(i: number): { line?: number; column?: number } {
        const item = this.content[i];
        if (typeof item === "object" && item !== null && "line" in item) {
            return { line: item.line, column: item.column };
        }
        return {};
    }

    public static expect(token:Token):ExpectableToken{
        return new ExpectableToken(token);
    }

    public static expectMany(tokens:Token[]):ExpectableTokens{
        return new ExpectableTokens(tokens);
    }

    public static pushWhile(tokens:Token[],condition:(token:Token)=>boolean,beginIdx:number):Token[]{
        let result:Token[] = []
        for(let i = 0;i<tokens.length;i++){
            if(condition(tokens[beginIdx + i])){
                result.push(tokens[beginIdx + i])
            }
            else{
                break;
            }
        }
        return result;
    }


    public tokenize(variableTypes: string[]):Token[]{
      let tokens:Token[] = []
      for(let i = 0;i<this.content.length;i++){
        const curVal = this.getVal(i);
        const pos = this.getPos(i);
        if(variableTypes.includes(curVal)){  
          let type = curVal  
          i++ 
          while(this.getVal(i) == "[" || this.getVal(i) == "]")   {
            type += this.getVal(i)
            i++
          }
          i--
          for(let j = i;j<this.content.length;j++){
            if(this.getVal(j) == "="){
              tokens.push({type:TokenType.TYPE,val:type, ...pos})
              break
            }
            else if(this.getVal(j) == "("){
              tokens.push({type:TokenType.RTYPE,val:type, ...pos})
              break
            }
            else if(this.getVal(j) == "{"){
              tokens.push({type:TokenType.STYPE,val:type, ...pos})
              break
            }
            else if(this.getVal(j) == ")"){
              tokens.push({type:TokenType.FTYPE,val:type, ...pos})
              break          
            }
          }
        }
        else if(curVal == `"` || (curVal.startsWith(`"`) && curVal.endsWith(`"`))){
          if(curVal.length > 1 && curVal.startsWith(`"`) && curVal.endsWith(`"`)){
            tokens.push({type:TokenType.STRING,val:curVal.slice(1,-1), ...pos})
          } else {
            let text = ""
            i++
            while(i < this.content.length && this.getVal(i) != `"`){
              text += (text.length > 0 ? " " : "") + this.getVal(i)
              i++
            }
            tokens.push({type:TokenType.STRING,val:text, ...pos})
          }
        }
        else if(curVal == "="){
          if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.EQEQ,val:"==", ...pos})
            i++
          }
          else if(this.getVal(i+1) != ">"){
            tokens.push({type:TokenType.EQUAL,val:curVal, ...pos})
          }
        }
        else if(curVal == ","){
          tokens.push({type:TokenType.COMMA,val:curVal, ...pos})
        }
        else if(curVal == "+"){
          if(this.getVal(i+1) == "+"){
            tokens.push({type:TokenType.PLUSPLUS,val:"++", ...pos})
            i++
          }
          else if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.PLUSEQUAL,val:"+=", ...pos})
            i++
          }
          else{
            tokens.push({type:TokenType.PLUS,val:curVal, ...pos})
          }
        }
        else if(curVal == "-"){
          if(this.getVal(i+1) == "-"){
            tokens.push({type:TokenType.MINUSMINUS,val:"--", ...pos})
            i++
          }
          else if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.MINUSEQUAL,val:"-=", ...pos})
            i++
          }
          else{
            tokens.push({type:TokenType.MINUS,val:curVal, ...pos})
          }
        }
        else if(curVal == "*"){
          if(this.getVal(i+1) == "*"){
            tokens.push({type:TokenType.EXPO,val:"**", ...pos})
          }
          else if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.MULTIPLYEQUAL,val:"*=", ...pos})
            i++
          }
          else{
            tokens.push({type:TokenType.MULTIPLY,val:curVal, ...pos})
          }
        }
        else if(curVal == "/"){
          if(this.getVal(i+1) == "/"){
            while(this.getVal(i) != "\n"  && i < this.content.length) i++
          }
          else if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.DIVIDEEQUAL,val:"/=", ...pos})
            i++
          }
          else{
            tokens.push({type:TokenType.DIVIDE,val:curVal, ...pos})
          }
        }
        else if(curVal == "("){
          tokens.push({type:TokenType.OPAREN,val:curVal, ...pos})
        }
        else if(curVal == ")"){
          tokens.push({type:TokenType.CPAREN,val:curVal, ...pos})
        }
        else if(curVal == "{"){
          tokens.push({type:TokenType.OBRACE,val:curVal, ...pos})
        }
        else if(curVal == "}"){
          tokens.push({type:TokenType.CBRACE,val:curVal, ...pos})
        }
        else if(curVal == "["){
          tokens.push({type:TokenType.OBRACKET,val:curVal, ...pos})
        }
        else if(curVal == "]"){
          tokens.push({type:TokenType.CBRACKET,val:curVal, ...pos})
        }
        else if(curVal == "!"){
          if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.NEQ,val:"!=", ...pos})
            i++
          } else {
            tokens.push({type:TokenType.NOT,val:curVal, ...pos})
          }
        }
        else if(curVal == "<"){
          if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.LESSEQ,val:"<=", ...pos})
            i++
          } else {
            tokens.push({type:TokenType.LESSTHAN,val:"<", ...pos})
          }
        }
        else if(curVal == ">"){
          if(this.getVal(i+1) == "="){
            tokens.push({type:TokenType.GREATEREQ,val:">=", ...pos})
            i++
          } else {
            tokens.push({type:TokenType.GREATERTHAN,val:">", ...pos})
          }
        }
        else if(curVal == "&"){
          if(this.getVal(i+1) != "&"){
            tokens.push({type:TokenType.AND,val:"&", ...pos})
          }
        }
        else if(curVal == "|"){
          if(this.getVal(i+1) == "|"){
            tokens.push({type:TokenType.OR,val:"||", ...pos})
          }
        }
        else if(curVal == "return"){
          tokens.push({type:TokenType.RETURN,val:curVal, ...pos})
        }
        else if(curVal == "if"){
          tokens.push({type:TokenType.IF,val:curVal, ...pos})
        }
        else if(curVal == "else"){
          tokens.push({type:TokenType.ELSE,val:curVal, ...pos})
        }
        else if(curVal == "for"){
          tokens.push({type:TokenType.FOR,val:curVal, ...pos})
        }
        else if(curVal == "while"){
          tokens.push({type:TokenType.WHILE,val:curVal, ...pos})
        }
        else if(curVal == "struct"){
          tokens.push({type:TokenType.STRUCT,val:curVal, ...pos})
        }
        else if(curVal == ";"){
          tokens.push({type:TokenType.SEMICOLON,val:curVal, ...pos})
        }
        else if(curVal == "."){
          tokens.push({type:TokenType.DOT,val:curVal, ...pos})
        }
        else if(curVal == ":"){
          tokens.push({type:TokenType.COLON,val:curVal, ...pos})
        }
        else if(curVal == "\n"){
          tokens.push({type:TokenType.NEWLINE,val:curVal, ...pos})
        }
        else{
          tokens.push({type:TokenType.IDENTIFIER,val:curVal, ...pos})
        }
      }
      return tokens
    }

}