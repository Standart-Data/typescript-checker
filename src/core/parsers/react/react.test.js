// React Parser Test Suite
// Декомпозированная структура тестов для лучшей организации

// Основные тесты функциональности парсера
import "./tests/react.basic.test.js";

// Тесты обратной совместимости
import "./tests/react.compatibility.test.js";

// Тесты Utility Types
import "./tests/react.utility-types.test.js";

// Тесты новых полей (propertyDetails и typeSignature)
import "./tests/react.new-fields.test.js";

// Кросс-тесты совместимости с TypeScript парсером
import "../cross-tests/index.test.js";

console.log("React Parser Test Suite loaded - all test modules imported");
