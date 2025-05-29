// Упражнение: различение const enum от обычного enum в React
// Задача: правильно определить типы enum и их использование в React компонентах

import React from "react";

// Обычный enum для состояний загрузки
enum LoadingState {
  Idle = "idle",
  Loading = "loading",
  Success = "success",
  Error = "error",
}

// Константный enum для размеров кнопок
const enum ButtonSize {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}

// Числовой обычный enum для приоритетов
enum Priority {
  Low,
  Medium,
  High,
}

// Числовой константный enum для уровней логирования
const enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

// Интерфейс для пропсов компонента
interface ButtonProps {
  size: ButtonSize;
  priority: Priority;
  loading: LoadingState;
  logLevel: LogLevel;
}

// React компонент, использующий enum
const Button: React.FC<ButtonProps> = ({
  size,
  priority,
  loading,
  logLevel,
}) => {
  const handleClick = () => {
    console.log(
      `Button clicked with priority: ${priority}, log level: ${logLevel}`
    );
  };

  return (
    <button
      className={`btn btn-${size} priority-${priority}`}
      disabled={loading === LoadingState.Loading}
      onClick={handleClick}
    >
      {loading === LoadingState.Loading ? "Loading..." : "Click me"}
    </button>
  );
};

// Экспортируемые enum
export enum Theme {
  Light = "light",
  Dark = "dark",
}

export const enum ComponentType {
  Button = "button",
  Input = "input",
  Select = "select",
}

// Использование enum в переменных
const currentTheme: Theme = Theme.Light;
const componentType: ComponentType = ComponentType.Button;
const appState: LoadingState = LoadingState.Idle;
const taskPriority: Priority = Priority.High;

export default Button;
