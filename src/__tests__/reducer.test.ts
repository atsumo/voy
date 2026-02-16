import { describe, test, expect } from "bun:test";
import { appReducer } from "../state/reducer.ts";
import type { AppState, FileEntry } from "../state/types.ts";

function createState(overrides?: Partial<AppState>): AppState {
  return {
    currentPath: "/home/user",
    parentPath: "/home",
    files: [],
    parentFiles: [],
    cursor: 0,
    parentCursor: 0,
    mode: "normal",
    clipboard: null,
    selectedIndices: new Set(),
    preview: { type: "none", content: "" },
    commandInput: "",
    search: null,
    prompt: null,
    error: null,
    sort: { field: "name", order: "asc" },
    showHidden: false,
    visualAnchor: 0,
    ...overrides,
  };
}

function createFile(name: string, isDir = false): FileEntry {
  return {
    name,
    path: `/home/user/${name}`,
    isDirectory: isDir,
    isSymlink: false,
    size: 1024,
    modified: new Date("2025-01-01"),
    permissions: "rw-r--r--",
  };
}

describe("appReducer", () => {
  describe("SET_PATH", () => {
    test("updates path and resets cursor/selection/search/error", () => {
      const state = createState({
        cursor: 5,
        selectedIndices: new Set([1, 2]),
        search: { query: "foo", matches: [0], currentMatch: 0 },
        error: "old error",
      });
      const next = appReducer(state, { type: "SET_PATH", path: "/new/path" });
      expect(next.currentPath).toBe("/new/path");
      expect(next.cursor).toBe(0);
      expect(next.selectedIndices.size).toBe(0);
      expect(next.search).toBeNull();
      expect(next.error).toBeNull();
    });
  });

  describe("SET_FILES", () => {
    test("sets files and clamps cursor", () => {
      const files = [createFile("a.txt"), createFile("b.txt")];
      const state = createState({ cursor: 5 });
      const next = appReducer(state, { type: "SET_FILES", files });
      expect(next.files).toEqual(files);
      expect(next.cursor).toBe(1); // clamped to files.length - 1
    });

    test("cursor stays at 0 for empty files", () => {
      const state = createState({ cursor: 3 });
      const next = appReducer(state, { type: "SET_FILES", files: [] });
      expect(next.cursor).toBe(0);
    });
  });

  describe("MOVE_CURSOR", () => {
    test("moves cursor down", () => {
      const files = [createFile("a"), createFile("b"), createFile("c")];
      const state = createState({ files, cursor: 0 });
      const next = appReducer(state, { type: "MOVE_CURSOR", delta: 1 });
      expect(next.cursor).toBe(1);
    });

    test("moves cursor up", () => {
      const files = [createFile("a"), createFile("b"), createFile("c")];
      const state = createState({ files, cursor: 2 });
      const next = appReducer(state, { type: "MOVE_CURSOR", delta: -1 });
      expect(next.cursor).toBe(1);
    });

    test("clamps at top", () => {
      const files = [createFile("a"), createFile("b")];
      const state = createState({ files, cursor: 0 });
      const next = appReducer(state, { type: "MOVE_CURSOR", delta: -5 });
      expect(next.cursor).toBe(0);
    });

    test("clamps at bottom", () => {
      const files = [createFile("a"), createFile("b")];
      const state = createState({ files, cursor: 1 });
      const next = appReducer(state, { type: "MOVE_CURSOR", delta: 10 });
      expect(next.cursor).toBe(1);
    });
  });

  describe("SET_CURSOR", () => {
    test("sets cursor directly", () => {
      const files = [createFile("a"), createFile("b"), createFile("c")];
      const state = createState({ files, cursor: 0 });
      const next = appReducer(state, { type: "SET_CURSOR", index: 2 });
      expect(next.cursor).toBe(2);
    });

    test("clamps out of range", () => {
      const files = [createFile("a"), createFile("b")];
      const state = createState({ files });
      const next = appReducer(state, { type: "SET_CURSOR", index: 100 });
      expect(next.cursor).toBe(1);
    });
  });

  describe("SET_MODE", () => {
    test("changes mode", () => {
      const state = createState();
      const next = appReducer(state, { type: "SET_MODE", mode: "visual" });
      expect(next.mode).toBe("visual");
    });

    test("clears commandInput when entering command mode", () => {
      const state = createState({ commandInput: "old" });
      const next = appReducer(state, { type: "SET_MODE", mode: "command" });
      expect(next.commandInput).toBe("");
    });

    test("clears commandInput when entering search mode", () => {
      const state = createState({ commandInput: "old" });
      const next = appReducer(state, { type: "SET_MODE", mode: "search" });
      expect(next.commandInput).toBe("");
    });

    test("preserves commandInput for other modes", () => {
      const state = createState({ commandInput: "old" });
      const next = appReducer(state, { type: "SET_MODE", mode: "normal" });
      expect(next.commandInput).toBe("old");
    });
  });

  describe("TOGGLE_SELECTION", () => {
    test("adds index to selection", () => {
      const state = createState();
      const next = appReducer(state, { type: "TOGGLE_SELECTION", index: 2 });
      expect(next.selectedIndices.has(2)).toBe(true);
    });

    test("removes index from selection", () => {
      const state = createState({ selectedIndices: new Set([2, 3]) });
      const next = appReducer(state, { type: "TOGGLE_SELECTION", index: 2 });
      expect(next.selectedIndices.has(2)).toBe(false);
      expect(next.selectedIndices.has(3)).toBe(true);
    });
  });

  describe("SELECT_RANGE", () => {
    test("selects range forward", () => {
      const state = createState();
      const next = appReducer(state, { type: "SELECT_RANGE", from: 1, to: 4 });
      expect([...next.selectedIndices]).toEqual([1, 2, 3, 4]);
    });

    test("selects range backward", () => {
      const state = createState();
      const next = appReducer(state, { type: "SELECT_RANGE", from: 4, to: 1 });
      expect([...next.selectedIndices].sort()).toEqual([1, 2, 3, 4]);
    });

    test("adds to existing selection", () => {
      const state = createState({ selectedIndices: new Set([0]) });
      const next = appReducer(state, { type: "SELECT_RANGE", from: 2, to: 3 });
      expect(next.selectedIndices.has(0)).toBe(true);
      expect(next.selectedIndices.has(2)).toBe(true);
      expect(next.selectedIndices.has(3)).toBe(true);
    });
  });

  describe("CLEAR_SELECTION", () => {
    test("clears all selections", () => {
      const state = createState({ selectedIndices: new Set([1, 2, 3]) });
      const next = appReducer(state, { type: "CLEAR_SELECTION" });
      expect(next.selectedIndices.size).toBe(0);
    });
  });

  describe("SET_CLIPBOARD", () => {
    test("sets clipboard", () => {
      const files = [createFile("a.txt")];
      const state = createState();
      const next = appReducer(state, {
        type: "SET_CLIPBOARD",
        clipboard: { operation: "copy", files },
      });
      expect(next.clipboard?.operation).toBe("copy");
      expect(next.clipboard?.files).toEqual(files);
    });
  });

  describe("SET_PROMPT", () => {
    test("sets prompt and switches to prompt mode", () => {
      const state = createState();
      const prompt = { title: "Test", value: "", onSubmit: () => {} };
      const next = appReducer(state, { type: "SET_PROMPT", prompt });
      expect(next.prompt).toBe(prompt);
      expect(next.mode).toBe("prompt");
    });

    test("clears prompt and returns to normal mode", () => {
      const state = createState({ mode: "prompt" });
      const next = appReducer(state, { type: "SET_PROMPT", prompt: null });
      expect(next.prompt).toBeNull();
      expect(next.mode).toBe("normal");
    });
  });

  describe("TOGGLE_HIDDEN", () => {
    test("toggles showHidden", () => {
      const state = createState({ showHidden: false });
      const next = appReducer(state, { type: "TOGGLE_HIDDEN" });
      expect(next.showHidden).toBe(true);
      const next2 = appReducer(next, { type: "TOGGLE_HIDDEN" });
      expect(next2.showHidden).toBe(false);
    });
  });
});
