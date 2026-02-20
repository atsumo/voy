import {
  createRegistry,
  register,
  type KeyBindingRegistry,
  type KeyActionContext,
} from "./registry.ts";
import { join, basename } from "node:path";
import {
  copyFiles,
  moveFiles,
  deleteFiles,
  renameFile,
  createDirectory,
  createFile,
} from "../fs/operations.ts";

function enterOrPreview(ctx: KeyActionContext) {
  const file = ctx.state.files[ctx.state.cursor];
  if (!file) return;
  if (file.isDirectory) {
    ctx.enterDirectory();
  } else if (ctx.state.preview.type === "text") {
    ctx.dispatch({ type: "SET_MODE", mode: "preview" });
  }
}

export function createDefaultBindings(): KeyBindingRegistry {
  const registry = createRegistry();

  // ── Normal mode ────────────────────────────────

  // Movement
  register(registry, "normal", {
    keys: ["j"],
    description: "Move cursor down",
    handler: ({ dispatch, count }) =>
      dispatch({ type: "MOVE_CURSOR", delta: count || 1 }),
  });

  register(registry, "normal", {
    keys: ["k"],
    description: "Move cursor up",
    handler: ({ dispatch, count }) =>
      dispatch({ type: "MOVE_CURSOR", delta: -(count || 1) }),
  });

  register(registry, "normal", {
    keys: ["down"],
    description: "Move cursor down",
    handler: ({ dispatch, count }) =>
      dispatch({ type: "MOVE_CURSOR", delta: count || 1 }),
  });

  register(registry, "normal", {
    keys: ["up"],
    description: "Move cursor up",
    handler: ({ dispatch, count }) =>
      dispatch({ type: "MOVE_CURSOR", delta: -(count || 1) }),
  });

  // Directory navigation
  register(registry, "normal", {
    keys: ["l"],
    description: "Enter directory / open preview",
    handler: enterOrPreview,
  });

  register(registry, "normal", {
    keys: ["return"],
    description: "Enter directory / open preview",
    handler: enterOrPreview,
  });

  register(registry, "normal", {
    keys: ["right"],
    description: "Enter directory / open preview",
    handler: enterOrPreview,
  });

  register(registry, "normal", {
    keys: ["h"],
    description: "Go to parent directory",
    handler: ({ parentDirectory }) => parentDirectory(),
  });

  register(registry, "normal", {
    keys: ["left"],
    description: "Go to parent directory",
    handler: ({ parentDirectory }) => parentDirectory(),
  });

  // Jump to top/bottom
  register(registry, "normal", {
    keys: ["g", "g"],
    description: "Go to first file",
    handler: ({ dispatch }) => dispatch({ type: "SET_CURSOR", index: 0 }),
  });

  register(registry, "normal", {
    keys: ["G"],
    description: "Go to last file",
    handler: ({ dispatch, state }) =>
      dispatch({ type: "SET_CURSOR", index: state.files.length - 1 }),
  });

  // Half-page movement
  register(registry, "normal", {
    keys: ["C-d"],
    description: "Half page down",
    handler: ({ dispatch }) =>
      dispatch({ type: "MOVE_CURSOR", delta: 15 }),
  });

  register(registry, "normal", {
    keys: ["C-u"],
    description: "Half page up",
    handler: ({ dispatch }) =>
      dispatch({ type: "MOVE_CURSOR", delta: -15 }),
  });

  // Selection
  register(registry, "normal", {
    keys: [" "],
    description: "Toggle selection",
    handler: ({ state, dispatch }) => {
      dispatch({ type: "TOGGLE_SELECTION", index: state.cursor });
      dispatch({ type: "MOVE_CURSOR", delta: 1 });
    },
  });

  register(registry, "normal", {
    keys: ["v"],
    description: "Enter visual mode",
    handler: ({ state, dispatch }) => {
      dispatch({ type: "SET_MODE", mode: "visual" });
      dispatch({ type: "SET_VISUAL_ANCHOR", index: state.cursor });
    },
  });

  register(registry, "normal", {
    keys: ["V"],
    description: "Select all / deselect all",
    handler: ({ state, dispatch }) => {
      if (state.selectedIndices.size > 0) {
        dispatch({ type: "CLEAR_SELECTION" });
      } else {
        dispatch({ type: "SELECT_RANGE", from: 0, to: state.files.length - 1 });
      }
    },
  });

  // Clipboard operations
  register(registry, "normal", {
    keys: ["y", "y"],
    description: "Copy (yank) selected files",
    handler: ({ state, dispatch }) => {
      const indices =
        state.selectedIndices.size > 0
          ? [...state.selectedIndices]
          : [state.cursor];
      const files = indices.map((i) => state.files[i]!).filter(Boolean);
      dispatch({ type: "SET_CLIPBOARD", clipboard: { operation: "copy", files } });
      dispatch({ type: "CLEAR_SELECTION" });
    },
  });

  register(registry, "normal", {
    keys: ["d", "d"],
    description: "Delete selected files",
    handler: ({ state, dispatch, refresh }) => {
      const indices =
        state.selectedIndices.size > 0
          ? [...state.selectedIndices]
          : [state.cursor];
      const files = indices.map((i) => state.files[i]!).filter(Boolean);
      dispatch({
        type: "SET_PROMPT",
        prompt: {
          title: `Delete ${files.length} file(s)? (y/n)`,
          value: "",
          onSubmit: async (value: string) => {
            if (value === "y" || value === "Y") {
              try {
                await deleteFiles(files);
                refresh();
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }
            dispatch({ type: "SET_PROMPT", prompt: null });
          },
        },
      });
    },
  });

  register(registry, "normal", {
    keys: ["p", "p"],
    description: "Paste files",
    handler: async ({ state, dispatch, refresh }) => {
      if (!state.clipboard) return;
      try {
        if (state.clipboard.operation === "copy") {
          await copyFiles(state.clipboard.files, state.currentPath);
        } else {
          await moveFiles(state.clipboard.files, state.currentPath);
          dispatch({ type: "CLEAR_CLIPBOARD" });
        }
        refresh();
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `Paste failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  // Enter preview mode (Shift+P — avoids conflict with pp paste)
  register(registry, "normal", {
    keys: ["P"],
    description: "Enter preview mode",
    handler: ({ state, dispatch }) => {
      if (state.preview.type === "text") {
        dispatch({ type: "SET_MODE", mode: "preview" });
      }
    },
  });

  // Open in editor
  register(registry, "normal", {
    keys: ["e"],
    description: "Open in editor",
    handler: ({ state, openEditor }) => {
      const file = state.files[state.cursor];
      if (file && !file.isDirectory) {
        openEditor(file.path);
      }
    },
  });

  // Rename
  register(registry, "normal", {
    keys: ["r"],
    description: "Rename file",
    handler: ({ state, dispatch, refresh }) => {
      const file = state.files[state.cursor];
      if (!file) return;
      dispatch({
        type: "SET_PROMPT",
        prompt: {
          title: "Rename:",
          value: file.name,
          onSubmit: async (value: string) => {
            if (value && value !== file.name) {
              try {
                await renameFile(file.path, value);
                refresh();
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: `Rename failed: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }
            dispatch({ type: "SET_PROMPT", prompt: null });
          },
        },
      });
    },
  });

  // Toggle hidden files
  register(registry, "normal", {
    keys: ["."],
    description: "Toggle hidden files",
    handler: ({ dispatch, refresh }) => {
      dispatch({ type: "TOGGLE_HIDDEN" });
      // refresh will be called via effect when showHidden changes
      refresh();
    },
  });

  // Mode switching
  register(registry, "normal", {
    keys: [":"],
    description: "Enter command mode",
    handler: ({ dispatch }) => dispatch({ type: "SET_MODE", mode: "command" }),
  });

  register(registry, "normal", {
    keys: ["/"],
    description: "Enter search mode",
    handler: ({ dispatch }) => dispatch({ type: "SET_MODE", mode: "search" }),
  });

  // Search navigation
  register(registry, "normal", {
    keys: ["n"],
    description: "Next search match",
    handler: ({ state, dispatch }) => {
      if (!state.search || state.search.matches.length === 0) return;
      const next =
        (state.search.currentMatch + 1) % state.search.matches.length;
      dispatch({
        type: "SET_SEARCH",
        search: { ...state.search, currentMatch: next },
      });
      const matchIndex = state.search.matches[next];
      if (matchIndex !== undefined) {
        dispatch({ type: "SET_CURSOR", index: matchIndex });
      }
    },
  });

  register(registry, "normal", {
    keys: ["N"],
    description: "Previous search match",
    handler: ({ state, dispatch }) => {
      if (!state.search || state.search.matches.length === 0) return;
      const prev =
        (state.search.currentMatch - 1 + state.search.matches.length) %
        state.search.matches.length;
      dispatch({
        type: "SET_SEARCH",
        search: { ...state.search, currentMatch: prev },
      });
      const matchIndex = state.search.matches[prev];
      if (matchIndex !== undefined) {
        dispatch({ type: "SET_CURSOR", index: matchIndex });
      }
    },
  });

  // Quit
  register(registry, "normal", {
    keys: ["q"],
    description: "Quit",
    handler: ({ exit }) => exit(),
  });

  // ── Visual mode ────────────────────────────────

  register(registry, "visual", {
    keys: ["j"],
    description: "Extend selection down",
    handler: ({ state, dispatch }) => {
      dispatch({ type: "MOVE_CURSOR", delta: 1 });
      const newCursor = Math.min(state.cursor + 1, state.files.length - 1);
      dispatch({
        type: "SELECT_RANGE",
        from: state.visualAnchor,
        to: newCursor,
      });
    },
  });

  register(registry, "visual", {
    keys: ["k"],
    description: "Extend selection up",
    handler: ({ state, dispatch }) => {
      dispatch({ type: "MOVE_CURSOR", delta: -1 });
      const newCursor = Math.max(state.cursor - 1, 0);
      dispatch({
        type: "SELECT_RANGE",
        from: state.visualAnchor,
        to: newCursor,
      });
    },
  });

  register(registry, "visual", {
    keys: ["escape"],
    description: "Exit visual mode",
    handler: ({ dispatch }) => {
      dispatch({ type: "CLEAR_SELECTION" });
      dispatch({ type: "SET_MODE", mode: "normal" });
    },
  });

  register(registry, "visual", {
    keys: ["v"],
    description: "Confirm selection and exit visual mode",
    handler: ({ dispatch }) => {
      dispatch({ type: "SET_MODE", mode: "normal" });
    },
  });

  // ── Preview mode ────────────────────────────────

  register(registry, "preview", {
    keys: ["j"],
    description: "Move cursor down",
    handler: ({ dispatch, count, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: count || 1, height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["down"],
    description: "Move cursor down",
    handler: ({ dispatch, count, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: count || 1, height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["k"],
    description: "Move cursor up",
    handler: ({ dispatch, count, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: -(count || 1), height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["up"],
    description: "Move cursor up",
    handler: ({ dispatch, count, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: -(count || 1), height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["C-d"],
    description: "Half page down",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: Math.floor(previewHeight / 2), height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["C-u"],
    description: "Half page up",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: -Math.floor(previewHeight / 2), height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["g", "g"],
    description: "Go to first line",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "SET_PREVIEW_CURSOR", index: 0, height: previewHeight }),
  });

  register(registry, "preview", {
    keys: ["G"],
    description: "Go to last line",
    handler: ({ state, dispatch, previewHeight }) => {
      const totalLines = state.preview.content.split("\n").length;
      dispatch({ type: "SET_PREVIEW_CURSOR", index: totalLines - 1, height: previewHeight });
    },
  });

  register(registry, "preview", {
    keys: [" "],
    description: "Toggle line selection",
    handler: ({ state, dispatch, previewHeight }) => {
      dispatch({ type: "TOGGLE_PREVIEW_LINE_SELECTION", line: state.previewCursor });
      dispatch({ type: "MOVE_PREVIEW_CURSOR", delta: 1, height: previewHeight });
    },
  });

  register(registry, "preview", {
    keys: ["v"],
    description: "Visual line selection toggle",
    handler: ({ state, dispatch }) => {
      dispatch({ type: "TOGGLE_PREVIEW_LINE_SELECTION", line: state.previewCursor });
    },
  });

  register(registry, "preview", {
    keys: ["V"],
    description: "Select all / deselect all lines",
    handler: ({ state, dispatch }) => {
      if (state.previewSelectedLines.size > 0) {
        dispatch({ type: "CLEAR_PREVIEW_SELECTION" });
      } else {
        const totalLines = state.preview.content.split("\n").length;
        dispatch({ type: "SELECT_PREVIEW_LINE_RANGE", from: 0, to: totalLines - 1 });
      }
    },
  });

  register(registry, "preview", {
    keys: ["y"],
    description: "Copy selected lines to clipboard",
    handler: ({ state, dispatch }) => {
      const lines = state.preview.content.split("\n");
      const selectedLines = [...state.previewSelectedLines].sort((a, b) => a - b);
      const text =
        selectedLines.length > 0
          ? selectedLines.map((i) => lines[i] ?? "").join("\n")
          : lines[state.previewCursor] ?? "";
      try {
        Bun.spawnSync(["pbcopy"], {
          stdin: new TextEncoder().encode(text),
        });
        const count = selectedLines.length || 1;
        dispatch({
          type: "SET_ERROR",
          error: `${count} line(s) copied`,
        });
        dispatch({ type: "CLEAR_PREVIEW_SELECTION" });
      } catch {
        dispatch({ type: "SET_ERROR", error: "Copy failed" });
      }
    },
  });

  register(registry, "preview", {
    keys: ["e"],
    description: "Open in editor",
    handler: ({ state, openEditor }) => {
      const file = state.files[state.cursor];
      if (file && !file.isDirectory) {
        openEditor(file.path, state.previewCursor + 1);
      }
    },
  });

  register(registry, "preview", {
    keys: ["q"],
    description: "Exit preview mode",
    handler: ({ dispatch }) =>
      dispatch({ type: "SET_MODE", mode: "normal" }),
  });

  register(registry, "preview", {
    keys: ["escape"],
    description: "Exit preview mode",
    handler: ({ dispatch }) =>
      dispatch({ type: "SET_MODE", mode: "normal" }),
  });

  return registry;
}
