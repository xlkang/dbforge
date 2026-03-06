# DBForge 🛠️

[English](./README.md) | [中文](./README.zh-CN.md)

A modern, web-based database management tool - like Navicat, but in your browser.

<p align="center">
  <img src="https://img.shields.io/github/license/xlkang/dbforge" alt="license">
  <img src="https://img.shields.io/github/stars/xlkang/dbforge" alt="stars">
  <img src="https://img.shields.io/github/forks/xlkang/dbforge" alt="forks">
</p>

## ✨ Features

- **Multiple Database Support** - SQLite (local files) & MySQL (via proxy)
- **Schema Browser** - View tables, columns, indexes, primary keys
- **Powerful SQL Editor** - Syntax highlighting, auto-formatting, keyboard shortcuts
- **Data Viewer** - Table view, pagination, inline editing
- **Query History** - Track and reuse your queries
- **Import/Export** - CSV and JSON format support

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/xlkang/dbforge.git
cd dbforge

# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev:all

# Or start them separately:
npm run dev      # Frontend only (http://localhost:5173)
npm run server   # Backend proxy (http://localhost:3001)
```

## 📖 Usage

1. **Connect to Database**
   - Click "Open SQLite File" to select a local `.db`, `.sqlite`, or `.sqlite3` file
   - Or connect to MySQL via the backend proxy

2. **Browse Schema**
   - Select a table from the left panel to view its structure

3. **Run Queries**
   - Write SQL in the editor, press `Ctrl+Enter` to execute
   - Use the format button to beautify your SQL

4. **Export Results**
   - Export query results to CSV or JSON

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS 4
- **Editor**: CodeMirror 6
- **State**: Zustand
- **SQL Engine**: sql.js (SQLite WebAssembly)
- **Backend**: Express, MySQL2

## 📁 Project Structure

```
dbforge/
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── stores/          # Zustand state stores
│   ├── lib/             # Utilities
│   └── App.tsx          # Main app component
├── server/              # Backend (MySQL proxy)
│   └── src/
│       └── server.js    # Express server
├── dist/                # Production build
└── openspec/            # OpenSpec documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by <a href="https://github.com/xlkang">xlkang</a></p>