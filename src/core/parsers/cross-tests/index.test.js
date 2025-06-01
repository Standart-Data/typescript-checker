// Импортируем все декомпозированные тесты совместимости парсеров
import "./basic.test.js";
import "./decorators.test.js";
import "./imports-exports.test.js";
import "./modules-namespaces.test.js";
import "./react-specific.test.js";
import "./function-bodies.test.js";
import "./utility-types.test.js";
import "./indexed-access-types.test.js";
import "./type-assertions.test.js";

// Этот файл служит точкой входа для всех тестов совместимости
// между TypeScript и React парсерами.
//
// Структура:
// - basic.test.js - основные конструкции (переменные, функции, классы, интерфейсы, типы, енумы)
// - decorators.test.js - декораторы классов, свойств и методов (без декораторов функций)
// - imports-exports.test.js - импорты, экспорты и смешанные случаи
// - modules-namespaces.test.js - модули, неймспейсы и перегрузки конструкторов
// - react-specific.test.js - React-специфичные компоненты
// - function-bodies.test.js - проверки body функций и методов
// - utility-types.test.js - utility типы (Pick, Omit, Partial, Required, Record)
//
// Для запуска конкретной группы тестов:
// npm test src/core/parsers/cross-tests/basic.test.js
// npm test src/core/parsers/cross-tests/decorators.test.js
// npm test src/core/parsers/cross-tests/imports-exports.test.js
// npm test src/core/parsers/cross-tests/modules-namespaces.test.js
// npm test src/core/parsers/cross-tests/react-specific.test.js
// npm test src/core/parsers/cross-tests/function-bodies.test.js
// npm test src/core/parsers/cross-tests/utility-types.test.js
//
// Для запуска всех тестов совместимости:
// npm test src/core/parsers/cross-tests/
