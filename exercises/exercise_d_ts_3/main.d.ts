/**
 * Упражнение 3: Объявления модулей и пространств имен
 *
 * Задание:
 * 1. Создайте объявление модуля 'data-service' с:
 *    - Функцией getData<T>(id: string): Promise<T>
 *    - Классом DataManager с методами:
 *      - constructor(config: ServiceConfig)
 *      - connect(): Promise<boolean>
 *      - disconnect(): void
 *    - Интерфейсом ServiceConfig с полями:
 *      - apiUrl: string
 *      - timeout: number (опциональное)
 *
 * 2. Создайте пространство имен API с:
 *    - Функцией request<T>(endpoint: string, method: 'GET'|'POST'): Promise<T>
 *    - Интерфейсом ErrorResponse с полями:
 *      - code: number
 *      - message: string
 */

// Создайте объявление модуля 'data-service'
declare module "data-service" {
  // Интерфейс для конфигурации сервиса
  export interface ServiceConfig {
    apiUrl: string;
    timeout?: number;
  }

  // Функция для получения данных
  export function getData<T>(id: string): Promise<T>;

  // Класс для управления подключением к сервису
  export class DataManager {
    constructor(config: ServiceConfig);
    connect(): Promise<boolean>;
    disconnect(): void;
  }
}

// Создайте пространство имен API
declare namespace API {
  // Интерфейс для ответа с ошибкой
  interface ErrorResponse {
    code: number;
    message: string;
  }

  // Функция для выполнения запросов
  function request<T>(endpoint: string, method: "GET" | "POST"): Promise<T>;
}

declare global {
  // Интерфейс для данных
  interface Data {
    id: string;
    name: string;
    age: number;
  }

  // Интерфейс для ответа от API
  interface ApiResponse<T> {
    data: T;
    status: string;
  }
}
