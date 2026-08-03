# Military Asset Management System (MAMS)

The Military Asset Management System (MAMS) is an enterprise-grade full-stack application designed to track critical military assets (vehicles, weapons, ammunition) across multiple military bases.

**Deployment Link:** [Your Live Link Here]
**Video Demo:** [Your Demo Link Here]

## Features

- **End-to-End Asset Visibility:** Calculates real-time opening balances, net movements, assignments, expenditures, and closing balances dynamically without relying on duplicate data.
- **Operational Accountability:** Cross-base asset transfers are executed with strict database transactions (ACID compliance) and backed by robust audit trails.
- **Granular Security (RBAC):** Strict Role-Based Access Control ensuring:
  - **Base Commanders** only view and manage assets related to their specific base.
  - **Logistics Officers** manage the global supply chain (purchases and transfers).
  - **Admins** have global, unrestricted control.
- **Full E2E Testing:** Playwright is used to rigorously test complex RBAC scoping and inventory edge cases.

## System Architecture

```mermaid
graph TD;
    Client[React SPA] -->|HTTPS API Requests| API[Express API Server]
    API -->|Prisma ORM| DB[(PostgreSQL)]
    
    subgraph Backend Layers
    API --> Middleware(RBAC & Auth)
    Middleware --> Controllers(Controllers & Transactions)
    end
```

## Relational Database Schema

```mermaid
erDiagram
    Base ||--o{ User : "houses"
    Base ||--o{ Purchase : "receives"
    EquipmentType ||--o{ Purchase : "categorizes"
    Base ||--o{ Transfer : "is source of"
    Base ||--o{ Transfer : "is destination of"
    User ||--o{ Transfer : "initiates"
    User ||--o{ AuditLog : "performs"

    Base {
        int id PK
        string name
        string location
    }
    User {
        int id PK
        string username
        string passwordHash
        string role
        int baseId FK
    }
```

## Deployment Guide (Render)

This project uses a unified multi-stage Dockerfile that builds the Vite frontend and the Express backend into a single container. The backend serves the compiled frontend assets directly from its `/public` folder.

1. Create a new "Web Service" in Render.
2. Select "Docker" as your runtime.
3. Add the following environment variables:
   - `DATABASE_URL`: Your Postgres connection string.
   - `JWT_SECRET`: A secure randomized secret key.
   - `PORT`: 5000 
4. Run `npx prisma db push && node prisma/seed.js` manually on your database (via connection string locally or in Render shell) to seed the initial roles.

## Sample Credentials

Since user registration is intentionally hidden for security, you must seed the database using `node prisma/seed.js` or via Docker deployment hooks. The default seeded credentials are:

| Role | Username | Password | Base Assigned |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin_user` | `AdminPass123!` | Global |
| **Base Commander** | `commander_alpha` | `CommandPass123!` | Base #1 |
| **Logistics Officer** | `logistics_officer`| `LogisticsPass123!` | Global |

## Development Setup

1. **Clone & Install:**
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
2. **Database:** Create a Postgres DB and place the string in `backend/.env`.
3. **Run:** Start both servers using `npm run dev` in their respective folders.
