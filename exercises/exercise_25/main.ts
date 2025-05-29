export type Greeting = {
  defaultName: string;
  setDefaultName: (newName: string) => void;
} & ((name?: string) => string);

// Реализация функции приветствия
export const greeting: Greeting = (() => {
  const fn = (name?: string) => {
    return `Привет, ${name || fn.defaultName}!`;
  };
  // Имя по умолчанию
  fn.defaultName = "Гость";
  // Реализация метода для смены имени по умолчанию
  fn.setDefaultName = (newName: string) => {
    fn.defaultName = newName;
  };

  return fn;
})();
// Работа модуля
greeting(); // "Привет, Гость!"
greeting("Вася"); // "Привет, Вася!"
