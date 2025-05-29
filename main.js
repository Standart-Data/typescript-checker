const express = require("express");
const cors = require("cors");
const handlebars = require("express-handlebars");
const { join } = require("node:path");
const { handleCheckRequest, loadExercise } = require("./src");

const app = express();
const port = 10000;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: "text/plain" }));
app.use(express.static("public"));

app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/:type(ts|react)/:taskID", async (req, res) => {
  try {
    await loadExercise(req.params.taskID); // Убедимся, что упражнение существует
    res.sendFile("typescript.html", { root: join(__dirname, "views") });
  } catch (error) {
    console.error("Error loading exercise for /:type/:taskID:", error);
    res.status(404).json({
      error: "Cannot load exercise data or exercise not found.",
    });
  }
});

app.get("/load/:taskID", async (req, res) => {
  try {
    const data = await loadExercise(req.params.taskID);
    res.json(data);
  } catch (error) {
    console.error("Error loading exercise for /load/:taskID:", error);
    res.status(500).json({
      error: "Cannot load exercise data. Please contact server administrator",
    });
  }
});

app.post("/check", (req, res) => {
  const result = handleCheckRequest(req.body);

  res.setHeader("Content-Type", "application/json");
  res.status(result.statusCode).json(result.response);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
