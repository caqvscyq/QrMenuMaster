# 🤖 AI ASSISTANT GUIDANCE

**⚠️ CRITICAL: READ THIS BEFORE MAKING ANY CODE CHANGES ⚠️**

## Active Codebase Locations

### ✅ DO EDIT - Active Code (Make changes here)
- `packages/frontend/src/` - Frontend React components and pages
- `packages/backend/src/` - Backend API routes and services  
- `packages/shared/` - Shared types and utilities

### ❌ DON'T EDIT - Archived/Generated Code
- `_archive/` - Historical code (read-only)
- `_archive/admin-client-archived/` - OLD frontend code (archived)
- `unified-server/` - LEGACY backend (being phased out)
- `packages/backend/public/` - Auto-generated build outputs

## File Organization Rules

### Frontend Changes
- **Edit**: `packages/frontend/src/pages/admin/` for admin UI
- **Edit**: `packages/frontend/src/pages/customer/` for customer UI
- **Edit**: `packages/frontend/src/components/` for shared components

### Backend Changes  
- **Edit**: `packages/backend/src/api/` for API endpoints
- **Edit**: `packages/backend/src/db/` for database operations
- **Edit**: `packages/backend/src/services/` for business logic

### Build Process
- Frontend builds to: `packages/backend/public/`
- Server serves from: `packages/backend/public/`
- **Never edit build outputs directly**

## Common Mistakes to Avoid

1. ❌ **Don't edit** files in `_archive/admin-client-archived/`
2. ❌ **Don't edit** files in `unified-server/public/`
3. ❌ **Don't edit** auto-generated files in `packages/backend/public/`
4. ✅ **Do edit** source files in `packages/frontend/src/`
5. ✅ **Do edit** source files in `packages/backend/src/`

## Development Commands

```bash
# Install dependencies
npm run install:all

# Development (auto-rebuild)
cd packages/frontend && npm run dev
cd packages/backend && npm run dev

# Build for production
cd packages/frontend && npm run build
```

## Why This Structure?

This organization prevents AI confusion by:
- Clearly separating active vs archived code
- Preventing edits to wrong/outdated files
- Ensuring changes are made to files that are actually used
- Avoiding the cycle of good UI being overwritten by poor UI

**Remember: Always check you're editing files in `packages/` not `_archive/`**
