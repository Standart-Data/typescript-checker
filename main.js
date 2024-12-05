const express = require('express');
const handlebars = require('express-handlebars');
const cors = require('cors');

const { createTempFileWithContent, readTsFiles} = require('./parse');
const { loadExercise } = require('./load')

const app = express();
const port = 10000;

app.use(cors());
app.use(express.json());

app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'handlebars');

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


app.get('/load/:taskID', async (req, res) => {

    const data = await loadExercise(req.params.taskID)

    res.render('home', {
        title: 'Greetings form Handlebars',
        advantages: ['simple', 'flexible', 'powerful'],
    });

    res.json(data)

})


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
