const express = require('express');
const cors = require('cors');

const { parseTypeScriptString } = require('./parse');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.post('/parse', (req, res) => {

    const files = req.body;
    const result = {};

    for (const [filename, filecontent] of Object.entries(files)) {
        try {
            result[filename] = parseTypeScriptString(filecontent);
        } catch {
            result[filename] = null
        }
    }

    res.setHeader('Content-Type', 'application/json')
    res.json(result);

});

app.get('/sample', (req, res)=> {

    const tsContent = `
    let a: number = 5;
    let b: string = 'hello';
    `;

    const result = parseTypeScriptString(tsContent);
    res.setHeader('Content-Type', 'application/json')
    res.json(result);

})


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
