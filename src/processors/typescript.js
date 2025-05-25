const ts = require("typescript");
const tmp = require("tmp");
const fs = require("fs");

/**
 * Валидирует TypeScript-код.
 * @param {string} code - Исходный код.
 * @param {object} options - Опции компилятора.
 * @returns {Array} - Массив ошибок.
 */
function validateTypeScript(code, options = {}) {
  try {
    const isJSX = options.jsx || false;
    const isDeclaration = options.declaration || false;

    let fileExtension = ".ts";
    if (isJSX) {
      fileExtension = ".tsx";
    } else if (isDeclaration) {
      fileExtension = ".d.ts";
    }

    const tmpFile = tmp.fileSync({ postfix: fileExtension });
    fs.writeFileSync(tmpFile.name, code);

    const compilerOptions = {
      target: ts.ScriptTarget.ES2024,
      module: ts.ModuleKind.ESNext,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: isJSX ? ts.JsxEmit.React : undefined,
      jsxFactory: options.jsxFactory || undefined,
      jsxFragmentFactory: options.jsxFragmentFactory || undefined,
      declaration: isDeclaration,
    };

    const program = ts.createProgram([tmpFile.name], compilerOptions);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    const errors = diagnostics.map((diagnostic) => {
      if (diagnostic.file) {
        const { line, character } =
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return {
          location: {
            line: line + 1,
            column: character + 1,
          },
          message: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          ),
        };
      } else {
        return {
          message: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          ),
        };
      }
    });

    tmpFile.removeCallback();
    return errors;
  } catch (error) {
    console.error("Error during validation:", error);
    return [{ message: error.message }];
  }
}

/**
 * Компилирует TypeScript-код.
 * @param {string} code - Исходный код.
 * @param {object} options - Опции компилятора.
 * @returns {string} - Скомпилированный JavaScript-код или исходный код для .d.ts.
 */
function processTypeScript(code, options = {}) {
  try {
    const isJSX = options.jsx || false;
    const isDeclaration = options.declaration || false;

    if (isDeclaration) {
      return code; // .d.ts файлы не транспилируются, возвращаем их как есть
    }

    const transpileResult = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2024,
        module: ts.ModuleKind.ESNext,
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: isJSX ? ts.JsxEmit.React : undefined,
        jsxFactory: options.jsxFactory || undefined,
        jsxFragmentFactory: options.jsxFragmentFactory || undefined,
        // declaration: isDeclaration, // не нужно здесь для транспиляции
      },
    });
    return transpileResult.outputText;
  } catch (error) {
    console.error("Error during transpilation:", error);
    return ""; // Возвращаем пустую строку в случае ошибки транспиляции
  }
}

module.exports = { validateTypeScript, processTypeScript };
