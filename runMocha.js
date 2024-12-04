const Mocha = require("mocha");
const { Writable } = require("stream");


function runMochaTests(testPath) {
    return new Promise((resolve, reject) => {
        const Mocha = require('mocha');
        const mocha = new Mocha({ reporter: 'json-stream' });

        mocha.addFile(testPath);

        const results = {
            tests: [],
        };

        const runner = mocha.run((failures) => {
            resolve(results);
        });

        runner.on('test', (test) => {
            // Можно что то делать с тестами
        });

        runner.on('pass', (test) => {
            results.tests.push({
                title: test.title,
                suite: test.parent.title,
                passed: test.isPassed(),
            });
        });

        runner.on('fail', (test, err) => {
            results.tests.push({
                title: test.title,
                suite: test.parent.title,
                passed: test.isPassed(),
                err: {
                    message: err.message,
                    stack: err.stack
                }
            });
        });
    });
}

function showTestResults(results){

    console.log("\n-------\n")

    for (const test of results.tests) {
        if (test.passed){
            console.log(`✅ ${test.suite}: ${test.title}`)
        } else {
            console.log(`❌ ${test.suite}: ${test.title}`)
        }
    }

    console.log("\n-------")

}

module.exports = { runMochaTests, showTestResults};
