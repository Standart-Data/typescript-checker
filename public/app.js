class App {

    testRunner = null;

    constructor(taskID, taskType="TS"){

        this.task = new Task(taskID)
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
        const errors = await this.task.validate(editorValue)

        const responseAllFiles = await this.task.process(editorValue)
        const responseJS = responseAllFiles["main.js"];

        const srcdoc = `<script>${responseJS}</script>`

        this.components.output.update({"code": responseJS, errors: errors, srcdoc: srcdoc})

    }

    async parse(){

        const editorValue = this.getEditorValues()
        return await this.task.parseUserCode(editorValue)

    }

    async check() {

        await this.run()

        const tests = this.task.tests
        const allVariables = await this.parse()

        const domDocument = document.querySelector("#output__iframe")

        const context = {
            allVariables: allVariables["main.ts"],
            dom: domDocument.contentWindow || domDocument.contentDocument.defaultView,
            editor: {"main.ts": this.getEditorValues()},
            fetch: () => {}
        }

        const result = await this.testRunner.run(tests, context)
        const passedCount = result.tests.filter(item => item.passed).length;
        const totalCount = result.tests.length

        this.components.testResults.update({tests: result.tests, passed:passedCount, total: totalCount})

    }
}
