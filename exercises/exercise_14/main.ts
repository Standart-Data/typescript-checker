type Greeting = {
  (name?: string): string;
  defaultName: string;
  setDefaultName: (newName: string) => void;
};

const someFunc: Greeting = (name) => name;

someFunc.defaultName = "Func";

someFunc.setDefaultName = (anotherName) => {};
