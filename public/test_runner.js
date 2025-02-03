 function SilentReporter(runner) {}
 Mocha.reporters.Silent = SilentReporter;

class TestRunner {


    constructor() {
        this.dom = {};
        this.errors = []
        this.editor = {}
    }

    async run(testString) {

        mocha.setup('bdd');
        mocha.reporter('Silent');
        const results = { tests: [] };
        const expect = window.chai.expect;

        const testFunction = new Function("expect", testString);
        testFunction(expect);

        return new Promise((resolve, reject) => { // Return a Promise
        mocha.run()
        .on('test', (test) => {

    })
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






