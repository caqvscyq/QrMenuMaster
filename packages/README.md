# Packages Directory

**⚠️ AI ASSISTANTS: THIS IS THE ACTIVE CODEBASE - MAKE CHANGES HERE ⚠️**

This directory contains the active, production-ready code for the QR Menu Master project.

## Directory Structure

```
packages/
├── frontend/           # React frontend application (ACTIVE)
│   ├── src/           # Source code for UI components
│   ├── public/        # Static assets
│   └── package.json   # Frontend dependencies
├── backend/           # Node.js backend server (ACTIVE)  
│   ├── src/           # Server source code
│   ├── public/        # Built frontend assets (auto-generated)
│   └── package.json   # Backend dependencies
└── shared/            # Shared types and utilities
    └── types/         # TypeScript type definitions
```

## Important Guidelines for AI Assistants

### ✅ DO EDIT - Active Directories
- `packages/frontend/src/` - Frontend React components and pages
- `packages/backend/src/` - Backend API routes and services
- `packages/shared/` - Shared types and utilities

### ❌ DON'T EDIT - Generated/Archive Directories  
- `packages/backend/public/` - Auto-generated build outputs
- `admin-client/` - ARCHIVED (moved to _archive/)
- `unified-server/` - LEGACY (being phased out)
- `_archive/` - Historical code (read-only)

### Build Process
- Frontend builds to: `packages/backend/public/`
- Server serves from: `packages/backend/public/`
- No manual editing of build outputs

## Development Workflow

```bash
# Install dependencies
npm run install:all

# Development (auto-rebuild)
npm run dev

# Production build
npm run build
```

## File Organization Rules

1. **UI Changes**: Edit files in `packages/frontend/src/`
2. **API Changes**: Edit files in `packages/backend/src/`
3. **Database Changes**: Edit files in `packages/backend/src/db/`
4. **Shared Code**: Edit files in `packages/shared/`

This structure prevents AI confusion and ensures changes are made to active code.
