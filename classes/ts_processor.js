const ts = require('typescript');
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const {AbstractProcessor} = require("./abstract_processor");

class TSProcessor extends AbstractProcessor{

    constructor(code) {
        super();

        this.code = code
        this.errors = []
        this.result = ""
    }

    validate() {
        try {
            // 1. Create a temporary file:
            const tmpFile = tmp.fileSync({ postfix: '.ts' });
            fs.writeFileSync(tmpFile.name, this.code);

            const program = ts.createProgram([tmpFile.name], {
                target: ts.ScriptTarget.ES2024,
                module: ts.ModuleKind.ESNext,
                strict: true,
                skipLibCheck: true,
            });

            const diagnostics = ts.getPreEmitDiagnostics(program);

            const errors = diagnostics.map(diagnostic => {
                if (diagnostic.file) { // Check if a file is associated with the diagnostic
                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    return {
                        location: {
                            line: line + 1,
                            column: character + 1,
                        },
                        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                    };
                } else {
                    return { // Handle diagnostics without a file (e.g., compiler options issues)
                        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                    };
                }
            });

            tmpFile.removeCallback();
            this.errors = errors;

        } catch (error) {
            console.error("Error during validation:", error);
            this.errors = [{ message: error.message }];
        }
    }

    process(){

        try {
            const transpileResult = ts.transpileModule(this.code, {
                compilerOptions: {
                    target: ts.ScriptTarget.ES2024,
                    module: ts.ModuleKind.ESNext,
                    strict: true,
                    skipLibCheck: true,
                },
            });
            this.result = transpileResult.outputText;
        } catch (error) {
            this.result = "";
        }

    }
}

module.exports = {TSProcessor}