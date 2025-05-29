// Упражнение: модификаторы в React/TypeScript
// Задача: правильно определить все модификаторы конструкций языка в React компонентах

import React from "react";

// Различные типы объявления переменных
var globalVar: string = "global";
let mutableVar: number = 42;
const immutableVar: boolean = true;

// Экспортируемые переменные
export var exportedVar: string = "exported";
export let exportedLet: number = 100;
export const exportedConst: boolean = false;

// Интерфейсы с модификаторами
interface LocalProps {
  title: string;
}

export interface ExportedProps {
  name: string;
  age?: number;
}

// Типы с модификаторами
type LocalType = string | number;
export type ExportedType = boolean | null;

// Enum с модификаторами
enum LocalEnum {
  Value1,
  Value2,
}

export enum ExportedEnum {
  ExportedValue1,
  ExportedValue2,
}

const enum LocalConstEnum {
  ConstValue1 = "const1",
  ConstValue2 = "const2",
}

export const enum ExportedConstEnum {
  ExportedConstValue1 = "exported1",
  ExportedConstValue2 = "exported2",
}

// Абстрактный класс с модификаторами
abstract class AbstractComponent {
  // Свойства с различными модификаторами доступа
  public publicProperty: string = "public";
  private privateProperty: string = "private";
  protected protectedProperty: string = "protected";
  readonly readonlyProperty: string = "readonly";
  static staticProperty: string = "static";
  abstract abstractProperty: string;

  // Методы с различными модификаторами
  public publicMethod(): void {}
  private privateMethod(): void {}
  protected protectedMethod(): void {}
  static staticMethod(): void {}
  async asyncMethod(): Promise<void> {
    return Promise.resolve();
  }
  abstract abstractMethod(): void;

  constructor(
    public constructorPublic: string,
    private constructorPrivate: number,
    protected constructorProtected: boolean
  ) {}
}

// React класс-компонент с модификаторами
export class ReactClassComponent extends React.Component<ExportedProps> {
  public state = { count: 0 };
  protected componentName: string = "ReactClassComponent";
  static displayName: string = "ReactClassComponent";

  public render(): React.ReactElement {
    return <div>{this.props.name}</div>;
  }

  private handleClick = (): void => {
    this.setState({ count: this.state.count + 1 });
  };

  protected componentDidMount(): void {
    console.log("Component mounted");
  }
}

// Обычный класс с наследованием
class ConcreteClass extends AbstractComponent {
  abstractProperty: string = "implemented";

  abstractMethod(): void {
    console.log("Abstract method implemented");
  }

  override publicMethod(): void {
    super.publicMethod();
  }
}

// Экспортируемый класс
export class ExportedClass {
  exportedProperty: string = "exported";
}

// Функциональные компоненты с модификаторами
const LocalComponent: React.FC<LocalProps> = ({ title }) => {
  return <h1>{title}</h1>;
};

export const ExportedComponent: React.FC<ExportedProps> = ({ name, age }) => {
  return (
    <div>
      <span>{name}</span>
      {age && <span> - {age}</span>}
    </div>
  );
};

// Функции с модификаторами
async function asyncFunction(): Promise<void> {
  return Promise.resolve();
}

function* generatorFunction(): Generator<number> {
  yield 1;
  yield 2;
}

export function exportedFunction(): void {}

// Использование различных конструкций
const instance = new ConcreteClass("public", 42, true);
const exportedInstance = new ExportedClass();
const enumValue = LocalEnum.Value1;
const constEnumValue = LocalConstEnum.ConstValue1;

// Экспорт по умолчанию
export default ExportedComponent;
