# Customer Interface Source Files

**⚠️ AI ASSISTANTS: EDIT FILES HERE FOR CUSTOMER INTERFACE CHANGES ⚠️**

This directory contains the source code for the customer-facing interface:

- `menu.tsx` - Menu display and item selection
- `cart.tsx` - Shopping cart functionality  
- `orders.tsx` - Order history and tracking
- `new-feature.tsx` - Additional customer features

## Important Development Notes

### For AI Assistants
- ✅ **DO EDIT**: Files in this directory (`admin-client/src/pages/customer/`)
- ❌ **DON'T EDIT**: Files in `unified-server/public/customer/` (these are auto-generated)

### To See Changes
After editing files here, run:
```bash
npm run dev:customer  # For auto-rebuild during development
# OR
npm run build:customer  # For one-time build
```

### Build Process
Files in this directory are compiled/bundled and output to:
`unified-server/public/customer/`

The server serves the compiled files, not these source files directly. 