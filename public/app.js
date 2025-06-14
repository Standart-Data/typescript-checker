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
    // ВАЖНО: сохраняем оригинальные данные из API отдельно для reset()
    this.originalApiFiles = JSON.parse(JSON.stringify(apiFiles));

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

        // Защита от пустых значений из localStorage
        if (!savedFile.value || savedFile.value.trim() === "") {
          console.warn(
            `Игнорируем пустое значение для файла ${savedFile.file_name} из localStorage`
          );
          return;
        }

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

        const initialValue = editorElement.value || "";

        try {
          if (!CM || !CM.state || !CM.view) {
            throw new Error("CodeMirror components not available");
          }

          // Определяем подходящий язык для файла
          const tab = document.querySelector(
            `.editor-tab[data-index="${index}"]`
          );
          let languageExtension = null;

          if (tab) {
            const fileName = tab.textContent.trim();
            languageExtension = this.getLanguageExtension(fileName);
          }

          const state = CM.state.EditorState.create({
            doc: initialValue,
            extensions: [
              // Добавляем номера строк
              CM.view.lineNumbers(),
              // Добавляем основные команды без автодополнения
              CM.view.keymap.of([
                ...CM.commands.defaultKeymap,
                ...CM.commands.historyKeymap,
              ]),
              CM.commands.history(),
              // Добавляем только подходящий язык
              ...(languageExtension ? [languageExtension] : []),
              CM.view.EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  editorElement.value = update.state.doc.toString();
                }
              }),
              ...MaterialDarkerTheme.materialDarker,
              CM.view.EditorView.theme({
                "&": { height: "100%" },
                ".cm-scroller": { overflow: "auto" },
              }),
            ],
          });

          const editor = new CM.view.EditorView({
            state: state,
            parent: editorElement.parentNode,
          });

          editorElement.style.display = "none";
          app.editors[editorId] = editor;
        } catch (error) {
          console.error(`Ошибка инициализации редактора ${editorId}:`, error);
        }
      });
  }

  getLanguageExtension(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const fullExt = filename.includes(".d.ts") ? "d.ts" : ext;

    try {
      // Проверяем доступность языковых объектов
      if (
        typeof CodeMirrorJavaScript === "undefined" &&
        typeof CodeMirrorCSS === "undefined"
      ) {
        console.warn("Language extensions not available");
        return null;
      }

      switch (fullExt) {
        case "d.ts":
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
          if (
            typeof CodeMirrorJavaScript !== "undefined" &&
            CodeMirrorJavaScript.javascript
          ) {
            return CodeMirrorJavaScript.javascript();
          }
          return null;
        case "css":
          if (typeof CodeMirrorCSS !== "undefined" && CodeMirrorCSS.css) {
            return CodeMirrorCSS.css();
          }
          return null;
        default:
          if (
            typeof CodeMirrorJavaScript !== "undefined" &&
            CodeMirrorJavaScript.javascript
          ) {
            return CodeMirrorJavaScript.javascript();
          }
          return null;
      }
    } catch (error) {
      console.warn("Language extension error:", error);
      return null;
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
        return editor.state.doc.toString();
      }

      // Fallback - попробуем получить из textarea если редактор не инициализирован
      const textareaElement = document.querySelector(`#${editorId}`);
      if (textareaElement && textareaElement.value) {
        return textareaElement.value;
      }
    }

    // Последний fallback для обратной совместимости
    const ideNode = this.components.editor.refs["ide"];
    if (ideNode && ideNode.state) {
      return ideNode.state.doc.toString();
    }

    return "";
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
        files[fileName] = editor.state.doc.toString();
      }
    }

    // Находим главный файл для вывода (приоритет TS файлам)
    const findMainFile = () => {
      const fileNames = Object.keys(files);
      const tsFiles = fileNames.filter(
        (name) =>
          name.endsWith(".ts") ||
          name.endsWith(".tsx") ||
          name.endsWith(".js") ||
          name.endsWith(".jsx")
      );

      if (tsFiles.length > 0) {
        return (
          tsFiles.find(
            (name) =>
              name.includes("index") ||
              name.includes("main") ||
              name.includes("app")
          ) || tsFiles[0]
        );
      }

      return this.getActiveFileName();
    };

    const mainFileName = findMainFile();
    const activeFileContent = files[mainFileName] || this.getEditorValues();

    console.log("Отправляем файлы на проверку:", files);

    await this.task.check(files);

    // Используем главный файл для получения соответствующего JS вывода
    const outputKey = mainFileName.replace(".ts", ".js").replace(".tsx", ".js");
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
    const currentFileName = this.getActiveFileName();
    const domDocument = document.querySelector("#output__iframe");

    console.log(allVariables, "allVariables");

    let context;
    const editorFiles = {};
    for (const [editorId, editor] of Object.entries(app.editors)) {
      const index = editorId.split("-").pop();
      const tab = document.querySelector(`.editor-tab[data-index="${index}"]`);
      if (tab) {
        const fileKey = tab.textContent.trim();
        editorFiles[fileKey] = editor.state.doc.toString();
      }
    }

    // Находим главный TypeScript файл для тестов независимо от активного таба
    const findMainTsFile = () => {
      const fileNames = Object.keys(editorFiles);
      // Приоритет для TypeScript/JavaScript файлов
      const tsFiles = fileNames.filter(
        (name) =>
          name.endsWith(".ts") ||
          name.endsWith(".tsx") ||
          name.endsWith(".js") ||
          name.endsWith(".jsx")
      );

      // Если есть TS файлы, используем первый найденный
      if (tsFiles.length > 0) {
        return (
          tsFiles.find(
            (name) =>
              name.includes("index") ||
              name.includes("main") ||
              name.includes("app")
          ) || tsFiles[0]
        );
      }

      // Fallback на текущий файл
      return currentFileName;
    };

    const fileName = findMainTsFile();

    // Создание правильной структуры контекста для многофайловых тестов
    if (Object.keys(allVariables).length > 0) {
      let testVariables;
      let filesStructure;

      // Проверяем формат данных от сервера
      if (allVariables.files && Object.keys(allVariables.files).length > 0) {
        // Новый формат: структура уже готова
        filesStructure = allVariables.files;
        // Сначала пытаемся найти файл с TypeScript метаданными
        const mainFileWithTypes = Object.values(filesStructure).find(
          (file) =>
            file &&
            (file.types ||
              file.functions ||
              file.variables ||
              file.interfaces ||
              file.classes)
        );

        testVariables =
          filesStructure["index.ts"] ||
          filesStructure["main.ts"] ||
          filesStructure["app.ts"] ||
          filesStructure[fileName] ||
          mainFileWithTypes ||
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

          // Сначала пытаемся найти файл с TypeScript метаданными
          const fileWithTypes = Object.values(filesStructure).find(
            (file) =>
              file &&
              (file.types ||
                file.functions ||
                file.variables ||
                file.interfaces ||
                file.classes)
          );

          testVariables =
            filesStructure[fileName] ||
            filesStructure["main.ts"] ||
            filesStructure["app.ts"] ||
            fileWithTypes ||
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
      const editorValue = this.getEditorValues();

      // Не сохраняем пустые значения - это может перезаписать правильные данные
      if (!editorValue || editorValue.trim() === "") {
        return;
      }

      localStorage.setItem(this.taskID + "_" + fileName, editorValue);
      localStorage.setItem(this.taskID + "_activeFile", fileName);
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

      app.editors = {};

      const apiFiles = this.originalApiFiles || this.task.fields || [];

      if (apiFiles.length === 0) {
        return;
      }

      this.components.editor.update({ fields: apiFiles });

      if (apiFiles.length > 0) {
        this.activeFileName = apiFiles[0].file_name;
      }

      setTimeout(() => {
        this.highlightEditor();

        setTimeout(() => {
          const firstTab = document.querySelector(
            '.editor-tab[data-index="0"]'
          );

          if (firstTab) {
            firstTab.click();

            setTimeout(() => {
              const editorValue = this.getEditorValues();
              const originalValue = apiFiles[0]?.value || "";

              if (!editorValue && originalValue) {
                console.warn(
                  "Редактор пустой после reset, повторная инициализация"
                );
                this.highlightEditor();
              }
            }, 200);
          }
        }, 100);
      }, 100);
    } catch (error) {
      console.error("Ошибка при сбросе:", error);
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
          cm.requestMeasure();
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
      files[fileName] = editor.state.doc.toString();
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
