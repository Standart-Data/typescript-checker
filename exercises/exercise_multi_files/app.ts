// Основной файл приложения
import { User, UserRole, AppConfig } from "./types";
import { UserCard, UserList } from "./components";

// Конфигурация приложения
const appConfig: AppConfig = {
  apiUrl: "https://api.example.com",
  theme: "light",
  language: "ru",
  maxUsers: 100,
};

// Пример пользователя
const user: User = {
  id: 1,
  name: "Иван Иванов",
  email: "ivan@example.com",
  role: UserRole.ADMIN,
  isActive: true,
  registeredAt: new Date("2023-01-15"),
  lastLogin: new Date(),
};

/**
 * Проверяет доступ пользователя к определенным действиям
 * @param user Пользователь для проверки
 * @param requiredRole Минимальная требуемая роль
 * @returns Имеет ли пользователь доступ
 */
function checkAccess(user: User, requiredRole: UserRole): boolean {
  if (!user.isActive) {
    return false;
  }

  switch (requiredRole) {
    case UserRole.USER:
      return true;
    case UserRole.MODERATOR:
      return user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    case UserRole.ADMIN:
      return user.role === UserRole.ADMIN;
    default:
      return false;
  }
}

/**
 * Отображает информацию о пользователе
 * @param user Пользователь для отображения
 */
function displayUserInfo(user: User): void {
  // Использование глобальной функции из types.d.ts
  showNotification(`Загружена информация о пользователе ${user.name}`);

  console.log(`Имя: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Роль: ${user.role}`);
  console.log(`Статус: ${user.isActive ? "Активен" : "Неактивен"}`);

  if (checkAccess(user, UserRole.ADMIN)) {
    console.log("Пользователь имеет права администратора");
  }
}

/**
 * Обработчик изменения пользователя
 * @param updatedUser Обновленный пользователь
 */
function handleUserEdit(updatedUser: User): void {
  showNotification(`Пользователь ${updatedUser.name} обновлен`, "success");
  console.log("Пользователь обновлен:", updatedUser);
}

// Экспортируем функции и объекты
export { user, appConfig, checkAccess, displayUserInfo, handleUserEdit };
