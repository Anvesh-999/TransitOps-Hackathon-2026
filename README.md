# TransitOps — Smart Transport Operations Platform

A centralized, web-based fleet management platform that digitizes the full lifecycle of fleet operations — vehicle registry, driver management, trip dispatch, maintenance scheduling, fuel/expense tracking, and operational analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcrypt |
| Validation | Zod |
| Charts | Chart.js (react-chartjs-2) |
| Icons | lucide-react |

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Server
```bash
cd server
cp .env.example .env    # edit with your MongoDB URI
npm install
npm run seed            # load demo data
npm run dev             # starts on http://localhost:5000
```

### Client
```bash
cd client
npm install
npm run dev             # starts on http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@transitops.com | Admin@123 |
| Fleet Manager | rajesh@transitops.com | Fleet@123 |
| Driver | alex@transitops.com | Driver@123 |
| Safety Officer | priya@transitops.com | Safety@123 |
| Financial Analyst | meera@transitops.com | Finance@123 |

## Folder Structure

```
transitops/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── README.md
└── .gitignore
```

## Team & Contributions

| Developer | Modules |
|---|---|
| Dev 1 | Auth, Users, Roles, Middleware, Seed |
| Dev 2 | Vehicles, Drivers, Maintenance |
| Dev 3 | Trips, Dispatch, Notifications |
| Dev 4 | Dashboard, Reports, Fuel, Expenses, UI |
