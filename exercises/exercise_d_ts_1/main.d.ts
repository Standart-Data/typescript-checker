/**
 * Упражнение 1: Работа с объявлениями типов (d.ts)
 *
 * Задание:
 * 1. Создайте интерфейс User с полями:
 *    - id: number
 *    - name: string
 *    - email: string (опциональное)
 *
 * 2. Создайте тип UserRole, который может быть 'admin', 'editor', или 'viewer'
 *
 * 3. Расширьте интерфейс User, добавив поле role: UserRole
 */

// Создайте здесь интерфейс User
interface User {
  id: number;
  name: string;
  email?: string;
}

// Создайте здесь тип UserRole
type UserRole = "admin" | "editor" | "viewer";

// Добавьте поле role в интерфейс User
interface UserWithRole extends User {
  role: UserRole;
}
