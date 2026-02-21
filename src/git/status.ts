export type GitStatusCode =
  | "M"  // Modified
  | "A"  // Added/staged
  | "D"  // Deleted
  | "R"  // Renamed
  | "?"  // Untracked
  | "!"  // Ignored
  | "C"  // Copied
  | "U"; // Unmerged

export interface GitFileStatus {
  index: string;
  workTree: string;
  path: string;
}

export interface GitRepositoryInfo {
  isRepo: boolean;
  branch: string;
  files: Map<string, GitFileStatus>;
}

interface CacheEntry {
  data: GitRepositoryInfo;
  timestamp: number;
}

const TTL_MS = 5000;
let cache: CacheEntry | null = null;
let cachedPath: string | null = null;

export function clearGitCache(): void {
  cache = null;
  cachedPath = null;
}

export async function getGitInfo(dirPath: string): Promise<GitRepositoryInfo> {
  const now = Date.now();
  if (cache && cachedPath === dirPath && now - cache.timestamp < TTL_MS) {
    return cache.data;
  }

  const info = await fetchGitInfo(dirPath);
  cache = { data: info, timestamp: now };
  cachedPath = dirPath;
  return info;
}

async function fetchGitInfo(dirPath: string): Promise<GitRepositoryInfo> {
  const noRepo: GitRepositoryInfo = { isRepo: false, branch: "", files: new Map() };

  try {
    // Check if inside a git repo
    const branchProc = Bun.spawn(
      ["git", "rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: dirPath, stdout: "pipe", stderr: "pipe" },
    );
    const branchOut = await new Response(branchProc.stdout).text();
    const branchExit = await branchProc.exited;
    if (branchExit !== 0) return noRepo;

    const branch = branchOut.trim();

    // Get status with NUL-separated output
    const statusProc = Bun.spawn(
      ["git", "status", "--porcelain=v1", "-z"],
      { cwd: dirPath, stdout: "pipe", stderr: "pipe" },
    );
    const statusOut = await new Response(statusProc.stdout).text();
    await statusProc.exited;

    const files = new Map<string, GitFileStatus>();
    if (statusOut.length > 0) {
      const entries = statusOut.split("\0").filter((e) => e.length > 0);
      for (const entry of entries) {
        // Format: XY path (where X=index, Y=work-tree)
        const index = entry[0] ?? " ";
        const workTree = entry[1] ?? " ";
        const path = entry.slice(3);
        if (path) {
          files.set(path, { index, workTree, path });
        }
      }
    }

    return { isRepo: true, branch, files };
  } catch {
    return noRepo;
  }
}

/**
 * Get the display status code for a file (prioritizes work-tree status)
 */
export function getDisplayStatus(status: GitFileStatus): GitStatusCode | null {
  // Untracked
  if (status.index === "?" && status.workTree === "?") return "?";
  // Ignored
  if (status.index === "!" && status.workTree === "!") return "!";
  // Work-tree modifications take priority for display
  if (status.workTree === "M") return "M";
  if (status.workTree === "D") return "D";
  // Index (staged) status
  if (status.index === "A") return "A";
  if (status.index === "M") return "A"; // staged modification shown as "A" (staged)
  if (status.index === "D") return "D";
  if (status.index === "R") return "R";
  return null;
}

/**
 * Check if the status indicates the file is staged
 */
export function isStaged(status: GitFileStatus): boolean {
  return status.index !== " " && status.index !== "?" && status.index !== "!";
}
