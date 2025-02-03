BASE_URL = `http://localhost:10000`

class TaskState {

    constructor() {
        this.currentState = "created"
    }

    transition(stateName){
        console.log(`Достигнуто состояние ${stateName}`)
        this.currentState = stateName
    }

}

class Task {

    constructor(id) {
        this.id = id
        this.data = null
        this.errors = []
        this.output = {}
        this.testResults = null
        this.state = new TaskState()
    }

    get tests(){
        return this.data.tests
    }

    get fields() {
        return this.data.fields
    }

    async load(){

        this.state.transition("loading")

        try {
            const url = `${BASE_URL}/load/${this.id}`
            console.log(url)
            const response = await fetch(url);
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`);}
            this.data = await response.json(); // Присваиваем загруженные данные свойству data

            this.state.transition("loaded");

        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            this.state.transition("error", error); // Передаем ошибку в состояние "error"
        }
        return this
    }

    async validate(solution) {

        try {

            const response = await fetch(`${BASE_URL}/validate`, {
                method: "POST",
                body: JSON.stringify({"main.ts": solution}),
                headers: { "Content-type": "application/json"  }
            });

            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`);}
            this.errors = await response.json();
            console.log(this.errors)
            return this.errors

        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            this.state.transition("error", error);
        }

        return this.errors
    }


    async process(solution) {

        try {

            const response = await fetch(`${BASE_URL}/process`, {
                method: "POST",
                body: JSON.stringify({"main.ts": solution}),
                headers: { "Content-type": "application/json"  }
            });

            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`);}
            this.errors = await response.json();
            console.log(this.errors)
            return this.errors

        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            this.state.transition("error", error);
        }

        return this.errors
    }

}