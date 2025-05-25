type Greeting = {
  (name?: string): string;
  defaultName: string;
  setDefaultName(newName: string): void;
};
// Реализация функции приветствия
const greeting: Greeting = (() => {
  const greeting = (name?: string) => {
    return `Привет, ${name || greeting.defaultName}!`;
  };
  // Имя по умолчанию
  greeting.defaultName = "Гость";
  // Реализация метода для смены имени по умолчанию
  greeting.setDefaultName = (newName: string) => {
    greeting.defaultName = newName;
  };

  return greeting;
})();
// Работа модуля
greeting(); // "Привет, Гость!"
greeting("Вася"); // "Привет, Вася!"
