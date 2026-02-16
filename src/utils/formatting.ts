const UNITS = ["B", "K", "M", "G", "T"] as const;

export function formatSize(bytes: number): string {
  if (bytes === 0) return "   0B";
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const formatted = size < 10 ? size.toFixed(1) : Math.round(size).toString();
  return `${formatted}${UNITS[unitIndex]}`.padStart(5);
}

export function formatDate(date: Date): string {
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, " ");
  if (isThisYear) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month} ${day} ${hours}:${minutes}`;
  }
  return `${month} ${day}  ${date.getFullYear()}`;
}

export function formatPermissions(mode: number): string {
  const perms = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  const owner = perms[(mode >> 6) & 7] ?? "---";
  const group = perms[(mode >> 3) & 7] ?? "---";
  const other = perms[mode & 7] ?? "---";
  return `${owner}${group}${other}`;
}

export function shortenPath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path;
  const home = process.env["HOME"] || "";
  if (home && path.startsWith(home)) {
    const shortened = "~" + path.slice(home.length);
    if (shortened.length <= maxLen) return shortened;
    return "~/.." + shortened.slice(shortened.length - maxLen + 4);
  }
  return ".." + path.slice(path.length - maxLen + 2);
}
