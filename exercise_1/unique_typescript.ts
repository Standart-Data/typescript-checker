class Client {
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
