// Основной файл приложения, использующий декораторы
import {
  Component,
  Logger,
  Required,
  MaxLength,
  Measure,
  Cacheable,
  Validate,
  Uppercase,
  LogLevel,
} from "./decorators";
import { User, UserProfileComponent, UserListComponent } from "./components";

// Пример класса сервиса с декораторами для работы с пользователями
@Logger(LogLevel.INFO)
class UserService {
  private users: User[] = [];
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;

    // Добавляем тестовых пользователей
    this.users = [
      {
        id: 1,
        name: "Иван Петров",
        email: "ivan@example.com",
        role: "admin",
        lastLogin: new Date("2023-12-15"),
      },
      {
        id: 2,
        name: "Мария Сидорова",
        email: "maria@example.com",
        role: "user",
        lastLogin: new Date("2023-12-20"),
      },
      {
        id: 3,
        name: "Алексей Иванов",
        email: "alex@example.com",
        role: "moderator",
      },
    ];
  }

  // Метод с декоратором измерения времени выполнения
  @Measure
  public getAllUsers(): User[] {
    // Имитация обращения к API
    console.log(`Получение пользователей с ${this.apiUrl}`);

    // Имитация задержки сети
    const delayMs = Math.random() * 100;
    const start = Date.now();
    while (Date.now() - start < delayMs) {
      // Искусственная задержка
    }

    return this.users;
  }

  // Метод с декоратором кэширования
  @Cacheable(60) // Кэширование на 60 секунд
  public getUserById(id: number): User | undefined {
    console.log(`Поиск пользователя с ID: ${id}`);
    return this.users.find((user) => user.id === id);
  }

  // Метод с декоратором параметра
  public addUser(
    @Validate((name) => typeof name === "string" && name.length >= 3)
    name: string,
    @Validate((email) => typeof email === "string" && email.includes("@"))
    email: string,
    role: string = "user"
  ): User {
    const id = Math.max(0, ...this.users.map((u) => u.id)) + 1;

    const newUser: User = {
      id,
      name,
      email,
      role,
      lastLogin: new Date(),
    };

    this.users.push(newUser);
    return newUser;
  }

  // Метод с декоратором Uppercase для параметра
  public sendNotification(userId: number, @Uppercase message: string): void {
    const user = this.getUserById(userId);
    if (user) {
      console.log(`Отправка уведомления пользователю ${user.name}: ${message}`);
    } else {
      console.error(`Пользователь с ID ${userId} не найден`);
    }
  }
}

// Пример класса настроек приложения с декораторами
@Component({
  selector: "app-config",
  template: "<div>App Configuration</div>",
})
class AppConfig {
  @Required
  private apiKey: string;

  @MaxLength(100)
  private appName: string;

  constructor(apiKey: string, appName: string) {
    this.apiKey = apiKey;
    this.appName = appName;
  }

  @Measure
  public getConfig(): { apiKey: string; appName: string } {
    return {
      apiKey: this.apiKey,
      appName: this.appName,
    };
  }
}

// Создаем экземпляры классов
const userService = new UserService("https://api.example.com/users");
const appConfig = new AppConfig("secret-api-key-12345", "Decorator Demo App");

// Примеры использования
console.log("Все пользователи:", userService.getAllUsers());
console.log("Пользователь с ID 2:", userService.getUserById(2));

// Добавляем нового пользователя
const newUser = userService.addUser("Петр Смирнов", "petr@example.com", "user");
console.log("Новый пользователь:", newUser);

// Отправляем уведомление (текст будет преобразован в верхний регистр декоратором)
userService.sendNotification(1, "Добро пожаловать в приложение!");

// Получаем конфигурацию приложения
console.log("Конфигурация приложения:", appConfig.getConfig());

// Экспортируем для использования в тестах
export { UserService, AppConfig };
