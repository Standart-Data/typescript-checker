const http = require('http');

TSBASEURL = "https://frontend-validator.atdcode.ru/api/tstask/"

async function loadExercise(taskID) {

    console.log(`Loading exercise ${taskID} ${TSBASEURL}${taskID}`)

    try {

        const response = await fetch(TSBASEURL+taskID);
        // console.log(response)
        const result = await response.json();
        return result

    } catch (error) {

        console.error('Error fetching data:', error);
        throw error;

    }

}


module.exports = { loadExercise };