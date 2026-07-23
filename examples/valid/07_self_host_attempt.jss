struct Token = {
    number tokenType,
    string value,
}

struct ASTNode = {
    number nodeType,
    string name,
    number value,
}

struct CompilerState = {
    number tokenCount,
    number currentPosition,
    boolean hasError,
}

Token createToken(number typeId, string val) {
    Token t = { tokenType: typeId, value: val };
    return t;
}

ASTNode createASTNode(number nodeKind, string identifierName, number val) {
    ASTNode node = { nodeType: nodeKind, name: identifierName, value: val };
    return node;
}

CompilerState initCompiler() {
    CompilerState state = { tokenCount: 0, currentPosition: 0, hasError: false };
    return state;
}

void logCompilerStatus(CompilerState state) {
    log("Compiler state initialized");
}

CompilerState state = initCompiler();
Token tok = createToken(1, "number");
ASTNode root = createASTNode(10, "main", 0);

logCompilerStatus(state);
