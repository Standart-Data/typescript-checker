import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Utility Types Consistency", () => {
  const testCases = [
    // === UTILITY ТИПЫ ===
    {
      name: "Pick Utility Type",
      tsContent: `
        interface Film {
          id: string;
          name: string;
          year: number;
          duration: number;
          cast: string[];
          link: string;
          rating: number;
          genres: string[];
          description: string;
          logo: string;
        }
        
        type FilmPreview = Pick<Film, "id" | "description" | "genres" | "logo" | "name">;
        export type PublicFilmInfo = Pick<Film, "name" | "year" | "rating">;
      `,
      reactContent: `
        interface Film {
          id: string;
          name: string;
          year: number;
          duration: number;
          cast: string[];
          link: string;
          rating: number;
          genres: string[];
          description: string;
          logo: string;
        }
        
        type FilmPreview = Pick<Film, "id" | "description" | "genres" | "logo" | "name">;
        export type PublicFilmInfo = Pick<Film, "name" | "year" | "rating">;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.FilmPreview).toBeDefined();
        expect(tsResult.types.FilmPreview.name).toBe("FilmPreview");
        expect(tsResult.types.FilmPreview.definition.replace(/\s/g, "")).toBe(
          'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
        );
        expect(tsResult.types.FilmPreview.value.replace(/\s/g, "")).toBe(
          'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
        );
        expect(tsResult.types.FilmPreview.isExported).toBe(false);

        expect(tsResult.types.PublicFilmInfo).toBeDefined();
        expect(tsResult.types.PublicFilmInfo.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.FilmPreview).toBeDefined();
        expect(reactResult.types.FilmPreview.name).toBe("FilmPreview");
        expect(reactResult.types.FilmPreview.type).toBe(
          'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
        );
        expect(reactResult.types.FilmPreview.value).toBe(
          'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
        );
        expect(reactResult.types.FilmPreview.isExported).toBe(false);

        expect(reactResult.types.PublicFilmInfo).toBeDefined();
        expect(reactResult.types.PublicFilmInfo.isExported).toBe(true);
        expect(reactResult.exports.PublicFilmInfo).toBe(true);
      },
    },
    {
      name: "Omit Utility Type",
      tsContent: `
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
      `,
      reactContent: `
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.UserWithoutPassword).toBeDefined();
        expect(
          tsResult.types.UserWithoutPassword.definition.replace(/\s/g, "")
        ).toBe('Omit<User,"password">');
        expect(
          tsResult.types.UserWithoutPassword.value.replace(/\s/g, "")
        ).toBe('Omit<User,"password">');

        expect(tsResult.types.PublicUser).toBeDefined();
        expect(tsResult.types.PublicUser.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.UserWithoutPassword).toBeDefined();
        expect(reactResult.types.UserWithoutPassword.type).toBe(
          'Omit<User, "password">'
        );
        expect(reactResult.types.UserWithoutPassword.value).toBe(
          'Omit<User, "password">'
        );

        expect(reactResult.types.PublicUser).toBeDefined();
        expect(reactResult.types.PublicUser.isExported).toBe(true);
        expect(reactResult.exports.PublicUser).toBe(true);
      },
    },
    {
      name: "Partial and Required Utility Types",
      tsContent: `
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type RequiredConfig = Required<Config>;
      `,
      reactContent: `
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type RequiredConfig = Required<Config>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.PartialConfig).toBeDefined();
        expect(tsResult.types.PartialConfig.definition.replace(/\s/g, "")).toBe(
          "Partial<Config>"
        );
        expect(tsResult.types.PartialConfig.value.replace(/\s/g, "")).toBe(
          "Partial<Config>"
        );

        expect(tsResult.types.RequiredConfig).toBeDefined();
        expect(tsResult.types.RequiredConfig.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.PartialConfig).toBeDefined();
        expect(reactResult.types.PartialConfig.type).toBe("Partial<Config>");
        expect(reactResult.types.PartialConfig.value).toBe("Partial<Config>");

        expect(reactResult.types.RequiredConfig).toBeDefined();
        expect(reactResult.types.RequiredConfig.isExported).toBe(true);
        expect(reactResult.exports.RequiredConfig).toBe(true);
      },
    },
    {
      name: "Record Utility Type",
      tsContent: `
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
      `,
      reactContent: `
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.StatusMap).toBeDefined();
        expect(tsResult.types.StatusMap.definition.replace(/\s/g, "")).toBe(
          "Record<Status,StatusInfo>"
        );
        expect(tsResult.types.StatusMap.value.replace(/\s/g, "")).toBe(
          "Record<Status,StatusInfo>"
        );

        expect(tsResult.types.StringRecord).toBeDefined();
        expect(tsResult.types.StringRecord.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.StatusMap).toBeDefined();
        expect(reactResult.types.StatusMap.type).toBe(
          "Record<Status, StatusInfo>"
        );
        expect(reactResult.types.StatusMap.value).toBe(
          "Record<Status, StatusInfo>"
        );

        expect(reactResult.types.StringRecord).toBeDefined();
        expect(reactResult.types.StringRecord.isExported).toBe(true);
        expect(reactResult.exports.StringRecord).toBe(true);
      },
    },
  ];

  testCases.forEach((tc) => {
    it(`should parse ${tc.name} consistently`, () => {
      const tsFile = createTempFileWithContent(tc.tsContent, ".ts");
      const reactFile = createTempFileWithContent(tc.reactContent, ".tsx");

      const tsResult = parseTypeScript([tsFile]);
      const reactResult = parseReact([reactFile]);

      try {
        tc.check(tsResult, reactResult);
      } catch (error) {
        console.log(
          `TypeScript Result for ${tc.name}:`,
          JSON.stringify(tsResult, null, 2)
        );
        console.log(
          `React Result for ${tc.name}:`,
          JSON.stringify(reactResult, null, 2)
        );
        throw error;
      }

      cleanupTempDir(tsFile);
      cleanupTempDir(reactFile);
    });
  });
});
