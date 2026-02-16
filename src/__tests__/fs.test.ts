import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  readDirectory,
  copyFiles,
  deleteFiles,
  renameFile,
  createDirectory,
  createFile,
} from "../fs/operations.ts";
import { loadPreview } from "../fs/preview.ts";

let testDir: string;

beforeAll(async () => {
  testDir = await mkdtemp(join(tmpdir(), "voy-test-"));
  // Create test structure
  await mkdir(join(testDir, "subdir"));
  await mkdir(join(testDir, ".hidden-dir"));
  await writeFile(join(testDir, "file-a.txt"), "hello world\nline 2\nline 3");
  await writeFile(join(testDir, "file-b.ts"), "const x = 1;");
  await writeFile(join(testDir, ".hidden-file"), "secret");
  await writeFile(join(testDir, "image.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await writeFile(join(testDir, "subdir", "nested.txt"), "nested content");
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("readDirectory", () => {
  test("reads directory without hidden files", async () => {
    const entries = await readDirectory(testDir, false);
    const names = entries.map((e) => e.name);
    expect(names).toContain("file-a.txt");
    expect(names).toContain("file-b.ts");
    expect(names).toContain("subdir");
    expect(names).not.toContain(".hidden-file");
    expect(names).not.toContain(".hidden-dir");
  });

  test("reads directory with hidden files", async () => {
    const entries = await readDirectory(testDir, true);
    const names = entries.map((e) => e.name);
    expect(names).toContain(".hidden-file");
    expect(names).toContain(".hidden-dir");
  });

  test("directories come first", async () => {
    const entries = await readDirectory(testDir, false);
    const firstDir = entries.findIndex((e) => e.isDirectory);
    const lastDir = entries.findLastIndex((e) => e.isDirectory);
    const firstFile = entries.findIndex((e) => !e.isDirectory);
    if (firstDir >= 0 && firstFile >= 0) {
      expect(lastDir).toBeLessThan(firstFile);
    }
  });

  test("sorts by name ascending by default", async () => {
    const entries = await readDirectory(testDir, false, "name", "asc");
    const fileNames = entries.filter((e) => !e.isDirectory).map((e) => e.name);
    const sorted = [...fileNames].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(fileNames).toEqual(sorted);
  });

  test("entries have correct properties", async () => {
    const entries = await readDirectory(testDir, false);
    const file = entries.find((e) => e.name === "file-a.txt");
    expect(file).toBeDefined();
    expect(file!.isDirectory).toBe(false);
    expect(file!.isSymlink).toBe(false);
    expect(file!.size).toBeGreaterThan(0);
    expect(file!.modified).toBeInstanceOf(Date);
    expect(file!.permissions.length).toBe(9);

    const dir = entries.find((e) => e.name === "subdir");
    expect(dir).toBeDefined();
    expect(dir!.isDirectory).toBe(true);
  });
});

describe("file operations", () => {
  test("createDirectory creates a new directory", async () => {
    const newDir = join(testDir, "new-dir");
    await createDirectory(newDir);
    const entries = await readDirectory(testDir, false);
    expect(entries.map((e) => e.name)).toContain("new-dir");
    await rm(newDir, { recursive: true });
  });

  test("createFile creates an empty file", async () => {
    const newFile = join(testDir, "new-file.txt");
    await createFile(newFile);
    const entries = await readDirectory(testDir, false);
    expect(entries.map((e) => e.name)).toContain("new-file.txt");
    const file = entries.find((e) => e.name === "new-file.txt");
    expect(file!.size).toBe(0);
    await rm(newFile);
  });

  test("copyFiles copies files to destination", async () => {
    const destDir = join(testDir, "copy-dest");
    await mkdir(destDir);
    const entries = await readDirectory(testDir, false);
    const fileToCopy = entries.find((e) => e.name === "file-a.txt")!;
    await copyFiles([fileToCopy], destDir);
    const destEntries = await readDirectory(destDir, false);
    expect(destEntries.map((e) => e.name)).toContain("file-a.txt");
    await rm(destDir, { recursive: true });
  });

  test("renameFile renames a file", async () => {
    const tempFile = join(testDir, "rename-me.txt");
    await writeFile(tempFile, "rename test");
    await renameFile(tempFile, "renamed.txt");
    const entries = await readDirectory(testDir, false);
    expect(entries.map((e) => e.name)).toContain("renamed.txt");
    expect(entries.map((e) => e.name)).not.toContain("rename-me.txt");
    await rm(join(testDir, "renamed.txt"));
  });

  test("deleteFiles deletes files", async () => {
    const tempFile = join(testDir, "delete-me.txt");
    await writeFile(tempFile, "delete test");
    const entries = await readDirectory(testDir, false);
    const fileToDelete = entries.find((e) => e.name === "delete-me.txt")!;
    await deleteFiles([fileToDelete]);
    const afterEntries = await readDirectory(testDir, false);
    expect(afterEntries.map((e) => e.name)).not.toContain("delete-me.txt");
  });
});

describe("loadPreview", () => {
  test("text file preview", async () => {
    const entries = await readDirectory(testDir, false);
    const file = entries.find((e) => e.name === "file-a.txt")!;
    const preview = await loadPreview(file);
    expect(preview.type).toBe("text");
    expect(preview.content).toContain("hello world");
    expect(preview.content).toContain("line 2");
  });

  test("directory preview", async () => {
    const entries = await readDirectory(testDir, false);
    const dir = entries.find((e) => e.name === "subdir")!;
    const preview = await loadPreview(dir);
    expect(preview.type).toBe("directory");
    expect(preview.entries).toBeDefined();
    expect(preview.entries!.length).toBeGreaterThan(0);
    expect(preview.entries!.map((e) => e.name)).toContain("nested.txt");
  });

  test("binary file preview", async () => {
    const entries = await readDirectory(testDir, false);
    const file = entries.find((e) => e.name === "image.png")!;
    const preview = await loadPreview(file);
    expect(preview.type).toBe("binary");
    expect(preview.content).toContain("Binary file");
  });

  test("non-existent file returns error", async () => {
    const fakeEntry = {
      name: "does-not-exist.txt",
      path: join(testDir, "does-not-exist.txt"),
      isDirectory: false,
      isSymlink: false,
      size: 100,
      modified: new Date(),
      permissions: "rw-r--r--",
    };
    const preview = await loadPreview(fakeEntry);
    expect(preview.type).toBe("error");
  });
});
