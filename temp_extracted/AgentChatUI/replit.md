# AI Agents Group Chat Application

## Overview

This is a full-stack web application for creating and managing AI agents and organizing them into groups for collaborative conversations. Users can create custom AI agents with specific roles, form groups with multiple agents, and engage in chat conversations where agents can participate collectively.

The application follows a modern full-stack architecture with React/TypeScript on the frontend, Express on the backend, and PostgreSQL (via Neon) for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing (alternative to React Router)
- **TanStack Query (React Query)** for server state management, data fetching, and caching

**UI Component System**
- **shadcn/ui** component library (Radix UI primitives with Tailwind styling)
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Design approach**: Linear/Slack-inspired clean interface with three-panel layout
  - Left sidebar (280px): Agent and group management
  - Main chat area (flex-1): Conversation display
  - Right panel (320px, toggleable): Agent detail view
- **Inter** font family from Google Fonts for consistent typography

**State Management**
- **Zustand** for client-side UI state (selected group, panel visibility, selected agent)
- React Query handles all server state (agents, groups, messages)
- No global Redux/Context - lightweight state management approach

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for RESTful API endpoints
- **HTTP server** created with Node's native `http` module to enable potential WebSocket upgrades
- Middleware: JSON body parsing, URL encoding, raw body capture for webhooks

**API Structure**
- RESTful endpoints organized by resource:
  - `/api/agents` - CRUD operations for AI agents
  - `/api/groups` - CRUD operations for conversation groups
  - `/api/group-members` - Manage agent-group relationships
  - `/api/messages` - Retrieve and create chat messages
- Standard HTTP methods: GET, POST, PATCH, DELETE
- Response format: JSON with appropriate status codes

**Data Layer**
- **Storage abstraction**: `IStorage` interface with `DatabaseStorage` implementation
- Repository pattern separating database logic from route handlers
- All database operations return TypeScript-typed entities

### Data Storage

**Database**
- **PostgreSQL** via **Neon serverless** driver
- **Drizzle ORM** for type-safe database queries and schema management
- WebSocket-based connection using `ws` library for Neon's serverless architecture

**Schema Design**
- `users` - User authentication (currently defined, may not be actively used)
- `agents` - AI agent entities with name, role, description, and color
- `groups` - Conversation group containers
- `groupMembers` - Many-to-many relationship between agents and groups
- `messages` - Chat messages with sender tracking (user or agent)

**Database Tooling**
- Drizzle Kit for schema migrations (`db:push` script)
- Zod schema validation via `drizzle-zod` for runtime type checking
- Auto-generated UUIDs for primary keys using PostgreSQL's `gen_random_uuid()`

### External Dependencies

**Third-Party UI Libraries**
- **Radix UI** primitives (30+ components): Accessible, unstyled components for dialogs, dropdowns, tooltips, etc.
- **Lucide React** - Icon library for consistent iconography
- **cmdk** - Command palette component (though may not be actively used)
- **date-fns** - Date formatting and manipulation
- **class-variance-authority** & **clsx** - Utility for conditional CSS class management

**Development & Build Tools**
- **tsx** - TypeScript execution for dev server and build scripts
- **esbuild** - Fast JavaScript bundler for server-side code
- **Vite plugins**: 
  - Runtime error overlay (Replit-specific)
  - Cartographer and dev banner (Replit development tools)
- **PostCSS** with Autoprefixer for CSS processing

**Database & Backend**
- **@neondatabase/serverless** - Neon PostgreSQL client
- **drizzle-orm** - TypeScript ORM
- **ws** - WebSocket client (required for Neon connections)

**Potential Future Integrations** (packages installed but not actively used in visible code):
- Session management: `express-session`, `connect-pg-simple`, `memorystore`
- Authentication: `passport`, `passport-local`, `jsonwebtoken`
- File uploads: `multer`
- Email: `nodemailer`
- Payment processing: `stripe`
- AI APIs: `openai`, `@google/generative-ai`
- Rate limiting: `express-rate-limit`
- Excel processing: `xlsx`

**Development Environment**
- Designed for Replit deployment with environment-specific plugins
- Environment variable: `DATABASE_URL` required for database connection
- Development mode uses Vite dev server with middleware mode integrated into Express