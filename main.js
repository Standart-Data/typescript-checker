const express = require('express');
const handlebars = require('express-handlebars');
const assert = require("assert");
const cors = require('cors');

const { createTempFileWithContent, readTsFiles} = require('./parse');
const { loadExercise } = require('./load')
const {runMochaTests} = require("./runMocha");

const app = express();
const port = 10000;

app.use(cors());
app.use(express.json());

app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'handlebars');

app.get('/load/:taskID', async (req, res) => {
    const data = await loadExercise(req.params.taskID)
    res.json(data)
})

app.post('/parse', (req, res) => {

    const files = req.body;
    const result = {};

    for (const [filename, filecontent] of Object.entries(files)) {
        const tempFilePath = createTempFileWithContent(filecontent);
        result[filename] = readTsFiles([tempFilePath])
    }

    res.setHeader('Content-Type', 'application/json')
    res.json(result);

});

app.get('/parse/:taskID', async (req, res) => {

    const exerciseData = await loadExercise(req.params.taskID)
    const mainContent = exerciseData["fields"][0]["value"]

    const tempFilePath = createTempFileWithContent(mainContent);
    const allVariables = readTsFiles([tempFilePath])

    res.setHeader('Content-Type', 'application/json')
    res.json(allVariables);

});

app.get('/check/:taskID', async (req, res) => {

    const exerciseData = await loadExercise(req.params.taskID)
    const mainContent = exerciseData["fields"][0]["value"]

    const tempFilePath = createTempFileWithContent(mainContent);
    const allVariables = readTsFiles([tempFilePath])

    const testContent = "const assert = require(\"assert\");\n" +
        `const allVariables = ${JSON.stringify(allVariables)};\n` +
        exerciseData["tests"]
    const testFilePath = createTempFileWithContent(testContent);
    const testResults = await runMochaTests(testFilePath)

    res.setHeader('Content-Type', 'application/json')
    res.json(testResults);

});

    app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
