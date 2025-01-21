const express = require('express');

const assert = require("assert");
const cors = require('cors');
const handlebars = require('express-handlebars');
const { createTempFileWithContent, readTsFiles} = require('./parse');
const { loadExercise } = require('./load')
const {runMochaTests} = require("./runMocha");

const app = express();
const port = 10000;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' })); // Чтобы парсить запросы с типом content-type text/plain
app.use(express.static('public'));

app.engine('handlebars', handlebars.engine()); // or just handlebars()
app.set('view engine', 'handlebars');
app.set('views', './views'); // Make sure this path is correct



app.get('/:taskID', async (req, res) => {

    const exerciseData = await loadExercise(req.params.taskID)
    res.render('index', {layout : null, exercise: exerciseData}); // This will render views/index.handlebars

});

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

app.get('/test/:taskID', async (req, res) => {

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


app.post('/check/:taskID', async (req, res) => {
    const taskId = req.params.taskID;
    const mainContent = await req.body;

    console.log("/n Получено решение /n"+req.body+"/n")

    if (!mainContent) {
        return res.status(400).json({error: 'Missing code in request body'});
    }



    try {
        const exerciseData = await loadExercise(taskId) // Загружаем данные упражнения, но mainContent не берем
        const tempFilePath = createTempFileWithContent(mainContent);
        const allVariables = readTsFiles([tempFilePath])

        const testContent = "const assert = require(\"assert\");\n" +
            `const allVariables = ${JSON.stringify(allVariables)};\n` +
            exerciseData["tests"];

        const testFilePath = createTempFileWithContent(testContent);
        const testResults = await runMochaTests(testFilePath);

        res.setHeader('Content-Type', 'application/json');
        res.json(testResults);

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({error: 'Internal server error'});
    }
})



    app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
