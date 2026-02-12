# System Design Document: Colombo Cosmetics - Order Management System

**Version:** 1.0  
**Project:** Order Management System (PWA)  
**Client:** Colombo Cosmetics  
**Author:** Antigravity (Google DeepMind)

## 1. System Overview

This system is a **Mobile-First Web Application (PWA)** designed to manage orders, shipping, receipts, and reporting for Colombo Cosmetics.

### Architecture

The application follows a standard **Client-Server-Database** architecture, optimized for cloud deployment and mobile usage.

- **Frontend (Client):** React.js (Vite) + Tailwind CSS + PWA functionality.
- **Backend (API):** Node.js + Express.js.
- **Database:** PostgreSQL (Supabase) via Prisma ORM (optional but recommended for type safety).
- **Deployment:** Vercel (Frontend), Railway (Backend), Supabase (PostgreSQL).

## 2. Technology Stack

### Frontend
- **Framework:** React 18+ (Vite)
- **Language:** JavaScript/TypeScript (TS Recommended)
- **Styling:** Tailwind CSS (Mobile-responsive UI)
- **State Management:** React Context API / Zustand
- **HTTP Client:** Axios / React Query
- **PWA:** Vite PWA Plugin (Service Worker, Manifest)
- **PDF Generation:** `react-pdf` or `jspdf`

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript/TypeScript
- **ORM:** Prisma or Sequelize (Prisma recommended for PostgreSQL)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens) + Bcrypt
- **CORS:** Enabled for frontend domain

### Infrastructure
- **Deployment:** Vercel (Client), Railway (Server)
- **Database Hosting:** Supabase
- **Version Control:** Git (GitHub/GitLab)

## 3. Database Schema Design (ERD Concept)

### Tables

1.  **Users**
    - `id` (UUID, PK)
    - `name` (String)
    - `email` (String, Unique)
    - `password_hash` (String)
    - `role` (Enum: 'ADMIN', 'STAFF')
    - `created_at` (Timestamp)

2.  **Products**
    - `id` (UUID, PK)
    - `name` (String)
    - `cost_price` (Decimal)
    - `default_selling_price` (Decimal, Optional)
    - `created_at` (Timestamp)
    - `updated_at` (Timestamp)

3.  **Orders**
    - `id` (String - Auto-generated unique ID, PK)
    - `customer_name` (String)
    - `mobile_number` (String)
    - `address` (Text)
    - `order_date` (Timestamp)
    - `status` (Enum: 'PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED')
    - `shipping_method` (Enum: 'PO', 'COD', 'SPEED')
    - `shipping_cost` (Decimal)
    - `total_selling_price` (Decimal)
    - `total_cost_price` (Decimal)
    - `net_profit` (Decimal)
    - `created_by` (FK -> Users.id)
    - `created_at` (Timestamp)
    - `updated_at` (Timestamp)

4.  **OrderItems**
    - `id` (UUID, PK)
    - `order_id` (FK -> Orders.id)
    - `product_id` (FK -> Products.id)
    - `product_name` (String - Snapshot)
    - `quantity` (Integer)
    - `cost_price` (Decimal - Snapshot)
    - `selling_price` (Decimal - Snapshot)
    - `total_item_value` (Decimal)

5.  **AuditLogs**
    - `id` (UUID, PK)
    - `user_id` (FK -> Users.id)
    - `action` (String - e.g., "STATUS_CHANGE")
    - `target_id` (String - e.g., Order ID)
    - `previous_value` (Json/Text)
    - `new_value` (Json/Text)
    - `timestamp` (Timestamp)

## 4. API Endpoints Plan

### Authentication
- `POST /api/auth/login` - Authenticate user & return JWT.
- `POST /api/auth/register` (Admin only) - Create new users.

### Products
- `GET /api/products` - List all products.
- `POST /api/products` - Create a product.
- `PUT /api/products/:id` - Update a product.
- `DELETE /api/products/:id` - Delete a product.

### Orders
- `GET /api/orders` - List orders (Search, Filter, Sort Support).
- `GET /api/orders/:id` - Get single order details with items.
- `POST /api/orders` - Create new order (Calculate profit/costs backend-side).
- `PATCH /api/orders/:id/status` - Update order status (Log in AuditLogs).
- `PUT /api/orders/:id` - Update order details.

### Dashboard & Reports
- `GET /api/dashboard/stats` - return summary stats (Total Orders, Sales, Profit, Pending Count, Returned Count).
- `GET /api/reports/sales` (Query Params: startDate, endDate, status) - Generate report data.

## 5. Security & Validation

- **Input Validation:** Zod or Joi on backend for all payloads.
- **Authentication:** JWT in HTTP-only cookies or Authorization header.
- **RBAC:** Middleware to check roles (e.g., Only Admin can see financial reports or delete certain items).
- **HTTPS:** Enforced in production.

## 6. Frontend Key Screens (Mobile First)

1.  **Login Screen**
2.  **Dashboard (Home)** - Key metrics at a glance.
3.  **Order List** - Search bar, Filter pill buttons, Order Cards.
4.  **Create Order Form** - Multi-step or Single page with dynamic item adding.
5.  **Order Details** - View details, Print Receipt button, Change Status dropdown.
6.  **Product Management** - List & Edit forms.
7.  **Reports** - Date picker & basic charts/tables.
