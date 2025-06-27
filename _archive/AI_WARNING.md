# ⚠️ ARCHIVE DIRECTORY - DO NOT EDIT ⚠️

**🤖 AI ASSISTANTS: DO NOT MAKE CHANGES TO FILES IN THIS DIRECTORY**

## What This Directory Contains

This `_archive/` directory contains historical, legacy, and archived code that is **NO LONGER ACTIVE**.

### Archived Projects
- `admin-client-archived/` - OLD frontend code (replaced by `packages/frontend/`)
- `Admin_databoard/` - Legacy admin interface
- `Client_QR/` - Legacy client interface
- `unified-server-*` - Various legacy server configurations

## Why You Should NOT Edit These Files

1. **Files are not used** - These files are not part of the active codebase
2. **Changes won't appear** - Editing these files won't affect the running application
3. **Causes confusion** - Making changes here creates the exact problem we're trying to solve
4. **Overwrites good UI** - Build processes might copy poor quality UI from here

## Where to Make Changes Instead

### For Frontend Changes
- ✅ Edit: `packages/frontend/src/`
- ❌ Don't edit: `_archive/admin-client-archived/`

### For Backend Changes
- ✅ Edit: `packages/backend/src/`
- ❌ Don't edit: `_archive/unified-server-*/`

### For Database Changes
- ✅ Edit: `packages/backend/src/db/`
- ❌ Don't edit: `_archive/*/db/`

## If You Need Code from Archive

1. **Read** the archived code for reference
2. **Copy** useful parts to the active codebase in `packages/`
3. **Never edit** the archived files directly

## Remember

**The active codebase is in `packages/` - always make changes there!**
