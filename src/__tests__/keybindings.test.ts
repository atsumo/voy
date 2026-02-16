import { describe, test, expect } from "bun:test";
import { parseInput, keyToString, createKeyBuffer } from "../keybindings/parser.ts";
import { createRegistry, register, findMatch } from "../keybindings/registry.ts";
import { createDefaultBindings } from "../keybindings/definitions.ts";
import type { Key } from "ink";

function makeKey(overrides?: Partial<Key>): Key {
  return {
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    pageDown: false,
    pageUp: false,
    home: false,
    end: false,
    return: false,
    escape: false,
    ctrl: false,
    shift: false,
    tab: false,
    backspace: false,
    delete: false,
    meta: false,
    super: false,
    hyper: false,
    capsLock: false,
    numLock: false,
    ...overrides,
  };
}

describe("parseInput", () => {
  test("parses regular character", () => {
    const result = parseInput("j", makeKey());
    expect(result).toEqual({ key: "j", ctrl: false, shift: false, meta: false });
  });

  test("parses up arrow", () => {
    const result = parseInput("", makeKey({ upArrow: true }));
    expect(result.key).toBe("up");
  });

  test("parses escape", () => {
    const result = parseInput("", makeKey({ escape: true }));
    expect(result).toEqual({ key: "escape", ctrl: false, shift: false, meta: false });
  });

  test("parses ctrl+d", () => {
    const result = parseInput("d", makeKey({ ctrl: true }));
    expect(result).toEqual({ key: "d", ctrl: true, shift: false, meta: false });
  });

  test("parses return", () => {
    const result = parseInput("", makeKey({ return: true }));
    expect(result.key).toBe("return");
  });
});

describe("keyToString", () => {
  test("regular key", () => {
    expect(keyToString({ key: "j", ctrl: false, shift: false, meta: false })).toBe("j");
  });

  test("ctrl key", () => {
    expect(keyToString({ key: "d", ctrl: true, shift: false, meta: false })).toBe("C-d");
  });

  test("meta key", () => {
    expect(keyToString({ key: "x", ctrl: false, shift: false, meta: true })).toBe("M-x");
  });

  test("shift with special key", () => {
    expect(keyToString({ key: "up", ctrl: false, shift: true, meta: false })).toBe("S-up");
  });

  test("shift with single char (not added)", () => {
    // Shift with single char is already in the key (capital letter)
    expect(keyToString({ key: "G", ctrl: false, shift: true, meta: false })).toBe("G");
  });
});

describe("createKeyBuffer", () => {
  test("starts empty", () => {
    const buf = createKeyBuffer();
    expect(buf.keys).toEqual([]);
    expect(buf.count).toBe("");
    expect(buf.timeout).toBeNull();
  });
});

describe("KeyBindingRegistry", () => {
  test("register and find single-key binding", () => {
    const registry = createRegistry();
    const handler = () => {};
    register(registry, "normal", {
      keys: ["j"],
      description: "test",
      handler,
    });

    const match = findMatch(registry, "normal", ["j"]);
    expect(match).not.toBeNull();
    expect(match!.exact).toBe(true);
    expect(match!.action.description).toBe("test");
  });

  test("find multi-key binding partial", () => {
    const registry = createRegistry();
    register(registry, "normal", {
      keys: ["g", "g"],
      description: "go top",
      handler: () => {},
    });

    const partial = findMatch(registry, "normal", ["g"]);
    expect(partial).not.toBeNull();
    expect(partial!.exact).toBe(false);
  });

  test("find multi-key binding exact", () => {
    const registry = createRegistry();
    register(registry, "normal", {
      keys: ["g", "g"],
      description: "go top",
      handler: () => {},
    });

    const exact = findMatch(registry, "normal", ["g", "g"]);
    expect(exact).not.toBeNull();
    expect(exact!.exact).toBe(true);
  });

  test("no match for unregistered key", () => {
    const registry = createRegistry();
    register(registry, "normal", {
      keys: ["j"],
      description: "test",
      handler: () => {},
    });

    const match = findMatch(registry, "normal", ["x"]);
    expect(match).toBeNull();
  });

  test("no match for wrong mode", () => {
    const registry = createRegistry();
    register(registry, "normal", {
      keys: ["j"],
      description: "test",
      handler: () => {},
    });

    const match = findMatch(registry, "command", ["j"]);
    expect(match).toBeNull();
  });
});

describe("createDefaultBindings", () => {
  test("creates registry with normal mode bindings", () => {
    const registry = createDefaultBindings();
    expect(registry.bindings.has("normal")).toBe(true);
    const normalBindings = registry.bindings.get("normal")!;
    expect(normalBindings.length).toBeGreaterThan(10);
  });

  test("has visual mode bindings", () => {
    const registry = createDefaultBindings();
    expect(registry.bindings.has("visual")).toBe(true);
  });

  test("j binding exists", () => {
    const registry = createDefaultBindings();
    const match = findMatch(registry, "normal", ["j"]);
    expect(match).not.toBeNull();
    expect(match!.exact).toBe(true);
  });

  test("gg binding exists as multi-key", () => {
    const registry = createDefaultBindings();
    const partial = findMatch(registry, "normal", ["g"]);
    expect(partial).not.toBeNull();
    expect(partial!.exact).toBe(false);

    const exact = findMatch(registry, "normal", ["g", "g"]);
    expect(exact).not.toBeNull();
    expect(exact!.exact).toBe(true);
  });

  test("dd binding exists", () => {
    const registry = createDefaultBindings();
    const exact = findMatch(registry, "normal", ["d", "d"]);
    expect(exact).not.toBeNull();
    expect(exact!.exact).toBe(true);
  });

  test("yy binding exists", () => {
    const registry = createDefaultBindings();
    const exact = findMatch(registry, "normal", ["y", "y"]);
    expect(exact).not.toBeNull();
    expect(exact!.exact).toBe(true);
  });
});
