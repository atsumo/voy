import type { AppState, AppAction } from "./types.ts";

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PATH":
      return {
        ...state,
        currentPath: action.path,
        cursor: 0,
        selectedIndices: new Set(),
        search: null,
        error: null,
      };

    case "SET_FILES":
      return {
        ...state,
        files: action.files,
        cursor: Math.min(state.cursor, Math.max(0, action.files.length - 1)),
      };

    case "SET_PARENT_FILES":
      return { ...state, parentFiles: action.files };

    case "SET_PARENT_PATH":
      return { ...state, parentPath: action.path };

    case "MOVE_CURSOR": {
      const newCursor = Math.max(
        0,
        Math.min(state.files.length - 1, state.cursor + action.delta),
      );
      return { ...state, cursor: newCursor };
    }

    case "SET_CURSOR": {
      const newCursor = Math.max(
        0,
        Math.min(state.files.length - 1, action.index),
      );
      return { ...state, cursor: newCursor };
    }

    case "SET_PARENT_CURSOR":
      return { ...state, parentCursor: action.index };

    case "SET_MODE": {
      const resetPreview =
        state.mode === "preview" && action.mode !== "preview";
      return {
        ...state,
        mode: action.mode,
        commandInput:
          action.mode === "command" || action.mode === "search"
            ? ""
            : state.commandInput,
        ...(resetPreview
          ? { previewScroll: 0, previewSelectedLines: new Set<number>() }
          : {}),
      };
    }

    case "TOGGLE_SELECTION": {
      const newSelected = new Set(state.selectedIndices);
      if (newSelected.has(action.index)) {
        newSelected.delete(action.index);
      } else {
        newSelected.add(action.index);
      }
      return { ...state, selectedIndices: newSelected };
    }

    case "SELECT_RANGE": {
      const newSelected = new Set(state.selectedIndices);
      const start = Math.min(action.from, action.to);
      const end = Math.max(action.from, action.to);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
      return { ...state, selectedIndices: newSelected };
    }

    case "CLEAR_SELECTION":
      return { ...state, selectedIndices: new Set() };

    case "SET_CLIPBOARD":
      return { ...state, clipboard: action.clipboard };

    case "CLEAR_CLIPBOARD":
      return { ...state, clipboard: null };

    case "SET_PREVIEW":
      return { ...state, preview: action.preview };

    case "SET_COMMAND_INPUT":
      return { ...state, commandInput: action.input };

    case "SET_SEARCH":
      return { ...state, search: action.search };

    case "SET_PROMPT":
      return {
        ...state,
        prompt: action.prompt,
        mode: action.prompt ? "prompt" : "normal",
      };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "TOGGLE_HIDDEN":
      return { ...state, showHidden: !state.showHidden };

    case "SET_VISUAL_ANCHOR":
      return { ...state, visualAnchor: action.index };

    case "MOVE_PREVIEW_SCROLL": {
      const totalLines = state.preview.content.split("\n").length;
      const newScroll = Math.max(
        0,
        Math.min(totalLines - 1, state.previewScroll + action.delta),
      );
      return { ...state, previewScroll: newScroll };
    }

    case "SET_PREVIEW_SCROLL": {
      const totalLines = state.preview.content.split("\n").length;
      const newScroll = Math.max(
        0,
        Math.min(totalLines - 1, action.index),
      );
      return { ...state, previewScroll: newScroll };
    }

    case "TOGGLE_PREVIEW_LINE_SELECTION": {
      const newSelected = new Set(state.previewSelectedLines);
      if (newSelected.has(action.line)) {
        newSelected.delete(action.line);
      } else {
        newSelected.add(action.line);
      }
      return { ...state, previewSelectedLines: newSelected };
    }

    case "SELECT_PREVIEW_LINE_RANGE": {
      const newSelected = new Set(state.previewSelectedLines);
      const start = Math.min(action.from, action.to);
      const end = Math.max(action.from, action.to);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
      return { ...state, previewSelectedLines: newSelected };
    }

    case "CLEAR_PREVIEW_SELECTION":
      return { ...state, previewSelectedLines: new Set() };

    default:
      return state;
  }
}
