const assert = require('assert');
const ts = require('typescript');


const filename = "main.ts";
const program = ts.createProgram([filename], {});
const sourceFile = program.getSourceFile(filename);
const typeChecker = program.getTypeChecker();

const allVariables = {}

// Здесь составляется дерево
function recursivelyGetVariableDeclarations(node, sourceFile) {
    if (node.kind === ts.SyntaxKind.VariableDeclaration)  {

        const nodeText = node.getText(sourceFile);
        const type = typeChecker.getTypeAtLocation(node);
        const typeName = typeChecker.typeToString(type, node).split("|");
        const name = node.name.getText(sourceFile);

        allVariables[name] = ({"name": name, "type": typeName})

    }

    node.forEachChild(child =>
        recursivelyGetVariableDeclarations(child, sourceFile)
    );
}

recursivelyGetVariableDeclarations(sourceFile, sourceFile);

// Тут показываем какие у нас объекты объявленя



describe('First test', function () {

    it('В коде объявлена переменная a c типом number', function () {
        assert.ok(allVariables["a"]["type"].includes("number"))
    });

    it('В коде объявлена переменная b c типом string', function () {
        assert.ok(allVariables["b"]["type"].includes("string"))
    });

});