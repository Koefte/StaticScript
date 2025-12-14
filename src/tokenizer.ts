

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
  COLON
}

export type Token = {
  type:TokenType,
  val:string
}

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
    private content: string[] = [];
    public constructor(content: string[]){
        this.content = content;
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
        if(variableTypes.includes(this.content[i])){  
          let type = this.content[i]  
          i++ 
          while(this.content[i] == "[" || this.content[i] == "]")   {
            type += this.content[i]
            i++
          }
          i--
          for(let j = i;j<this.content.length;j++){
            if(this.content[j] == "="){
              tokens.push({type:TokenType.TYPE,val:type})
              break
            }
            else if(this.content[j] == "("){
              tokens.push({type:TokenType.RTYPE,val:type})
              break
            }
            else if(this.content[j] == "{"){
              tokens.push({type:TokenType.STYPE,val:type})
            }
            else if(this.content[j] == ")"){
              tokens.push({type:TokenType.FTYPE,val:type})
              break          
            }
          }
        }
        else if(this.content[i] == `"`){
          let text = ""
          i++
          while(this.content[i] != `"`){
            text += this.content[i]
            i++
          }
          tokens.push({type:TokenType.STRING,val:text})
        }
        else if(this.content[i] == "="){
          if(this.content[i+1] != "=" && this.content[i] != ">")
            tokens.push({type:TokenType.EQUAL,val:this.content[i]})
        }
        else if(this.content[i] == ","){
          tokens.push({type:TokenType.COMMA,val:this.content[i]})
        }
        else if(this.content[i] == "+"){
          if(this.content[i+1] == "+"){
            tokens.push({type:TokenType.PLUSPLUS,val:"++"})
          }
          else if(this.content[i+1] == "="){
            tokens.push({type:TokenType.PLUSEQUAL,val:"+="})
            i++
          }
          else{
            tokens.push({type:TokenType.PLUS,val:this.content[i]})
          }
        }
        else if(this.content[i] == "-"){
          if(this.content[i+1] == "-"){
            tokens.push({type:TokenType.MINUSMINUS,val:"--"})
          }
          else if(this.content[i+1] == "="){
            tokens.push({type:TokenType.MINUSEQUAL,val:"-="})
            i++
          }
          else{
            tokens.push({type:TokenType.MINUS,val:this.content[i]})
          }
        }
        else if(this.content[i] == "*"){
          if(this.content[i+1] == "*"){
            tokens.push({type:TokenType.EXPO,val:"**"})
          }
          else if(this.content[i+1] == "="){
            tokens.push({type:TokenType.MULTIPLYEQUAL,val:"*="})
            i++
          }
          else{
            tokens.push({type:TokenType.MULTIPLY,val:this.content[i]})
          }
        }
        else if(this.content[i] == "/"){
          if(this.content[i+1] == "/"){
            while(this.content[i] != "\n"  && i < this.content.length) i++
          }
          else if(this.content[i+1] == "="){
            tokens.push({type:TokenType.DIVIDEEQUAL,val:"/="})
            i++
          }
          else{
            tokens.push({type:TokenType.DIVIDE,val:this.content[i]})
          }
        }
        else if(this.content[i] == "("){
          tokens.push({type:TokenType.OPAREN,val:this.content[i]})
        }
        else if(this.content[i] == ")"){
          tokens.push({type:TokenType.CPAREN,val:this.content[i]})
        }
        else if(this.content[i] == "{"){
          tokens.push({type:TokenType.OBRACE,val:this.content[i]})
        }
        else if(this.content[i] == "}"){
          tokens.push({type:TokenType.CBRACE,val:this.content[i]})
        }
        else if(this.content[i] == "["){
          tokens.push({type:TokenType.OBRACKET,val:this.content[i]})
        }
        else if(this.content[i] == "]"){
          tokens.push({type:TokenType.CBRACKET,val:this.content[i]})
        }
        else if(this.content[i] == "!"){
          if(this.content[i+1] != "="){
            tokens.push({type:TokenType.NOT,val:this.content[i]})
          }
        }
        else if(this.content[i] == "&"){
          if(this.content[i+1] != "&"){
            tokens.push({type:TokenType.AND,val:"&"})
          }
        }
        else if(this.content[i] == "|"){
          if(this.content[i+1] == "|"){
            tokens.push({type:TokenType.OR,val:"||"})
          }
        }
        else if(this.content[i] == "return"){
          tokens.push({type:TokenType.RETURN,val:this.content[i]})
        }
        else if(this.content[i] == "struct"){
          tokens.push({type:TokenType.STRUCT,val:this.content[i]})
        }
        else if(this.content[i] == ";"){
          tokens.push({type:TokenType.SEMICOLON,val:this.content[i]})
        }
        else if(this.content[i] == "."){
          tokens.push({type:TokenType.DOT,val:this.content[i]})
        }
        else if(this.content[i] == ":"){
          tokens.push({type:TokenType.COLON,val:this.content[i]})
        }
        else if(this.content[i] == "\n"){
          tokens.push({type:TokenType.NEWLINE,val:this.content[i]})
        }
        else{
          tokens.push({type:TokenType.IDENTIFIER,val:this.content[i]})
        }
      }
      return tokens
    }

}