import { JSDOM } from 'jsdom';
import Mocha from 'mocha';
import chai from 'chai';

interface TestResult {
    suite: string;  // название сюиты из describe
    title: string;  // название теста из it
    passed: boolean;  // пройден ли тест
    error?: {
        message: string;
    };
}

type TestResultArray = TestResult[];

class Scope {
    [key: string]: any;
}

class MochaRunner {
    private code: string;
    private scope: Scope;

    constructor(code: string) {
        this.code = code;
        this.scope = new Scope();
    }

    mount(scopeObject: any) {
        Object.assign(this.scope, scopeObject);
    }

    async run(): Promise<TestResultArray> {
        // Создание среды для выполнения тестов
        const jsdomInstance = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        const { window } = jsdomInstance;

        // Настройка глобальных объектов для браузерного окружения
        global.window = window as any;
        global.document = window.document;
        global.navigator = { ...global.navigator, userAgent: 'node.js' };
        global.Node = window.Node;
        global.HTMLElement = window.HTMLElement;

        // Копирование всех объектов из scope в глобальное пространство имен
        Object.assign(global, this.scope);

        const mocha = new Mocha();
        const testResults: TestResultArray = [];

        // Добавление слушателя для сбора результатов тестов
        mocha.suite.on('test end', (test: Mocha.Test) => {
            testResults.push({
                suite: test.parent?.title || '',
                title: test.title,
                passed: test.state === 'passed',
                error: test.err ? { message: test.err.message } : undefined,
            });
        });

        // Подготовка среды для выполнения тестов
        mocha.suite.emit('pre-require', global, 'testfile', mocha);

        try {
            // Выполнение тестов
            eval(this.code);
        } catch (e) {
            console.error(e);
        }

        return new Promise((resolve) => {
            mocha.run(() => resolve(testResults));
        });
    }
}

export { MochaRunner, TestResult, TestResultArray };
