# Task Completion Guidelines

## After Making Code Changes
1. **Build customer interface**: `npm run build:customer` (if customer UI was modified)
2. **Build admin interface**: `npm run build` (if admin UI was modified)
3. **Restart development server**: `npm run dev` or `npm run dev:customer`
4. **Test functionality**: Verify changes work as expected
5. **Check for linter errors**: Fix any TypeScript or build errors

## File Structure Rules
- **Edit source files**: Always modify files in `admin-client/src/` for UI changes
- **Never edit**: Files in `unified-server/public/` (these are auto-generated)
- **Customer interface source**: `admin-client/src/pages/customer/`
- **Admin interface source**: `admin-client/src/pages/admin/`

## Testing and Validation
- Test in browser after builds complete
- Check both customer and admin interfaces if changes affect both
- Verify database operations work correctly
- Test real-time features if modified

## Important Notes
- Customer interface changes require `npm run build:customer` to see results
- Development mode with auto-rebuild: `npm run dev:customer`
- Always preserve existing functionality when making changes