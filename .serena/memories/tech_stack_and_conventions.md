# Tech Stack and Code Conventions

## Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Validation**: Zod schemas

## Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Code Conventions
- TypeScript strict mode enabled
- Functional components with hooks preferred
- Clean code principles: meaningful names, single responsibility
- No magic numbers - use named constants
- Self-documenting code over comments
- File-by-file changes preferred
- Preserve existing code structure