# QR Menu Master - Project Overview

## Purpose
QR Menu Master is a unified restaurant ordering system that allows customers to scan QR codes to view menus, place orders, and make payments. It includes both customer-facing interfaces and admin management dashboards.

## Architecture
- **unified-server**: Node.js/Express backend with TypeScript, PostgreSQL database using Drizzle ORM
- **admin-client**: React frontend with TypeScript, Vite build tool, Tailwind CSS, built into static files served by unified-server
- **Customer Interface**: Built from admin-client source but served as separate static files

## Key Components
- Customer menu browsing and ordering
- Shopping cart with customizations
- Admin dashboard for orders, analytics, customers
- Real-time order tracking with Socket.IO
- QR code scanning functionality
- Database management with migrations