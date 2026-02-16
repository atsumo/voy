import { useCallback } from "react";
import { useAppState, useAppDispatch } from "../state/context.tsx";
import { dirname, join } from "node:path";

export function useNavigation() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const navigate = useCallback(
    (path: string) => {
      dispatch({ type: "SET_PATH", path });
    },
    [dispatch],
  );

  const enterDirectory = useCallback(() => {
    const entry = state.files[state.cursor];
    if (!entry) return;
    if (entry.isDirectory) {
      navigate(entry.path);
    }
    // For non-directory files, we just show preview (already handled)
  }, [state.files, state.cursor, navigate]);

  const parentDirectory = useCallback(() => {
    const parent = dirname(state.currentPath);
    if (parent !== state.currentPath) {
      navigate(parent);
    }
  }, [state.currentPath, navigate]);

  return { navigate, enterDirectory, parentDirectory };
}
