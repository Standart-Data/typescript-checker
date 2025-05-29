// Упражнение: различение const enum от обычного enum
// Задача: правильно определить типы enum и их свойства

// Обычный enum - создает объект во время выполнения
enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue",
}

// Константный enum - инлайнится во время компиляции
const enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

// Числовой обычный enum
enum Status {
  Pending,
  Approved,
  Rejected,
}

// Числовой константный enum
const enum Priority {
  Low = 1,
  Medium,
  High,
}

// Использование enum
const userColor: Color = Color.Red;
const moveDirection: Direction = Direction.Up;
const currentStatus: Status = Status.Pending;
const taskPriority: Priority = Priority.High;

// Экспортируемые enum
export enum Theme {
  Light = "light",
  Dark = "dark",
}

export const enum Size {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}
