// Упражнение на интерфейсы и объекты настроек
// Задача:
// 1. Создать интерфейс AppSettings с свойствами:
//    - theme: может быть "dark" или "light"
//    - language: может быть "ru", "en" или "fr"
//    - notifications: boolean тип
// 2. Создать объект defaultSettings типа AppSettings со значениями по умолчанию с константной типизацией
// 3. Создать объект userSettings типа AppSettings с пользовательскими настройками

interface AppSettings {
  theme: "dark" | "light";
  language: "ru" | "en" | "fr";
  notifications: boolean;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  language: "en",
  notifications: false,
} as const;

const userSettings: AppSettings = {
  theme: "light",
  language: "ru",
  notifications: true,
};

// Функция для применения настроек
const applySettings = (settings: AppSettings) => {
  console.log(
    `Settings updated! Theme: ${settings.theme}, Language: ${settings.language}, Notifications: ${settings.notifications}`
  );
};

applySettings(defaultSettings); // Settings updated! Theme: dark, Language: en, Notifications: false
applySettings(userSettings); // Settings updated! Theme: light, Language: ru, Notifications: true
