export type Mode = "normal" | "command" | "search" | "visual" | "prompt" | "preview";

export type SortField = "name" | "size" | "modified";
export type SortOrder = "asc" | "desc";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  modified: Date;
  permissions: string;
}

export interface ClipboardEntry {
  operation: "copy" | "cut";
  files: FileEntry[];
}

export interface PreviewContent {
  type: "text" | "directory" | "binary" | "none" | "error";
  content: string;
  entries?: FileEntry[];
}

export interface SearchState {
  query: string;
  matches: number[];
  currentMatch: number;
}

export interface PromptState {
  title: string;
  value: string;
  onSubmit: (value: string) => void;
}

export interface AppState {
  currentPath: string;
  parentPath: string;
  files: FileEntry[];
  parentFiles: FileEntry[];
  cursor: number;
  parentCursor: number;
  mode: Mode;
  clipboard: ClipboardEntry | null;
  selectedIndices: Set<number>;
  preview: PreviewContent;
  commandInput: string;
  search: SearchState | null;
  prompt: PromptState | null;
  error: string | null;
  sort: { field: SortField; order: SortOrder };
  showHidden: boolean;
  visualAnchor: number;
  previewScroll: number;
  previewCursor: number;
  previewSelectedLines: Set<number>;
}

export type AppAction =
  | { type: "SET_PATH"; path: string }
  | { type: "SET_FILES"; files: FileEntry[] }
  | { type: "SET_PARENT_FILES"; files: FileEntry[] }
  | { type: "SET_PARENT_PATH"; path: string }
  | { type: "MOVE_CURSOR"; delta: number }
  | { type: "SET_CURSOR"; index: number }
  | { type: "SET_PARENT_CURSOR"; index: number }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "TOGGLE_SELECTION"; index: number }
  | { type: "SELECT_RANGE"; from: number; to: number }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_CLIPBOARD"; clipboard: ClipboardEntry }
  | { type: "CLEAR_CLIPBOARD" }
  | { type: "SET_PREVIEW"; preview: PreviewContent }
  | { type: "SET_COMMAND_INPUT"; input: string }
  | { type: "SET_SEARCH"; search: SearchState | null }
  | { type: "SET_PROMPT"; prompt: PromptState | null }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_HIDDEN" }
  | { type: "SET_VISUAL_ANCHOR"; index: number }
  | { type: "MOVE_PREVIEW_CURSOR"; delta: number; height: number }
  | { type: "SET_PREVIEW_CURSOR"; index: number; height: number }
  | { type: "TOGGLE_PREVIEW_LINE_SELECTION"; line: number }
  | { type: "SELECT_PREVIEW_LINE_RANGE"; from: number; to: number }
  | { type: "CLEAR_PREVIEW_SELECTION" };
