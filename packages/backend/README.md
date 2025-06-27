# Backend Package

**⚠️ AI ASSISTANTS: EDIT FILES HERE FOR API/SERVER CHANGES ⚠️**

This is the active backend Node.js server for QR Menu Master.

## Directory Structure

```
packages/backend/
├── src/
│   ├── api/               # API route handlers
│   ├── config/            # Configuration files
│   ├── db/                # Database models and migrations
│   ├── services/          # Business logic services
│   └── index.ts           # Main server file
├── public/                # Built frontend assets (auto-generated)
│   ├── admin/            # Admin interface build
│   └── customer/         # Customer interface build
└── package.json          # Dependencies and scripts
```

## Important for AI Assistants

### ✅ DO EDIT - Source Files
- `src/api/` - API endpoints and routes
- `src/config/` - Server configuration
- `src/db/` - Database schemas and queries
- `src/services/` - Business logic
- `src/index.ts` - Server setup

### ❌ DON'T EDIT - Build Outputs
- `public/admin/` - Auto-generated admin UI
- `public/customer/` - Auto-generated customer UI

## Development Commands

```bash
# Development server with auto-restart
npm run dev

# Build TypeScript
npm run build

# Database operations
npm run db:init
npm run seed
```

## Making Changes

1. Edit source files in `src/`
2. Server auto-restarts in development
3. For database changes, run migrations

This is the ONLY location where backend changes should be made.
