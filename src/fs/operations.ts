import { readdir, stat, lstat, cp, rm, rename, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import type { FileEntry, SortField, SortOrder } from "../state/types.ts";
import { formatPermissions } from "../utils/formatting.ts";

export async function readDirectory(
  dirPath: string,
  showHidden: boolean,
  sortField: SortField = "name",
  sortOrder: SortOrder = "asc",
): Promise<FileEntry[]> {
  const dirents = await readdir(dirPath, { withFileTypes: true });

  const entries: FileEntry[] = [];

  for (const dirent of dirents) {
    if (!showHidden && dirent.name.startsWith(".")) continue;

    const fullPath = join(dirPath, dirent.name);
    try {
      const stats = await lstat(fullPath);
      entries.push({
        name: dirent.name,
        path: fullPath,
        isDirectory: dirent.isDirectory(),
        isSymlink: dirent.isSymbolicLink(),
        size: stats.size,
        modified: stats.mtime,
        permissions: formatPermissions(stats.mode & 0o777),
      });
    } catch {
      // Skip entries we can't stat (broken symlinks, etc.)
      entries.push({
        name: dirent.name,
        path: fullPath,
        isDirectory: false,
        isSymlink: dirent.isSymbolicLink(),
        size: 0,
        modified: new Date(0),
        permissions: "---------",
      });
    }
  }

  return sortEntries(entries, sortField, sortOrder);
}

function sortEntries(
  entries: FileEntry[],
  field: SortField,
  order: SortOrder,
): FileEntry[] {
  const dirs = entries.filter((e) => e.isDirectory);
  const files = entries.filter((e) => !e.isDirectory);

  const comparator = (a: FileEntry, b: FileEntry): number => {
    let result: number;
    switch (field) {
      case "name":
        result = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
        break;
      case "size":
        result = a.size - b.size;
        break;
      case "modified":
        result = a.modified.getTime() - b.modified.getTime();
        break;
    }
    return order === "asc" ? result : -result;
  };

  dirs.sort(comparator);
  files.sort(comparator);

  // Directories first, then files
  return [...dirs, ...files];
}

export async function copyFiles(
  sources: FileEntry[],
  destDir: string,
): Promise<void> {
  for (const source of sources) {
    const destPath = join(destDir, basename(source.path));
    await cp(source.path, destPath, { recursive: true });
  }
}

export async function moveFiles(
  sources: FileEntry[],
  destDir: string,
): Promise<void> {
  for (const source of sources) {
    const destPath = join(destDir, basename(source.path));
    await rename(source.path, destPath);
  }
}

export async function deleteFiles(files: FileEntry[]): Promise<void> {
  for (const file of files) {
    await rm(file.path, { recursive: true, force: true });
  }
}

export async function renameFile(
  oldPath: string,
  newName: string,
): Promise<void> {
  const dir = join(oldPath, "..");
  const newPath = join(dir, newName);
  await rename(oldPath, newPath);
}

export async function createDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function createFile(filePath: string): Promise<void> {
  await Bun.write(filePath, "");
}

export function openInEditor(
  filePath: string,
  editor: string,
  line?: number,
): void {
  const editorParts = editor.split(/\s+/);
  const args = line
    ? [...editorParts, `+${line}`, filePath]
    : [...editorParts, filePath];
  Bun.spawnSync(args, {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
}
