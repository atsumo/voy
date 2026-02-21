import {
  createRegistry,
  register,
  type KeyBindingRegistry,
  type KeyActionContext,
} from "./registry.ts";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import {
  copyFiles,
  moveFiles,
  deleteFiles,
  renameFile,
  createDirectory,
  createFile,
} from "../fs/operations.ts";
import type { AppState } from "../state/types.ts";
import { gitAdd, gitCommit, gitPush, gitDiff, gitLog } from "../git/operations.ts";
import { getIssueList, getPRList, openInBrowser } from "../git/github.ts";

function calcViewport(state: AppState, contentHeight: number) {
  const visibleCount = Math.max(1, contentHeight);
  let startIndex: number;
  if (state.files.length <= visibleCount) {
    startIndex = 0;
  } else {
    const half = Math.floor(visibleCount / 2);
    startIndex = Math.max(0, state.cursor - half);
    startIndex = Math.min(startIndex, state.files.length - visibleCount);
  }
  return { startIndex, visibleCount };
}

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
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_CURSOR", delta: Math.floor(previewHeight / 2) }),
  });

  register(registry, "normal", {
    keys: ["C-u"],
    description: "Half page up",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_CURSOR", delta: -Math.floor(previewHeight / 2) }),
  });

  // Screen-relative movement
  register(registry, "normal", {
    keys: ["H"],
    description: "Jump to top of screen",
    handler: ({ state, dispatch, previewHeight }) => {
      const { startIndex } = calcViewport(state, previewHeight);
      dispatch({ type: "SET_CURSOR", index: startIndex });
    },
  });

  register(registry, "normal", {
    keys: ["M"],
    description: "Jump to middle of screen",
    handler: ({ state, dispatch, previewHeight }) => {
      const { startIndex, visibleCount } = calcViewport(state, previewHeight);
      const middleIndex = startIndex + Math.floor(visibleCount / 2);
      dispatch({ type: "SET_CURSOR", index: middleIndex });
    },
  });

  register(registry, "normal", {
    keys: ["L"],
    description: "Jump to bottom of screen",
    handler: ({ state, dispatch, previewHeight }) => {
      const { startIndex, visibleCount } = calcViewport(state, previewHeight);
      dispatch({ type: "SET_CURSOR", index: startIndex + visibleCount - 1 });
    },
  });

  // Full-page movement
  register(registry, "normal", {
    keys: ["C-f"],
    description: "Full page down",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_CURSOR", delta: previewHeight }),
  });

  register(registry, "normal", {
    keys: ["C-b"],
    description: "Full page up",
    handler: ({ dispatch, previewHeight }) =>
      dispatch({ type: "MOVE_CURSOR", delta: -previewHeight }),
  });

  // Home directory
  register(registry, "normal", {
    keys: ["~"],
    description: "Go to home directory",
    handler: ({ navigate }) => navigate(homedir()),
  });

  // Parent directory alias
  register(registry, "normal", {
    keys: ["-"],
    description: "Go to parent directory",
    handler: ({ parentDirectory }) => parentDirectory(),
  });

  // Back to previous directory
  register(registry, "normal", {
    keys: ["C-o"],
    description: "Go back to previous directory",
    handler: ({ state, dispatch }) => {
      if (state.pathHistory.length === 0) return;
      dispatch({ type: "POP_PATH_HISTORY" });
    },
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

  // Cut (for move via pp)
  register(registry, "normal", {
    keys: ["x"],
    description: "Cut (mark for move)",
    handler: ({ state, dispatch }) => {
      const indices =
        state.selectedIndices.size > 0
          ? [...state.selectedIndices]
          : [state.cursor];
      const files = indices.map((i) => state.files[i]!).filter(Boolean);
      dispatch({ type: "SET_CLIPBOARD", clipboard: { operation: "cut", files } });
      dispatch({ type: "CLEAR_SELECTION" });
    },
  });

  // New file
  register(registry, "normal", {
    keys: ["o"],
    description: "Create new file",
    handler: ({ state, dispatch, refresh }) => {
      dispatch({
        type: "SET_PROMPT",
        prompt: {
          title: "New file:",
          value: "",
          onSubmit: async (value: string) => {
            if (value) {
              try {
                await createFile(join(state.currentPath, value));
                refresh();
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: `Create file failed: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }
            dispatch({ type: "SET_PROMPT", prompt: null });
          },
        },
      });
    },
  });

  // New directory
  register(registry, "normal", {
    keys: ["O"],
    description: "Create new directory",
    handler: ({ state, dispatch, refresh }) => {
      dispatch({
        type: "SET_PROMPT",
        prompt: {
          title: "New directory:",
          value: "",
          onSubmit: async (value: string) => {
            if (value) {
              try {
                await createDirectory(join(state.currentPath, value));
                refresh();
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: `Create directory failed: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }
            dispatch({ type: "SET_PROMPT", prompt: null });
          },
        },
      });
    },
  });

  // Delete (single key shortcut for dd)
  register(registry, "normal", {
    keys: ["D"],
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

  // Open with system default
  register(registry, "normal", {
    keys: ["W"],
    description: "Open with system default",
    handler: ({ state }) => {
      const file = state.files[state.cursor];
      if (file) {
        Bun.spawnSync(["open", file.path]);
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

  // ── Git operations ────────────────────────────────

  register(registry, "normal", {
    keys: ["g", "a"],
    description: "Git add (stage) file",
    handler: async ({ state, dispatch, refresh }) => {
      if (!state.git.isRepo) return;
      const indices =
        state.selectedIndices.size > 0
          ? [...state.selectedIndices]
          : [state.cursor];
      const files = indices.map((i) => state.files[i]!).filter(Boolean);
      try {
        await gitAdd(files.map((f) => f.path), state.currentPath);
        dispatch({ type: "CLEAR_SELECTION" });
        refresh();
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `git add failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  register(registry, "normal", {
    keys: ["g", "c"],
    description: "Git commit",
    handler: ({ state, dispatch, refresh }) => {
      if (!state.git.isRepo) return;
      dispatch({
        type: "SET_PROMPT",
        prompt: {
          title: "Commit message:",
          value: "",
          onSubmit: async (value: string) => {
            if (value.trim()) {
              try {
                await gitCommit(value, state.currentPath);
                refresh();
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: `git commit failed: ${err instanceof Error ? err.message : String(err)}`,
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
    keys: ["g", "p"],
    description: "Git push",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      try {
        const result = await gitPush(state.currentPath);
        dispatch({ type: "SET_ERROR", error: `Push: ${result || "done"}` });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `git push failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  register(registry, "normal", {
    keys: ["g", "d"],
    description: "Show git diff in preview",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      const file = state.files[state.cursor];
      if (!file) return;
      try {
        const diff = await gitDiff(file.path, state.currentPath);
        dispatch({
          type: "SET_PREVIEW",
          preview: { type: "diff", content: diff },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `git diff failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  register(registry, "normal", {
    keys: ["g", "l"],
    description: "Show git log in preview",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      try {
        const log = await gitLog(state.currentPath);
        dispatch({
          type: "SET_PREVIEW",
          preview: { type: "gitlog", content: log },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `git log failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  // ── GitHub CLI operations ────────────────────────────────

  register(registry, "normal", {
    keys: ["g", "i"],
    description: "Show GitHub issues in preview",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      try {
        const issues = await getIssueList(state.currentPath);
        dispatch({
          type: "SET_PREVIEW",
          preview: { type: "github-issues", content: issues },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  register(registry, "normal", {
    keys: ["g", "P"],
    description: "Show GitHub PRs in preview",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      try {
        const prs = await getPRList(state.currentPath);
        dispatch({
          type: "SET_PREVIEW",
          preview: { type: "github-prs", content: prs },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  register(registry, "normal", {
    keys: ["g", "o"],
    description: "Open in browser (gh browse)",
    handler: async ({ state, dispatch }) => {
      if (!state.git.isRepo) return;
      try {
        await openInBrowser(state.currentPath);
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: `${err instanceof Error ? err.message : String(err)}`,
        });
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
    description: "Toggle visual line selection",
    handler: ({ state, dispatch }) => {
      if (state.previewVisualAnchor !== null) {
        // Exit visual: keep selection, clear anchor
        dispatch({ type: "SET_PREVIEW_VISUAL_ANCHOR", anchor: null });
      } else {
        // Enter visual: set anchor, select current line
        dispatch({ type: "CLEAR_PREVIEW_SELECTION" });
        dispatch({ type: "SET_PREVIEW_VISUAL_ANCHOR", anchor: state.previewCursor });
        dispatch({ type: "TOGGLE_PREVIEW_LINE_SELECTION", line: state.previewCursor });
      }
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
        dispatch({ type: "SET_PREVIEW_VISUAL_ANCHOR", anchor: null });
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
    description: "Exit visual selection / Exit preview mode",
    handler: ({ state, dispatch }) => {
      if (state.previewVisualAnchor !== null) {
        dispatch({ type: "SET_PREVIEW_VISUAL_ANCHOR", anchor: null });
        dispatch({ type: "CLEAR_PREVIEW_SELECTION" });
      } else {
        dispatch({ type: "SET_MODE", mode: "normal" });
      }
    },
  });

  return registry;
}
