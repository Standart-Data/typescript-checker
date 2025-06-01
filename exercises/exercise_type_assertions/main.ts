// Упражнение на type assertions (операторы as и satisfies)
// Задача:
// 1. Создать переменные с различными type assertions используя оператор 'as'
// 2. Создать переменные с 'as const' для создания неизменяемых типов
// 3. Создать интерфейсы и использовать type assertions для приведения типов
// 4. Использовать readonly assertions для массивов и объектов

// === ИНТЕРФЕЙСЫ ===
interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// === БАЗОВЫЕ TYPE ASSERTIONS ===
// Приведение строки к типу string (избыточно, но для примера)
const userInput = "123" as string;

// Приведение к типу number
const userId = "456" as unknown as number;

// Приведение к типу any
const apiData = { id: 1, result: "success" } as any;

// === AS CONST ASSERTIONS ===
// Объект с as const - все свойства становятся readonly и literal типами
const appConfig = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
  features: {
    auth: true,
    cache: false,
  },
} as const;

// Массив с as const - становится readonly tuple
const statusCodes = [200, 404, 500, 503] as const;

// Массив строк с as const
const allowedRoles = ["admin", "user", "guest"] as const;

// === INTERFACE ASSERTIONS ===
// Данные с сервера, приводим к нужному интерфейсу
const rawUserData: unknown = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
};

const user = rawUserData as User;

// API ответ с generic интерфейсом
const rawApiResponse: unknown = {
  data: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
  status: 200,
  message: "Success",
};

const usersResponse = rawApiResponse as ApiResponse<User[]>;

// === READONLY ASSERTIONS ===
// Массив как readonly
const readonlyNumbers = [1, 2, 3, 4, 5] as readonly number[];

// Объект как readonly (partial)
const readonlyConfig = {
  host: "localhost",
  port: 3000,
} as const;

// === UNION TYPE ASSERTIONS ===
type Environment = "development" | "production" | "test";
type LogLevel = "debug" | "info" | "warn" | "error";

// Приведение строки к union типу
const currentEnv = "development" as Environment;
const logLevel = "info" as LogLevel;

// === СЛОЖНЫЕ ASSERTIONS ===
// Nested object с as const
const themeConfig = {
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    success: "#28a745",
    danger: "#dc3545",
  },
  typography: {
    fontFamily: "Arial, sans-serif",
    fontSize: {
      small: "12px",
      medium: "16px",
      large: "24px",
    },
  },
} as const;

// Функция с type assertion результата
function fetchData(): unknown {
  return { data: "some data", timestamp: Date.now() };
}

const typedData = fetchData() as { data: string; timestamp: number };

// === ЭКСПОРТЫ ===
export {
  user,
  usersResponse,
  appConfig,
  statusCodes,
  allowedRoles,
  themeConfig,
  currentEnv,
  readonlyNumbers,
};
