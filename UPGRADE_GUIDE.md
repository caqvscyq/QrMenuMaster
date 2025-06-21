# 🚀 Upgrade Guide: Smart Database Initialization

This guide helps you transition from the old automatic database reset system to the new smart initialization system that preserves your development data.

## 🎯 What Changed?

### Before (Old System)
- Every `npm run dev` automatically reset the database
- All orders, sessions, and user data were lost on restart
- No way to preserve development work between sessions

### After (New System)
- `npm run dev` uses smart initialization that preserves existing data
- Database is only seeded when completely empty
- Manual database management commands available when needed
- Development data persists between restarts

## 🔄 Migration Steps

### Step 1: Update Your Workflow

**Old workflow:**
```bash
npm run dev  # This used to reset everything
```

**New workflow:**
```bash
npm run dev  # This now preserves your data!
```

### Step 2: Migrate Existing Database (Optional)

If you have an existing database, run the migration script:

```bash
cd unified-server
node migrate-to-smart-init.js
```

This will:
- ✅ Preserve all existing data
- ✅ Update database schema
- ✅ Ensure compatibility with new system

### Step 3: Learn New Commands

**Check database status:**
```bash
npm run db:status
```

**Force reset when needed:**
```bash
npm run db:reset  # DESTRUCTIVE - use carefully
```

**Smart seed (safe):**
```bash
npm run seed  # Only seeds if database is empty
```

## 🛠️ New Tools Available

### Database Manager
```bash
cd unified-server
node db-manager.js help  # Show all options
```

### Enhanced PowerShell Script
```powershell
.\start-dev-with-options.ps1 -Help  # Show all options
```

## 🔍 Troubleshooting

### "My database seems corrupted"
```bash
npm run db:reset  # Complete reset
```

### "I want fresh test data"
```bash
npm run seed:force  # Force reseed (destructive)
```

### "I want to check what's in my database"
```bash
npm run db:status  # Check initialization status
```

### "I want to update schema without losing data"
```bash
npm run db:init  # Schema update only
```

## 📋 Quick Reference

| Command | Safe? | Description |
|---------|-------|-------------|
| `npm run dev` | ✅ Safe | Start development (preserves data) |
| `npm run seed` | ✅ Safe | Smart seed (only if empty) |
| `npm run db:init` | ✅ Safe | Update schema only |
| `npm run db:status` | ✅ Safe | Check database status |
| `npm run seed:force` | ⚠️ Destructive | Force reseed (clears data) |
| `npm run db:reset` | ⚠️ Destructive | Complete reset |

## 🎮 PowerShell Scripts

| Script | Safe? | Description |
|--------|-------|-------------|
| `.\start-dev-with-options.ps1` | ✅ Safe | Enhanced development start |
| `.\start-dev-with-options.ps1 -Reset` | ⚠️ Destructive | Start with database reset |
| `.\start-dev.ps1` | ✅ Safe | Legacy script (updated) |

## 💡 Best Practices

1. **Use the safe commands for daily development:**
   ```bash
   npm run dev  # Your data is preserved!
   ```

2. **Check status when in doubt:**
   ```bash
   npm run db:status
   ```

3. **Use destructive commands sparingly:**
   ```bash
   npm run seed:force  # Only when you need fresh data
   ```

4. **Backup important test scenarios:**
   - Document your test orders and sessions
   - Export important data before major changes

## 🆘 Need Help?

### Common Issues

**Q: My development server won't start**
```bash
npm run db:status  # Check database
npm run db:init    # Fix schema issues
```

**Q: I want to start fresh**
```bash
npm run db:reset   # Complete reset
npm run dev        # Start development
```

**Q: I want to preserve some data but refresh menu items**
This requires manual database operations. Consider:
1. Export important orders/sessions
2. Run `npm run seed:force`
3. Manually restore important data

**Q: The new system isn't working**
```bash
cd unified-server
node migrate-to-smart-init.js  # Run migration
npm run dev                    # Try again
```

## 📖 Additional Resources

- [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md) - Comprehensive database guide
- [README.md](README.md) - Updated project documentation
- `unified-server/db-manager.js help` - Database utility help

## 🎉 Benefits of New System

- ✅ **Data Persistence**: Your test orders and sessions survive restarts
- ✅ **Flexible Management**: Choose when to reset vs. preserve
- ✅ **Better Development**: Test complex workflows without losing progress
- ✅ **Safe by Default**: Accidental data loss is prevented
- ✅ **Easy Reset**: Still easy to get fresh data when needed

Welcome to a better development experience! 🚀
