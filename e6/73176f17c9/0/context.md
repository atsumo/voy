# Session Context

**Session ID:** 34182dbc-72f1-4034-ae22-4a2b3e44efc8

**Commit Message:** Implement the following plan:

# Voy Feature Improvements & Git History

## Prompt

Implement the following plan:

# Voy Feature Improvements & Git History Cleanup

## Context

voy は Yazi 風の 3 ペイン TUI ファイルマネージャー。現在は git/GitHub 連携がゼロで、プレビューは plain text のみ。
以下の機能追加と、main ブランチのコミット履歴整理を行う。

---

## Step 0: main ブランチのコミット履歴整理

### 問題
main の 13 コミットが日本語の雑なメッセージ（「試してください」「その方針がいい！」等）になっている。

### 方針
`git reset --soft <初回コミット>` で全コミットを1つにまとめ、英語で意味のあるメッセージに書き直す。

```bash
# 全コミットを初回コミットの親までソフトリセット
git reset --soft 2859e2c^
# 1つのクリーンなコミットにまとめる
git add -A
git commit -m "Initial implementation of voy TUI file manager

- Three-pane layout (parent, current, preview) with Ink 6 + React 19
- Vim-style keybindings (hjkl navigation, visual mode, search)
- File operations (copy, move, delete, rename, mkdir, touch)
- Text/directory/binary preview with extension-based coloring
- Virtual scrolling for large directories
- npm package distribution setup (@atsumo/voy)"
# リモートに force push（履歴書き換えのため）
git push --force origin main
```

**注意**: force push が必要。他の人がこのリポを使っていないことを確認済みの前提。

---

## Step 1: Git Status 連携 (`feature/git-status`)

### 目的
ファイル一覧に git status を表示し、StatusBar にブランチ名を表示する。

### 新規ファイル
- `src/git/status.ts` — `git status --porcelain=v1 -z` と `git rev-parse --abbrev-ref HEAD` を `Bun.spawn` で実行・パース。5秒 TTL キャッシュ付き。

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/state/types.ts` | `FileEntry` に `gitStatus?: GitStatus` 追加。`AppState` に `git: GitRepositoryInfo` 追加。`SET_GIT_INFO` アクション追加 |
| `src/state/reducer.ts` | `SET_GIT_INFO` ケース追加 |
| `src/state/context.tsx` | 初期状態に `git` フィールド追加 |
| `src/hooks/useFileSystem.ts` | `readDirectory()` 後に `getGitInfo()` を呼び、`FileEntry` を enrich |
| `src/components/file-list/FileItem.tsx` | ファイル名の前に git status インジケーター (`M`, `A`, `?`, `D`) を色付きで表示 |
| `src/utils/colors.ts` | git status による色分け（modified=黄, staged=緑, untracked=灰, deleted=赤） |
| `src/components/layout/StatusBar.tsx` | ブランチ名 `[main]` を表示 |

---

## Step 2: Git 操作 keybindings (`feature/git-operations`)

### 目的
`g` プレフィックスの keybinding で基本的な git 操作を実行する。

### 新規ファイル
- `src/git/operations.ts` — `gitAdd`, `gitCommit`, `gitPush`, `gitDiff`, `gitLog` を `Bun.spawn` で実行。操作後にキャッシュクリア。

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/state/types.ts` | `PreviewContent.type` に `"diff"` `"gitlog"` 追加 |
| `src/keybindings/definitions.ts` | `ga`(stage), `gc`(commit), `gp`(push), `gd`(diff→preview), `gl`(log→preview) 追加 |

### keybinding 一覧
| キー | 操作 |
|------|------|
| `ga` | 選択ファイルを `git add` |
| `gc` | プロンプトでメッセージ入力 → `git commit` |
| `gp` | `git push` |
| `gd` | カーソル位置のファイルの diff をプレビューに表示 |
| `gl` | `git log --oneline --graph` をプレビューに表示 |

---

## Step 3: Preview 強化 (`feature/enhanced-preview`)

### 目的
ファイルタイプに応じたフォーマット表示を実装する。

### 新規ファイル
- `src/components/preview/DiffPreview.tsx` — `+` 緑, `-` 赤, `@@` シアン, `diff --git` 黄太字
- `src/components/preview/GitLogPreview.tsx` — グラフ黄, ハッシュ黄, refs シアン
- `src/utils/syntax.ts` — 正規表現ベースの軽量シンタックスハイライト

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/components/layout/PreviewPane.tsx` | `diff`, `gitlog` ケースを switch に追加 |
| `src/components/preview/TextPreview.tsx` | `fileName` prop を受け取り、拡張子に応じてハイライト適用 |
| `src/fs/preview.ts` | `PreviewContent` に `fileName` フィールド追加 |

### シンタックスハイライト対象
| 拡張子 | ハイライト |
|--------|-----------|
| `.ts`, `.tsx`, `.js`, `.jsx` | キーワード (const, function, import 等) をシアン |
| `.py` | キーワード (def, class, if 等) をマゼンタ |
| `.json` | キー名をシアン |
| `.md` | 見出し=青太字, リスト=黄 |

---

## Step 4: GitHub CLI 連携 (`feature/github-cli`)

### 目的
`gh` コマンドと連携し、Issue/PR をプレビューに表示する。

### 新規ファイル
- `src/git/github.ts` — `checkGhInstalled`, `getIssueList`, `getPRList`, `openInBrowser`
- `src/components/preview/GitHubPreview.tsx` — Issue/PR 番号=緑, ラベル=黄

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `src/state/types.ts` | `PreviewContent.type` に `"github-issues"`, `"github-prs"` 追加 |
| `src/keybindings/definitions.ts` | `gi`(issues), `gP`(PRs), `go`(browse) 追加 |
| `src/components/layout/PreviewPane.tsx` | `github-issues`, `github-prs` ケース追加 |

### keybinding 一覧
| キー | 操作 |
|------|------|
| `gi` | `gh issue list` → プレビュー表示 |
| `gP` | `gh pr list` → プレビュー表示 |
| `go` | `gh browse` でブラウザを開く |

---

## 実装順序

| 順序 | ステップ | ブランチ | 依存 |
|------|---------|---------|------|
| 0 | コミット履歴整理 | main (直接) | なし |
| 1 | Git Status 連携 | `feature/git-status` | Step 0 |
| 2 | Git 操作 | `feature/git-operations` | Step 1 |
| 3 | Preview 強化 | `feature/enhanced-preview` | Step 2 |
| 4 | GitHub CLI 連携 | `feature/github-cli` | Step 1 |

Step 3 と Step 4 は並行作業可能（Step 1 が完了していれば）。

---

## 検証方法

### Step 0
- `git log --oneline main` で 1 コミットになっていることを確認

### Step 1
- git リポジトリ内で `bun run start` → ファイル一覧に `M`, `?` 等のインジケーターが表示される
- StatusBar にブランチ名が表示される
- git リポジトリ外で起動 → インジケーターなし、エラーなし

### Step 2
- `ga` でファイルを stage → `git status` で staged になっている
- `gd` で diff がプレビューに色付き表示される
- `gl` で log がプレビューに表示される

### Step 3
- `.ts` ファイル選択 → キーワードがシアンでハイライトされる
- `.json` ファイル選択 → キー名がシアン
- `.md` ファイル選択 → 見出しが青太字

### Step 4
- `gi` → Issue 一覧がプレビューに表示（gh 未インストール時はエラーメッセージ）
- `go` → ブラウザが開く


If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content you generated), read the full transcript at: /Users/atsumo/.REDACTED.jsonl

If this plan can be broken down into multiple independent tasks, consider using the TeamCreate tool to create a team and parallelize the work.

## Summary

All changes are in place. Here's a summary of everything implemented:

## Summary

### Step 0: Git History Cleanup
- Squashed all 13 commits into one clean commit: `"Initial implementation of voy TUI file manager"`
- **Force push pending** - run `git push --force origin main` when ready

### Step 1: Git Status Integration
- **`src/git/status.ts`** (new) — Runs `git status --porcelain=v1 -z` and `git rev-parse --abbrev-ref HEAD` via `Bun.spawn`, with 5s TTL cache
- **`src/state/types.ts`** — Added `gitStatus?`/`gitStaged?` to `FileEntry`, `GitInfo` interface, `SET_GIT_INFO` action, extended `PreviewContent.type`
- **`src/state/reducer.ts`** — Added `SET_GIT_INFO` case
- **`src/state/context.tsx`** — Added initial `git` state
- **`src/hooks/useFileSystem.ts`** — Enriches files with git status after `readDirectory()`
- **`src/components/file-list/FileItem.tsx`** — Shows `M`/`A`/`?`/`D` indicators with colors (yellow/green/gray/red)
- **`src/components/layout/StatusBar.tsx`** — Shows `[branch-name]` in green
- **`src/utils/colors.ts`** — Added git status color exports

### Step 2: Git Operations Keybindings
- **`src/git/operations.ts`** (new) — `gitAdd`, `gitCommit`, `gitPush`, `gitDiff`, `gitLog`
- **`src/keybindings/definitions.ts`** — `ga` (stage), `gc` (commit), `gp` (push), `gd` (diff→preview), `gl` (log→preview)

### Step 3: Preview Enhancement
- **`src/components/preview/DiffPreview.tsx`** (new) — `+` green, `-` red, `@@` cyan, `diff --git` yellow bold
- **`src/components/preview/GitLogPreview.tsx`** (new) — Graph/hash yellow, refs cyan
- **`src/utils/syntax.ts`** (new) — Regex-based highlighting for `.ts/.tsx/.js/.jsx` (keywords→cyan), `.py` (keywords→magenta), `.json` (keys→cyan), `.md` (headings→blue bold, lists→yellow)
- **`src/components/preview/TextPreview.tsx`** — Accepts `fileName` prop, applies syntax highlighting
- **`src/components/layout/PreviewPane.tsx`** — Added `diff`, `gitlog`, `github-issues`, `github-prs` cases
- **`src/fs/preview.ts`** — Passes `fileName` to text preview

### Step 4: GitHub CLI Integration
- **`src/git/github.ts`** (new) — `getIssueList`, `getPRList`, `openInBrowser` via `gh` CLI
- **`src/components/preview/GitHubPreview.tsx`** (new) — Issue/PR display with colored number prefixes
- **`src/keybindings/definitions.ts`** — `gi` (issues), `gP` (PRs), `go` (browse)

All 77 tests pass, build succeeds. Would you like me to commit these changes?

## Key Actions

- - **Task**: Explore voy codebase structure
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/state/types.ts
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/state/reducer.ts
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/state/context.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/hooks/useFileSystem.ts
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/components/file-list/FileItem.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/components/layout/StatusBar.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/components/layout/PreviewPane.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/components/preview/TextPreview.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/keybindings/definitions.ts
