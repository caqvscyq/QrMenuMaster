# Frontend Package

**⚠️ AI ASSISTANTS: EDIT FILES HERE FOR UI CHANGES ⚠️**

This is the active frontend React application for QR Menu Master.

## Directory Structure

```
packages/frontend/
├── src/
│   ├── pages/
│   │   ├── admin/          # Admin dashboard pages
│   │   └── customer/       # Customer interface pages
│   ├── components/         # Shared UI components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## Important for AI Assistants

### ✅ DO EDIT - Source Files
- `src/pages/admin/` - Admin interface components
- `src/pages/customer/` - Customer interface components  
- `src/components/` - Shared UI components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

### ❌ DON'T EDIT - Build Outputs
- Files in `packages/backend/public/` (auto-generated)
- Files in `unified-server/public/` (legacy)

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Build admin interface
npm run build:admin

# Build customer interface  
npm run build:customer
```

## Making Changes

1. Edit source files in `src/`
2. Run build command to see changes
3. Changes appear in the served application

This is the ONLY location where UI changes should be made.
