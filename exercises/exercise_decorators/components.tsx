// React компоненты с использованием декораторов
import React, { useState, useEffect } from "react";
import {
  Component,
  Logger,
  Required,
  MaxLength,
  Measure,
  Cacheable,
  LogLevel,
  Validate,
  Uppercase,
} from "./decorators";

// Интерфейс для пользователя
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
}

// Интерфейс для пропсов компонента UserProfile
export interface UserProfileProps {
  user: User;
  showRole?: boolean;
  onUpdate?: (user: User) => void;
}

// Расширяем интерфейс для класса, чтобы включить метод log, добавляемый декоратором Logger
interface LoggableComponent {
  log(message: string): void;
}

// Использование декоратора для класса компонента
@Component({
  selector: "user-profile",
  template: "<div>User Profile Component</div>",
})
@Logger(LogLevel.DEBUG)
export class UserProfileComponent
  extends React.Component<UserProfileProps>
  implements LoggableComponent
{
  // Декораторы для свойств
  @Required
  private userId: number;

  @MaxLength(50)
  private userName: string;

  constructor(props: UserProfileProps) {
    super(props);
    this.userId = props.user.id;
    this.userName = props.user.name;
  }

  // Метод log, добавляемый декоратором Logger
  log(message: string): void {
    console.log(`[DEBUG] ${message}`);
  }

  // Декоратор для метода
  @Measure
  public render() {
    const { user, showRole = false } = this.props;

    return (
      <div className="user-profile">
        <h2>Профиль пользователя</h2>
        <div className="user-info">
          <p>ID: {user.id}</p>
          <p>Имя: {user.name}</p>
          <p>Email: {user.email}</p>
          {showRole && <p>Роль: {user.role}</p>}
          {user.lastLogin && (
            <p>Последний вход: {user.lastLogin.toLocaleDateString()}</p>
          )}
        </div>
        {this.renderButtons()}
      </div>
    );
  }

  // Приватный метод с декоратором
  @Cacheable(30) // Кэш на 30 секунд
  private getUserDisplayName(): string {
    console.log("Вычисление отображаемого имени пользователя...");
    return `${this.props.user.name} (${this.props.user.role})`;
  }

  // Метод с декораторами параметров
  public updateUserName(
    @Validate((value) => value && value.length > 2) name: string,
    @Uppercase extraInfo?: string
  ) {
    this.userName = name;
    console.log(`Имя пользователя обновлено на ${name}`);

    if (extraInfo) {
      console.log(`Дополнительная информация: ${extraInfo}`);
    }

    if (this.props.onUpdate) {
      this.props.onUpdate({
        ...this.props.user,
        name: this.userName,
      });
    }
  }

  private renderButtons() {
    return (
      <div className="actions">
        <button
          onClick={() => this.updateUserName(this.props.user.name, "updated")}
        >
          Обновить
        </button>
        <button onClick={() => this.log("Профиль пользователя просмотрен")}>
          Журнал
        </button>
      </div>
    );
  }
}

// Интерфейс для пропсов компонента UserList
export interface UserListProps {
  users: User[];
  title?: string;
}

// Еще один компонент с декораторами
@Component({
  selector: "user-list",
  template: "<div>User List Component</div>",
})
@Logger(LogLevel.INFO)
export class UserListComponent
  extends React.Component<UserListProps>
  implements LoggableComponent
{
  // Декоратор для свойства
  @MaxLength(100)
  private listTitle: string;

  constructor(props: UserListProps) {
    super(props);
    this.listTitle = props.title || "Список пользователей";
  }

  // Метод log, добавляемый декоратором Logger
  log(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  // Метод с декоратором
  @Measure
  public render() {
    const { users } = this.props;

    return (
      <div className="user-list">
        <h2>{this.listTitle}</h2>
        {users.length === 0 ? (
          <p>Нет пользователей для отображения</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Метод с декоратором
  @Cacheable()
  public getUsersCount(): number {
    console.log("Подсчет количества пользователей...");
    return this.props.users.length;
  }
}
