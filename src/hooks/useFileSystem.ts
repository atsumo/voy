import { useEffect, useCallback, useRef } from "react";
import { useAppState, useAppDispatch } from "../state/context.tsx";
import { readDirectory } from "../fs/operations.ts";
import { dirname, basename, relative } from "node:path";
import { getGitInfo, getDisplayStatus, isStaged } from "../git/status.ts";

export function useFileSystem() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const prevPathRef = useRef<string>("");

  const loadDirectory = useCallback(async () => {
    try {
      const files = await readDirectory(
        state.currentPath,
        state.showHidden,
        state.sort.field,
        state.sort.order,
      );
      // Enrich files with git status
      const gitInfo = await getGitInfo(state.currentPath);
      dispatch({
        type: "SET_GIT_INFO",
        git: { isRepo: gitInfo.isRepo, branch: gitInfo.branch },
      });

      if (gitInfo.isRepo) {
        const rootProc = Bun.spawn(
          ["git", "rev-parse", "--show-toplevel"],
          { cwd: state.currentPath, stdout: "pipe", stderr: "pipe" },
        );
        const repoRoot = (await new Response(rootProc.stdout).text()).trim();

        for (const file of files) {
          const relPath = relative(repoRoot, file.path);
          const status = gitInfo.files.get(relPath);
          if (status) {
            file.gitStatus = getDisplayStatus(status) ?? undefined;
            file.gitStaged = isStaged(status);
          } else if (file.isDirectory) {
            const dirPrefix = relPath + "/";
            for (const [path, fileStatus] of gitInfo.files) {
              if (path.startsWith(dirPrefix)) {
                file.gitStatus = getDisplayStatus(fileStatus) ?? undefined;
                break;
              }
            }
          }
        }
      }

      dispatch({ type: "SET_FILES", files });

      // Load parent directory
      const parentPath = dirname(state.currentPath);
      dispatch({ type: "SET_PARENT_PATH", path: parentPath });

      const parentFiles = await readDirectory(
        parentPath,
        state.showHidden,
        state.sort.field,
        state.sort.order,
      );
      dispatch({ type: "SET_PARENT_FILES", files: parentFiles });

      // Set parent cursor to highlight current dir in parent
      const currentDirName = basename(state.currentPath);
      const parentCursorIndex = parentFiles.findIndex(
        (f) => f.name === currentDirName,
      );
      if (parentCursorIndex >= 0) {
        dispatch({ type: "SET_PARENT_CURSOR", index: parentCursorIndex });
      }
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        error: `Failed to read directory: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [state.currentPath, state.showHidden, state.sort.field, state.sort.order, dispatch]);

  useEffect(() => {
    loadDirectory();
    prevPathRef.current = state.currentPath;
  }, [state.currentPath, state.showHidden, loadDirectory]);

  return { refresh: loadDirectory };
}
