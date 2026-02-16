import chalk from "chalk";
import type { FileEntry } from "../state/types.ts";

const EXTENSION_COLORS: Record<string, (s: string) => string> = {
  // Archives
  ".zip": chalk.red,
  ".tar": chalk.red,
  ".gz": chalk.red,
  ".bz2": chalk.red,
  ".xz": chalk.red,
  ".7z": chalk.red,
  ".rar": chalk.red,

  // Images
  ".png": chalk.magenta,
  ".jpg": chalk.magenta,
  ".jpeg": chalk.magenta,
  ".gif": chalk.magenta,
  ".svg": chalk.magenta,
  ".webp": chalk.magenta,
  ".ico": chalk.magenta,
  ".bmp": chalk.magenta,

  // Video
  ".mp4": chalk.magenta.bold,
  ".mkv": chalk.magenta.bold,
  ".avi": chalk.magenta.bold,
  ".mov": chalk.magenta.bold,
  ".webm": chalk.magenta.bold,

  // Audio
  ".mp3": chalk.cyan,
  ".flac": chalk.cyan,
  ".wav": chalk.cyan,
  ".ogg": chalk.cyan,
  ".m4a": chalk.cyan,

  // Documents
  ".pdf": chalk.red.bold,
  ".doc": chalk.red.bold,
  ".docx": chalk.red.bold,
  ".xls": chalk.red.bold,
  ".xlsx": chalk.red.bold,
  ".ppt": chalk.red.bold,

  // Code
  ".ts": chalk.blue,
  ".tsx": chalk.blue,
  ".js": chalk.yellow,
  ".jsx": chalk.yellow,
  ".py": chalk.green,
  ".rs": chalk.red,
  ".go": chalk.cyan,
  ".rb": chalk.red,
  ".java": chalk.red,
  ".c": chalk.blue,
  ".cpp": chalk.blue,
  ".h": chalk.blue,

  // Config
  ".json": chalk.yellow,
  ".yaml": chalk.yellow,
  ".yml": chalk.yellow,
  ".toml": chalk.yellow,
  ".ini": chalk.yellow,
  ".xml": chalk.yellow,

  // Markup
  ".md": chalk.white,
  ".html": chalk.yellow,
  ".css": chalk.blue,
  ".scss": chalk.blue,

  // Shell
  ".sh": chalk.green,
  ".bash": chalk.green,
  ".zsh": chalk.green,
  ".fish": chalk.green,
};

export function colorize(entry: FileEntry): (s: string) => string {
  if (entry.isSymlink) return chalk.cyan.italic;
  if (entry.isDirectory) return chalk.blue.bold;

  const dotIndex = entry.name.lastIndexOf(".");
  if (dotIndex > 0) {
    const ext = entry.name.slice(dotIndex).toLowerCase();
    const color = EXTENSION_COLORS[ext];
    if (color) return color;
  }

  // Executable-looking files
  if (entry.name.startsWith(".")) return chalk.dim;

  return chalk.white;
}

export const SELECTED_BG = chalk.bgBlue;
export const CURSOR_BG = chalk.bgWhite.black;
export const DIM = chalk.dim;
export const BOLD = chalk.bold;
export const ERROR_COLOR = chalk.red.bold;
