// Файл с декларациями типов

// Перечисление ролей пользователя
export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

// Интерфейс пользователя
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  registeredAt: Date;
  lastLogin: Date;
}

// Тип для конфигурации приложения
export type AppConfig = {
  apiUrl: string;
  theme: "light" | "dark" | "system";
  language: string;
  maxUsers: number;
};

// Глобальная декларация функции для уведомлений
declare function showNotification(
  message: string,
  type?: "success" | "error" | "warning" | "info"
): void;
