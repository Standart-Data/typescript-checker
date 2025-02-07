class App {

    testRunner = null;

    constructor(taskID, taskType="TS"){

        this.task = new Task(taskID)
        this.errors = []
        this.completed = []
        this.tests = []

        this.components = {

            exercise: new Component("#theExercise", "exercise", {exercise: {title: "Загружаем задание"}}),
            output: new Component("#theOutput", "output", {code: "// запустите, чтобы посмотреть", records: []}),
            testResults: new Component("#theTestResults", "testResults", {"tests": []}),
            editor: new Component("#theEditor", "editor", {"fields": {}}),

        }
    }

    start(){
        this.task.load().then(r => this.show())
        return this
    }

    async show(){

        document.querySelector("title").innerHTML = this.task.data.title + " | Курс по Typescript"

        this.components.output.update({"code": "// запустите, чтобы посмотреть"})
        this.components.exercise.update({"exercise": this.task.data})

        this.components.editor.update({"fields": this.task.fields})
        this.highlightEditor()

        await this.check()

    }

    highlightEditor(){

        const ideNode = this.components.editor.container.querySelector("textarea")

        this.components.editor.refs["ide"] = CodeMirror.fromTextArea(ideNode, {
            lineNumbers: true,
            matchBrackets: true,
            mode: "javascript", // Or "typescript" if you have the relevant files locally
            theme: "material-darker"
        })
    }

    getEditorValues(){

        const ideNode =  this.components.editor.refs["ide"]
        return ideNode.getValue()

    }

    async run() {

        console.log("Запускаем выполнение упражнения")

        const editorValue = this.getEditorValues()
        this.errors = await this.task.validate(editorValue)

        if (this.errors.length > 0) {
            this.components.output.update({errors: this.errors})
            this.components.testResults.update({tests: this.tests, completed: this.completed, errors: this.errors, })
            return
        }

        const responseAllFiles = await this.task.process(editorValue)
        const responseJS = responseAllFiles["main.js"];

        const srcdoc = `<script>${responseJS}</script>`

        this.components.output.update({"code": responseJS, errors: this.errors, srcdoc: srcdoc})
        this.components.testResults.update({errors: this.errors, tests: this.tests})

    }

    async parse(){

        const editorValue = this.getEditorValues()
        return await this.task.parseUserCode(editorValue)

    }

    async check() {


        this.indicateProcess("run")
        await this.run()

        this.indicateProcess("check")
        await this.runTests()

        this.components.testResults.update({tests: this.tests, errors: this.errors, completed: this.completed})

    }

    indicateProcess(processName){

        const button = document.querySelector("#checkbutton")
        if (!button){return }

        if (processName==="run") {button.innerHTML = "Запускаем ..."}
        if (processName==="check") {button.innerHTML = "Проверяем ..."}

    }

    async runTests(){

        const allVariables = await this.parse()

        const domDocument = document.querySelector("#output__iframe")

        const context = {
            allVariables: allVariables["main.ts"],
            dom: domDocument.contentWindow || domDocument.contentDocument.defaultView,
            editor: {"main.ts": this.getEditorValues()},
            fetch: () => {}
        }

        const result = await this.testRunner.run(this.task.tests, context)
        this.tests = result.tests
        this.completed = this.tests.every(t => t.passed);
    }
}
