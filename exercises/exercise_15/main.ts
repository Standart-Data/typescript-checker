class Animal {
  protected name: string;
 
  constructor(name: string) {
    this.name = name;
  }
 
  public makeSound() {
    console.log(`Как говорит ${this.name}?`);
  }
}
 
class Dog extends Animal {
  constructor (name: string) {
    super(name) // Вызов конструктора родительского класса
  }
  public makeSound() {
    console.log(`${this.name} лает: Гав-гав!`); // Полное переопределение метода
  }
}