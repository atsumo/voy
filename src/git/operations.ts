import { clearGitCache } from "./status.ts";

async function runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

export async function gitAdd(filePaths: string[], cwd: string): Promise<void> {
  const { exitCode, stderr } = await runGit(["add", ...filePaths], cwd);
  if (exitCode !== 0) throw new Error(stderr.trim() || "git add failed");
  clearGitCache();
}

export async function gitCommit(message: string, cwd: string): Promise<string> {
  const { exitCode, stdout, stderr } = await runGit(["commit", "-m", message], cwd);
  if (exitCode !== 0) throw new Error(stderr.trim() || "git commit failed");
  clearGitCache();
  return stdout.trim();
}

export async function gitPush(cwd: string): Promise<string> {
  const { exitCode, stdout, stderr } = await runGit(["push"], cwd);
  if (exitCode !== 0) throw new Error(stderr.trim() || "git push failed");
  return (stdout + stderr).trim();
}

export async function gitDiff(filePath: string, cwd: string): Promise<string> {
  const unstaged = await runGit(["diff", "--", filePath], cwd);
  const staged = await runGit(["diff", "--cached", "--", filePath], cwd);

  const parts: string[] = [];
  if (staged.stdout.trim()) parts.push(staged.stdout.trim());
  if (unstaged.stdout.trim()) parts.push(unstaged.stdout.trim());

  return parts.join("\n") || "(no changes)";
}

export async function gitLog(cwd: string, count: number = 50): Promise<string> {
  const { stdout } = await runGit(
    ["log", "--oneline", "--graph", `-${count}`],
    cwd,
  );
  return stdout.trim() || "(no commits)";
}
