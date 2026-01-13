# Token Management Dashboard Setup

## Overview

The Token Management Dashboard is a React-based web interface for managing design tokens with full CRUD capabilities. It includes an Express backend API for file operations and build triggers.

**UI Framework**: Built with [Tabler](https://tabler.io/) - A professional, open-source dashboard UI kit based on Bootstrap 5, providing clean and modern components via CDN.

## Architecture

- **Backend**: Express.js API server (port 3001)
- **Frontend**: React + Vite (port 5173)
- **API Communication**: REST API with proxy configuration

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:

- **Production dependencies**: `express`, `cors`
- **Development dependencies**: `react`, `react-dom`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`

### 2. Build Initial Tokens

Before running the dashboard, ensure tokens are compiled:

```bash
npm run build:core
```

## Running the Dashboard

### Development Mode (Recommended)

Run both backend and frontend concurrently:

```bash
npm run dev
```

This will:

1. **Build tokens first** (`npm run build:core`) - ensures assets exist
2. **Start backend API**: http://localhost:3001
3. **Start frontend dev server**: http://localhost:5173
4. **Auto-open browser**: Opens to http://localhost:5173/design-tokens/

The frontend automatically proxies `/api` requests to the backend.

**Note**: First run may take 10-20 seconds for initial token build. Subsequent starts with watch mode are faster.

### Production Build

Build the static site:

```bash
npm run site:build
```

Output: `docs/` directory

## Features

### CRUD Operations

- **Create**: Add new tokens or token groups
- **Read**: Browse all token files by category
- **Update**: Edit token values, types, and descriptions
- **Delete**: Remove obsolete tokens (planned)

### Draft & Commit Workflow

1. **Edit tokens** in the UI (changes tracked in memory)
2. **Review changes** (modified files highlighted)
3. **Commit changes** (saves files and triggers build)

### API Endpoints

- `GET /api/files` - List all token files
- `GET /api/tokens?file={path}` - Read token file content
- `POST /api/tokens` - Write token file content
- `POST /api/build` - Trigger token build process
- `GET /api/health` - Health check

## File Structure

```
├── server/
│   └── index.js           # Express API server
├── site/
│   ├── index.html         # HTML entry point
│   └── src/
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # Root component
│       ├── types.ts       # TypeScript interfaces
│       ├── dashboard.css  # Dashboard styles
│       └── components/
│           ├── Sidebar.tsx      # File navigation
│           ├── TokenEditor.tsx  # Main editor view
│           ├── TokenTree.tsx    # Recursive token renderer
│           └── CommitBar.tsx    # Commit/cancel bar
```

## Security Notes

- ⚠️ **Local Development Only**: No authentication implemented
- ⚠️ **Path Validation**: Backend validates file paths to prevent directory traversal
- ⚠️ **No Multi-User Support**: Changes are session-based

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is occupied:

```bash
# Kill process on Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill process on macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Build Fails

Ensure token files are valid JSON:

```bash
npm run tokens:validate
```

### React/TypeScript Errors

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Add Token Creation UI**: Modal for adding new tokens
2. **Delete Functionality**: Confirmation dialog for token deletion
3. **Undo/Redo**: Track change history
4. **Validation**: Real-time token value validation
5. **Search/Filter**: Find tokens quickly
6. **Bulk Operations**: Edit multiple tokens at once

## Related Documentation

- [README.md](./README.md) - Main project documentation
- [WORKFLOW.md](./WORKFLOW.md) - Token workflow guide
- [tokens/README.md](./tokens/README.md) - Token structure reference
