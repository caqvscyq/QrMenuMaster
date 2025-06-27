# Shared Package

**⚠️ AI ASSISTANTS: EDIT FILES HERE FOR SHARED TYPES/UTILITIES ⚠️**

This package contains shared TypeScript types and utilities used by both frontend and backend.

## Directory Structure

```
packages/shared/
├── types/
│   ├── api.ts            # API request/response types
│   ├── database.ts       # Database model types
│   └── common.ts         # Common shared types
├── utils/
│   ├── validation.ts     # Validation utilities
│   └── helpers.ts        # Helper functions
└── schema.ts             # Zod schemas for validation
```

## Important for AI Assistants

### ✅ DO EDIT - Shared Code
- `types/` - TypeScript type definitions
- `utils/` - Shared utility functions
- `schema.ts` - Validation schemas

### Usage
- Import in frontend: `import { Type } from '@shared/types'`
- Import in backend: `import { Type } from '@shared/types'`

## Making Changes

1. Edit shared types/utilities here
2. Both frontend and backend can import
3. Ensures type consistency across packages

This ensures type safety and code reuse between frontend and backend.
