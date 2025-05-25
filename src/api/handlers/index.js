const {
  validateRequest,
  formatResponse,
  handleCheckRequest,
} = require("./checkHandler");
const { loadExercise } = require("./exerciseHandler");

module.exports = {
  validateRequest,
  formatResponse,
  handleCheckRequest,
  loadExercise,
};
