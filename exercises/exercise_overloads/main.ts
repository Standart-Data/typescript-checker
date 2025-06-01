// Задача: Создать функцию getPerimeter с двумя перегрузками
// 1. getPerimeter(radius: number): number - вычисляет длину окружности (2 * π * radius)
// 2. getPerimeter(width: number, height: number): number - вычисляет периметр прямоугольника (2 * (width + height))

function getPerimeter(radius: number): number;
function getPerimeter(width: number, height: number): number;
function getPerimeter(value1: number, value2?: number): number {
  if (value2 === undefined) {
    // Вычисляем длину окружности
    return 2 * Math.PI * value1;
  } else {
    // Вычисляем периметр прямоугольника
    return 2 * (value1 + value2);
  }
}

// Примеры использования:
console.log(getPerimeter(5)); // Ожидаемый результат: 31.42 (Длина окружности)
console.log(getPerimeter(4, 6)); // Ожидаемый результат: 20 (Периметр прямоугольника)
