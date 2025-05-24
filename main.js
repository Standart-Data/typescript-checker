const express = require("express");
const cors = require("cors");
const handlebars = require("express-handlebars");
const { loadExercise } = require("./load");
const { createProcessor } = require("./src"); // Используем главный index.js из src
const { getParser, createTempFileWithContent } = require("./src"); // Используем главный index.js из src
const { runMochaTests } = require("./runMocha"); // Этот файл может потребовать адаптации, если он использовал старые процессоры
const { join } = require("node:path");

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
  let combinedResult = {};
  let combinedMetadata = {
    files: {},
  };
  let combinedErrors = [];

  const filesFromBody = req.body;

  if (Object.keys(filesFromBody).length === 0) {
    return res.status(400).json({
      errors: [{ message: "Нет файлов для обработки" }],
      result: {},
      metadata: {},
    });
  }

  try {
    const mainFileName =
      Object.keys(filesFromBody).find((name) => name === "main.ts") ||
      Object.keys(filesFromBody)[0];

    for (const [filename, filecontent] of Object.entries(filesFromBody)) {
      let fileExtension;
      if (filename.endsWith(".d.ts")) {
        fileExtension = "d.ts";
      } else {
        fileExtension = filename.split(".").pop().toLowerCase();
      }

      if (["ts", "tsx", "d.ts"].includes(fileExtension)) {
        const processor = createProcessor(fileExtension, filecontent);
        const currentErrors = processor.validate();
        combinedErrors = [...combinedErrors, ...currentErrors];

        if (currentErrors.length === 0) {
          const processedCode = processor.process();
          let outputFileName;
          if (fileExtension === "d.ts") {
            outputFileName = filename;
          } else {
            outputFileName = filename.replace(
              fileExtension === "tsx" ? ".tsx" : ".ts",
              ".js"
            );
          }
          combinedResult[outputFileName] = processedCode;
        }

        const tempFilePath = createTempFileWithContent(
          filecontent,
          `.${fileExtension}`
        );
        const parserFn = getParser(fileExtension);
        if (parserFn) {
          const metadataForFile = parserFn([tempFilePath]);
          combinedMetadata.files[filename] = metadataForFile;

          if (filename === mainFileName) {
            Object.keys(metadataForFile).forEach((key) => {
              if (key !== "files") {
                combinedMetadata[key] = metadataForFile[key];
              }
            });
          }
        } else {
          combinedMetadata.files[filename] = {
            message: "Парсер для этого типа файла не реализован",
          };
        }
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.json({
      errors: combinedErrors,
      result: combinedResult,
      metadata: combinedMetadata,
    });
  } catch (error) {
    console.error("Ошибка обработки файлов:", error);
    res.status(500).json({
      errors: [{ message: `Ошибка обработки файлов: ${error.message}` }],
      result: {},
      metadata: {},
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
