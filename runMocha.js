const Mocha = require("mocha");
const { Writable } = require("stream");

function runMochaTests(testPath) {
  return new Promise((resolve, reject) => {
    const mocha = new Mocha({ reporter: "json-stream" });

    mocha.addFile(testPath);

    const results = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        results.push(JSON.parse(chunk.toString("utf8")));
        callback();
      },
    });

    mocha
      .run((failures) => {
        if (failures > 0) {
          reject(new Error(`Tests failed with ${failures} failures.`));
        } else {
          resolve(results);
        }
      })
      .on("data", (chunk) => {
        outputStream.write(chunk);
      });
  });
}

module.exports = { runMochaTests };
