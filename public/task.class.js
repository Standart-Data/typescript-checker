BASE_URL = ``;

class TaskState {
  constructor() {
    this.currentState = "created";
  }

  transition(stateName) {
    console.log(`Достигнуто состояние ${stateName}`);
    this.currentState = stateName;
  }
}

class Task {
  constructor(id) {
    this.id = id;

    this.data = {};
    this.errors = [];
    this.output = {};

    this.testResults = null;
    this.state = new TaskState();

    this.confirmationCode = "NOCODE";
  }

  get tests() {
    return this.data.tests;
  }

  get fields() {
    return this.data.fields;
  }

  generateCode(strange_word) {
    const taskText = strange_word.toLowerCase().replace(/[^a-zа-яё]/gm, "");
    let sum = taskText
      .split("")
      .map((elem) => elem.charCodeAt(0))
      .reduce((a, b) => a + b);
    sum *= sum;
    const result = [];
    const coef = 20;
    while (sum != 0) {
      result.push(String.fromCharCode(48 + (sum % coef)));
      sum = Math.floor(sum / coef);
    }
    return result.join("");
  }

  async load() {
    this.state.transition("loading");

    try {
      const url = `${BASE_URL}/load/${this.id}`;
      console.log(url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();

      this.confirmationCode = this.generateCode(this.data.strange_word);

      this.state.transition("loaded");
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      this.state.transition("error", error);
    }
    return this;
  }

  async check(files) {
    try {
      // Проверяем, является ли files объектом с файлами или это строка (для обратной совместимости)
      let requestData;
      if (typeof files === "string") {
        // Старый формат: filename, content
        const fileName = arguments[0];
        const content = arguments[1];
        requestData = { [fileName]: content };
      } else if (typeof files === "object") {
        // Новый формат: объект с файлами { fileName: content, ... }
        requestData = files;
      } else {
        throw new Error("Неверный формат данных для проверки");
      }

      const response = await fetch(`${BASE_URL}/check`, {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: { "Content-type": "application/json" },
      });

      const responseData = await response.json();

      console.log(responseData);

      this.errors = responseData.errors;
      this.output = responseData.result;
      this.metadata = responseData.metadata;
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      this.state.transition("error", error);
    }
  }
}
