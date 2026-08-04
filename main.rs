use std::fs;
use std::error::Error;
use std::collections::HashMap;

#[derive(Debug, Eq, PartialEq, Clone)]
enum Token {
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
    OBracket,
    CBracket,
    Equals,
    Comma,
    Add,
    Multiply,
    Return,
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
    functions: HashMap<String, (String, Vec<String>)>,
    return_stack: Vec<String>,
}

type Variables = Vec<HashMap<String, String>>;

#[derive(Debug, Clone)]
enum BinOp { Add, Sub, Mul, Div }

#[derive(Debug, Clone)]
enum UnaryOp { Add, Sub }

#[derive(Debug, Clone)]
enum BoolOp { OrOr, AndAnd, Greater, Less }

#[derive(Debug)]
enum Expr {
    Scope(Vec<Expr>), 
    Document(Vec<Expr>),
    VariableDecl(String, String),
    FunDecl(String, String, Vec<Expr>, Box<Expr>),
    AssignOp(Box<Expr>, Box<Expr>),
    BinOp(BinOp, Box<Expr>, Box<Expr>),
    BoolOp(BoolOp, Box<Expr>, Box<Expr>),
    ArrayAccess(Box<Expr>,Box<Expr>),
    UnaryOp(UnaryOp, Box<Expr>),
    ReturnExpr(Box<Expr>),
    FunCall(Box<Expr>, Vec<Box<Expr>>),
    ArrayLiteral(Vec<Expr>),
    NumberLiteral(i32),
    Identifier(String),
    StringLiteral(String),
    BooleanLiteral(bool)
}

impl Analyzer {
    fn new() -> Self {
        Analyzer { 
            functions: HashMap::new(), 
            variables: vec![HashMap::new()],
            return_stack: Vec::new()
        }
    }

    fn enter_scope(&mut self) {
        self.variables.push(HashMap::new());
    }

    fn exit_scope(&mut self) {
        self.variables.pop();
    }
    
    fn get_var_type(&self, name: &str) -> Option<String> {
        for scope in self.variables.iter().rev() {
            if let Some(t) = scope.get(name) {
                return Some(t.clone());
            }
        }
        None
    }

    fn declare_var(&mut self, name: String, t: String) {
        let current_scope = self.variables.last_mut().unwrap();
        current_scope.insert(name, t);
    }

    fn check_type(&mut self, expr: Expr) -> String {
        match expr {
            Expr::Document(stmts) => {
                for stmt in stmts {
                    self.check_type(stmt);
                }
                String::new()
            },
            Expr::Scope(statements) => {
                self.enter_scope(); 
                for stmt in statements {
                    self.check_type(stmt);
                }
                self.exit_scope();
                String::new()
            },
            Expr::FunDecl(ret_type, name, params, body) => {
                let mut param_types = Vec::new();
                
                self.enter_scope();
                
                for param in params {
                    if let Expr::VariableDecl(p_type, p_name) = param {
                        self.declare_var(p_name, p_type.clone());
                        param_types.push(p_type);
                    }
                }
                
                self.functions.insert(name, (ret_type.clone(), param_types));
                
                self.return_stack.push(ret_type.clone());

                self.check_type(*body);
                
                self.return_stack.pop();

                self.exit_scope();
                ret_type
            },
            Expr::ArrayAccess(base,index) => {
                let index_type = self.check_type(*index);
                if  index_type != "number"  {
                    panic!("Can only index array with numbers , found {}",index_type);
                }

                let array_type = self.check_type(*base);

                if array_type.ends_with("[]") {
                    array_type[..array_type.len() - 2].to_string()
                }
                else{
                    panic!("Cannot index into non-array type {}",array_type);
                }
            }
            Expr::ReturnExpr(expr) => { 
                let actual_type = self.check_type(*expr);

                if let Some(expected_type) = self.return_stack.last(){
                    if &actual_type != expected_type  {
                        panic!("Return type mismatch: expected '{}', found '{}'", 
                                expected_type, actual_type
                        );
                    }
                } else {
                    panic!("Cannot use 'return' outside of a function");
                }
                
                actual_type
            },
            Expr::FunCall(name_expr, args) => {
                if let Expr::Identifier(name) = *name_expr {
                    if let Some((ret_type, param_types)) = self.functions.get(&name).cloned() {
                        if args.len() != param_types.len() {
                            panic!("Function '{}' expects {} arguments, got {}", name, param_types.len(), args.len());
                        }

                        for (i, arg) in args.into_iter().enumerate() {
                            let arg_type = self.check_type(*arg);
                            let expected_type = &param_types[i];
                            
                            if arg_type != *expected_type {
                                panic!("Argument type mismatch in '{}' at position {}: expected {}, found {}", name, i + 1, expected_type, arg_type);
                            }
                        }
                        
                        return ret_type;
                    } else {
                        panic!("Call to undefined function: {}", name);
                    }
                }
                panic!("Function call must use an identifier");
            },
            Expr::ArrayLiteral(elements) => {
                if elements.is_empty() {
                    return "EmptyArray".to_string();
                }
                let mut iter = elements.into_iter();
                let first_type = self.check_type(iter.next().unwrap());

                if !iter.all(|el| self.check_type(el) == first_type) {
                    panic!("Array element type mismatch");
                }
                format!("{}[]", first_type)
            },
            Expr::AssignOp(lhs, rhs) => {
                let rhs_type = self.check_type(*rhs);
                let lhs_type = self.check_type(*lhs);

                let is_valid = lhs_type == rhs_type || 
                            (rhs_type == "EmptyArray" && lhs_type.ends_with("[]"));

                if !is_valid {
                    panic!("Assign mismatch: Tried assigning {:?} to {:?}", rhs_type, lhs_type);
                }
                lhs_type
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
                    panic!("BinOp mismatch");
                } else if lhs_type != "string" && lhs_type != "number" {
                    panic!("Can only add numbers or strings,tried adding {:?} and {:?}",lhs_type,rhs_type);
                }
                lhs_type
            },
            Expr::BinOp(_, lhs, rhs) => {
                let lhs_type = self.check_type(*lhs);
                let rhs_type = self.check_type(*rhs);
                if lhs_type != rhs_type {
                    panic!("BinOp mismatch");
                } else if lhs_type != "number" {
                    panic!("Can only perform arithmetic on numbers");
                }
                lhs_type
            },
            Expr::BoolOp(op, lhs, rhs) => {
                let lhs_type = self.check_type(*lhs);
                let rhs_type = self.check_type(*rhs);
                if lhs_type != rhs_type {
                    panic!("BoolOp mismatch");
                }
                match op {
                    BoolOp::Greater | BoolOp::Less => {
                        if lhs_type != "number" {
                            panic!("Greater/Less require Numbers");
                        }
                    },
                    BoolOp::AndAnd | BoolOp::OrOr => {
                        if lhs_type != "boolean" {
                            panic!("And/Or require Booleans");
                        }
                    }
                }
                "boolean".to_string() 
            },
            Expr::UnaryOp(_, expr) => {
                let _type = self.check_type(*expr);
                if _type != "number" {
                    panic!("Can only perform unary operations on numbers");
                }
                _type
            },
            Expr::StringLiteral(_) => "string".to_string(),
            Expr::NumberLiteral(_) => "number".to_string(),
            Expr::BooleanLiteral(_) => "boolean".to_string(),
            Expr::VariableDecl(_type, name) => {
                self.declare_var(name, _type.clone());
                _type
            },
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

    fn peek(&self) -> &Token {
        if self.pos + 1 < self.tokens.len() {
            &self.tokens[self.pos + 1]
        } else {
            &Token::EOF
        }
    }

    fn expect_semicolon(&mut self) -> Result<(), String> {
        if matches!(self.current(), Token::Semicolon) {
            self.consume();
            Ok(())
        } else {
            Err(format!("Expected ';', found {:?}", self.current()))
        }
    }

    fn parse_document(&mut self) -> Result<Expr, String> {
        let mut statements = Vec::new();

        while !matches!(self.current(), Token::EOF) {
            let is_function = match (self.current(), self.peek()) {
                (Token::Identifier(_), Token::Identifier(_)) => {
                    if self.pos + 2 < self.tokens.len() && matches!(self.tokens[self.pos + 2], Token::OParen) {
                        true
                    } else {
                        false
                    }
                },
                _ => false,
            };

            if is_function {
                statements.push(self.parse_fun_decl()?);
            } else {
                statements.push(self.parse_statement()?);
            }
        }
        
        Ok(Expr::Document(statements))
    }

    fn parse_statement(&mut self) -> Result<Expr, String> {
        match self.current() {
            Token::Return => {
                let ret = self.parse_return()?;
                self.expect_semicolon()?;
                Ok(ret)
            },
            Token::OBrace => {
                self.parse_scope()
            },
            _ => {
                let expr = self.parse_assign()?;
                self.expect_semicolon()?;
                Ok(expr)
            }
        }
    }

    fn parse_fun_decl(&mut self) -> Result<Expr, String> {
        let return_type = if let Token::Identifier(t) = self.current() {
            t.clone()
        } else {
            return Err(format!("Expected return type, found {:?}", self.current()));
        };
        self.consume();

        let func_name = if let Token::Identifier(n) = self.current() {
            n.clone()
        } else {
            return Err(format!("Expected function name, found {:?}", self.current()));
        };
        self.consume();

        if matches!(self.current(), Token::OParen) {
            self.consume();
        } else {
            return Err(format!("Expected '(' after function name, found {:?}", self.current()));
        }

        let mut params = Vec::new();
        while !matches!(self.current(), Token::CParen | Token::EOF) {
            let param_type = if let Token::Identifier(t) = self.current() { t.clone() } else { return Err("Expected type".into()); };
            self.consume();
            let param_name = if let Token::Identifier(n) = self.current() { n.clone() } else { return Err("Expected name".into()); };
            self.consume();

            params.push(Expr::VariableDecl(param_type, param_name));

            if matches!(self.current(), Token::Comma) {
                self.consume(); 
            }
        }

        if matches!(self.current(), Token::CParen) {
            self.consume(); 
        }

        let body = self.parse_scope()?;

        Ok(Expr::FunDecl(return_type, func_name, params, Box::new(body)))
    }

    fn parse_return(&mut self) -> Result<Expr, String> {
        if let Token::Return = self.current() {
            self.consume();
        } else {
            return Err(format!("Expected return keyword, found {:?}", self.current()));
        };

        Ok(Expr::ReturnExpr(Box::new(self.parse_expr_unary()?)))
    }

    fn parse_scope(&mut self) -> Result<Expr, String> {
        self.consume(); 
        
        let mut statements: Vec<Expr> = Vec::new();

        while !matches!(self.current(), Token::CBrace | Token::EOF) {
            statements.push(self.parse_statement()?);
        }

        if matches!(self.current(), Token::CBrace) {
            self.consume(); 
            Ok(Expr::Scope(statements))
        } else {
            Err(String::from("Expected '}' to close scope"))
        }
    }
    
    fn parse_assign(&mut self) -> Result<Expr, String> {
        let is_declaration = match (self.current(), self.peek()) {
            (Token::Identifier(_), Token::Identifier(_)) => true, 
            (Token::Identifier(_), Token::OBracket) => true,      
            _ => false,
        };

        let lhs = if is_declaration {
            self.parse_var_dec()?
        } else {
            self.parse_expr_unary()? 
        };

        if matches!(self.current(), Token::Equals) {
            self.consume();
            let rhs = self.parse_expr_unary()?; 
            Ok(Expr::AssignOp(Box::new(lhs), Box::new(rhs)))
        } else {
            Ok(lhs)
        }
    }

    fn parse_var_dec(&mut self) -> Result<Expr, String> {
        let mut type_str = if let Token::Identifier(t) = self.current() {
            t.clone()
        } else {
            return Err("Expected type identifier".into());
        };
        self.consume();

        while matches!(self.current(), Token::OBracket) {
            self.consume();
            if matches!(self.current(), Token::CBracket) {
                self.consume();
                type_str.push_str("[]");
            } else {
                return Err("Expected ']' in array type declaration".into());
            }
        }

        let name_str = if let Token::Identifier(n) = self.current() {
            n.clone()
        } else {
            return Err("Expected variable name".into());
        };
        self.consume();

        Ok(Expr::VariableDecl(type_str, name_str))
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

    fn parse_array_literal(&mut self) -> Result<Expr, String> {
        self.consume(); 
        
        let mut elements = Vec::new();
        
        while !matches!(self.current(), Token::CBracket | Token::EOF) {
            elements.push(self.parse_expr_unary()?);
            
            if matches!(self.current(), Token::Comma) {
                self.consume(); 
            } else if !matches!(self.current(), Token::CBracket) {
                return Err(format!("Expected ',' or ']', found {:?}", self.current()));
            }
        }

        if matches!(self.current(), Token::CBracket) {
            self.consume(); 
            Ok(Expr::ArrayLiteral(elements))
        } else {
            Err(String::from("Expected ']' to close array literal"))
        }
    }

    fn literal(&mut self) -> Result<Expr, String> {
        match self.current().clone() {
            Token::OBracket =>  {
                self.parse_array_literal()
            },
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
                let mut base_expr = Expr::Identifier(val.clone());

                if matches!(self.current(), Token::OParen) {
                    self.consume(); 
                    let mut args = Vec::new();
                    while !matches!(self.current(), Token::CParen | Token::EOF) {
                        args.push(Box::new(self.parse_expr_unary()?));
                        if matches!(self.current(), Token::Comma) {
                            self.consume(); 
                        } else if !matches!(self.current(), Token::CParen) {
                            return Err(format!("Expected ',' or ')', found {:?}", self.current()));
                        }
                    }
                    if matches!(self.current(), Token::CParen) {
                        self.consume(); 
                        base_expr = Expr::FunCall(Box::new(Expr::Identifier(val)), args);
                    } else {
                        return Err(String::from("Expected ')' to close function call"));
                    }
                }

                else if matches!(self.current(),Token::OBracket) {
                    self.consume();

                    let index_expr = self.parse_expr_unary()?;

                    if matches!(self.current(),Token::CBracket) {
                        self.consume();
                        base_expr = Expr::ArrayAccess(Box::new(base_expr),Box::new(index_expr));
                    }
                }

                Ok(base_expr)
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
                "false"    => Token::BooleanLiteral(false),
                "true"     => Token::BooleanLiteral(true),
                "return"   => Token::Return,
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
                '"' => {
                    self.consume(1); 
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
                ',' => Token::Comma,
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
                '[' => Token::OBracket,
                ']' => Token::CBracket,
                _   => Token::Unknown(c.to_string()) 
            };
            
            self.consume(if matches!(token, Token::AndAnd | Token::OrOr) { 2 } else if let Token::StringLiteral(_) = token { 0 } else { 1 }); 
            return Some(token);
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let message: String = fs::read_to_string("example.txt").unwrap_or_else(|_| String::from("Number main() { return 0; }"));
    
    let mut tokenizer = Tokenizer::new(message);
    let tokens: Vec<Token> = std::iter::from_fn(|| tokenizer.next_token()).collect();
    
    let mut parser = Parser::new(tokens);
    let root = parser.parse_document()?;

    let mut analyzer = Analyzer::new();
    analyzer.check_type(root);
    
    Ok(())
}