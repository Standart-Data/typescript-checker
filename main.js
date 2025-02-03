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



app.get('/:taskID', async (req, res) => {
    try {
        const exerciseData = await loadExercise(req.params.taskID)
        res.sendFile('index.html', { root: join(__dirname, 'views') }); // Relative path
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


app.post('/validate', (req, res) => {

    const requestData = req.body;
    const processor = new TSProcessor(requestData["main.ts"])
    processor.validate()

    res.setHeader('Content-Type', 'application/json')
    res.json(processor.errors);

})

app.post('/process', (req, res) => {

    const requestData = req.body;
    const processor = new TSProcessor(requestData["main.ts"])
    processor.process()
    res.setHeader('Content-Type', 'application/json')
    res.json({"main.js": processor.result});

})





// app.post('/check/:taskID', async (req, res) => {
//     const taskId = req.params.taskID;
//     const mainContent = await req.body;
//
//     console.log("/n Получено решение /n"+req.body+"/n")
//
//     if (!mainContent) {
//         return res.status(400).json({error: 'Missing code in request body'});
//     }
//
//
//     try {
//         const exerciseData = await loadExercise(taskId) // Загружаем данные упражнения, но mainContent не берем
//         const tempFilePath = createTempFileWithContent(mainContent);
//         const allVariables = readTsFiles([tempFilePath])
//
//         const testContent = "const assert = require(\"assert\");\n" +
//             `const allVariables = ${JSON.stringify(allVariables)};\n` +
//             exerciseData["tests"];
//
//         const testFilePath = createTempFileWithContent(testContent);
//         const testResults = await runMochaTests(testFilePath);
//
//         res.setHeader('Content-Type', 'application/json');
//         res.json(testResults);
//
//     } catch (error) {
//         console.error('Error processing request:', error);
//         res.status(500).json({error: 'Internal server error'});
//     }
// })

    app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
