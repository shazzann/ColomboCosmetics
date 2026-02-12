# Colombo Cosmetics - Development Roadmap (TODO)

## Phase 1: Project Initialization
- [ ] Initialize Git repository
- [ ] Set up Frontend (React + Vite + Tailwind CSS)
    - [ ] Configure PWA plugin
    - [ ] Setup Axios/React Query
- [ ] Set up Backend (Node.js + Express)
    - [ ] Configure PostgreSQL (Supabase) connection
    - [ ] Setup Prisma ORM
- [ ] Create Database Schema (Users, Products, Orders, OrderItems)

## Phase 2: Authentication & User Management
- [ ] Implement JWT Authentication (Login)
- [ ] Implement Middleware for Role-Based Access Control (Admin/Staff)
- [ ] Create Staff Management UI (Admin only)
- [ ] Seed default Admin user

## Phase 3: Core Features (Backend First)
- [ ] Product Management API (CRUD)
- [ ] Order Management API (Create, Read, Update Status)
- [ ] Shipping Calculation Logic (PO, COD, Speed)
- [ ] Profit Calculation Logic
- [ ] Receipt Data Aggregation Logic

## Phase 4: Frontend Development
- [ ] Login Screen
- [ ] Dashboard (Summary Stats)
- [ ] Product List & Create/Edit Forms
- [ ] Order Creation Flow
    - [ ] Customer Details Entry
    - [ ] Product Selection & Quantity
    - [ ] Shipping Method Selection
    - [ ] Review & Submit
- [ ] Order Management View
    - [ ] List Orders (Filter by Status)
    - [ ] Order Details View
    - [ ] Update Status Actions
- [ ] Receipt Generation & Download (PDF)

## Phase 5: Reporting & Polish
- [ ] Implement Sales Reports (Date Range)
- [ ] Mobile Responsiveness Testing & Fixes
- [ ] PWA Installability Check
- [ ] Secure Deployment (Vercel + Railway)
