use std::fs;
use std::error::Error;

#[derive(Debug,Eq,PartialEq,Clone)]
enum Token{
    String,
    Number,
    Boolean,
    NumberLiteral(i32),
    Greater,
    Less,
    Identifier(String),
    StringLiteral(String),
    BooleanLiteral(bool),
    AndAnd,
    OrOr,
    Semicolon,
    OParen,
    CParen,
    OBrace,
    CBrace,
    Equals,
    Add,
    Multiply,
    Sub,
    Divide,
    EOF,
    Unknown(String)
}


struct Tokenizer {
    input: String,
    accumulator:String,
    pos: usize
}

struct Parser {
    tokens:Vec<Token>,
    pos: usize
}

#[derive(Debug)]
enum BinOp { Add, Sub, Mul, Div }

#[derive(Debug)]
enum BoolOp {OrOr,AndAnd,Greater,Less}

#[derive(Debug,PartialEq,Eq)]
enum Type  { Number, String, Boolean}

#[derive(Debug)]
enum Expr{
    VariableDecl(Type,String),
    AssignOp(Box<Expr>,Box<Expr>),
    BinOp(BinOp,Box<Expr>,Box<Expr>),
    BoolOp(BoolOp,Box<Expr>,Box<Expr>),
    NumberLiteral(i32),
    Identifier(String),
    StringLiteral(String),
    BooleanLiteral(bool)
}

fn check_type(expr:  Expr) ->  Type{
    match expr {
        Expr::AssignOp(lhs,rhs)  => {
            let lhs_type = check_type(*lhs);
            let rhs_type = check_type(*rhs);
            if lhs_type != rhs_type {
                panic!("TODO: Add proper error message (Assign mismatch)");
            }
            else{
                lhs_type
            }
        },
        Expr::BinOp(BinOp::Add,lhs,rhs) => {
           let lhs_type = check_type(*lhs);
           let rhs_type = check_type(*rhs);
           if lhs_type != rhs_type {
                panic!("TODO: Add proper error  message (BinOp mismatch)");
           }
           else if lhs_type != Type::String && lhs_type != Type::Number {
                panic!("Can only add numbers or strings");
           }
           else {
            lhs_type
           }
        },
        Expr::BinOp(_,lhs,rhs) => {
           let lhs_type = check_type(*lhs);
           let rhs_type = check_type(*rhs);
           if  lhs_type != rhs_type{
                panic!("TODO: Add proper error  message (BinOp mismatch)");
           }
           else if lhs_type != Type::Number {
                panic!("Can only perform arithmetic on numbers");
           }
           else{
            lhs_type
           }
        },
        Expr::BoolOp(_,lhs,rhs) => {
            let lhs_type = check_type(*lhs);
            let rhs_type = check_type(*rhs);
            if lhs_type != rhs_type {
                panic!("TODO: Add proper error  message (BoolOp mismatch)");
            }
            else if lhs_type != Type::Boolean  {
                panic!("Can only perform boolean operations on booleans");
            }
            else{
                lhs_type
            }
        },
        Expr::StringLiteral(_) => Type::String,
        Expr::NumberLiteral(_) => Type::Number,
        Expr::BooleanLiteral(_) => Type::Boolean,
        Expr::VariableDecl(_type,_) => _type,
        _ => panic!("{:?}",expr )
    }
}


impl Parser {
    fn new(tokens: Vec<Token>) -> Self{
        Parser {tokens,pos:0}
    }

    fn current(&self) -> &Token {
        &self.tokens[self.pos]
    }

    fn consume(&mut self) {
        if self.pos < self.tokens.len() - 1 {
            self.pos += 1;
        }
    }

    fn parse_assign(&mut self) -> Result<Expr,String>{
        let lhs = self.parse_var_dec();
        if matches!(self.current(),Token::Equals){
            self.consume();
        }
        else {
            return Err(String::from("Expected = sign"));
        }
        let rhs = self.parse_expr_boolean();
        Ok(Expr::AssignOp(Box::new(lhs?),Box::new(rhs?)))
    }

    fn parse_expr_boolean_sub(&mut self) -> Result<Expr,String> {
        let mut left = self.parse_expr_arithmetic()?;

        while matches!(self.current(),Token::AndAnd | Token::OrOr){
            let op_token = self.current().clone();
            self.consume();

            let op = match op_token {
                Token::AndAnd => BoolOp::AndAnd,
                Token::OrOr   => BoolOp::OrOr,
                _ => unreachable!()
            };
            let right = self.parse_expr_arithmetic()?;
            left = Expr::BoolOp(op,Box::new(left),Box::new(right));

        }
        Ok(left)
    }

    fn parse_expr_boolean(&mut self) -> Result<Expr,String> {
        let mut left = self.parse_expr_boolean_sub()?;

        while matches!(self.current(),Token::AndAnd | Token::OrOr){
            let op_token = self.current().clone();
            self.consume();

            let op = match op_token {
                Token::Greater => BoolOp::Greater,
                Token::Less => BoolOp::Less,
                _ => todo!("{}",format!("{:?}",op_token))
            };
            let right = self.parse_expr_boolean_sub()?;
            left = Expr::BoolOp(op,Box::new(left),Box::new(right));

        }
        Ok(left)
    }


    fn parse_expr_arithmetic(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_term()?;
        
        while matches!(self.current(), Token::Add | Token::Sub) {
            let op_token = self.current().clone();
            self.consume();
            
            let op = match op_token {
                Token::Add => BinOp::Add,
                Token::Sub => BinOp::Sub,
                _ => unreachable!(),
            };
            
            let right = self.parse_term()?;
            left = Expr::BinOp(op,Box::new(left),Box::new(right))
        }
        Ok(left)
    }

    fn parse_term(&mut self) -> Result<Expr,String> {
        let mut left = self.literal()?;

        while matches!(self.current(),Token::Multiply | Token::Divide) {
            let op_token = self.current().clone();
            self.consume();

            let op = match op_token {
                Token::Multiply => BinOp::Mul,
                Token::Divide   => BinOp::Div,
                _ => return Err(format!("Unexpected operator in parse_term: {:?}",op_token))
            };

            let right = self.literal()?;

            left = Expr::BinOp(op,Box::new(left),Box::new(right));
        }
        Ok(left)
    }

    fn parse_var_dec(&mut self) -> Result<Expr,String> {
        let mut lhs_tokens: Vec<Token> = Vec::new();
        while !matches!(self.current(),Token::Equals) {
            lhs_tokens.push(self.current().clone());
            self.consume();
        }
        if lhs_tokens.len() != 2 {
            return Err(String::from("Variable Declaration must consist of exactly two tokens"));
        }

        let (type_expr,name_str) = match &lhs_tokens[..] {
            [Token::Number ,Token::Identifier(name)] => (Type::Number,name),
            [Token::String ,Token::Identifier(name)] => (Type::String,name),
            [Token::Boolean,Token::Identifier(name)] => (Type::Boolean,name),
            _ => return Err(String::from("Invalid tokens in variable dec!"))
        };

        Ok(Expr::VariableDecl(type_expr,name_str.to_string()))

    }

   fn literal(&mut self) -> Result<Expr,String>{
        let expr = match self.current().clone(){
            Token::NumberLiteral(val) => Ok(Expr::NumberLiteral(val)),
            Token::StringLiteral(val) => Ok(Expr::StringLiteral(val)),
            Token::BooleanLiteral(val) => Ok(Expr::BooleanLiteral(val)),
            Token::Identifier(val)    => Ok(Expr::Identifier(val)),
            _ => Err(format!("Unerwartetes Token: {:?}", self.current()))
        };
        
        if expr.is_ok() {
            self.consume();
        }
        
        expr
    }

}


impl Tokenizer {
    fn new(input: String) -> Self {
        Tokenizer {input , pos:0 ,accumulator: Default::default()}
    }

    fn current(&self) -> Option<char> {
        self.input.chars().nth(self.pos)
    }

    fn consume(&mut self, n: usize) {
        self.pos += n;
    }

    fn peek(&self) -> Option<char>{
        self.input.chars().nth(self.pos + 1)
    }

    fn next_token(&mut self) -> Option<Token> {
        while let Some(c) = self.current() {
            if c.is_whitespace() {
                self.consume(1);
            } else {
                break;
            }
        }

        let c = self.current()?; 

        if c.is_alphabetic() {
            while let Some(ch) = self.current() {
                if ch.is_alphabetic() || ch.is_numeric() {
                    self.accumulator.push(ch);
                    self.consume(1);
                } else {
                    break;
                }
            }
            
            let token = match self.accumulator.as_str() {
                "string"   => Token::String,
                "number"   => Token::Number,
                "boolean"  => Token::Boolean,
                "false"    => Token::BooleanLiteral(false),
                "true"     => Token::BooleanLiteral(true),
                _          => Token::Identifier(self.accumulator.clone())        
            };
            self.accumulator.clear();
            return Some(token);
            
        } else if c.is_numeric() {
            while let Some(ch) = self.current() {
                if ch.is_numeric() {
                    self.accumulator.push(ch);
                    self.consume(1);
                } else {
                    break;
                }
            }
            let number = self.accumulator.parse::<i32>().unwrap();
            self.accumulator.clear();
            return Some(Token::NumberLiteral(number));
            
        } else {

            let token = match c {
                '&' if self.peek() == Some('&') => Token::AndAnd,
                '|' if self.peek() == Some('|') => Token::OrOr,
                ';' => Token::Semicolon,
                '(' => Token::OParen,
                ')' => Token::CParen,
                '{' => Token::OBrace,
                '}' => Token::CBrace,
                '=' => Token::Equals,
                '*' => Token::Multiply,
                '/' => Token::Divide,
                '+' => Token::Add,
                '-' => Token::Sub,
                _   => Token::Unknown(c.to_string()) 
            };
            
            self.consume(if matches!(token, Token::AndAnd | Token::OrOr) { 2 } else { 1 }); 
            return Some(token);
        }
    }
}


fn main() -> Result<(), Box<dyn Error>> {
    let message: String = fs::read_to_string("example.txt")?;
    println!("{}",message);
    let mut tokenizer = Tokenizer::new(message);
    let tokens : Vec<Token> = std::iter::from_fn(|| tokenizer.next_token()).collect();
    let mut parser = Parser::new(tokens);
    let mut ast = parser.parse_assign();
    for token in &parser.tokens {
        println!("{:?}",token);
    }
    println!("{:?}",ast);
    check_type(ast?);
    Ok(())
}