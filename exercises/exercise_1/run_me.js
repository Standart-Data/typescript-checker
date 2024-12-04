const { runMochaTests } = require("../../runMocha.js");

function showTestResults(results){

  console.log("\n-------\n")

  for (const test of results.tests) {
    if (test.passed){
      console.log(`✅ ${test.suite} ${test.title}`)
    } else {
      console.log(`❌ ${test.suite} ${test.title}`)
    }
  }

  console.log("\n-------")

}

runMochaTests("test_ast.js").then((results) => {
  showTestResults(results);
});
