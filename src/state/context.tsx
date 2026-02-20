import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import { appReducer } from "./reducer.ts";
import type { AppState, AppAction } from "./types.ts";

const initialState: AppState = {
  currentPath: process.argv[2] || process.cwd(),
  parentPath: "",
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
  previewVisualAnchor: null,
  previewSelectedLines: new Set(),
  pathHistory: [],
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  return useContext(AppStateContext);
}

export function useAppDispatch(): Dispatch<AppAction> {
  return useContext(AppDispatchContext);
}
