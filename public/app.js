class App {

    testRunner = null;

    constructor(taskID, taskType="TS"){

        this.taskID = taskID
        this.task = new Task(taskID)
        this.errors = []
        this.completed = false
        this.tests = []  // тесты сплошным списком
        this.groupedTests = []  // Тесты сгрупированные по сюитам

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

        const localSaved = this.loadFromLocalStorage()
        if (localSaved) {
            const localData = [{"value": localSaved, "file_name": "index.ts"}]
            this.components.editor.update({"fields": localData})
        } else {
            this.components.editor.update({"fields": this.task.fields})
        }

        console.log(this.task.fields)

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


    async check() {

        console.log("Запускаем выполнение упражнения")

        this.indicateProcess("check")

        this.saveToLocalStorage()

        const editorValue = this.getEditorValues()
        await this.task.check(editorValue)

        const responseJS = this.task.output["main.js"];
        const srcdoc = `<script>${responseJS}</script>`

        this.components.output.update({"code": responseJS, errors: this.task.errors, srcdoc: srcdoc})
        // this.components.testResults.update({errors: this.errors, tests: this.testResults,  feedback: this.groupedTests, task: this.task})

        setTimeout(async ()=> {

            await this.runTests()
            this.components.testResults.update({tests: this.testResults, errors: this.task.errors, feedback: this.groupedTests, completed: this.completed, task: this.task})

        }, 200)


    }

    async runTests(){

        const allVariables = this.task.metadata

        const domDocument = document.querySelector("#output__iframe")

        const context = {
            allVariables: allVariables["main.ts"],
            dom: domDocument.contentWindow || domDocument.contentDocument.defaultView,
            editor: {"main.ts": this.getEditorValues()},
            fetch: () => {}
        }

        const result = await this.testRunner.run(this.task.tests, context)
        this.testResults = result.tests
        this.groupedTests = this.groupTests(this.testResults);
        this.completed = this.testResults.every(t => t.passed) && this.task.errors.length === 0;

    }

    groupTests(tests) {

        return Object.values(tests.reduce((acc, test) => {

            if (!acc[test.suite]) {
                acc[test.suite] = {
                    suite: test.suite,
                    tests: []
                };
            }

            acc[test.suite].tests.push(test);
            return acc;
        }, {}));
    }

    loadFromLocalStorage(){
        try {
            const content = localStorage.getItem(this.taskID);
            return content;

        } catch (error) {
            console.error(`Ошибка при загрузке из localStorage:`, error);
            return null;
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(this.taskID, this.getEditorValues());
            console.log(`Код успешно сохранен в localStorage.`);
        } catch (error) {
            console.error(`Ошибка при сохранении в localStorage:`, error);
        }
    }




    // TODO Это заплатка, ее над бы выпилить
    indicateProcess(processName){

        const button = document.querySelector("#checkbutton")
        if (!button){return }

        if (processName==="check") {button.innerHTML = "Проверяем ..."}

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

        this.deltaOne = 0;
        this.deltaTwo = 0;

        this.resizerWidth = 20;

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


        let newLeftWidth, newMiddleWidth, newRightWidth;

        if (this.currentResizer === this.resizerLeft) {

            this.deltaOne = e.clientX - this.currentX;

            newLeftWidth = this.initialWidths.left + this.deltaOne;
            newMiddleWidth = this.initialWidths.middle - this.deltaOne;

            this.leftColumn.style.width = newLeftWidth + "px";
            this.middleColumn.style.width = newMiddleWidth + "px";


        } else if (this.currentResizer === this.resizerRight) {

            this.deltaTwo = e.clientX - this.currentX;

            newMiddleWidth = this.initialWidths.middle + this.deltaTwo;
            newRightWidth = this.initialWidths.right - this.deltaTwo;

            this.middleColumn.style.width = newMiddleWidth + "px";
            this.rightColumn.style.width = newRightWidth + "px";

        }

    }

    endResizing() {
        this.isResizing = false;
        this.currentResizer = null;
    }

    setInitialWidths() {

        const containerWidth = this.container.offsetWidth

        if (containerWidth < 640) {

            this.leftColumn.style.width = "100%";
            this.middleColumn.style.width  = "100%";
            this.rightColumn.style.width  = "100%";

            this.resizerLeft.style.display = "None"
            this.resizerRight.style.display = "None"

            return
        }

        if (containerWidth >= 640 && containerWidth < 1280 ) {

            const initialWidth = (containerWidth - (this.resizerWidth + 5 )) / 2;

            this.leftColumn.style.width = initialWidth + "px";
            this.middleColumn.style.width  = initialWidth + "px";

            this.resizerLeft.style.display = "Block"
            this.resizerRight.style.display = "None"
            return
        }

        const initialWidth = (containerWidth - (this.resizerWidth*2 + 5)) / 3;
        this.leftColumn.style.width = initialWidth + "px";
        this.middleColumn.style.width = initialWidth + "px";
        this.rightColumn.style.width = initialWidth + "px";

        this.resizerLeft.style.display = "Block"
        this.resizerRight.style.display = "Block"

        console.log(`Container ${containerWidth} Outer resized`)

    }

    resizeHandler() {
        this.setInitialWidths()
    }
}


const container = document.querySelector('.resizable-container');

const leftColumn = document.querySelector('.column-left');
const middleColumn = document.querySelector('.column-middle');
const rightColumn = document.querySelector('.column-right');

const resizerLeft = document.querySelector('.resizer-left');
const resizerRight = document.querySelector('.resizer-right');

new ResizableColumns(container, leftColumn, middleColumn, rightColumn, resizerLeft, resizerRight);

