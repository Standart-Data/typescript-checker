enum PreviewMode {

    TS = "TypeScript Only",
    REACT = "React",
    JS = "Javascript Only"

}

interface File {
    file_name: string,
    value: string,
}

type Files = {string?: File} | {}

interface renderResult {
    files: Files,
    errors: [],
    console: []
}

class PreviewRender {
    private readonly files: Files;
    private mode: PreviewMode;

    private readonly engine: Function;
    private readonly config: Object;

    constructor(files: Files, mode: PreviewMode, engine: Function, config: Object){

        this.files = files
        this.mode = mode
        this.engine = engine
        this.config = config

    }


    /**
     * Преобразует все файлы как надо и отдает преобразованные
     * подходит для TS, SASS, исполняемых  файлов (Python, SQL, Java, ...)
     */
    build(): renderResult{
        return this.engine(this.files, this.config)
    }

}

function renderTS(files: Files, config: Object) : renderResult{

    //  Здесь код преобразования в TS

    return {
        files: {},
        errors: [],
        console: []
    }

}

function renderSQL(files: Files){

}

// Usage

// Файлы которые нужно рендерить
const files: Files = {"index.ts": "const a:number = 1; const b: number = 2;"}

// Конфиги, с которыми их нужно рендерить
const config = {}

// Делаем новый рендерер превью
const render = new PreviewRender(files, PreviewMode.TS, renderTS, config)

// Получаем готовые файлы, вывод в консоль и ошибки
const result: renderResult = render.build()