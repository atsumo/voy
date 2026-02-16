import { describe, test, expect } from "bun:test";
import { formatSize, formatDate, formatPermissions, shortenPath } from "../utils/formatting.ts";

describe("formatSize", () => {
  test("zero bytes", () => {
    expect(formatSize(0)).toBe("   0B");
  });

  test("bytes", () => {
    expect(formatSize(500).trim()).toBe("500B");
  });

  test("kilobytes", () => {
    expect(formatSize(1024).trim()).toBe("1.0K");
  });

  test("kilobytes larger", () => {
    expect(formatSize(1536).trim()).toBe("1.5K");
  });

  test("megabytes", () => {
    expect(formatSize(1048576).trim()).toBe("1.0M");
  });

  test("megabytes rounded", () => {
    expect(formatSize(10 * 1024 * 1024).trim()).toBe("10M");
  });

  test("gigabytes", () => {
    expect(formatSize(1073741824).trim()).toBe("1.0G");
  });

  test("result is 5 chars padded", () => {
    expect(formatSize(0).length).toBe(5);
    expect(formatSize(500).length).toBe(5);
    expect(formatSize(1024).length).toBe(5);
  });
});

describe("formatDate", () => {
  test("same year shows time", () => {
    const now = new Date();
    const date = new Date(now.getFullYear(), 5, 15, 14, 30);
    const result = formatDate(date);
    expect(result).toContain("14:30");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });

  test("different year shows year", () => {
    const date = new Date(2020, 0, 5, 10, 0);
    const result = formatDate(date);
    expect(result).toContain("2020");
    expect(result).toContain("Jan");
  });
});

describe("formatPermissions", () => {
  test("rwxrwxrwx (0o777)", () => {
    expect(formatPermissions(0o777)).toBe("rwxrwxrwx");
  });

  test("rwxr-xr-x (0o755)", () => {
    expect(formatPermissions(0o755)).toBe("rwxr-xr-x");
  });

  test("rw-r--r-- (0o644)", () => {
    expect(formatPermissions(0o644)).toBe("rw-r--r--");
  });

  test("rw------- (0o600)", () => {
    expect(formatPermissions(0o600)).toBe("rw-------");
  });

  test("no permissions (0o000)", () => {
    expect(formatPermissions(0o000)).toBe("---------");
  });
});

describe("shortenPath", () => {
  test("returns path if within maxLen", () => {
    expect(shortenPath("/home/user", 50)).toBe("/home/user");
  });

  test("shortens with ~ for home dir", () => {
    const home = process.env["HOME"] || "";
    if (!home) return;
    const longPath = `${home}/very/deeply/nested/directory/path`;
    const result = shortenPath(longPath, 20);
    expect(result.startsWith("~")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test("shortens non-home path with ..", () => {
    const result = shortenPath("/very/long/absolute/path/to/some/dir", 15);
    expect(result.startsWith("..")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(15);
  });
});
