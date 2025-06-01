// Компоненты и типы для расширенного упражнения с декораторами

// Базовые типы
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
  isActive?: boolean;
  permissions?: string[];
}

export interface UserProfile extends User {
  avatar?: string;
  bio?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Енумы для примеров
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
  GUEST = "guest",
}

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
  AUTO = "auto",
}

// Базовые компоненты для демонстрации декораторов
export interface ComponentInterface {
  render(): string;
  mount(): void;
  unmount(): void;
}

export abstract class BaseComponent implements ComponentInterface {
  protected mounted: boolean = false;

  abstract render(): string;

  mount(): void {
    this.mounted = true;
  }

  unmount(): void {
    this.mounted = false;
  }
}

// Примеры компонентов для демонстрации
export class UserProfileComponent extends BaseComponent {
  constructor(private user: UserProfile) {
    super();
  }

  render(): string {
    return `<div class="user-profile">
      <h2>${this.user.name}</h2>
      <p>${this.user.email}</p>
      <p>Role: ${this.user.role}</p>
    </div>`;
  }
}

export class UserListComponent extends BaseComponent {
  constructor(private users: User[]) {
    super();
  }

  render(): string {
    const userItems = this.users
      .map((user) => `<li>${user.name} (${user.email})</li>`)
      .join("");

    return `<ul class="user-list">${userItems}</ul>`;
  }
}
