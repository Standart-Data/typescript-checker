const express = require('express');

const assert = require("assert");
const cors = require('cors');
const handlebars = require('express-handlebars');
const { createTempFileWithContent, readTsFiles} = require('./parse');
const { loadExercise } = require('./load')
const { TSProcessor } = require('./classes/ts_processor')
const {runMochaTests} = require("./runMocha");
const {join} = require("node:path");

const app = express();
const port = 10000;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' })); // Чтобы парсить запросы с типом content-type text/plain
app.use(express.static('public'));

app.engine('handlebars', handlebars.engine()); // or just handlebars()
app.set('view engine', 'handlebars');
app.set('views', './views'); // Make sure this path is correct

// test 2
app.get('/ts/:taskID', async (req, res) => {
    try {
        const exerciseData = await loadExercise(req.params.taskID)
        res.sendFile('typescript.html', { root: join(__dirname, 'views') }); // Relative path
    }  catch  (error) {
        res.status(500).json({"error": "Cannot load exercise data. Please contact server administrator"})
    }

});

app.get('/load/:taskID', async (req, res) => {
    try {
        const data = await loadExercise(req.params.taskID)
        res.json(data)
    } catch {
        res.json({"error": "Cannot load exercise data. Please contact server administrator"})
        res.status(500)
    }
})

// DEPRECATED
app.post('/validate', (req, res) => {

    const requestData = req.body;
    const processor = new TSProcessor(requestData["main.ts"])
    processor.validate()

    res.setHeader('Content-Type', 'application/json')
    res.json(processor.errors);

})

// DEPRECATED
app.post('/process', (req, res) => {

    const requestData = req.body;
    const processor = new TSProcessor(requestData["main.ts"])
    processor.process()
    res.setHeader('Content-Type', 'application/json')
    res.json({"main.js": processor.result});

})

// DEPRECATED
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


app.post('/check/ts', (req, res) => {

    let result = {};
    let metadata = {};
    let errors = []

    const requestData = req.body;
    const mainTsContent = requestData["main.ts"];

    // Здесь валидируем код

    const processor = new TSProcessor(mainTsContent)
    processor.validate()
    errors = processor.errors

    // Здесь вытаскиваем результат и ошибки

    if (errors.length === 0) { // Only process if validation passes
        processor.process();
        result = { "main.js": processor.result };
    }

    // Здесь парсим – вытаскиваем структуру

    const files = req.body;

    for (const [filename, filecontent] of Object.entries(files)) {
        const tempFilePath = createTempFileWithContent(filecontent);
        metadata[filename] = readTsFiles([tempFilePath])
    }

    res.setHeader('Content-Type', 'application/json');
    res.json({ errors: errors, result: result, metadata: metadata });
});







app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
