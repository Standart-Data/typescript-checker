import { TestResultArray } from "./MochaRunner";

const { MochaRunner } = require('./MochaRunner.ts');

const dom = {
    querySelector: (selector: string) => document.querySelector(selector),
};
const editor = {};
const allTSObjects = {};

const tests = `
    describe('Тестирование наличия элементов внутри элемента counter', () => {
       it('должен содержать поле ввода .counter__input', () => {
           const counterInput = dom.querySelector('.counter .counter__input');
           chai.expect(counterInput).to.exist;
       });
       
       it('должен содержать поле ввода .counter__increase', () => {
           const counterIncrease = dom.querySelector('.counter .counter__increase');
           chai.expect(counterIncrease).to.exist;
       });
       
       it('должен содержать поле ввода .counter__decrease', () => {
           const counterDecrease = dom.querySelector('.counter .counter__decrease');
           chai.expect(counterDecrease).to.exist;
       });
    });
`;

const testRunner = new MochaRunner(tests);
testRunner.mount(dom);
testRunner.mount(editor);
testRunner.mount(allTSObjects);

testRunner.run().then((result: TestResultArray) => {
    console.log(result);
});
