 function SilentReporter(runner) {}
 Mocha.reporters.Silent = SilentReporter;

class TestRunner {

    constructor() {
        this.dom = {};
        this.errors = []
        this.editor = {}
        this.mocha = mocha
        this.mocha.setup({ui:'bdd', cleanReferencesAfterRun: false });
        this.mocha.reporter('Silent');
    }

    /* Запускает тесты, докидывая в область видимости:
    * – все переменные тайпскрипта
    * – поля редактора
    * – DOM превьюшки
    * */

    async run(testString, mountingContext={}) {

        const results = {};
        results.tests = []

        const expect = window.chai.expect;
        const assert = window.chai.assert;

        this.mocha.suite.suites = []; // Clear all suites
        this.mocha.suite.tests = [];  //Clear all tests

        const defaultContext = {
            allVariables: {},
            dom: {},
            fetch: () => {},
            editor: {},
        }

        const mc  = { ...defaultContext, ...mountingContext };

        const testFunction = new Function("allVariables", "dom", "fetch", "editor", "expect", "assert",  testString);
        testFunction(mc.allVariables, mc.dom, mc.fetch, mc.editor, expect, assert);

        return new Promise((resolve, reject) => { // Return a Promise
        this.mocha.run()

        .on('pass', (test) => {
            results.tests.push({
                title: test.title,
                suite: test.parent.title,
                passed: test.isPassed(),
            });
        })
        .on('fail', (test, err) => {
            results.tests.push({
                title: test.title,
                suite: test.parent.title,
                passed: test.isPassed(), // Should be false in case of failure
                err: {
                    message: err.message,
                    stack: err.stack,
                },
            });
        })
        .on('end', () => {  // Resolve the promise when all tests are finished
            resolve(results); // Resolve with the results object
        })
        .on('error', (err) => { // Handle potential errors during the test run
            reject(err);
        });
    });
}

}
