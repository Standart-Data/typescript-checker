import fs from "fs";
import path from "path";
import os from "os";

/**
 * Creates a temporary file with the given content.
 * @param {string} content - The content to write to the file.
 * @param {string} [extension='.ts'] - The file extension.
 * @returns {string} The path to the temporary file.
 */
export const createTempFileWithContent = (content, extension = ".ts") => {
  // Используем более уникальное имя для директории, чтобы избежать конфликтов при параллельном запуске тестов
  const tempDir = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      `vitest-temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-`
    )
  );
  const tempFilePath = path.join(tempDir, `tempfile${extension}`);
  fs.writeFileSync(tempFilePath, content);
  return tempFilePath;
};

/**
 * Cleans up the temporary directory created for a test file.
 * @param {string} filePath - The path to the temporary file whose directory needs to be cleaned up.
 */
export const cleanupTempDir = (filePath) => {
  if (!filePath) return;
  try {
    const dirPath = path.dirname(filePath);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup temp dir for ${filePath}:`, error);
    // Не прерываем тесты из-за ошибки очистки, но логируем ее
  }
};
