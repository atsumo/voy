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
    previewScroll: 0,
    previewCursor: 0,
    previewSelectedLines: new Set(),
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

  describe("MOVE_PREVIEW_CURSOR", () => {
    test("moves cursor down", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2\nline3\nline4\nline5" },
        previewCursor: 0,
      });
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: 2, height: 10 });
      expect(next.previewCursor).toBe(2);
    });

    test("moves cursor up", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2\nline3" },
        previewCursor: 2,
      });
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: -1, height: 10 });
      expect(next.previewCursor).toBe(1);
    });

    test("clamps at top", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2" },
        previewCursor: 0,
      });
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: -10, height: 10 });
      expect(next.previewCursor).toBe(0);
    });

    test("clamps at bottom", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2\nline3" },
        previewCursor: 1,
      });
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: 100, height: 10 });
      expect(next.previewCursor).toBe(2); // 3 lines, max index = 2
    });

    test("scrolls down when cursor goes below viewport", () => {
      const state = createState({
        preview: { type: "text", content: "0\n1\n2\n3\n4\n5\n6\n7\n8\n9" },
        previewCursor: 2,
        previewScroll: 0,
      });
      // viewport height=3, so visible lines are 0,1,2. Move cursor to 3 → scroll follows
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: 1, height: 3 });
      expect(next.previewCursor).toBe(3);
      expect(next.previewScroll).toBe(1); // 3 - 3 + 1 = 1
    });

    test("scrolls up when cursor goes above viewport", () => {
      const state = createState({
        preview: { type: "text", content: "0\n1\n2\n3\n4\n5\n6\n7\n8\n9" },
        previewCursor: 5,
        previewScroll: 5,
      });
      // cursor at 5, scroll at 5, move up by 1 → cursor=4, which is above scroll
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: -1, height: 3 });
      expect(next.previewCursor).toBe(4);
      expect(next.previewScroll).toBe(4);
    });

    test("does not scroll when cursor stays within viewport", () => {
      const state = createState({
        preview: { type: "text", content: "0\n1\n2\n3\n4\n5\n6\n7\n8\n9" },
        previewCursor: 3,
        previewScroll: 2,
      });
      // viewport: lines 2,3,4 (scroll=2, height=3). Cursor at 3, move to 4 → still in viewport
      const next = appReducer(state, { type: "MOVE_PREVIEW_CURSOR", delta: 1, height: 3 });
      expect(next.previewCursor).toBe(4);
      expect(next.previewScroll).toBe(2); // unchanged
    });
  });

  describe("SET_PREVIEW_CURSOR", () => {
    test("sets cursor position", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2\nline3\nline4" },
        previewCursor: 0,
      });
      const next = appReducer(state, { type: "SET_PREVIEW_CURSOR", index: 3, height: 10 });
      expect(next.previewCursor).toBe(3);
    });

    test("clamps out of range", () => {
      const state = createState({
        preview: { type: "text", content: "line1\nline2" },
        previewCursor: 0,
      });
      const next = appReducer(state, { type: "SET_PREVIEW_CURSOR", index: 100, height: 10 });
      expect(next.previewCursor).toBe(1);
    });

    test("scrolls to follow cursor when jumping to end", () => {
      const state = createState({
        preview: { type: "text", content: "0\n1\n2\n3\n4\n5\n6\n7\n8\n9" },
        previewCursor: 0,
        previewScroll: 0,
      });
      const next = appReducer(state, { type: "SET_PREVIEW_CURSOR", index: 9, height: 3 });
      expect(next.previewCursor).toBe(9);
      expect(next.previewScroll).toBe(7); // 9 - 3 + 1 = 7
    });

    test("scrolls to follow cursor when jumping to beginning", () => {
      const state = createState({
        preview: { type: "text", content: "0\n1\n2\n3\n4\n5\n6\n7\n8\n9" },
        previewCursor: 9,
        previewScroll: 7,
      });
      const next = appReducer(state, { type: "SET_PREVIEW_CURSOR", index: 0, height: 3 });
      expect(next.previewCursor).toBe(0);
      expect(next.previewScroll).toBe(0);
    });
  });

  describe("TOGGLE_PREVIEW_LINE_SELECTION", () => {
    test("adds line to selection", () => {
      const state = createState();
      const next = appReducer(state, { type: "TOGGLE_PREVIEW_LINE_SELECTION", line: 5 });
      expect(next.previewSelectedLines.has(5)).toBe(true);
    });

    test("removes line from selection", () => {
      const state = createState({ previewSelectedLines: new Set([5, 6]) });
      const next = appReducer(state, { type: "TOGGLE_PREVIEW_LINE_SELECTION", line: 5 });
      expect(next.previewSelectedLines.has(5)).toBe(false);
      expect(next.previewSelectedLines.has(6)).toBe(true);
    });
  });

  describe("SELECT_PREVIEW_LINE_RANGE", () => {
    test("selects range", () => {
      const state = createState();
      const next = appReducer(state, { type: "SELECT_PREVIEW_LINE_RANGE", from: 2, to: 5 });
      expect([...next.previewSelectedLines].sort()).toEqual([2, 3, 4, 5]);
    });

    test("selects range backward", () => {
      const state = createState();
      const next = appReducer(state, { type: "SELECT_PREVIEW_LINE_RANGE", from: 5, to: 2 });
      expect([...next.previewSelectedLines].sort()).toEqual([2, 3, 4, 5]);
    });
  });

  describe("CLEAR_PREVIEW_SELECTION", () => {
    test("clears preview selection", () => {
      const state = createState({ previewSelectedLines: new Set([1, 2, 3]) });
      const next = appReducer(state, { type: "CLEAR_PREVIEW_SELECTION" });
      expect(next.previewSelectedLines.size).toBe(0);
    });
  });

  describe("SET_MODE with preview reset", () => {
    test("resets preview state when leaving preview mode", () => {
      const state = createState({
        mode: "preview",
        previewScroll: 10,
        previewCursor: 15,
        previewSelectedLines: new Set([1, 2, 3]),
      });
      const next = appReducer(state, { type: "SET_MODE", mode: "normal" });
      expect(next.mode).toBe("normal");
      expect(next.previewScroll).toBe(0);
      expect(next.previewCursor).toBe(0);
      expect(next.previewSelectedLines.size).toBe(0);
    });

    test("does not reset preview state when staying in preview mode", () => {
      const state = createState({
        mode: "preview",
        previewScroll: 10,
        previewCursor: 15,
        previewSelectedLines: new Set([1, 2, 3]),
      });
      const next = appReducer(state, { type: "SET_MODE", mode: "preview" });
      expect(next.previewScroll).toBe(10);
      expect(next.previewCursor).toBe(15);
      expect(next.previewSelectedLines.size).toBe(3);
    });
  });
});
