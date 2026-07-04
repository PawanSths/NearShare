# NearBeat

NearBeat helps people discover spontaneous nearby real-world events. Users can find events on an interactive map, join them, chat with attendees, and meet in person.

## Project Overview

This is a full-stack portfolio application built with:

- **Frontend:** React, Vite, TypeScript, Material UI, React Router, TanStack Query, Zustand
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO, JWT
- **Database:** PostgreSQL

## Folder Structure

```
NearBeat/
├── client/                 # React frontend
│   └── src/
│       ├── features/       # Feature modules (auth, events, chat, etc.)
│       ├── components/     # Shared UI components
│       ├── layouts/        # Page layouts
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API client services
│       ├── store/          # Zustand stores
│       ├── types/          # TypeScript types
│       ├── utils/          # Utilities and theme
│       └── assets/         # Static assets
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── routes/         # Express routes
│       ├── services/       # Business logic
│       ├── middleware/     # Express middleware
│       ├── validators/     # Zod request validators
│       ├── socket/         # Socket.IO handlers
│       ├── config/         # Configuration
│       └── utils/          # Utilities
│   └── prisma/             # Prisma schema and migrations
├── README.md
└── .gitignore
```

## Installation

### Prerequisites

- Node.js 20+ (tested with 20.13+; Vite 5 is used for broad compatibility)
- PostgreSQL 14+ (required from Database milestone onward)

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd NearBeat
```

2. Install server dependencies:

```bash
cd server
npm install
cp .env.example .env
```

3. Install client dependencies:

```bash
cd ../client
npm install
cp .env.example .env
```

4. Set up the database (see [Database Setup](#database-setup) below).

## Environment Variables

### Server (`server/.env`)

| Variable     | Description                          | Default                      |
| ------------ | ------------------------------------ | ---------------------------- |
| NODE_ENV     | Environment mode                     | development                  |
| PORT         | Server port                          | 3001                         |
| CLIENT_URL   | Frontend URL for CORS                | http://localhost:5173        |
| JWT_SECRET   | Secret for JWT signing               | (set in production)          |
| DATABASE_URL | PostgreSQL connection string         | `postgresql://postgres:postgres@localhost:5432/nearbeat?schema=public` |

### Client (`client/.env`)

| Variable     | Description     | Default               |
| ------------ | --------------- | --------------------- |
| VITE_API_URL | Backend API URL | http://localhost:3001 |

## Database Setup

### 1. Create the database

Create a PostgreSQL database named `nearbeat`:

```sql
CREATE DATABASE nearbeat;
```

### 2. Configure environment

Ensure `DATABASE_URL` is set in `server/.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nearbeat?schema=public
```

### 3. Run migrations

```bash
cd server
npm run db:migrate
```

This applies the Prisma migrations in `server/prisma/migrations/`.

### 4. Seed the database

```bash
npm run db:seed
```

This creates sample users, events, messages, notifications, reports, and blocks. All seed users share the password `password123`.

### Database Models

| Model             | Purpose                                      |
| ----------------- | -------------------------------------------- |
| User              | Accounts, profiles, roles, discovery radius  |
| Event             | Events with location, schedule, and status   |
| EventParticipant  | Join/leave tracking                          |
| Message           | Event chat messages                          |
| Notification      | In-app notifications                         |
| Report            | User and event reports                       |
| BlockedUser       | User blocking relationships                  |

Nearby event calculations use the Haversine formula (no PostGIS).

## Available Scripts

### Server

```bash
npm run dev      # Start development server with hot reload
npm run build    # Generate Prisma client and compile TypeScript
npm start        # Run production build
npm run lint     # Run ESLint
npm run test     # Run tests with Vitest
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (development)
npm run db:push      # Push schema without migration files
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio
```

### Client

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Type-check and build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Overview

| Endpoint        | Method | Description              | Auth |
| --------------- | ------ | ------------------------ | ---- |
| `/api/health` | GET | Health check (includes database status) | No |
| `/api/auth/register` | POST | Create a new user account and return a JWT | No |
| `/api/auth/login` | POST | Sign in with email/password and return a JWT | No |
| `/api/auth/me` | GET | Return the current authenticated user | Yes |
| `/api/profile/me` | GET | Get the current user's profile | Yes |
| `/api/profile/me` | PUT | Update profile (display name, username, bio, photo, interests, radius) | Yes |
| `/api/profile/me` | DELETE | Delete the current user's account | Yes |
| `/api/events` | GET | List active events | No |
| `/api/events` | POST | Create a new event | Yes |
| `/api/events/:id` | GET | Get event details with participant count | No |
| `/api/events/:id` | PUT | Update an event (organizer only) | Yes |
| `/api/events/:id` | DELETE | Delete an event (organizer only, notifies participants) | Yes |
| `/api/events/:id/join` | POST | Join an event (notifies organizer) | Yes |
| `/api/events/:id/leave` | POST | Leave an event | Yes |
| `/api/events/:id/cancel` | PATCH | Cancel an event (organizer only, notifies participants) | Yes |
| `/api/notifications` | GET | Get current user's notifications | Yes |
| `/api/notifications/:id/read` | PUT | Mark a notification as read | Yes |
| `/api/notifications/read-all` | PUT | Mark all notifications as read | Yes |
| `/api/reports` | POST | Report a user or event | Yes |
| `/api/blocks` | GET | Get blocked users | Yes |
| `/api/blocks/:id` | POST | Block a user | Yes |
| `/api/blocks/:id` | DELETE | Unblock a user | Yes |
| `/api/admin/users` | GET | List all users (admin only) | Admin |
| `/api/admin/events` | GET | List all events (admin only) | Admin |
| `/api/admin/reports` | GET | List all reports (admin only) | Admin |
| `/api/admin/users/:id/suspend` | PATCH | Suspend a user (admin only) | Admin |
| `/api/admin/users/:id/unsuspend` | PATCH | Unsuspend a user (admin only) | Admin |
| `/api/admin/users/:id` | DELETE | Delete a user (admin only) | Admin |
| `/api/admin/events/:id` | DELETE | Delete an event (admin only) | Admin |
| `/api/admin/reports/:id/reviewed` | PATCH | Mark report as reviewed (admin only) | Admin |
| `/api/admin/reports/:id/dismiss` | PATCH | Dismiss a report (admin only) | Admin |

### Socket.IO Events

| Event | Direction | Description |
| ----- | --------- | ----------- |
| `join:event` | Client → Server | Join an event's chat room |
| `leave:event` | Client → Server | Leave an event's chat room |
| `message:send` | Client → Server | Send a message (profanity filtered) |
| `messages:init` | Server → Client | Receive chat history on join |
| `message:new` | Server → Client | Receive a new message |
| `user:joined` | Server → Client | System notification: user joined |
| `user:left` | Server → Client | System notification: user left |

## Development Milestones

| #  | Milestone            | Status      |
| -- | -------------------- | ----------- |
| 1  | Project Setup        | Complete    |
| 2  | Database             | Complete    |
| 3  | Authentication       | Complete    |
| 4  | User Profile         | Complete    |
| 5  | Event CRUD           | Complete    |
| 6  | Interactive Map      | Complete    |
| 7  | Nearby Discovery     | Complete    |
| 8  | Join / Leave Events  | Complete    |
| 9  | Event Chat           | Complete    |
| 10 | Notifications        | Complete    |
| 11 | Safety Features      | Complete    |
| 12 | Admin Dashboard      | Complete    |
| 13 | Testing              | Complete    |
| 14 | UI Polish            | Complete    |
| 15 | Documentation        | Complete    |

## License

MIT
