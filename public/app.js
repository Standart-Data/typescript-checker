class App {
  testRunner = null;

  constructor(taskID, taskType = "TS") {
    this.taskID = taskID;
    this.task = new Task(taskID);
    this.errors = [];
    this.completed = false;
    this.tests = [];
    this.groupedTests = [];
    this.activeFileName = "index.ts";

    this.components = {
      exercise: new Component("#theExercise", "exercise", {
        exercise: { title: "Загружаем задание" },
      }),
      output: new Component("#theOutput", "output", {
        code: "// запустите, чтобы посмотреть",
        records: [],
      }),
      testResults: new Component("#theTestResults", "testResults", {
        tests: [],
      }),
      editor: new Component("#theEditor", "editor", { fields: {} }),
    };

    if (window.app) {
      window.app.instance = this;
    }
  }

  start() {
    this.task.load().then((r) => this.show());
    return this;
  }

  async show() {
    document.querySelector("title").innerHTML =
      this.task.data.title + " | Курс по Typescript";

    this.components.output.update({ code: "// запустите, чтобы посмотреть" });
    this.components.exercise.update({ exercise: this.task.data });

    const apiFiles = this.task.fields || [];
    const apiFileMap = {};
    apiFiles.forEach((file) => {
      apiFileMap[file.file_name] = file.value;
    });

    const displayData = [...apiFiles];
    const keys = Object.keys(localStorage);
    const savedFiles = [];

    keys.forEach((key) => {
      if (key.startsWith(this.taskID + "_") && !key.endsWith("_activeFile")) {
        const fileName = key.replace(this.taskID + "_", "");
        savedFiles.push({
          file_name: fileName,
          value: localStorage.getItem(key),
        });
      }
    });

    if (savedFiles.length > 0) {
      savedFiles.forEach((savedFile) => {
        const existingFileIndex = displayData.findIndex(
          (f) => f.file_name === savedFile.file_name
        );

        if (existingFileIndex !== -1) {
          displayData[existingFileIndex].value = savedFile.value;
        } else {
          displayData.push(savedFile);
        }
      });
    }

    const activeFile = localStorage.getItem(this.taskID + "_activeFile");
    if (activeFile) {
      this.activeFileName = activeFile;
    } else if (displayData.length > 0) {
      this.activeFileName = displayData[0].file_name;
    }

    this.components.editor.update({ fields: displayData });
    console.log("Загруженные файлы:", displayData);

    this.highlightEditor();

    setTimeout(() => {
      const tabs = document.querySelectorAll(".editor-tab");
      tabs.forEach((tab) => {
        if (tab.textContent.trim() === this.activeFileName) {
          tab.click();
        }
      });
    }, 100);

    await this.check();
  }

  highlightEditor() {
    document
      .querySelectorAll('[id^="editor__ide-"]')
      .forEach((editorElement) => {
        const editorId = editorElement.id;
        const index = editorId.split("-").pop();

        const tab = document.querySelector(
          `.editor-tab[data-index="${index}"]`
        );
        let mode = "javascript";
        if (tab) {
          const fileName = tab.textContent.trim();
          mode = this.getEditorMode(fileName);
        }

        const editor = CodeMirror.fromTextArea(editorElement, {
          lineNumbers: true,
          lineWrapping: true,
          matchBrackets: true,
          mode: mode,
          theme: "material-darker",
        });

        app.editors[editorId] = editor;
      });
  }

  getEditorMode(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    switch (ext) {
      case "ts":
        return "text/typescript";
      case "tsx":
        return "text/typescript-jsx";
      case "js":
        return "text/javascript";
      case "jsx":
        return "text/jsx";
      case "css":
        return "text/css";
      case "scss":
        return "text/x-scss";
      case "less":
        return "text/x-less";
      case "json":
        return "application/json";
      case "html":
        return "text/html";
      case "xml":
        return "text/xml";
      default:
        return "text/javascript"; // По умолчанию JavaScript
    }
  }

  getActiveFileName() {
    const activeTab = document.querySelector(".editor-tab.active-tab");
    if (activeTab) {
      return activeTab.textContent.trim();
    }
    return this.activeFileName;
  }

  getEditorValues() {
    const activeTab = document.querySelector(".editor-tab.active-tab");
    if (activeTab) {
      const index = activeTab.getAttribute("data-index");
      const editorId = `editor__ide-${index}`;
      const editor = app.getEditorInstance(editorId);
      if (editor) {
        return editor.getValue();
      }
    }

    // Fallback для обратной совместимости
    const ideNode = this.components.editor.refs["ide"];
    return ideNode.getValue();
  }

  async check() {
    console.log("Запускаем выполнение упражнения");

    this.indicateProcess("check");
    this.saveToLocalStorage();

    const files = {};
    for (const [editorId, editor] of Object.entries(app.editors)) {
      const index = editorId.split("-").pop();
      const tab = document.querySelector(`.editor-tab[data-index="${index}"]`);
      if (tab) {
        const fileName = tab.textContent.trim();
        files[fileName] = editor.getValue();
      }
    }

    // Для обратной совместимости с однофайловыми заданиями
    const activeFileName = this.getActiveFileName();
    const activeFileContent = files[activeFileName] || this.getEditorValues();

    console.log("Отправляем файлы на проверку:", files);

    await this.task.check(files);

    // Используем активный файл для получения соответствующего JS вывода
    const outputKey = activeFileName.replace(".ts", ".js");
    const responseJS =
      this.task.output[outputKey] || this.task.output["main.js"];
    const srcdoc = `<script>${responseJS}</script>`;

    this.components.output.update({
      code: responseJS,
      errors: this.task.errors,
      srcdoc: srcdoc,
    });

    setTimeout(async () => {
      await this.runTests();
      this.components.testResults.update({
        tests: this.testResults,
        errors: this.task.errors,
        feedback: this.groupedTests,
        completed: this.completed,
        task: this.task,
      });
    }, 200);
  }

  async runTests() {
    const allVariables = this.task.metadata;
    const fileName = this.getActiveFileName();
    const domDocument = document.querySelector("#output__iframe");

    console.log(allVariables, "allVariables");

    let context;
    const editorFiles = {};
    for (const [editorId, editor] of Object.entries(app.editors)) {
      const index = editorId.split("-").pop();
      const tab = document.querySelector(`.editor-tab[data-index="${index}"]`);
      if (tab) {
        const fileKey = tab.textContent.trim();
        editorFiles[fileKey] = editor.getValue();
      }
    }

    // Создание правильной структуры контекста для многофайловых тестов
    if (Object.keys(allVariables).length > 0) {
      let testVariables;
      let filesStructure;

      // Проверяем формат данных от сервера
      if (allVariables.files && Object.keys(allVariables.files).length > 0) {
        // Новый формат: структура уже готова
        filesStructure = allVariables.files;
        testVariables =
          filesStructure["index.ts"] ||
          filesStructure["main.ts"] ||
          filesStructure["app.ts"] ||
          Object.values(filesStructure)[0] ||
          allVariables;
      } else {
        filesStructure = {};

        if (
          allVariables.variables ||
          allVariables.functions ||
          allVariables.classes ||
          allVariables.interfaces
        ) {
          // Метаданные одного файла - добавляем в структуру
          const mainFileName = fileName || "main.ts";
          filesStructure[mainFileName] = allVariables;
          testVariables = allVariables;
        } else {
          // Ищем объекты с метаданными файлов в корневом объекте
          Object.keys(allVariables).forEach((key) => {
            if (
              typeof allVariables[key] === "object" &&
              allVariables[key] !== null &&
              (allVariables[key].variables ||
                allVariables[key].functions ||
                allVariables[key].classes ||
                allVariables[key].interfaces)
            ) {
              filesStructure[key] = allVariables[key];
            }
          });

          testVariables =
            filesStructure[fileName] ||
            filesStructure["main.ts"] ||
            filesStructure["app.ts"] ||
            Object.values(filesStructure)[0] ||
            allVariables;
        }
      }

      // Создаем объект allVariables совместимый с серверными тестами
      const testAllVariables = {
        files: filesStructure,
        ...testVariables, // Обратная совместимость: данные основного файла в корне
      };

      context = {
        allVariables: testAllVariables,
        files: filesStructure,
        dom:
          domDocument.contentWindow || domDocument.contentDocument.defaultView,
        editor: editorFiles,
        fetch: () => {},
      };
    } else {
      context = {
        allVariables: { files: {} },
        files: {},
        dom:
          domDocument.contentWindow || domDocument.contentDocument.defaultView,
        editor: editorFiles,
        fetch: () => {},
      };
    }

    console.log("Test context:", context);
    console.log("All global This Objects");
    console.log(domDocument.contentWindow.globalThis);

    const result = await this.testRunner.run(this.task.tests, context);
    this.testResults = result.tests;
    this.groupedTests = this.groupTests(this.testResults);
    this.completed =
      this.testResults.every((t) => t.passed) && this.task.errors.length === 0;
  }

  groupTests(tests) {
    return Object.values(
      tests.reduce((acc, test) => {
        if (!acc[test.suite]) {
          acc[test.suite] = {
            suite: test.suite,
            tests: [],
          };
        }

        acc[test.suite].tests.push(test);
        return acc;
      }, {})
    );
  }

  saveToLocalStorage() {
    try {
      const fileName = this.getActiveFileName();
      localStorage.setItem(
        this.taskID + "_" + fileName,
        this.getEditorValues()
      );
      localStorage.setItem(this.taskID + "_activeFile", fileName);
      console.log(`Код успешно сохранен в localStorage.`);
    } catch (error) {
      console.error(`Ошибка при сохранении в localStorage:`, error);
    }
  }

  reset() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.taskID)) {
          localStorage.removeItem(key);
        }
      });

      const apiFiles = this.task.fields || [];
      this.components.editor.update({ fields: apiFiles });
      console.log("Файлы сброшены до оригинальных из API:", apiFiles);

      if (apiFiles.length > 0) {
        this.activeFileName = apiFiles[0].file_name;
      }

      this.highlightEditor();

      setTimeout(() => {
        const firstTab = document.querySelector('.editor-tab[data-index="0"]');
        if (firstTab) {
          firstTab.click();
        }
      }, 100);

      console.log("Запомненный код удален из localStorage.");
    } catch (error) {
      console.error("Ошибка при удалении из localStorage:", error);
    }
  }

  indicateProcess(processName) {
    const button = document.querySelector("#checkbutton");
    if (!button) {
      return;
    }
    if (processName === "check") {
      button.innerHTML = "Проверяем ...";
    }
  }
}

const container = document.querySelector(".resizable-container");
const leftColumn = document.querySelector(".column-left");
const middleColumn = document.querySelector(".column-middle");
const rightColumn = document.querySelector(".column-right");
const resizerLeft = document.querySelector(".resizer-left");
const resizerRight = document.querySelector(".resizer-right");

new ResizableColumns(
  container,
  leftColumn,
  middleColumn,
  rightColumn,
  resizerLeft,
  resizerRight
);

document.addEventListener("DOMContentLoaded", function () {
  initTabHandlers();
});

function initTabHandlers() {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        const tabContainer = document.getElementById("editor-tabs");
        if (tabContainer && !tabContainer.hasAttribute("data-initialized")) {
          setupTabs();
          tabContainer.setAttribute("data-initialized", "true");
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function setupTabs() {
  const tabs = document.querySelectorAll(".editor-tab");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      if (!index) return;

      tabs.forEach((t) => t.classList.remove("active-tab"));
      this.classList.add("active-tab");

      const fileName = this.textContent.trim();
      if (window.app && window.app.instance) {
        window.app.instance.activeFileName = fileName;
      }

      document.querySelectorAll(".editor-content").forEach((editor) => {
        editor.classList.add("hidden");
      });

      const activeEditor = document.querySelector(
        `.editor-content[data-index="${index}"]`
      );
      if (activeEditor) {
        activeEditor.classList.remove("hidden");

        const editorId = `editor__ide-${index}`;
        const cm = app.getEditorInstance(editorId);
        if (cm) {
          cm.refresh();
        }
      }
    });
  });
}

if (typeof app === "undefined") {
  var app = {};
}

app.instance = null;
app.editors = {};

app.getEditorInstance = function (editorId) {
  return app.editors[editorId];
};

const originalInitEditor = app.initEditor || function () {};
app.initEditor = function (data) {
  originalInitEditor(data);
};

app.check = function () {
  const files = {};

  for (const [editorId, editor] of Object.entries(app.editors)) {
    const index = editorId.split("-").pop();
    const tab = document.querySelector(`.editor-tab[data-index="${index}"]`);
    if (tab) {
      const fileName = tab.textContent.trim();
      files[fileName] = editor.getValue();
    }
  }

  fetch("/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(files),
  })
    .then((response) => response.json())
    .then((data) => {
      app.renderResults(data);
    })
    .catch((error) => {
      console.error("Ошибка при отправке данных:", error);
    });
};

app.renderResults = function (data) {
  const errorsContainer = document.getElementById("theOutput");
  if (errorsContainer) {
    const template = document.getElementById("output");
    const rendered = Handlebars.compile(template.innerHTML)({
      errors: data.errors,
      code: (data.result && Object.values(data.result)[0]) || "",
      srcdoc: "",
    });
    errorsContainer.innerHTML = rendered;
  }
};
