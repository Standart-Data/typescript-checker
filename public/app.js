class App {

    testRunner = null;

    constructor(taskID, taskType="TS"){

        this.task = new Task(taskID)
        this.components = {

            console: new Component("#theConsole", "console", {records: []}),
            exercise: new Component("#theExercise", "exercise", {exercise: {title: "Загружаем задание"}}),
            output: new Component("#theOutput", "output", {code: "// запустите, чтобы посмотреть"}),
            testResults: new Component("theTestResults", "testResults", {"tests": []})


        }
    }

    start(){
        this.task.load().then(r => this.show())
        return this
    }

    show(){

        console.log(this.task.data)

        this.components.exercise.update({"exercise": this.task.data})
        this.components.console.update({"records": [1,2,3,4,5]})
        this.components.output.update({"code": "// запустите, чтобы посмотреть"})

    }

    run() {

        console.log("Запускаем выполнение упражнения")

        this.task.validate("const x: string = '1';").then(response =>
            this.components.console.update({records: this.task.errors})
        )

        this.task.process("const x: string = '1';").then(response =>
            this.components.output.update({"code": response["main.js"]})
        )

    }

    check() {

        const tests = this.task.tests

        this.testRunner.run(tests).then(result => {
            // this.components.testResults.update({"tests": result})
            console.log(`Получен результат выполнения тестов` )
            console.log( result )
        })
    }
}
