// Create a class called `Car`.
//
// Add properties `make` (string), `model` (string), and `year` (number).
//
// Add a constructor to initialize these properties.
// Create an instance of the `Car` class and log it to the console.

class Car {
  make: string;
  model: string;
  year: number;

  constructor(make: string, model: string, year: number) {
    this.make = make;
    this.model = model;
    this.year = year;
  }
}
