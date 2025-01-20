const http = require('http');

TSBASEURL = "http://5.53.125.217/api/tstask/"

async function loadExercise(taskID) {

    console.log(`Loading exercise ${taskID} ${TSBASEURL}${taskID}`)

    try {

        const response = await fetch(TSBASEURL+taskID);
        // console.log(response)
        const result = await response.json();
        console.log(`Loaded data ${JSON.stringify(result)}`)
        return result

    } catch (error) {

        console.error('Error fetching data:', error);
        throw error;

    }


}


module.exports = { loadExercise };