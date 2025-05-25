const Mocha = require("mocha");
const { Writable } = require("stream");

function runMochaTests(testPath) {
  return new Promise((resolve, reject) => {
    class SilentReporter {
      constructor() {}
    }

    const mocha = new Mocha({ reporter: SilentReporter });

    // Добавляем файл теста
    mocha.addFile(testPath);

    // Объект для хранения результатов
    const results = {
      tests: [],
      stats: {
        tests: 0,
        passes: 0,
        failures: 0,
        duration: 0,
      },
      failures: [],
    };

    // Запускаем тесты
    const runner = mocha.run((failures) => {
      resolve(results);
    });

    // Собираем информацию о тестах
    runner.on("pass", (test) => {
      results.tests.push({
        title: test.title,
        suite: test.parent.title,
        passed: true,
      });
    });

    runner.on("fail", (test, err) => {
      results.tests.push({
        title: test.title,
        suite: test.parent.title,
        passed: false,
        err: {
          message: err.message,
          stack: err.stack,
        },
      });
    });

    // Собираем статистику
    runner.on("end", () => {
      results.stats.tests = results.tests.length;
      results.stats.passes = results.tests.filter((t) => t.passed).length;
      results.stats.failures = results.tests.filter((t) => !t.passed).length;
      results.failures = results.tests.filter((t) => !t.passed);
      results.passes = results.tests.filter((t) => t.passed);
    });
  });
}

function showTestResults(results) {
  console.log("\n-------\n");

  for (const test of results.tests) {
    if (test.passed) {
      console.log(`✅ ${test.suite}: ${test.title}`);
    } else {
      console.log(`❌ ${test.suite}: ${test.title}`);
    }
  }

  console.log("\n-------");
}

module.exports = { runMochaTests, showTestResults };
