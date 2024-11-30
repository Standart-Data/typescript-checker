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

const str = "paeroaqwe1";

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
