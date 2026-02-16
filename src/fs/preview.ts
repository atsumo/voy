import { readdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import type { FileEntry, PreviewContent } from "../state/types.ts";
import { formatPermissions } from "../utils/formatting.ts";

const MAX_PREVIEW_LINES = 100;
const MAX_FILE_SIZE = 1024 * 256; // 256KB

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".mp4", ".mkv", ".avi", ".mov", ".webm",
  ".mp3", ".flac", ".wav", ".ogg", ".m4a",
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dll", ".so", ".dylib", ".o", ".a",
  ".wasm", ".class", ".pyc",
]);

export async function loadPreview(entry: FileEntry): Promise<PreviewContent> {
  try {
    if (entry.isDirectory) {
      return await loadDirectoryPreview(entry.path);
    }

    const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return { type: "binary", content: `Binary file: ${entry.name}` };
    }

    if (entry.size > MAX_FILE_SIZE) {
      return { type: "binary", content: `File too large: ${entry.name}` };
    }

    return await loadTextPreview(entry.path);
  } catch (err) {
    return {
      type: "error",
      content: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function loadTextPreview(filePath: string): Promise<PreviewContent> {
  const file = Bun.file(filePath);
  const text = await file.text();
  const lines = text.split("\n").slice(0, MAX_PREVIEW_LINES);
  return { type: "text", content: lines.join("\n") };
}

async function loadDirectoryPreview(
  dirPath: string,
): Promise<PreviewContent> {
  const dirents = await readdir(dirPath, { withFileTypes: true });
  const entries: FileEntry[] = [];

  for (const dirent of dirents.slice(0, 50)) {
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

  // Sort: directories first, then alphabetical
  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    type: "directory",
    content: entries.map((e) => (e.isDirectory ? `${e.name}/` : e.name)).join("\n"),
    entries,
  };
}
