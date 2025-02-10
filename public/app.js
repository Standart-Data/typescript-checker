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







class ResizableColumns {
    constructor(container, leftColumn, middleColumn, rightColumn, resizerLeft, resizerRight) {
        this.container = container;
        this.leftColumn = leftColumn;
        this.middleColumn = middleColumn;
        this.rightColumn = rightColumn;
        this.resizerLeft = resizerLeft;
        this.resizerRight = resizerRight;

        this.isResizing = false;
        this.currentX = 0;
        this.initialWidths = {};
        this.currentResizer = null;

        this.resizerLeft.addEventListener('mousedown', (e) => this.startResizing(e, this.resizerLeft));
        this.resizerRight.addEventListener('mousedown', (e) => this.startResizing(e, this.resizerRight));

        window.addEventListener('mousemove', (e) => this.resizing(e));
        window.addEventListener('mouseup', () => this.endResizing());
        window.addEventListener('resize', () => this.resizeHandler());
        window.addEventListener('DOMContentLoaded', () => this.setInitialWidths());
    }

    startResizing(e, resizer) {
        this.isResizing = true;
        this.currentX = e.clientX;
        this.currentResizer = resizer;

        this.initialWidths = {
            left: this.leftColumn.offsetWidth,
            middle: this.middleColumn.offsetWidth,
            right: this.rightColumn.offsetWidth
        };
        e.preventDefault();
    }

    resizing(e) {
        if (!this.isResizing) return;

        const deltaX = e.clientX - this.currentX;
        let newLeftWidth, newMiddleWidth;

        if (this.currentResizer === this.resizerLeft) {
            newLeftWidth = this.initialWidths.left + deltaX;
            newMiddleWidth = this.initialWidths.middle - deltaX;

            const minWidth = 100;
            const maxWidth = this.container.offsetWidth - minWidth * 2 - 20; // 20 - ширина разделителей
            newLeftWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));
            newMiddleWidth = Math.max(minWidth, Math.min(maxWidth - newLeftWidth, newMiddleWidth));

            // console.log( this.leftColumn.offsetWidth+ this.middleColumn.offsetWidth)

            this.leftColumn.style.width = newLeftWidth + "px";
            this.middleColumn.style.width = newMiddleWidth + "px";
        } else if (this.currentResizer === this.resizerRight) {
            newMiddleWidth = this.initialWidths.middle + deltaX;

            const minWidth = 100;
            const maxWidth = this.container.offsetWidth - minWidth * 2 - 20 - this.leftColumn.offsetWidth; // 20 - ширина разделителей
            newMiddleWidth = Math.max(minWidth, Math.min(maxWidth, newMiddleWidth));
            this.middleColumn.style.width = newMiddleWidth + "px";

            // console.log( this.rightColumn.offsetWidth+ this.middleColumn.offsetWidth)

        }

        this.rightColumn.style.width = this.container.offsetWidth - this.leftColumn.offsetWidth - this.middleColumn.offsetWidth - 20 + "px";
    }

    endResizing() {
        this.isResizing = false;
        this.currentResizer = null;
    }

    setInitialWidths() {
        const initialWidth = this.container.offsetWidth / 3;
        this.leftColumn.style.width = initialWidth + "px";
        this.middleColumn.style.width = initialWidth + "px";
        this.rightColumn.style.width = initialWidth + "px";
    }

    resizeHandler() {
        const currentWidth = this.container.offsetWidth;
        const initialWidth = currentWidth / 3;

        this.leftColumn.style.width = initialWidth + "px";
        this.middleColumn.style.width = initialWidth + "px";
        this.rightColumn.style.width = initialWidth + "px";
    }
}


const container = document.querySelector('.resizable-container');

const leftColumn = document.querySelector('.column-left');
const middleColumn = document.querySelector('.column-middle');
const rightColumn = document.querySelector('.column-right');

const resizerLeft = document.querySelector('.resizer-left');
const resizerRight = document.querySelector('.resizer-right');

new ResizableColumns(container, leftColumn, middleColumn, rightColumn, resizerLeft, resizerRight);

