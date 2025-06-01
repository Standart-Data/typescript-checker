import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Decorators Consistency", () => {
  const testCases = [
    // === ДЕКОРАТОРЫ КЛАССОВ ===
    {
      name: "Class Decorators with Various Arguments",
      tsContent: `
        @Component({
          selector: 'app-user',
          template: '<div>{{name}}</div>',
          styleUrls: ['./user.component.css']
        })
        @Injectable({ providedIn: 'root' })
        export class UserComponent {
          @Input() name: string;
          
          @Output() nameChange = new EventEmitter<string>();
          
          @ViewChild('template', { static: true })
          template: TemplateRef<any>;
          
          @HostListener('click', ['$event'])
          onClick(event: Event): void {
            console.log('Clicked!');
          }
        }
      `,
      reactContent: `
        @Component({
          selector: 'app-user',
          template: '<div>{{name}}</div>',
          styleUrls: ['./user.component.css']
        })
        @Injectable({ providedIn: 'root' })
        export class UserComponent {
          @Input() name: string;
          
          @Output() nameChange = new EventEmitter<string>();
          
          @ViewChild('template', { static: true })
          template: TemplateRef<any>;
          
          @HostListener('click', ['$event'])
          onClick(event: Event): void {
            console.log('Clicked!');
          }
        }
      `,
      check: (tsResult, reactResult) => {
        const tsClass = tsResult.classes.UserComponent;
        expect(tsClass).toBeDefined();
        expect(tsClass.decorators).toBeDefined();
        expect(tsClass.decorators).toHaveLength(2);

        const componentDecorator = tsClass.decorators.find(
          (d) => d.name === "Component"
        );
        expect(componentDecorator).toBeDefined();
        expect(componentDecorator.args[0]).toContain("selector:");
        expect(componentDecorator.args[0]).toContain("template:");
        expect(componentDecorator.args[0]).toContain("styleUrls:");

        const injectableDecorator = tsClass.decorators.find(
          (d) => d.name === "Injectable"
        );
        expect(injectableDecorator).toBeDefined();
        expect(injectableDecorator.args[0]).toContain("providedIn:");

        // Проверяем декораторы свойств
        expect(tsClass.properties.name.decorators).toBeDefined();
        expect(tsClass.properties.name.decorators).toHaveLength(1);
        expect(tsClass.properties.name.decorators[0].name).toBe("Input");

        expect(tsClass.properties.nameChange.decorators).toBeDefined();
        expect(tsClass.properties.nameChange.decorators[0].name).toBe("Output");

        expect(tsClass.properties.template.decorators).toBeDefined();
        expect(tsClass.properties.template.decorators[0].name).toBe(
          "ViewChild"
        );

        // Проверяем декораторы методов
        expect(tsClass.methods.onClick.decorators).toBeDefined();
        expect(tsClass.methods.onClick.decorators[0].name).toBe("HostListener");

        expect(tsClass.isExported).toBe(true);
        expect(reactResult.exports?.UserComponent).toBe(true);
      },
    },

    // === ДЕКОРАТОРЫ СВОЙСТВ ===
    {
      name: "Property Decorators with Validation",
      tsContent: `
        export class ValidationExample {
          @Required
          @MinLength(5)
          @MaxLength(100)
          @Email
          email: string;

          @Range(18, 99)
          @IsPositive
          age: number;

          @JsonProperty("user_name")
          @Transform(({ value }) => value.toLowerCase())
          username: string;

          @Exclude()
          @Column({ type: "varchar", length: 255 })
          private password: string;
        }
      `,
      reactContent: `
        export class ValidationExample {
          @Required
          @MinLength(5)
          @MaxLength(100)
          @Email
          email: string;

          @Range(18, 99)
          @IsPositive
          age: number;

          @JsonProperty("user_name")
          @Transform(({ value }) => value.toLowerCase())
          username: string;

          @Exclude()
          @Column({ type: "varchar", length: 255 })
          private password: string;
        }
      `,
      check: (tsResult, reactResult) => {
        const tsClass = tsResult.classes.ValidationExample;
        expect(tsClass).toBeDefined();

        // Проверяем email с множественными декораторами
        expect(tsClass.properties.email.decorators).toHaveLength(4);
        const emailDecorators = tsClass.properties.email.decorators.map(
          (d) => d.name
        );
        expect(emailDecorators).toContain("Required");
        expect(emailDecorators).toContain("MinLength");
        expect(emailDecorators).toContain("MaxLength");
        expect(emailDecorators).toContain("Email");

        // Проверяем age с аргументами
        expect(tsClass.properties.age.decorators).toHaveLength(2);
        const rangeDecorator = tsClass.properties.age.decorators.find(
          (d) => d.name === "Range"
        );
        expect(rangeDecorator.args).toEqual(["18", "99"]);

        // Проверяем username с комплексными аргументами
        expect(tsClass.properties.username.decorators).toHaveLength(2);
        const jsonPropertyDecorator =
          tsClass.properties.username.decorators.find(
            (d) => d.name === "JsonProperty"
          );
        expect(jsonPropertyDecorator.args[0]).toBe('"user_name"');

        // Проверяем приватное свойство
        expect(tsClass.properties.password.decorators).toHaveLength(2);
        expect(tsClass.properties.password.accessModifier).toBe("private");

        expect(tsClass.isExported).toBe(true);
        expect(reactResult.exports?.ValidationExample).toBe(true);
      },
    },

    // === ДЕКОРАТОРЫ МЕТОДОВ ===
    {
      name: "Method Decorators with Complex Configurations",
      tsContent: `
        export class ServiceExample {
          @Get('/users/:id')
          @UseGuards(AuthGuard)
          @ApiResponse({ status: 200, description: 'User found' })
          @ApiParam({ name: 'id', type: 'number' })
          async getUser(@Param('id') id: number): Promise<User> {
            return this.userService.findById(id);
          }

          @Post('/users')
          @UsePipes(ValidationPipe)
          @HttpCode(201)
          @Header('Cache-Control', 'no-cache')
          createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
            return this.userService.create(createUserDto);
          }

          @Cacheable({ ttl: 60, key: 'user-list' })
          @Measure()
          @Retry(3, 1000)
          async getUserList(): Promise<User[]> {
            return this.userService.findAll();
          }
        }
      `,
      reactContent: `
        export class ServiceExample {
          @Get('/users/:id')
          @UseGuards(AuthGuard)
          @ApiResponse({ status: 200, description: 'User found' })
          @ApiParam({ name: 'id', type: 'number' })
          async getUser(@Param('id') id: number): Promise<User> {
            return this.userService.findById(id);
          }

          @Post('/users')
          @UsePipes(ValidationPipe)
          @HttpCode(201)
          @Header('Cache-Control', 'no-cache')
          createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
            return this.userService.create(createUserDto);
          }

          @Cacheable({ ttl: 60, key: 'user-list' })
          @Measure()
          @Retry(3, 1000)
          async getUserList(): Promise<User[]> {
            return this.userService.findAll();
          }
        }
      `,
      check: (tsResult, reactResult) => {
        const tsClass = tsResult.classes.ServiceExample;
        expect(tsClass).toBeDefined();

        // Проверяем getUser с множественными декораторами
        const getUserMethod = tsClass.methods.getUser;
        expect(getUserMethod.decorators).toHaveLength(4);

        const getDecorator = getUserMethod.decorators.find(
          (d) => d.name === "Get"
        );
        expect(getDecorator.args[0]).toBe("'/users/:id'");

        const apiResponseDecorator = getUserMethod.decorators.find(
          (d) => d.name === "ApiResponse"
        );
        expect(apiResponseDecorator.args[0]).toContain("status:");
        expect(apiResponseDecorator.args[0]).toContain("description:");

        // Проверяем createUser
        const createUserMethod = tsClass.methods.createUser;
        expect(createUserMethod.decorators).toHaveLength(4);

        const httpCodeDecorator = createUserMethod.decorators.find(
          (d) => d.name === "HttpCode"
        );
        expect(httpCodeDecorator.args[0]).toBe("201");

        // Проверяем getUserList с кэшированием
        const getUserListMethod = tsClass.methods.getUserList;
        expect(getUserListMethod.decorators).toHaveLength(3);

        const cacheableDecorator = getUserListMethod.decorators.find(
          (d) => d.name === "Cacheable"
        );
        expect(cacheableDecorator.args[0]).toContain("ttl:");
        expect(cacheableDecorator.args[0]).toContain("key:");

        const retryDecorator = getUserListMethod.decorators.find(
          (d) => d.name === "Retry"
        );
        expect(retryDecorator.args).toEqual(["3", "1000"]);

        expect(tsClass.isExported).toBe(true);
        expect(reactResult.exports?.ServiceExample).toBe(true);
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
