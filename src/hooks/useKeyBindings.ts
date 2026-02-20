import { useCallback, useRef } from "react";
import { useInput, useApp } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { useAppState, useAppDispatch } from "../state/context.tsx";
import { useConfig } from "../config/config.ts";
import { parseInput, keyToString, createKeyBuffer, type KeyBuffer } from "../keybindings/parser.ts";
import { findMatch, findExactMatch, type KeyActionContext } from "../keybindings/registry.ts";
import { createDefaultBindings } from "../keybindings/definitions.ts";
import { openInEditor, createDirectory, createFile } from "../fs/operations.ts";
import { resolve, join } from "node:path";
import type { Key } from "ink";

const TIMEOUT_MS = 1000;

interface UseKeyBindingsOptions {
  navigate: (path: string) => void;
  enterDirectory: () => void;
  parentDirectory: () => void;
  refresh: () => void;
}

export function useKeyBindings(options: UseKeyBindingsOptions) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const config = useConfig();
  const { exit } = useApp();
  const { height: screenHeight } = useScreenSize();
  const previewHeight = Math.max(1, screenHeight - 3);
  const registryRef = useRef(createDefaultBindings());
  const bufferRef = useRef<KeyBuffer>(createKeyBuffer());
  const stateRef = useRef(state);
  stateRef.current = state;
  const previewHeightRef = useRef(previewHeight);
  previewHeightRef.current = previewHeight;

  const buildContext = useCallback(
    (count: number): KeyActionContext => ({
      state: stateRef.current,
      dispatch,
      count,
      navigate: options.navigate,
      enterDirectory: options.enterDirectory,
      parentDirectory: options.parentDirectory,
      refresh: options.refresh,
      exit,
      config,
      openEditor: (filePath: string, line?: number) => {
        openInEditor(filePath, config.editor.command, line);
        options.refresh();
      },
      previewHeight: previewHeightRef.current,
    }),
    [dispatch, exit, options, config],
  );

  const handleNormalInput = useCallback(
    (input: string, key: Key) => {
      const parsed = parseInput(input, key);
      const keyStr = keyToString(parsed);
      const buffer = bufferRef.current;

      // Clear timeout
      if (buffer.timeout) {
        clearTimeout(buffer.timeout);
        buffer.timeout = null;
      }

      // Collect numeric prefix
      if (/^\d$/.test(keyStr) && buffer.keys.length === 0) {
        buffer.count += keyStr;
        return;
      }

      buffer.keys.push(keyStr);

      const match = findMatch(registryRef.current, stateRef.current.mode, buffer.keys);

      if (match && match.exact) {
        const count = buffer.count ? parseInt(buffer.count, 10) : 0;
        const ctx = buildContext(count);
        match.action.handler(ctx);
        buffer.keys = [];
        buffer.count = "";
      } else if (match && !match.exact) {
        // Partial match - wait for more keys
        // On timeout, check for exact match before clearing
        const savedKeys = [...buffer.keys];
        const savedCount = buffer.count;
        buffer.timeout = setTimeout(() => {
          const exact = findExactMatch(
            registryRef.current,
            stateRef.current.mode,
            savedKeys,
          );
          if (exact) {
            const count = savedCount ? parseInt(savedCount, 10) : 0;
            const ctx = buildContext(count);
            exact.handler(ctx);
          }
          buffer.keys = [];
          buffer.count = "";
        }, TIMEOUT_MS);
      } else {
        // No match
        buffer.keys = [];
        buffer.count = "";
      }
    },
    [buildContext],
  );

  const handleCommandInput = useCallback(
    (input: string, key: Key) => {
      if (key.escape) {
        dispatch({ type: "SET_MODE", mode: "normal" });
        dispatch({ type: "SET_COMMAND_INPUT", input: "" });
        return;
      }

      if (key.return) {
        executeCommand(state.commandInput, buildContext(0));
        dispatch({ type: "SET_MODE", mode: "normal" });
        dispatch({ type: "SET_COMMAND_INPUT", input: "" });
        return;
      }

      if (key.backspace) {
        const newInput = state.commandInput.slice(0, -1);
        if (newInput.length === 0) {
          dispatch({ type: "SET_MODE", mode: "normal" });
        }
        dispatch({ type: "SET_COMMAND_INPUT", input: newInput });
        return;
      }

      dispatch({
        type: "SET_COMMAND_INPUT",
        input: state.commandInput + input,
      });
    },
    [state, dispatch, buildContext],
  );

  const handleSearchInput = useCallback(
    (input: string, key: Key) => {
      if (key.escape) {
        dispatch({ type: "SET_MODE", mode: "normal" });
        dispatch({ type: "SET_COMMAND_INPUT", input: "" });
        return;
      }

      if (key.return) {
        // Finalize search
        dispatch({ type: "SET_MODE", mode: "normal" });
        return;
      }

      if (key.backspace) {
        const newInput = state.commandInput.slice(0, -1);
        if (newInput.length === 0) {
          dispatch({ type: "SET_MODE", mode: "normal" });
          dispatch({ type: "SET_SEARCH", search: null });
        }
        dispatch({ type: "SET_COMMAND_INPUT", input: newInput });
        updateSearch(newInput, state, dispatch);
        return;
      }

      const newInput = state.commandInput + input;
      dispatch({ type: "SET_COMMAND_INPUT", input: newInput });
      updateSearch(newInput, state, dispatch);
    },
    [state, dispatch],
  );

  const handlePromptInput = useCallback(
    (input: string, key: Key) => {
      if (key.escape) {
        dispatch({ type: "SET_PROMPT", prompt: null });
        return;
      }

      if (key.return) {
        state.prompt?.onSubmit(state.prompt.value);
        return;
      }

      if (key.backspace) {
        if (state.prompt) {
          dispatch({
            type: "SET_PROMPT",
            prompt: {
              ...state.prompt,
              value: state.prompt.value.slice(0, -1),
            },
          });
        }
        return;
      }

      if (state.prompt) {
        dispatch({
          type: "SET_PROMPT",
          prompt: { ...state.prompt, value: state.prompt.value + input },
        });
      }
    },
    [state, dispatch],
  );

  useInput((input, key) => {
    // Clear error on any key
    if (state.error) {
      dispatch({ type: "SET_ERROR", error: null });
    }

    switch (state.mode) {
      case "normal":
      case "visual":
      case "preview":
        handleNormalInput(input, key);
        break;
      case "command":
        handleCommandInput(input, key);
        break;
      case "search":
        handleSearchInput(input, key);
        break;
      case "prompt":
        handlePromptInput(input, key);
        break;
    }
  });
}

function updateSearch(
  query: string,
  state: import("../state/types.ts").AppState,
  dispatch: import("react").Dispatch<import("../state/types.ts").AppAction>,
) {
  if (!query) {
    dispatch({ type: "SET_SEARCH", search: null });
    return;
  }

  const lowerQuery = query.toLowerCase();
  const matches: number[] = [];
  state.files.forEach((file, index) => {
    if (file.name.toLowerCase().includes(lowerQuery)) {
      matches.push(index);
    }
  });

  dispatch({
    type: "SET_SEARCH",
    search: { query, matches, currentMatch: 0 },
  });

  // Jump to first match
  if (matches.length > 0 && matches[0] !== undefined) {
    dispatch({ type: "SET_CURSOR", index: matches[0] });
  }
}

function executeCommand(
  command: string,
  ctx: KeyActionContext,
) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1).join(" ");

  switch (cmd) {
    case "q":
    case "quit":
      ctx.exit();
      break;

    case "cd":
      if (args) {
        const target = resolve(ctx.state.currentPath, args);
        ctx.navigate(target);
      }
      break;

    case "mkdir":
      if (args) {
        const dirPath = join(ctx.state.currentPath, args);
        createDirectory(dirPath)
          .then(() => ctx.refresh())
          .catch((err: Error) =>
            ctx.dispatch({
              type: "SET_ERROR",
              error: `mkdir failed: ${err.message}`,
            }),
          );
      }
      break;

    case "touch":
      if (args) {
        const filePath = join(ctx.state.currentPath, args);
        createFile(filePath)
          .then(() => ctx.refresh())
          .catch((err: Error) =>
            ctx.dispatch({
              type: "SET_ERROR",
              error: `touch failed: ${err.message}`,
            }),
          );
      }
      break;

    default:
      ctx.dispatch({
        type: "SET_ERROR",
        error: `Unknown command: ${cmd}`,
      });
  }
}
