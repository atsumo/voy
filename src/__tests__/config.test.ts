import { describe, test, expect } from "bun:test";
import { loadConfigSync } from "../config/config.ts";

describe("loadConfigSync", () => {
  test("returns default config when no config file exists", () => {
    const config = loadConfigSync();
    expect(config).toBeDefined();
    expect(config.editor).toBeDefined();
    expect(typeof config.editor.command).toBe("string");
    expect(config.editor.command.length).toBeGreaterThan(0);
  });

  test("editor fallback uses EDITOR env or vi", () => {
    const config = loadConfigSync();
    const expected = process.env.EDITOR || process.env.VISUAL || "vi";
    expect(config.editor.command).toBe(expected);
  });
});
