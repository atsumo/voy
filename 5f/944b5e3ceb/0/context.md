# Session Context

**Session ID:** 73577220-a042-415e-85cd-42d09b797db9

**Commit Message:** Homebrewの対応はため、それに必要なコードは削除
npmだけ対応してください

## Prompt

homebrewの対応はため、それに必要なコードは削除
npmだけ対応してください

## Summary

完了です。

### 変更内容

**削除:**
- `.github/workflows/release.yml`
- `scripts/update-formula.sh`
- `Formula/voy.rb.template`

**`package.json` 変更:**
- `"private": true` を削除（npm publish に必要）
- `"files": ["src"]` を追加（公開ファイルを限定）
- `"version": "0.1.0"` はそのまま維持

### npm で公開する手順

```bash
npm login          # 初回のみ
npm publish        # 公開
```

ユーザーは以下でインストール:
```bash
bunx voy           # 一回だけ実行
bun install -g voy # グローバルインストール
```

## Key Actions

- - **Bash**: Remove Homebrew-related files
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Glob**: src/**/*.{ts,tsx}
- - **Edit**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Edit**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
- - **Read**: /Users/atsumo/.ghq/github.com/atsumo/voy/package.json
