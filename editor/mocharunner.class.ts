interface TestResult {
    suite: string;  // название сюиты из describe
    title: string;  // название теста из it
    passed: boolean;  // пройден ли тест
    error?: {
        message: string;
    };
}

type TestResultArray = TestResult[];

/**
 *  Запускает mocha тест приходящий в виде строки
 *  Возвращает резульат его выполнения в стандартнм формате
 */
class MochaRunner {

    constructor(code: string) {


    }

    /**
     *  Добавляет в будущий контекст выполнения объект
     * Например, typeScriptObects, DOM, editor.
     */
    mount(object: Object) {

    }

    /**
     *  Добавляет в будущий контекст выполнения объект
     * Например, typeScriptObects, DOM, editor.
     */
    run(fullTestAsString): TestResultArray {

        // TBD

    }

}


// Usage:

dom = {}
editor = {}
allTSObjects = {}


const tests = `

    describe('Тестирование наличия элементов внутри элемента counter', () => {
    
       it('должен содержать поле ввода .counter__input', () => {
           const counterInput = dom.querySelector('.counter .counter__input');
           chai.expect(counterInput).to.exist;
       });
       
       it('должен содержать поле ввода .counter__increase', () => {
           const counterIncrease = dom.querySelector('.counter .counter__increase');\
           chai.expect(counterIncrease).to.exist;
       });
       
       it('должен содержать поле ввода .counter__decrease', () => {
           const counterDecrease = dom.querySelector('.counter .counter__decrease');
           chai.expect(counterDecrease).to.exist;
       });
       
    });`

const testRunner = new MochaRunner((tests))
testRunner.mount(dom)
testRunner.mount(editor)
testRunner.mount(allTSObjects)

const result: TestResultArray = testRunner.run()


