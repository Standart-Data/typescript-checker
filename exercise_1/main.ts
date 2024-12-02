// Это пример файла, который тестируется

const a: number = 5;

let helloWorld: string | number = "Hello World";

type IamNotNumber = string | boolean;

interface User {
  name: string;
  id: number;
}

const user: User = {
  name: "Hayes",
  id: 0,
};

const str = "paeroaqwe1" as number;

const client = {
  name: "Hayes",
  id: 0,
  address: {
    country: "Russia",
    city: "Moskva",
    indexes: ["123", "2323"],
  },
};

function add(a: number, b: number) {
  a + b;
}

function multiple(a: number, b: number) {
  return a * b;
}
class Client {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  sayName() {
    console.log(`Hello ${this.name}`);
  }

  saySomething(someThing: string) {
    console.log(`Hello ${someThing}`);
  }
}

enum roles {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MODERATOR = "MODERATOR",
}

let b = "It's string";

let c = 7;

const strArr = ["123", "456", "789"];
