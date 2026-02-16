# Voy

Yazi-style three-pane TUI file manager built with Bun + Ink (React for CLI).

## Features

- **Three-pane layout** — Parent / Current / Preview columns
- **Vim-style navigation** — `hjkl`, `gg`/`G`, `Ctrl+d`/`Ctrl+u`, numeric prefix (`5j`)
- **File operations** — Copy (`yy`), Delete (`dd`), Paste (`pp`), Rename (`r`)
- **Visual selection** — `Space` toggle, `v` visual mode, `V` select all
- **Search** — `/` incremental search, `n`/`N` jump between matches
- **Command mode** — `:q`, `:cd`, `:mkdir`, `:touch`
- **Preview** — Text files, directory listings, binary detection
- **Hidden files** — `.` to toggle visibility
- **Virtual scrolling** — Handles large directories efficiently
- **Color coding** — File type based coloring (30+ extensions)

## Requirements

- [Bun](https://bun.sh/) v1.0+

## Getting Started

```bash
# Install dependencies
bun install

# Run
bun run src/index.tsx

# Or with a specific directory
bun run src/index.tsx /path/to/dir
```

## Keybindings

### Navigation

| Key | Action |
|-----|--------|
| `j` / `↓` | Move cursor down |
| `k` / `↑` | Move cursor up |
| `l` / `→` / `Enter` | Enter directory |
| `h` / `←` | Parent directory |
| `gg` | Go to first entry |
| `G` | Go to last entry |
| `Ctrl+d` | Half page down |
| `Ctrl+u` | Half page up |

### File Operations

| Key | Action |
|-----|--------|
| `yy` | Yank (copy) file(s) |
| `dd` | Delete file(s) |
| `pp` | Paste file(s) |
| `r` | Rename |
| `Space` | Toggle selection |
| `v` | Visual selection mode |
| `V` | Select / deselect all |

### Modes

| Key | Action |
|-----|--------|
| `/` | Search mode |
| `n` / `N` | Next / previous match |
| `:` | Command mode |
| `.` | Toggle hidden files |
| `q` | Quit |

### Commands

| Command | Action |
|---------|--------|
| `:q` | Quit |
| `:cd <path>` | Change directory |
| `:mkdir <name>` | Create directory |
| `:touch <name>` | Create file |

## Tech Stack

- **Runtime**: Bun
- **UI**: Ink 6 (React 19)
- **Fullscreen**: fullscreen-ink
- **Language**: TypeScript (strict mode)

## Testing

```bash
bun test
```

## License

MIT
