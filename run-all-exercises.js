const fs = require("fs");
const path = require("path");
const { runMochaTests, showTestResults } = require("./runMocha.js");

async function runAllExercises() {
  const exercisesDir = path.join(__dirname, "exercises");
  const exercises = fs
    .readdirSync(exercisesDir)
    .filter((item) => {
      const fullPath = path.join(exercisesDir, item);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  console.log(`🚀 Найдено ${exercises.length} уроков для запуска\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  const failedExercises = [];

  for (const exercise of exercises) {
    const exercisePath = path.join(exercisesDir, exercise);
    const runMePath = path.join(exercisePath, "run_me.js");
    const testPath = path.join(exercisePath, "test_ast.js");

    if (!fs.existsSync(runMePath) || !fs.existsSync(testPath)) {
      console.log(
        `⚠️  Пропускаю ${exercise} - отсутствует run_me.js или test_ast.js`
      );
      continue;
    }

    console.log(`\n📚 Запускаю урок: ${exercise}`);
    console.log("=".repeat(50));

    try {
      const results = await runMochaTests(testPath);
      showTestResults(results);

      totalPassed += results.stats.passes;
      totalFailed += results.stats.failures;

      if (results.stats.failures > 0) {
        failedExercises.push({
          name: exercise,
          failures: results.failures,
        });
      }

      console.log(`\n📊 Статистика для ${exercise}:`);
      console.log(`   ✅ Пройдено: ${results.stats.passes}`);
      console.log(`   ❌ Провалено: ${results.stats.failures}`);
    } catch (error) {
      console.error(`❌ Ошибка при запуске ${exercise}:`, error.message);
      failedExercises.push({
        name: exercise,
        error: error.message,
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 ИТОГОВЫЕ РЕЗУЛЬТАТЫ");
  console.log("=".repeat(60));
  console.log(`📈 Общая статистика:`);
  console.log(`   ✅ Всего пройдено тестов: ${totalPassed}`);
  console.log(`   ❌ Всего провалено тестов: ${totalFailed}`);
  console.log(`   📚 Уроков запущено: ${exercises.length}`);

  if (failedExercises.length > 0) {
    console.log(`\n⚠️  Уроки с проблемами (${failedExercises.length}):`);
    failedExercises.forEach((exercise) => {
      console.log(`   📌 ${exercise.name}`);
      if (exercise.error) {
        console.log(`      💥 Ошибка: ${exercise.error}`);
      } else if (exercise.failures) {
        exercise.failures.forEach((failure) => {
          console.log(`      ❌ ${failure.title}: ${failure.err.message}`);
        });
      }
    });
  } else {
    console.log("\n🎉 Все уроки прошли успешно!");
  }
}

if (require.main === module) {
  runAllExercises().catch(console.error);
}

module.exports = { runAllExercises };
