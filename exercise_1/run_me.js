const { runMochaTests } = require("../runMocha.js");

runMochaTests("test_ast.js").then((results) => {
  console.log(results);
});
