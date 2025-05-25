function SilentReporter(runner) {}
Mocha.reporters.Silent = SilentReporter;

class TestRunner {
  constructor() {
    // Сохраняем конфигурацию Mocha
    this.mochaConfig = {
      ui: "bdd",
      reporter: "spec",
      timeout: 5000,
      cleanReferencesAfterRun: false, // Отключаем автоочистку для повторного использования
    };
  }

  /* Запускает тесты, докидывая в область видимости:
   * – все переменные тайпскрипта
   * – поля редактора
   * – DOM превьюшки
   * */

  async run(testString, mountingContext = {}) {
    const results = {};
    results.tests = [];

    const expect = window.chai.expect;
    const assert = window.chai.assert;

    try {
      // Попытка 1: Очистка и переиспользование глобального mocha
      if (mocha.suite) {
        mocha.suite.suites = []; // Clear all suites
        mocha.suite.tests = []; // Clear all tests
        mocha.suite.pending = false;
        mocha.suite._beforeEach = [];
        mocha.suite._beforeAll = [];
        mocha.suite._afterEach = [];
        mocha.suite._afterAll = [];
      }

      // Сбрасываем состояние runner'а если он существует
      if (mocha._runner) {
        mocha._runner.removeAllListeners();
        mocha._runner = null;
      }

      // Настраиваем Mocha заново для этого запуска
      mocha.setup(this.mochaConfig);

      var mochaInstance = mocha;
    } catch (error) {
      // Попытка 2: Создание нового экземпляра Mocha если глобальный не работает
      console.warn("Fallback to creating new Mocha instance:", error.message);

      if (typeof Mocha === "function") {
        mochaInstance = new Mocha(this.mochaConfig);
      } else {
        throw new Error(
          "Cannot create new Mocha instance and global mocha is not available"
        );
      }
    }

    const defaultContext = {
      allVariables: {},
      files: {}, // Добавляем поддержку структуры files
      dom: {},
      fetch: () => {},
      editor: {},
    };

    const mc = { ...defaultContext, ...mountingContext };

    // Обновляем функцию теста, чтобы передавать files
    const testFunction = new Function(
      "allVariables",
      "files",
      "dom",
      "fetch",
      "editor",
      "expect",
      "assert",
      testString
    );

    testFunction(
      mc.allVariables,
      mc.files,
      mc.dom,
      mc.fetch,
      mc.editor,
      expect,
      assert
    );

    return new Promise((resolve, reject) => {
      // Return a Promise
      const runner = mochaInstance.run();

      runner
        .on("pass", (test) => {
          results.tests.push({
            title: test.title,
            suite: test.parent.title,
            passed: test.isPassed(),
          });
        })
        .on("fail", (test, err) => {
          results.tests.push({
            title: test.title,
            suite: test.parent.title,
            passed: test.isPassed(),
            err: {
              message: err.message,
              stack: err.stack,
            },
          });
        })
        .on("end", () => {
          // Полная очистка состояния после завершения тестов
          if (mochaInstance.suite) {
            mochaInstance.suite.suites = [];
            mochaInstance.suite.tests = [];
            mochaInstance.suite.pending = false;
            mochaInstance.suite._beforeEach = [];
            mochaInstance.suite._beforeAll = [];
            mochaInstance.suite._afterEach = [];
            mochaInstance.suite._afterAll = [];
          }

          // Очищаем runner
          runner.removeAllListeners();
          if (mochaInstance._runner) {
            mochaInstance._runner = null;
          }

          // Resolve the promise when all tests are finished
          resolve(results); // Resolve with the results object
        })
        .on("error", (err) => {
          // Handle potential errors during the test run
          reject(err);
        });
    });
  }
}
