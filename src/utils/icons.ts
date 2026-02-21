import type { FileEntry } from "../state/types.ts";

export interface FileIcon {
  icon: string;
  color: string;
}

const SPECIAL_FILES: Record<string, FileIcon> = {
  // Docker
  "Dockerfile": { icon: "\uf308", color: "#384d54" },      //
  "docker-compose.yml": { icon: "\uf308", color: "#384d54" },
  "docker-compose.yaml": { icon: "\uf308", color: "#384d54" },
  ".dockerignore": { icon: "\uf308", color: "#384d54" },

  // Node / JS
  "package.json": { icon: "\ue71e", color: "#e8274b" },     //
  "package-lock.json": { icon: "\ue71e", color: "#e8274b" },
  "tsconfig.json": { icon: "\ue628", color: "#3178c6" },    //
  "bun.lock": { icon: "\uf487", color: "#fbf0df" },         //
  "bun.lockb": { icon: "\uf487", color: "#fbf0df" },

  // Git
  ".gitignore": { icon: "\ue702", color: "#f05032" },       //
  ".gitmodules": { icon: "\ue702", color: "#f05032" },
  ".gitattributes": { icon: "\ue702", color: "#f05032" },

  // Config
  ".env": { icon: "\uf462", color: "#faf743" },             //
  ".env.local": { icon: "\uf462", color: "#faf743" },
  ".env.development": { icon: "\uf462", color: "#faf743" },
  ".env.production": { icon: "\uf462", color: "#faf743" },
  ".editorconfig": { icon: "\ue652", color: "#fff2f0" },    //
  ".prettierrc": { icon: "\ue6b4", color: "#56b3b4" },      //
  ".eslintrc": { icon: "\udb82\udd61", color: "#4b32c3" },  // 󰱡
  ".eslintrc.js": { icon: "\udb82\udd61", color: "#4b32c3" },
  ".eslintrc.json": { icon: "\udb82\udd61", color: "#4b32c3" },

  // Build
  "Makefile": { icon: "\ue673", color: "#6d8086" },         //
  "CMakeLists.txt": { icon: "\ue673", color: "#6d8086" },
  "Rakefile": { icon: "\ue21e", color: "#cc342d" },         //

  // Rust
  "Cargo.toml": { icon: "\ue7a8", color: "#dea584" },       //
  "Cargo.lock": { icon: "\ue7a8", color: "#dea584" },

  // Docs
  "README.md": { icon: "\uf48a", color: "#42a5f5" },        //
  "LICENSE": { icon: "\uf718", color: "#d0bf41" },           //
  "CHANGELOG.md": { icon: "\uf7d9", color: "#42a5f5" },     //
};

const EXTENSION_ICONS: Record<string, FileIcon> = {
  // TypeScript
  ".ts": { icon: "\ue628", color: "#3178c6" },      //
  ".tsx": { icon: "\ue628", color: "#3178c6" },
  ".d.ts": { icon: "\ue628", color: "#3178c6" },

  // JavaScript
  ".js": { icon: "\ue74e", color: "#f7df1e" },      //
  ".jsx": { icon: "\ue74e", color: "#f7df1e" },
  ".mjs": { icon: "\ue74e", color: "#f7df1e" },
  ".cjs": { icon: "\ue74e", color: "#f7df1e" },

  // Python
  ".py": { icon: "\ue73c", color: "#ffbc03" },      //
  ".pyi": { icon: "\ue73c", color: "#ffbc03" },
  ".pyc": { icon: "\ue73c", color: "#ffbc03" },

  // Rust
  ".rs": { icon: "\ue7a8", color: "#dea584" },      //

  // Go
  ".go": { icon: "\ue627", color: "#00add8" },      //
  ".mod": { icon: "\ue627", color: "#00add8" },

  // Ruby
  ".rb": { icon: "\ue21e", color: "#cc342d" },      //
  ".erb": { icon: "\ue21e", color: "#cc342d" },
  ".gemspec": { icon: "\ue21e", color: "#cc342d" },

  // Java
  ".java": { icon: "\ue256", color: "#cc3e44" },    //
  ".class": { icon: "\ue256", color: "#cc3e44" },
  ".jar": { icon: "\ue256", color: "#cc3e44" },

  // C / C++
  ".c": { icon: "\ue61e", color: "#599eff" },       //
  ".h": { icon: "\ue61e", color: "#599eff" },
  ".cpp": { icon: "\ue61d", color: "#599eff" },     //
  ".hpp": { icon: "\ue61d", color: "#599eff" },
  ".cc": { icon: "\ue61d", color: "#599eff" },

  // C#
  ".cs": { icon: "\udb81\ub068", color: "#596706" }, //

  // Swift
  ".swift": { icon: "\ue755", color: "#e37933" },   //

  // Lua
  ".lua": { icon: "\ue620", color: "#51a0cf" },     //

  // Shell
  ".sh": { icon: "\uf489", color: "#4eaa25" },      //
  ".bash": { icon: "\uf489", color: "#4eaa25" },
  ".zsh": { icon: "\uf489", color: "#4eaa25" },
  ".fish": { icon: "\uf489", color: "#4eaa25" },

  // Config
  ".json": { icon: "\ue60b", color: "#cbcb41" },    //
  ".jsonc": { icon: "\ue60b", color: "#cbcb41" },
  ".yaml": { icon: "\ue60b", color: "#cbcb41" },
  ".yml": { icon: "\ue60b", color: "#cbcb41" },
  ".toml": { icon: "\ue60b", color: "#cbcb41" },
  ".ini": { icon: "\ue60b", color: "#6d8086" },
  ".xml": { icon: "\udb80\udf32", color: "#e37933" }, // 󰗲
  ".conf": { icon: "\ue60b", color: "#6d8086" },

  // Markup / Web
  ".html": { icon: "\ue736", color: "#e44d26" },    //
  ".htm": { icon: "\ue736", color: "#e44d26" },
  ".css": { icon: "\ue749", color: "#42a5f5" },     //
  ".scss": { icon: "\ue749", color: "#f55385" },
  ".sass": { icon: "\ue749", color: "#f55385" },
  ".less": { icon: "\ue749", color: "#563d7c" },
  ".vue": { icon: "\ue6a0", color: "#8dc149" },     //
  ".svelte": { icon: "\ue697", color: "#ff3e00" },   //

  // Markdown
  ".md": { icon: "\ue73e", color: "#ffffff" },       //
  ".mdx": { icon: "\ue73e", color: "#ffffff" },

  // Images
  ".png": { icon: "\uf1c5", color: "#a074c4" },     //
  ".jpg": { icon: "\uf1c5", color: "#a074c4" },
  ".jpeg": { icon: "\uf1c5", color: "#a074c4" },
  ".gif": { icon: "\uf1c5", color: "#a074c4" },
  ".svg": { icon: "\uf1c5", color: "#ffb13b" },
  ".webp": { icon: "\uf1c5", color: "#a074c4" },
  ".ico": { icon: "\uf1c5", color: "#a074c4" },
  ".bmp": { icon: "\uf1c5", color: "#a074c4" },

  // Video
  ".mp4": { icon: "\uf03d", color: "#fd971f" },     //
  ".mkv": { icon: "\uf03d", color: "#fd971f" },
  ".avi": { icon: "\uf03d", color: "#fd971f" },
  ".mov": { icon: "\uf03d", color: "#fd971f" },
  ".webm": { icon: "\uf03d", color: "#fd971f" },

  // Audio
  ".mp3": { icon: "\uf001", color: "#66d9ef" },     //
  ".flac": { icon: "\uf001", color: "#66d9ef" },
  ".wav": { icon: "\uf001", color: "#66d9ef" },
  ".ogg": { icon: "\uf001", color: "#66d9ef" },
  ".m4a": { icon: "\uf001", color: "#66d9ef" },

  // Archives
  ".zip": { icon: "\uf410", color: "#eca517" },     //
  ".tar": { icon: "\uf410", color: "#eca517" },
  ".gz": { icon: "\uf410", color: "#eca517" },
  ".bz2": { icon: "\uf410", color: "#eca517" },
  ".xz": { icon: "\uf410", color: "#eca517" },
  ".7z": { icon: "\uf410", color: "#eca517" },
  ".rar": { icon: "\uf410", color: "#eca517" },

  // Documents
  ".pdf": { icon: "\uf1c1", color: "#b30b00" },     //
  ".doc": { icon: "\uf1c2", color: "#185abd" },      //
  ".docx": { icon: "\uf1c2", color: "#185abd" },
  ".xls": { icon: "\uf1c3", color: "#207245" },      //
  ".xlsx": { icon: "\uf1c3", color: "#207245" },
  ".ppt": { icon: "\uf1c4", color: "#cb4a32" },      //
  ".pptx": { icon: "\uf1c4", color: "#cb4a32" },

  // SQL
  ".sql": { icon: "\ue706", color: "#dad8d8" },     //

  // GraphQL
  ".graphql": { icon: "\ue662", color: "#e535ab" },  //
  ".gql": { icon: "\ue662", color: "#e535ab" },

  // Lock files
  ".lock": { icon: "\uf023", color: "#6d8086" },     //
};

const DEFAULT_FILE: FileIcon = { icon: "\uf15b", color: "#6d8086" };    //
const DEFAULT_DIR: FileIcon = { icon: "\uf07b", color: "#42a5f5" };     //
const SYMLINK_ICON: FileIcon = { icon: "\uf0c1", color: "#66d9ef" };    //

export function getFileIcon(entry: FileEntry): FileIcon {
  if (entry.isSymlink) return SYMLINK_ICON;
  if (entry.isDirectory) return DEFAULT_DIR;

  // Check special filenames first
  const special = SPECIAL_FILES[entry.name];
  if (special) return special;

  // Check extension (support compound extensions like .d.ts)
  const name = entry.name.toLowerCase();
  const dotIndex = name.indexOf(".", name.startsWith(".") ? 1 : 0);
  if (dotIndex >= 0) {
    // Try compound extension first (e.g., ".d.ts")
    const secondDot = name.indexOf(".", dotIndex + 1);
    if (secondDot >= 0) {
      const compoundExt = name.slice(dotIndex);
      const compound = EXTENSION_ICONS[compoundExt];
      if (compound) return compound;
    }

    // Try simple extension
    const lastDot = name.lastIndexOf(".");
    const ext = name.slice(lastDot);
    const icon = EXTENSION_ICONS[ext];
    if (icon) return icon;
  }

  return DEFAULT_FILE;
}
