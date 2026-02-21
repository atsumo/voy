async function runGh(args: string[], cwd: string): Promise<string> {
  try {
    const proc = Bun.spawn(["gh", ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    if (exitCode !== 0) {
      throw new Error(stderr.trim() || `gh ${args[0]} failed`);
    }
    return stdout.trim();
  } catch (err) {
    if (err instanceof Error && err.message.includes("ENOENT")) {
      throw new Error("gh CLI is not installed. Install it from https://cli.github.com/");
    }
    throw err;
  }
}

export async function getIssueList(cwd: string): Promise<string> {
  return await runGh(["issue", "list"], cwd);
}

export async function getPRList(cwd: string): Promise<string> {
  return await runGh(["pr", "list"], cwd);
}

export async function openInBrowser(cwd: string): Promise<void> {
  await runGh(["browse"], cwd);
}
