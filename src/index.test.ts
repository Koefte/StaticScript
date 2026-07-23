import * as fs from "fs";
import * as path from "path";
import { compile } from "./index";

describe("StaticScript Compiler - Extended Unit Tests (Phases 1 to 3)", () => {
  describe("Valid StaticScript Features", () => {
    it("compiles primitive variable declarations and arithmetic expressions", () => {
      const code = `
        number a = 10;
        number b = 20.5;
        number c = a + b;
        string name = "StaticScript";
        boolean flag = true;
        any flex = 100;
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("let a=10;");
      expect(res.code).toContain("let b=20.5;");
    });

    it("compiles if / else if / else conditional branching", () => {
      const code = `
        number score = 85.5;
        string grade = "B";
        if (score >= 90.0) {
          grade = "A+";
        } else if (score >= 80.0) {
          grade = "A";
        } else {
          grade = "B";
        }
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("if (score>=90");
      expect(res.code).toContain("else if (score>=80");
    });

    it("compiles while loops and comparison operations", () => {
      const code = `
        number count = 0;
        while (count < 10) {
          count++;
        }
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("while (count<10)");
    });

    it("compiles array methods and string member accesses", () => {
      const code = `
        number[] list = [1.5, 2.5, 3.5];
        list.push(4.5);
        number len = list.length;
        
        string title = "StaticScript";
        number strLen = title.length;
        boolean hasScript = title.includes("Script");
        number idx = title.indexOf("Script");
        string sub = title.substring(0, 6);
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("list.push(4.5)");
      expect(res.code).toContain("title.length");
    });

    it("compiles global Math library calls", () => {
      const code = `
        number val = 16.0;
        number root = Math.sqrt(val);
        number fl = Math.floor(10.75);
        number rounded = Math.round(5.4);
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("Math.sqrt(val)");
      expect(res.code).toContain("Math.floor(10.75)");
    });

    it("compiles functions with parameters and return values", () => {
      const code = `
        number add(number x, number y) {
          return x + y;
        }
        number result = add(10.5, 20.25);
      `;
      const res = compile(code);
      expect(res.valid).toBe(true);
      expect(res.code).toContain("function add(x,y)");
    });
  });

  describe("Invalid StaticScript Code Examples (Error Cases)", () => {
    it("throws error when assigning wrong type to a variable", () => {
      const code = `number x = "string_value";`;
      expect(() => compile(code)).toThrow(/types dont match/i);
    });

    it("throws error when function returns wrong type", () => {
      const code = `
        number getNumber() {
          return "not a number";
        }
      `;
      expect(() => compile(code)).toThrow(/should return number but returns string/i);
    });

    it("throws error when accessing non-existent struct property", () => {
      const code = `
        struct Point = {
          number x,
          number y,
        }
        Point p = { x: 1, y: 2 };
        number invalidProp = p.z;
      `;
      expect(() => compile(code)).toThrow(/Property z does not exist on struct/i);
    });
  });

  describe("File-Based Example Suite", () => {
    const validDir = path.join(__dirname, "../examples/valid");
    const invalidDir = path.join(__dirname, "../examples/invalid");

    const validFiles = fs.readdirSync(validDir).filter((f) => f.endsWith(".jss"));
    const invalidFiles = fs.readdirSync(invalidDir).filter((f) => f.endsWith(".jss"));

    validFiles.forEach((file) => {
      it(`should successfully compile valid example: ${file}`, () => {
        const filePath = path.join(validDir, file);
        const code = fs.readFileSync(filePath, "utf-8");
        expect(() => compile(code)).not.toThrow();
      });
    });

    invalidFiles.forEach((file) => {
      it(`should throw a compilation error for invalid example: ${file}`, () => {
        const filePath = path.join(invalidDir, file);
        const code = fs.readFileSync(filePath, "utf-8");
        expect(() => compile(code)).toThrow();
      });
    });
  });
});
