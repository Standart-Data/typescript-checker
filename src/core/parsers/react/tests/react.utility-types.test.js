import { describe, it, expect } from "vitest";
import { parseReact } from "../parseReact";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../../tests/testUtils";

describe("React Parser - Utility Types", () => {
  it("should parse Pick utility type in React files", () => {
    const content = `
      import React from 'react';
      
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
      
      const MyComponent: React.FC<{film: FilmPreview}> = ({film}) => {
        return <div>{film.name}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const filmPreview = result.types.FilmPreview;
    expect(filmPreview).toBeDefined();
    expect(filmPreview.name).toBe("FilmPreview");
    expect(filmPreview.type).toBe(
      'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
    );
    expect(filmPreview.value).toBe(
      'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
    );
    expect(filmPreview.isExported).toBe(false);

    const publicFilmInfo = result.types.PublicFilmInfo;
    expect(publicFilmInfo).toBeDefined();
    expect(publicFilmInfo.name).toBe("PublicFilmInfo");
    expect(publicFilmInfo.type).toBe('Pick<Film, "name" | "year" | "rating">');
    expect(publicFilmInfo.value).toBe('Pick<Film, "name" | "year" | "rating">');
    expect(publicFilmInfo.isExported).toBe(true);

    // Проверяем что React компонент тоже парсится
    expect(result.functions.MyComponent).toBeDefined();
    expect(result.functions.MyComponent.jsx).toBe(true);

    cleanupTempDir(tempFile);
  });

  it("should parse Omit utility type in React files", () => {
    const content = `
      import React from 'react';
      
      interface User {
        id: string;
        name: string;
        email: string;
        password: string;
        createdAt: Date;
      }
      
      type UserWithoutPassword = Omit<User, "password">;
      export type PublicUser = Omit<User, "password" | "email">;
      
      const UserProfile: React.FC<{user: PublicUser}> = ({user}) => {
        return <div>{user.name}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const userWithoutPassword = result.types.UserWithoutPassword;
    expect(userWithoutPassword).toBeDefined();
    expect(userWithoutPassword.type).toBe('Omit<User, "password">');
    expect(userWithoutPassword.value).toBe('Omit<User, "password">');
    expect(userWithoutPassword.isExported).toBe(false);

    const publicUser = result.types.PublicUser;
    expect(publicUser).toBeDefined();
    expect(publicUser.type).toBe('Omit<User, "password" | "email">');
    expect(publicUser.value).toBe('Omit<User, "password" | "email">');
    expect(publicUser.isExported).toBe(true);

    expect(result.functions.UserProfile).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse Partial utility type in React files", () => {
    const content = `
      import React from 'react';
      
      interface Config {
        apiUrl: string;
        timeout: number;
        retries: number;
      }
      
      type PartialConfig = Partial<Config>;
      export type OptionalConfig = Partial<Pick<Config, "timeout" | "retries">>;
      
      const ConfigForm: React.FC<{config: PartialConfig}> = ({config}) => {
        return <div>{config.apiUrl}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const partialConfig = result.types.PartialConfig;
    expect(partialConfig).toBeDefined();
    expect(partialConfig.type).toBe("Partial<Config>");
    expect(partialConfig.value).toBe("Partial<Config>");

    const optionalConfig = result.types.OptionalConfig;
    expect(optionalConfig).toBeDefined();
    expect(optionalConfig.type).toBe(
      'Partial<Pick<Config, "timeout" | "retries">>'
    );
    expect(optionalConfig.value).toBe(
      'Partial<Pick<Config, "timeout" | "retries">>'
    );
    expect(optionalConfig.isExported).toBe(true);

    expect(result.functions.ConfigForm).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse Required utility type in React files", () => {
    const content = `
      import React from 'react';
      
      interface Options {
        name?: string;
        age?: number;
        active?: boolean;
      }
      
      type RequiredOptions = Required<Options>;
      export type StrictOptions = Required<Pick<Options, "name" | "age">>;
      
      const OptionsDisplay: React.FC<{options: RequiredOptions}> = ({options}) => {
        return <div>{options.name}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const requiredOptions = result.types.RequiredOptions;
    expect(requiredOptions).toBeDefined();
    expect(requiredOptions.type).toBe("Required<Options>");
    expect(requiredOptions.value).toBe("Required<Options>");

    const strictOptions = result.types.StrictOptions;
    expect(strictOptions).toBeDefined();
    expect(strictOptions.type).toBe('Required<Pick<Options, "name" | "age">>');
    expect(strictOptions.value).toBe('Required<Pick<Options, "name" | "age">>');
    expect(strictOptions.isExported).toBe(true);

    expect(result.functions.OptionsDisplay).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse Record utility type in React files", () => {
    const content = `
      import React from 'react';
      
      type Status = "pending" | "approved" | "rejected";
      type StatusInfo = {
        label: string;
        color: string;
      };
      
      type StatusMap = Record<Status, StatusInfo>;
      export type StringRecord = Record<string, number>;
      
      const StatusBadge: React.FC<{status: Status}> = ({status}) => {
        return <span>{status}</span>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const statusMap = result.types.StatusMap;
    expect(statusMap).toBeDefined();
    expect(statusMap.type).toBe("Record<Status, StatusInfo>");
    expect(statusMap.value).toBe("Record<Status, StatusInfo>");

    const stringRecord = result.types.StringRecord;
    expect(stringRecord).toBeDefined();
    expect(stringRecord.type).toBe("Record<string, number>");
    expect(stringRecord.value).toBe("Record<string, number>");
    expect(stringRecord.isExported).toBe(true);

    expect(result.functions.StatusBadge).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse Exclude and Extract utility types in React files", () => {
    const content = `
      import React from 'react';
      
      type AllTypes = string | number | boolean | null;
      type PrimitiveTypes = "string" | "number" | "boolean";
      
      type NonNullTypes = Exclude<AllTypes, null>;
      type OnlyNumbers = Extract<AllTypes, number>;
      export type StringOrNumber = Extract<AllTypes, string | number>;
      
      const TypeChecker: React.FC<{value: NonNullTypes}> = ({value}) => {
        return <div>{typeof value}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const nonNullTypes = result.types.NonNullTypes;
    expect(nonNullTypes).toBeDefined();
    expect(nonNullTypes.type).toBe("Exclude<AllTypes, null>");
    expect(nonNullTypes.value).toBe("Exclude<AllTypes, null>");

    const onlyNumbers = result.types.OnlyNumbers;
    expect(onlyNumbers).toBeDefined();
    expect(onlyNumbers.type).toBe("Extract<AllTypes, number>");
    expect(onlyNumbers.value).toBe("Extract<AllTypes, number>");

    const stringOrNumber = result.types.StringOrNumber;
    expect(stringOrNumber).toBeDefined();
    expect(stringOrNumber.type).toBe("Extract<AllTypes, string | number>");
    expect(stringOrNumber.value).toBe("Extract<AllTypes, string | number>");
    expect(stringOrNumber.isExported).toBe(true);

    expect(result.functions.TypeChecker).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse hybrid types (intersection of object and function) in React files", () => {
    const content = `
      import React from 'react';
      
      type EventHandler = {
        on: (event: string, callback: Function) => void;
        off: (event: string, callback: Function) => void;
        listeners: string[];
      } & ((event: string, data: any) => void);
      
      export type MediaPlayer = {
        title: string;
        play: () => void;
        pause: () => void;
        setVolume: (volume: number) => void;
      } & ((action: string) => void);
      
      const PlayerComponent: React.FC<{player: MediaPlayer}> = ({player}) => {
        return <div>{player.title}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем EventHandler
    const eventHandler = result.types.EventHandler;
    expect(eventHandler).toBeDefined();
    expect(eventHandler.name).toBe("EventHandler");
    expect(eventHandler.type).toBe("function");
    expect(eventHandler.isExported).toBe(false);

    // Проверяем функциональную сигнатуру EventHandler
    expect(eventHandler.params).toBeDefined();
    expect(eventHandler.params).toHaveLength(2);
    expect(eventHandler.params[0].name).toBe("event");
    expect(eventHandler.params[1].name).toBe("data");
    expect(eventHandler.returnType).toBeDefined();

    // Проверяем свойства EventHandler
    expect(eventHandler.properties).toBeDefined();
    expect(eventHandler.properties.on).toBeDefined();
    expect(eventHandler.properties.off).toBeDefined();
    expect(eventHandler.properties.listeners).toBeDefined();

    // Проверяем MediaPlayer
    const mediaPlayer = result.types.MediaPlayer;
    expect(mediaPlayer).toBeDefined();
    expect(mediaPlayer.name).toBe("MediaPlayer");
    expect(mediaPlayer.type).toBe("function");
    expect(mediaPlayer.isExported).toBe(true);

    // Проверяем функциональную сигнатуру MediaPlayer
    expect(mediaPlayer.params).toBeDefined();
    expect(mediaPlayer.params).toHaveLength(1);
    expect(mediaPlayer.params[0].name).toBe("action");
    expect(mediaPlayer.returnType).toBeDefined();

    // Проверяем свойства MediaPlayer
    expect(mediaPlayer.properties).toBeDefined();
    expect(mediaPlayer.properties.title).toBeDefined();
    expect(mediaPlayer.properties.play).toBeDefined();
    expect(mediaPlayer.properties.pause).toBeDefined();
    expect(mediaPlayer.properties.setVolume).toBeDefined();

    expect(result.functions.PlayerComponent).toBeDefined();

    cleanupTempDir(tempFile);
  });
});
