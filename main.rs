use std::fs;
use std::error::Error;
use std::collections::HashMap;

#[derive(Debug, Eq, PartialEq, Clone)]
enum Token {
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
    accumulator: String,
    pos: usize
}

struct Parser {
    tokens: Vec<Token>,
    pos: usize
}

struct Analyzer {
    variables: Variables,
}

type Variables = Vec<HashMap<String, Type>>;

#[derive(Debug, Clone)]
enum BinOp { Add, Sub, Mul, Div }

#[derive(Debug, Clone)]
enum UnaryOp { Add, Sub }

#[derive(Debug, Clone)]
enum BoolOp { OrOr, AndAnd, Greater, Less }

#[derive(Debug, PartialEq, Eq, Clone)]
enum Type { Number, String, Boolean ,None}

#[derive(Debug, Clone)]
enum Expr {
    Scope(Vec<Expr>, Vec<Expr>), // Vec<AssignOps> Vec<Scopes>
    VariableDecl(Type, String),
    AssignOp(Box<Expr>, Box<Expr>),
    BinOp(BinOp, Box<Expr>, Box<Expr>),
    BoolOp(BoolOp, Box<Expr>, Box<Expr>),
    UnaryOp(UnaryOp, Box<Expr>),
    FunCall(Box<Expr>, Vec<Box<Expr>>),
    NumberLiteral(i32),
    Identifier(String),
    StringLiteral(String),
    BooleanLiteral(bool)
}

impl Analyzer {
    fn new() -> Self {
        Analyzer { variables: vec![HashMap::new()]}
    }

    fn enter_scope(&mut self){
        self.variables.push(HashMap::new());
    }

    fn exit_scope(&mut self){
        self.variables.pop();
    }
    
    fn get_var_type(&self, name: &str) -> Option<Type> {
        for scope in self.variables.iter().rev() {
            if let Some(t) = scope.get(name) {
                return Some(t.clone());
            }
        }
        None
    }

    fn declare_var(&mut self, name: String, t: Type) {
        let current_scope = self.variables.last_mut().unwrap();
        current_scope.insert(name, t);
    }

    fn check_type(&mut self, expr: Expr) -> Type {
        match expr {
            Expr::Scope(assigns, scopes) => {
                self.enter_scope(); 
                for assign in assigns {
                    self.check_type(assign);
                }
                for scope in scopes {
                    self.check_type(scope);
                }
                
                self.exit_scope();
                Type::None 
            },
            Expr::AssignOp(lhs, rhs) => {
                let rhs_type = self.check_type(*rhs);
                
                let lhs_type = self.check_type(*lhs);


                if lhs_type != rhs_type {
                    panic!("Assign mismatch: Tried assigning {:?} to {:?}", rhs_type, lhs_type);
                } else {
                    lhs_type
                }
            },
            Expr::Identifier(name) => {
                match self.get_var_type(&name) {
                    Some(t) => t.clone(),
                    None => panic!("Use of undeclared variable: {}", name),
                }
            },
            Expr::BinOp(BinOp::Add, lhs, rhs) => {
                let lhs_type = self.check_type(*lhs);
                let rhs_type = self.check_type(*rhs);
                if lhs_type != rhs_type {
                    panic!("BinOp mismatch: cannot add {:?} and {:?}", lhs_type, rhs_type);
                } else if lhs_type != Type::String && lhs_type != Type::Number {
                    panic!("Can only add numbers or strings");
                } else {
                    lhs_type
                }
            },
            Expr::BinOp(_, lhs, rhs) => {
                let lhs_type = self.check_type(*lhs);
                let rhs_type = self.check_type(*rhs);
                if lhs_type != rhs_type {
                    panic!("BinOp mismatch: cannot operate on {:?} and {:?}", lhs_type, rhs_type);
                } else if lhs_type != Type::Number {
                    panic!("Can only perform arithmetic on numbers");
                } else {
                    lhs_type
                }
            },
            Expr::BoolOp(op, lhs, rhs) => {
                let lhs_type = self.check_type(*lhs);
                let rhs_type = self.check_type(*rhs);
                if lhs_type != rhs_type {
                    panic!("BoolOp mismatch: {:?} and {:?}", lhs_type, rhs_type);
                }
                match op {
                    BoolOp::Greater | BoolOp::Less => {
                        if lhs_type != Type::Number {
                            panic!("Greater/Less operations require Numbers");
                        }
                    },
                    BoolOp::AndAnd | BoolOp::OrOr => {
                        if lhs_type != Type::Boolean {
                            panic!("And/Or operations require Booleans");
                        }
                    }
                }
                Type::Boolean // Relational and logical ops always return Boolean
            },
            Expr::UnaryOp(_, expr) => {
                let _type = self.check_type(*expr);
                if _type != Type::Number {
                    panic!("Can only perform unary operations on numbers!");
                }
                _type
            }
            Expr::StringLiteral(_) => Type::String,
            Expr::NumberLiteral(_) => Type::Number,
            Expr::BooleanLiteral(_) => Type::Boolean,
            Expr::VariableDecl(_type, name) => {
                self.declare_var(name,_type.clone());
                _type
            },
            _ => panic!("Unhandled expression in type checker: {:?}", expr)
        }
    }
}


impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Parser { tokens, pos: 0 }
    }

    fn current(&self) -> &Token {
        if self.pos < self.tokens.len() {
            &self.tokens[self.pos]
        } else {
            &Token::EOF
        }
    }

    fn consume(&mut self) {
        if self.pos < self.tokens.len() {
            self.pos += 1;
        }
    }

    fn parse_scope(&mut self) -> Result<Expr, String> {
        let has_braces = matches!(self.current(), Token::OBrace);
        if has_braces {
            self.consume(); 
        }
        
        let mut assigns: Vec<Expr> = Vec::new();
        let mut scopes: Vec<Expr> = Vec::new();    

        while !matches!(self.current(), Token::CBrace | Token::EOF) {
            if matches!(self.current(), Token::OBrace) {
                scopes.push(self.parse_scope()?);
            } else {
                assigns.push(self.parse_assign()?);
                
                if matches!(self.current(), Token::Semicolon) {
                    self.consume();
                } else {
                    return Err(format!("Expected ';' inside scope, found {:?}", self.current()));
                }
            }
        }

        if has_braces {
            if matches!(self.current(), Token::CBrace) {
                self.consume(); 
            } else {
                return Err(String::from("Expected '}' to close scope, but reached EOF"));
            }
        }
        
        Ok(Expr::Scope(assigns, scopes))
    }
   
    fn parse_assign(&mut self) -> Result<Expr, String> {
        let lhs = self.parse_var_dec()?; 
        
        if matches!(self.current(), Token::Equals) {
            self.consume();
        } else {
            return Err(format!("Expected '=' sign, found {:?}", self.current()));
        }
        
        let rhs = self.parse_expr_unary()?; 
        
        Ok(Expr::AssignOp(Box::new(lhs), Box::new(rhs)))
    }

    fn parse_var_dec(&mut self) -> Result<Expr, String> {
        let mut lhs_tokens: Vec<Token> = Vec::new();
        
        while !matches!(self.current(), Token::Equals | Token::EOF | Token::Semicolon) {
            lhs_tokens.push(self.current().clone());
            self.consume();
        }
        
        if lhs_tokens.len() == 1 {
            if let Token::Identifier(name) = &lhs_tokens[0] {
                return Ok(Expr::Identifier(name.clone()));
            } else {
                return Err(format!("Expected identifier for reassignment, found {:?}", lhs_tokens[0]));
            }
        } else if lhs_tokens.len() == 2 {
            let (type_expr, name_str) = match &lhs_tokens[..] {
                [Token::Number, Token::Identifier(name)]  => (Type::Number, name),
                [Token::String, Token::Identifier(name)]  => (Type::String, name),
                [Token::Boolean, Token::Identifier(name)] => (Type::Boolean, name),
                _ => return Err(format!("Invalid tokens in variable dec! {:?}", lhs_tokens))
            };
            return Ok(Expr::VariableDecl(type_expr, name_str.to_string()));
        }

        Err(format!("LHS must be 1 (reassignment) or 2 (declaration) tokens, found {}", lhs_tokens.len()))
    }

    fn parse_expr_unary(&mut self) -> Result<Expr, String> {
        let op = if matches!(self.current(), Token::Sub | Token::Add) {
            let temp = match self.current() {
                Token::Sub => UnaryOp::Sub,
                Token::Add => UnaryOp::Add,
                _ => unreachable!()
            };
            self.consume();
            Some(temp)
        } else {
            None
        };

        let expr = self.parse_expr_boolean()?;
        
        if let Some(op) = op {
            Ok(Expr::UnaryOp(op, Box::new(expr)))
        } else {
            Ok(expr)
        }
    }

    fn parse_expr_boolean(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_expr_boolean_sub()?;
        while matches!(self.current(), Token::Greater | Token::Less) {
            let op_token = self.current().clone();
            self.consume();
            let op = match op_token {
                Token::Greater => BoolOp::Greater,
                Token::Less => BoolOp::Less,
                _ => unreachable!()
            };
            let right = self.parse_expr_boolean_sub()?;
            left = Expr::BoolOp(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }

    fn parse_expr_boolean_sub(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_expr_arithmetic()?;
        while matches!(self.current(), Token::AndAnd | Token::OrOr) {
            let op_token = self.current().clone();
            self.consume();
            let op = match op_token {
                Token::AndAnd => BoolOp::AndAnd,
                Token::OrOr   => BoolOp::OrOr,
                _ => unreachable!()
            };
            let right = self.parse_expr_arithmetic()?;
            left = Expr::BoolOp(op, Box::new(left), Box::new(right));
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
            left = Expr::BinOp(op, Box::new(left), Box::new(right))
        }
        Ok(left)
    }

    fn parse_term(&mut self) -> Result<Expr, String> {
        let mut left = self.literal()?;
        while matches!(self.current(), Token::Multiply | Token::Divide) {
            let op_token = self.current().clone();
            self.consume();
            let op = match op_token {
                Token::Multiply => BinOp::Mul,
                Token::Divide   => BinOp::Div,
                _ => unreachable!()
            };
            let right = self.literal()?;
            left = Expr::BinOp(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }

    fn literal(&mut self) -> Result<Expr, String> {
        match self.current().clone() {
            Token::NumberLiteral(val) => {
                self.consume();
                Ok(Expr::NumberLiteral(val))
            },
            Token::StringLiteral(val) => {
                self.consume();
                Ok(Expr::StringLiteral(val))
            },
            Token::BooleanLiteral(val) => {
                self.consume();
                Ok(Expr::BooleanLiteral(val))
            },
            Token::Identifier(val) => {
                self.consume();
                Ok(Expr::Identifier(val))
            },
            Token::OParen => {
                self.consume(); 
                let expr = self.parse_expr_unary()?; 
                if matches!(self.current(), Token::CParen) {
                    self.consume(); 
                    Ok(expr)        
                } else {
                    Err(format!("Expected closing ')', but found {:?}", self.current()))
                }
            },
            _ => Err(format!("Unexpected Token in literal: {:?}", self.current()))
        }
    }
}

impl Tokenizer {
    fn new(input: String) -> Self {
        Tokenizer { input, pos: 0, accumulator: String::new() }
    }

    fn current(&self) -> Option<char> {
        self.input.chars().nth(self.pos)
    }

    fn consume(&mut self, n: usize) {
        self.pos += n;
    }

    fn peek(&self) -> Option<char> {
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
                // String literal handling
                '"' => {
                    self.consume(1); // Consume opening quote
                    while let Some(ch) = self.current() {
                        if ch != '"' {
                            self.accumulator.push(ch);
                            self.consume(1);
                        } else {
                            break;
                        }
                    }
                    if self.current() == Some('"') {
                        self.consume(1); 
                    }
                    let s = self.accumulator.clone();
                    self.accumulator.clear();
                    return Some(Token::StringLiteral(s));
                },
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
                '>' => Token::Greater,
                '<' => Token::Less,
                _   => Token::Unknown(c.to_string()) 
            };
            
            self.consume(if matches!(token, Token::AndAnd | Token::OrOr) { 2 } else if let Token::StringLiteral(_) = token { 0 } else { 1 }); 
            return Some(token);
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let message: String = fs::read_to_string("example.txt")?;
    
    println!("--- Source Code ---");
    println!("{}", message);
    
    let mut tokenizer = Tokenizer::new(message);
    let tokens: Vec<Token> = std::iter::from_fn(|| tokenizer.next_token()).collect();
    
    let mut parser = Parser::new(tokens);
    let root = parser.parse_scope()?;

    println!("\n--- Abstract Syntax Tree ---");
    println!("{:#?}", root);

    println!("\n--- Semantic Analysis ---");
    let mut analyzer = Analyzer::new();
    analyzer.check_type(root);
    

    Ok(())
}