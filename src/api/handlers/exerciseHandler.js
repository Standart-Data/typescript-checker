const http = require("http");

const TSBASEURL = "https://frontend-validator.atdcode.ru/api/tstask/";

/**
 * Загружает упражнение с внешнего API
 * @param {string} taskID - ID задачи
 * @returns {Promise<Object>} данные упражнения
 */
async function loadExercise(taskID) {
  console.log(`Loading exercise ${taskID} ${TSBASEURL}${taskID}`);

  try {
    const response = await fetch(TSBASEURL + taskID);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

module.exports = { loadExercise };
