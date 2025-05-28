/**
 * Упражнение 2: Продвинутые объявления типов (d.ts)
 *
 * Задание:
 * 1. Создайте дженерик-интерфейс ApiResponse<T> с полями:
 *    - data: T
 *    - status: number
 *    - message: string
 *
 * 2. Объявите функцию fetchData<T>, которая:
 *    - принимает параметр url типа string
 *    - принимает опциональный параметр options типа RequestOptions
 *    - возвращает Promise<ApiResponse<T>>
 *
 * 3. Создайте интерфейс RequestOptions с полями:
 *    - headers?: Record<string, string>
 *    - timeout?: number
 *    - cache?: 'default' | 'no-cache' | 'reload'
 */

// Создайте здесь интерфейс ApiResponse
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Создайте здесь интерфейс RequestOptions
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: "default" | "no-cache" | "reload";
}

// Объявите здесь функцию fetchData
declare function fetchData<T>(
  url: string,
  options?: RequestOptions
): Promise<ApiResponse<T>>;
