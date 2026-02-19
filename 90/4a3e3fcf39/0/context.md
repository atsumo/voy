# Session Context

**Session ID:** 73577220-a042-415e-85cd-42d09b797db9

**Commit Message:** その方針がいい！

## Prompt

その方針がいい！

## Summary

バンドルされた JS は正常に動いています（Raw mode エラーは TUI アプリを非インタラクティブ環境で実行したため。`bun run start` でも同じエラーが出る正常な挙動です）。

完了です。変更内容:

- **`bin`**: `src/index.tsx` → `dist/voy.js`
- **`files`**: `["src"]` → `["dist"]`
- **`build`**: `bun build src/index.tsx --target bun --outfile dist/voy.js`
- **`build:compile`**: 従来のスタンドアロンバイナリビルドも残した
- **`prepublishOnly`**: `npm publish` 時に自動でビルドが走る

### 公開手順

```bash
npm login
npm publish
```

ユーザーのインストール:
```bash
bunx voy
bun install -g voy
```

## Key Actions

- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/src/index.tsx
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/.gitignore
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Edit**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Bash**: Test bundle build
- - **Edit**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Bash**: Test bundle build with bun target
- - **Bash**: Quick test bundled output
