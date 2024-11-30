const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ts = require('typescript');


function createTempFileWithContent(content) {
    const randomFileName = path.join(os.tmpdir(), `temp-${crypto.randomBytes(8).toString('hex')}.ts`);
    fs.writeFileSync(randomFileName, content);
    return randomFileName;
}


function parseTypeScriptString(tsString) {

    const tempFilename = createTempFileWithContent(tsString);

    const result = {
        variables: {},
        functions: {},
        classes: {},
        types: {},
        interfaces: {},
        enums: {},
    };

    try {
        const program = ts.createProgram([tempFilename], {});
        const sourceFile = program.getSourceFile(tempFilename);
        const typeChecker = program.getTypeChecker();
        function recursivelyGetVariableDeclarations(node, sourceFile) {


            if (node.kind === ts.SyntaxKind.VariableDeclaration) {
                const nodeText = node.getText(sourceFile);
                const type = typeChecker.getTypeAtLocation(node);
                const typeName = typeChecker.typeToString(type, node).split("|");
                const name = node.name.getText(sourceFile);
                result.variables[name] = { "name": name, "type": typeName };
            }
             else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {

                const name = node.name.getText(sourceFile);
                const parameters = {};
                node.parameters.forEach(param => {
                    const paramName = param.name.getText(sourceFile);
                    const paramType = typeChecker.getTypeAtLocation(param);
                    const paramTypeName = typeChecker.typeToString(paramType, param).split("|");
                    parameters[paramName] = { "name": paramName, "type": paramTypeName.join('|') };
                });

                const returnType = typeChecker.getTypeAtLocation(node.type);
                const returnTypeName = typeChecker.typeToString(returnType, node.type);

                result.functions[name] = {
                    "name": name,
                    "parameters": parameters,
                    "type": returnTypeName
                };
             }





            node.forEachChild(child => recursivelyGetVariableDeclarations(child, sourceFile));
        }

        recursivelyGetVariableDeclarations(sourceFile, sourceFile);

    } finally {
        fs.unlinkSync(tempFilename);
    }

    return result;

}

module.exports = { parseTypeScriptString };