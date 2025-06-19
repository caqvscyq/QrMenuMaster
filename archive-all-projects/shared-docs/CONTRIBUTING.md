# Contributing

This project is structured with a single `unified-server` that provides all API endpoints and serves the frontend applications.

## Quick Start

The easiest way to start all components is to use the provided PowerShell script:

```powershell
.\start-all.ps1
```

This script will:
1. Kill any existing Node.js processes
2. Start the unified server on port 5000
3. Start the Admin Dashboard frontend on port 5173
4. Start the Client QR frontend on port 5174

## Manual Development Workflow

If you prefer to start each component manually, you will need to have three terminal windows open.

### 1. Run the Unified Server

The main server is located in the `unified-server` directory.

```bash
cd unified-server
npm install
npm run dev
```

This will start the backend server on `http://localhost:5000`.

### 2. Run the Admin Dashboard Frontend

The admin dashboard is located in the `Admin_databoard` directory.

```bash
cd Admin_databoard
npm install
npm run dev
```

This will start the frontend development server, which will be accessible at `http://localhost:5173` (or another port if 5173 is in use). API requests will be automatically proxied to the unified server.

### 3. Run the Customer QR Menu Frontend

The customer-facing QR menu is located in the `Client_QR` directory.

```bash
cd Client_QR
npm install
npm run dev
```

This will start the frontend development server, typically on a port like `http://localhost:5174`. API requests will be proxied to the unified server.

## Building for Production

To create a production build of the applications, you will need to run the `build` script in each of the frontend directories (`Admin_databoard` and `Client_QR`). The build artifacts will be placed in the `unified-server/public` directory, from where they are served.

## Troubleshooting

If you encounter database connection issues:

1. Make sure PostgreSQL is running on your system
2. Verify the connection string in `unified-server/.env` is correct
3. Ensure the database `qrmenu` exists
4. Check that all components are using port 5000 for API requests 