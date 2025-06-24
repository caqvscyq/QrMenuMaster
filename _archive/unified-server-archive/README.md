# Archive Directory

This directory contains archived files that are no longer actively used in the main project but are kept for reference and historical purposes.

## Directory Structure

### 📁 `tests/`
Contains all test files, debugging scripts, and development utilities:
- `test-*.js` - Various test scripts for different components
- `test-*.html` - HTML test pages for frontend testing
- `comprehensive-*.js` - Comprehensive system tests
- `final-*.js` - Final verification tests
- Browser testing files and session compatibility tests

### 📁 `debug/`
Contains debugging utilities and diagnostic tools:
- `debug-*.js` - Debug scripts for various components
- `debug-*.html` - Debug HTML pages
- Session debugging tools
- Database debugging utilities

### 📁 `docs/`
Contains project documentation and reports:
- `*.md` - Markdown documentation files
- Fix reports and implementation guides
- API mapping analysis
- Integration success reports
- Session management documentation
- Quick start guides

### 📁 `backup-configs/`
Contains backup configuration files:
- `*-KIU*` - Backup versions of configuration files
- Alternative package.json versions
- Environment file backups
- Index file backups

### 📁 `unused-files/`
Contains utility scripts that are no longer needed:
- `analyze-*.js` - Analysis scripts
- `check-*.js` - Verification scripts
- `fix-*.js` - Fix scripts
- `migrate-*.js` - Migration utilities
- `validate-*.js` - Validation scripts
- `verify-*.js` - Verification utilities
- PowerShell scripts

## Purpose

These files were moved to the archive to:

1. **Clean up the main project directory** - Remove clutter from development files
2. **Preserve development history** - Keep important debugging and testing tools
3. **Maintain reference materials** - Keep documentation and reports accessible
4. **Enable future debugging** - Preserve tools that might be useful later

## Usage

If you need to reference any of these files:

1. **For testing**: Check the `tests/` directory for relevant test scripts
2. **For debugging**: Use tools in the `debug/` directory
3. **For documentation**: Refer to files in the `docs/` directory
4. **For configuration**: Check `backup-configs/` for alternative setups

## Important Notes

- These files are **not part of the active codebase**
- They are **safe to delete** if disk space is needed
- They are **kept for reference only**
- Some may contain **outdated code** that doesn't reflect current implementation

## Restoration

If you need to restore any file to the main project:

```bash
# Example: Restore a test file
cp archive/tests/test-session-fix.js ./

# Example: Restore documentation
cp archive/docs/SESSION_MANAGEMENT_FIX_REPORT.md ./
```

---

**Last Updated**: June 18, 2025  
**Archive Created**: During session management fix implementation
