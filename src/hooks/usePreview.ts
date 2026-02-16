import { useEffect, useRef } from "react";
import { useAppState, useAppDispatch } from "../state/context.tsx";
import { loadPreview } from "../fs/preview.ts";

export function usePreview() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    const entry = state.files[state.cursor];
    if (!entry) {
      dispatch({ type: "SET_PREVIEW", preview: { type: "none", content: "" } });
      return;
    }

    // Don't reload if same file
    if (entry.path === lastPathRef.current) return;
    lastPathRef.current = entry.path;

    // Debounce preview loading
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const preview = await loadPreview(entry);
      dispatch({ type: "SET_PREVIEW", preview });
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.files, state.cursor, dispatch]);
}
