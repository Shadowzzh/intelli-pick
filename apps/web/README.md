# Sift Web Dashboard

Real-time web dashboard for the Sift content filtering system.

## Features

- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🌙 Kanagawa Dark (dark) and Zebra (light) themes
- 📊 Real-time content updates via WebSocket
- 🔍 Advanced filtering and search
- 📱 Responsive grid layout
- ♾️ Infinite scroll for content list
- 🏷️ Entity extraction and tracking
- 📈 Live statistics

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

Create `.env.local`:

```bash
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Architecture

- **Frontend**: React 18 + Vite 5 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Real-time**: Socket.IO Client
- **API**: GraphQL + REST (from apps/api)

## Deployment

Build as static site and deploy to any static hosting service (Vercel, Netlify, etc.).
