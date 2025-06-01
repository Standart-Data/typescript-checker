// Максимально расширенный файл приложения, демонстрирующий все возможные варианты декораторов
import {
  // Декораторы классов
  Component,
  Logger,
  Singleton,
  Observable,
  Metrics,

  // Декораторы свойств
  Required,
  MaxLength,
  MinLength,
  Readonly,
  EnumValidation,
  Lazy,

  // Декораторы методов
  Measure,
  Cacheable,
  Retry,
  Throttle,
  Debounce,
  Authorize,
  LogMethodCalls,

  // Декораторы параметров
  Validate,
  Uppercase,
  Lowercase,
  Trim,
  DefaultValue,
  TypeCheck,

  // Декораторы аксессоров
  LogGetter,
  LogSetter,

  // Композитные декораторы
  ApiEndpoint,
  BusinessLogic,

  // Енумы и типы
  LogLevel,
  ValidationLevel,
  ComponentConfig,
  CacheConfig,
  ValidationConfig,
  MetricsConfig,
} from "./decorators";

import {
  User,
  UserProfile,
  UserPreferences,
  UserRole,
  Theme,
  ApiResponse,
  UserProfileComponent,
  UserListComponent,
  BaseComponent,
} from "./components";

// ===========================================
// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ДЕКОРАТОРОВ КЛАССОВ
// ===========================================

/**
 * Пример класса с множественными декораторами
 */
@Logger(LogLevel.INFO, "UserService")
@Metrics({
  trackTime: true,
  trackMemory: true,
  trackCalls: true,
  reportingInterval: 5000,
})
@Observable
class AdvancedUserService {
  private users: User[] = [];
  private apiUrl: string;
  public userRoles: string[] = ["admin", "user", "moderator"]; // Для демонстрации @Authorize

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.initializeUsers();
  }

  private initializeUsers(): void {
    this.users = [
      {
        id: 1,
        name: "Иван Петров",
        email: "ivan@example.com",
        role: UserRole.ADMIN,
        lastLogin: new Date("2023-12-15"),
        isActive: true,
        permissions: ["read", "write", "delete"],
      },
      {
        id: 2,
        name: "Мария Сидорова",
        email: "maria@example.com",
        role: UserRole.USER,
        lastLogin: new Date("2023-12-20"),
        isActive: true,
        permissions: ["read"],
      },
      {
        id: 3,
        name: "Алексей Иванов",
        email: "alex@example.com",
        role: UserRole.MODERATOR,
        isActive: false,
        permissions: ["read", "write"],
      },
    ];
  }

  // Метод с кэшированием и измерением времени
  @Cacheable({ ttl: 120, strategy: "memory", maxSize: 50 })
  @Measure(true)
  @LogMethodCalls(LogLevel.DEBUG)
  public getAllUsers(): User[] {
    console.log(`Получение пользователей с ${this.apiUrl}`);

    // Имитация задержки API
    const delay = Math.random() * 100;
    const start = Date.now();
    while (Date.now() - start < delay) {
      // Искусственная задержка
    }

    // Уведомляем подписчиков о событии
    (this as any).notify({ type: "users-fetched", count: this.users.length });

    return this.users;
  }

  // Метод с авторизацией и повторными попытками
  @Authorize(["admin", "moderator"])
  @Retry(3, 2000)
  @BusinessLogic({ cache: true, retry: false, authorize: false })
  public async deleteUser(
    @TypeCheck("number") userId: number
  ): Promise<boolean> {
    console.log(`Удаление пользователя с ID: ${userId}`);

    // Имитация возможной ошибки
    if (Math.random() < 0.3) {
      throw new Error("Временная ошибка сервера");
    }

    const userIndex = this.users.findIndex((user) => user.id === userId);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    (this as any).notify({ type: "user-deleted", userId });

    return true;
  }

  // API endpoint с композитным декоратором
  @ApiEndpoint("/api/users", "GET")
  public getUsersApi(): ApiResponse<User[]> {
    return {
      data: this.getAllUsers(),
      status: 200,
      message: "Success",
    };
  }

  // Метод с throttling
  @Throttle(1000)
  public saveToLog(@Trim @Uppercase message: string): void {
    console.log(`Сохранение в лог: ${message}`);
  }

  // Метод с debouncing
  @Debounce(500)
  public search(
    @Validate(
      (term) => typeof term === "string" && term.length >= 2,
      "Поисковый запрос должен содержать минимум 2 символа"
    )
    @Trim
    @Lowercase
    searchTerm: string
  ): User[] {
    console.log(`Поиск пользователей по запросу: ${searchTerm}`);
    return this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
  }

  // Метод с несколькими декораторами параметров
  public createUser(
    @Validate(
      (name) => typeof name === "string" && name.length >= 3,
      "Имя должно содержать минимум 3 символа"
    )
    @Trim
    name: string,

    @Validate(
      (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      "Некорректный email адрес"
    )
    @Trim
    @Lowercase
    email: string,

    @DefaultValue(UserRole.USER)
    role: UserRole,

    @DefaultValue([])
    permissions: string[]
  ): User {
    const id = Math.max(0, ...this.users.map((u) => u.id)) + 1;

    const newUser: User = {
      id,
      name,
      email,
      role,
      lastLogin: new Date(),
      isActive: true,
      permissions,
    };

    this.users.push(newUser);
    (this as any).notify({ type: "user-created", user: newUser });

    return newUser;
  }
}

/**
 * Singleton сервис для настроек приложения
 */
@Singleton
@Component({
  selector: "app-config",
  template: "<div class='app-config'>{{title}}</div>",
  styleUrls: ["./app-config.css"],
  providers: [],
  inputs: ["title", "theme"],
  outputs: ["configChanged"],
})
@Logger(LogLevel.WARN, "ConfigService")
class ConfigurationService {
  @Required
  @MinLength(3)
  @MaxLength(100)
  private appName: string = "";

  @Required
  @Readonly
  private apiKey: string = "";

  @EnumValidation(Theme)
  private theme: Theme = Theme.LIGHT;

  @Lazy(() => new Date().toISOString())
  private readonly buildTimestamp!: string;

  @Lazy(() => ({
    version: "1.0.0",
    environment: "development",
    features: ["auth", "cache", "metrics"],
  }))
  private readonly appMetadata!: any;

  constructor(appName: string, apiKey: string) {
    this.appName = appName;
    this.apiKey = apiKey;
  }

  // Геттер и сеттер с декораторами
  @LogGetter
  get currentTheme(): Theme {
    return this.theme;
  }

  @LogSetter
  set currentTheme(newTheme: Theme) {
    this.theme = newTheme;
  }

  @Measure()
  @Cacheable(300) // Кэш на 5 минут
  public getFullConfig(): any {
    return {
      appName: this.appName,
      theme: this.theme,
      buildTimestamp: this.buildTimestamp,
      metadata: this.appMetadata,
      timestamp: new Date().toISOString(),
    };
  }

  @Authorize(["admin"])
  public updateConfig(
    @Validate(
      (config) => typeof config === "object" && config !== null,
      "Конфигурация должна быть объектом"
    )
    config: Partial<{ appName: string; theme: Theme }>
  ): void {
    if (config.appName) {
      this.appName = config.appName;
    }
    if (config.theme) {
      this.currentTheme = config.theme;
    }
  }

  // Статический метод для получения экземпляра (паттерн Singleton)
  public static getInstance(
    appName?: string,
    apiKey?: string
  ): ConfigurationService {
    return new ConfigurationService(
      appName || "Default App",
      apiKey || "default-key"
    );
  }
}

/**
 * Класс для демонстрации Observable паттерна
 */
@Observable
@Metrics()
class EventBus {
  private events: Map<string, any[]> = new Map();

  @Throttle(100) // Ограничиваем частоту эмиссии событий
  public emit(
    @Validate(
      (eventName) => typeof eventName === "string" && eventName.length > 0
    )
    @Trim
    eventName: string,

    @DefaultValue({})
    data: any
  ): void {
    const eventData = { eventName, data, timestamp: Date.now() };

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName)?.push(eventData);
    (this as any).notify(eventData);
  }

  @Cacheable({ ttl: 30, maxSize: 10 })
  public getEventHistory(
    @Validate((eventName) => typeof eventName === "string")
    eventName: string
  ): any[] {
    return this.events.get(eventName) || [];
  }

  @Authorize(["admin", "moderator"])
  public clearEventHistory(): void {
    this.events.clear();
    console.log("История событий очищена");
  }
}

/**
 * Расширенный UI компонент с декораторами
 */
@Component({
  selector: "advanced-user-component",
  template: `
    <div class="user-component">
      <h3>{{ userName }}</h3>
      <p>{{ userEmail }}</p>
      <button (click)="onUserClick()">Действие</button>
    </div>
  `,
  styleUrls: ["./user-component.css"],
  inputs: ["user", "theme"],
  outputs: ["userSelected", "userAction"],
})
@Logger(LogLevel.DEBUG, "UserComponent")
class AdvancedUserComponent extends BaseComponent {
  @Required
  @Validate((user) => user && typeof user === "object" && user.id && user.name)
  private user!: User;

  @EnumValidation(Theme)
  private theme: Theme = Theme.LIGHT;

  @Readonly
  private readonly componentId: string = Math.random()
    .toString(36)
    .substr(2, 9);

  @Lazy(() => new Date().toISOString())
  private readonly createdAt!: string;

  // Геттеры с декораторами
  @LogGetter
  get userName(): string {
    return this.user?.name || "Unknown";
  }

  @LogGetter
  get userEmail(): string {
    return this.user?.email || "no-email";
  }

  // Методы с декораторами
  @Debounce(300)
  @Measure()
  public onUserClick(): void {
    console.log(`Клик по пользователю: ${this.userName}`);
    // Эмулируем событие
  }

  @Throttle(1000)
  public highlightUser(): void {
    console.log(`Подсветка пользователя: ${this.userName}`);
  }

  @Cacheable({ ttl: 60, strategy: "memory" })
  public getUserDisplayName(
    @DefaultValue(false) includeEmail: boolean,
    @DefaultValue("") prefix: string
  ): string {
    let displayName = prefix ? `${prefix} ${this.userName}` : this.userName;
    if (includeEmail) {
      displayName += ` (${this.userEmail})`;
    }
    return displayName;
  }

  public render(): string {
    return `<div class="advanced-user-component theme-${this.theme}">
      <div class="user-info">
        <h4>${this.getUserDisplayName(true, "👤")}</h4>
        <p>ID: ${this.componentId}</p>
        <p>Создан: ${this.createdAt}</p>
        <p>Роль: ${this.user?.role}</p>
        <p>Активен: ${this.user?.isActive ? "Да" : "Нет"}</p>
      </div>
    </div>`;
  }
}

/**
 * Сервис для работы с API
 */
@Logger(LogLevel.INFO, "ApiService")
@Metrics({ trackTime: true, trackCalls: true })
class ApiService {
  @Required
  @Readonly
  private readonly baseUrl: string;

  @Lazy(() => new Map())
  private readonly cache!: Map<string, any>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  @Retry(3, 1000)
  @Measure()
  @Cacheable({ ttl: 300, strategy: "memory", maxSize: 100 })
  public async fetchUsers(): Promise<User[]> {
    console.log(`Загрузка пользователей с ${this.baseUrl}/users`);

    // Имитация HTTP запроса
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    // Имитация возможной ошибки
    if (Math.random() < 0.2) {
      throw new Error("Ошибка сети");
    }

    return [
      { id: 1, name: "API User 1", email: "api1@test.com", role: "user" },
      { id: 2, name: "API User 2", email: "api2@test.com", role: "admin" },
    ];
  }

  @Authorize(["admin"])
  @LogMethodCalls(LogLevel.INFO)
  public async createUser(
    @Validate((userData) => userData && typeof userData === "object")
    @DefaultValue({})
    userData: Partial<User>
  ): Promise<User> {
    console.log("Создание нового пользователя через API");

    // Имитация API вызова
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: User = {
      id: Date.now(),
      name: userData.name || "New User",
      email: userData.email || "new@example.com",
      role: userData.role || "user",
      isActive: true,
    };

    return newUser;
  }

  @Throttle(5000) // Не чаще раза в 5 секунд
  public async syncData(): Promise<void> {
    console.log("Синхронизация данных с сервером");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// ===========================================
// СОЗДАНИЕ ЭКЗЕМПЛЯРОВ И ДЕМОНСТРАЦИЯ РАБОТЫ
// ===========================================

// Создаем экземпляры сервисов
const userService = new AdvancedUserService("https://api.example.com/v1");
const configService = ConfigurationService.getInstance(
  "Decorator Demo App Extended",
  "secret-api-key-extended-123"
);
const eventBus = new EventBus();
const apiService = new ApiService("https://jsonplaceholder.typicode.com");

// Настраиваем роли для демонстрации авторизации
(userService as any).userRoles = ["admin", "user", "moderator"];
(configService as any).userRoles = ["admin"];
(eventBus as any).userRoles = ["admin", "moderator"];
(apiService as any).userRoles = ["admin"];

// Подписываемся на события Observable
const unsubscribeUserService = (userService as any).subscribe((data: any) => {
  console.log("🔔 Событие от UserService:", data);
});

const unsubscribeEventBus = (eventBus as any).subscribe((data: any) => {
  console.log("🔔 Событие от EventBus:", data);
});

// Создаем пользователей с валидацией
console.log("\n=== Создание пользователей ===");
try {
  const newUser1 = userService.createUser(
    "Петр Смирнов",
    "petr@example.com",
    UserRole.USER,
    ["read", "write"]
  );
  console.log("✅ Пользователь создан:", newUser1);

  const newUser2 = userService.createUser(
    "Анна Козлова", // Будет обрезано
    " ANNA@EXAMPLE.COM ", // Будет приведено к нижнему регистру и обрезано
    UserRole.MODERATOR
    // permissions будет установлено по умолчанию как []
  );
  console.log("✅ Пользователь создан:", newUser2);
} catch (error: any) {
  console.error("❌ Ошибка создания пользователя:", error.message);
}

// Демонстрация кэширования
console.log("\n=== Демонстрация кэширования ===");
console.log("Первый вызов getAllUsers():");
console.time("getAllUsers-1");
const users1 = userService.getAllUsers();
console.timeEnd("getAllUsers-1");

console.log("Второй вызов getAllUsers() (из кэша):");
console.time("getAllUsers-2");
const users2 = userService.getAllUsers();
console.timeEnd("getAllUsers-2");

// Демонстрация поиска с debouncing
console.log("\n=== Демонстрация поиска с debouncing ===");
userService.search("ив");
userService.search("ива");
userService.search("иван"); // Только этот вызов будет выполнен через 500мс

// Демонстрация throttling
console.log("\n=== Демонстрация throttling ===");
userService.saveToLog("  первое сообщение  ");
userService.saveToLog("второе сообщение");
userService.saveToLog("третье сообщение"); // Эти вызовы будут заблокированы

// Работа с конфигурацией
console.log("\n=== Работа с конфигурацией ===");
console.log("Полная конфигурация:", configService.getFullConfig());
console.log("Текущая тема:", configService.currentTheme);

configService.currentTheme = Theme.DARK;
console.log("Новая тема:", configService.currentTheme);

// Демонстрация ленивой инициализации
console.log("Build timestamp (lazy):", (configService as any).buildTimestamp);
console.log("App metadata (lazy):", (configService as any).appMetadata);

// Работа с EventBus
console.log("\n=== Работа с EventBus ===");
eventBus.emit("user-login", { userId: 1, timestamp: Date.now() });
eventBus.emit("user-logout", { userId: 1, timestamp: Date.now() });
eventBus.emit("  system-maintenance  ", { status: "started" }); // Будет обрезано

// Создание UI компонентов
console.log("\n=== Создание UI компонентов ===");
const userComponent = new AdvancedUserComponent();
(userComponent as any).user = users1[0];
(userComponent as any).theme = Theme.DARK;

console.log("Компонент отрендерен:", userComponent.render());
console.log("Display name:", userComponent.getUserDisplayName(true, "🎭"));

// Имитация кликов (debounced)
userComponent.onUserClick();
userComponent.onUserClick();
userComponent.onUserClick(); // Только последний клик будет обработан

// Демонстрация метрик
console.log("\n=== Метрики ===");
setTimeout(() => {
  console.log("Метрики UserService:", (userService as any).getMetrics());
  console.log("Метрики EventBus:", (eventBus as any).getMetrics());
  console.log("Метрики ApiService:", (apiService as any).getMetrics());
}, 1000);

// Async операции с API
console.log("\n=== Async операции с API ===");
(async () => {
  try {
    const apiUsers = await apiService.fetchUsers();
    console.log("✅ Пользователи загружены из API:", apiUsers);

    const createdUser = await apiService.createUser({
      name: "API Test User",
      email: "apitest@example.com",
      role: UserRole.USER,
    });
    console.log("✅ Пользователь создан через API:", createdUser);
  } catch (error: any) {
    console.error("❌ Ошибка API:", error.message);
  }
})();

// Демонстрация авторизации (будет ошибка, если роли не совпадают)
console.log("\n=== Демонстрация авторизации ===");
try {
  // Эта операция требует роли admin или moderator
  setTimeout(async () => {
    const deleted = await userService.deleteUser(999);
    console.log("✅ Результат удаления:", deleted);
  }, 2000);
} catch (error: any) {
  console.error("❌ Ошибка авторизации:", error.message);
}

// Очистка ресурсов через 10 секунд
setTimeout(() => {
  console.log("\n=== Очистка ресурсов ===");
  unsubscribeUserService();
  unsubscribeEventBus();

  (userService as any).resetMetrics?.();
  (eventBus as any).resetMetrics?.();
  (apiService as any).resetMetrics?.();

  console.log("🧹 Ресурсы очищены");
}, 10000);

// Экспортируем для использования в тестах
export {
  AdvancedUserService,
  ConfigurationService,
  EventBus,
  AdvancedUserComponent,
  ApiService,
  userService,
  configService,
  eventBus,
  apiService,
};
