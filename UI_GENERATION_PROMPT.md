# Colombo Cosmetics - UI/UX Design Generation Prompt

## Project Overview
This prompt is designed to generate the visual identity, user flows, and component code for the **Colombo Cosmetics Order Management System**. This is a mobile-first PWA intended for use by staff and admins on smartphones.

---

## 🎨 Visual Identity & Theme
- **Brand Name:** Colombo Cosmetics
- **Core Aesthetic:** Minimalist, Elegant, Premium Beauty Brand.
- **Color Palette:**
    - **Primary:** Vibrant Hot Pink (`#FF3385`) - Main brand color, Buttons, Active states.
    - **Secondary:** Soft Pink (`#FFE6F0`) - Backgrounds, light accents.
    - **Accent:** Dark Charcoal (`#2D2D2D`) - Headings, Primary Text.
    - **Background:** White (`#FFFFFF`) & Very Light Pink Tint (`#FFF9FB`) - Clean, feminine feel.
    - **Status Colors:** 
        - Success/Delivered: Sage Green (`#4CAF50`)
        - Warning/Pending: Golden Orange (`#FF9800`)
        - Error/Cancelled: Soft Red (`#F44336`)
- **Typography:**
    - Headings: `Playfair Display` or `Merriweather` (Classic Serif for elegance).
    - Body: `Inter`, `Manrope`, or `Poppins` (Clean Sans-serif for readability).
- **Style Elements:** 
    - **Glassmorphism:** Subtle blur effects on cards/modals.
    - **Rounded Corners:** Soft `rounded-2xl` or `rounded-3xl` for mobile friendliness.
    - **Shadows:** Soft, diffused drop shadows (e.g., `shadow-lg`, `shadow-soft-pink`).

---

## 📱 Platform & Accessibility
- **Target Device:** Mobile First (Smartphone Viewport: 375px - 430px width).
- **Navigation:** Bottom Tab Bar (Dashboard, Orders, Products, Profile) for easy thumb reach.
- **Interactions:** Large touch targets (min 44px height), swipe gestures for list items.

---

## 🖥️ Screen Generation Directives

### 1. Login Screen
- **Visuals:** Minimalist logo centered at top. Clean input fields with floating labels. Primary "Sign In" button with gradient background (Hot Pink -> Soft Pink).
- **Prompt:** "Generate a mobile login screen for a high-end cosmetics brand app. Minimalist white background, hot pink primary button, 'Colombo Cosmetics' logo in serif font at the top. Inputs for Email/Password with soft shadows."

### 2. Dashboard Home
- **Visuals:** Greeting header ("Hello, Admin"). Quick stats cards in a grid (Total Orders, Today's Sales). Recent Activity list below.
- **Components:** `StatCard` (Icon + Value + Label), `ActivityList` (Order # + Status Badge + Time).
- **Prompt:** "Design a mobile dashboard for an order management app. Top section has a greeting and 4 square cards showing key metrics (Orders, Profit) with hot pink icons. Bottom section lists 'Recent Orders' with status badges."

### 3. Order List View
- **Visuals:** Scrollable list of order cards. Each card shows: Customer Name, Order ID, Status Badge, Total Amount. Filter pills at the top (All, Pending, Dispatched).
- **Components:** `OrderCard` with status color-coding. Floating Action Button (FAB) (+) at bottom right to Create Order.
- **Prompt:** "Create a mobile order list UI. Cards with white background and soft shadow. Each card displays customer name, order ID #12345, and a pill-shaped status badge (e.g., 'Pending' in yellow). Filter tabs at the top: All, Pending, Delivered."

### 4. Create Order Flow (Wizard)
- **Visuals:** Step-based form (Customer -> Products -> Shipping -> Review).
- **Interaction:** Dynamic product search bar. Quantity counters (- 1 +).
- **Prompt:** "Design a 'New Order' screen for mobile. Step 1: Customer Details form. Step 2: Product selection with a search bar and list of items with quantity steppers. Clean, spacious layout with a 'Next' button fixed at the bottom."

### 5. Order Details & Receipt
- **Visuals:** Detailed view of an order. Sectioned layout: Customer Info, Items List (Table-like), Shipping Info, Payment Summary. 'Generate Receipt' button prominent.
- **Prompt:** "Mobile UI for Order Details. Sections for Customer Info, Order Items list with prices, and a 'Payment Summary' at the bottom showing Subtotal, Shipping, and Total. Large 'Download Receipt' button at the bottom."

---

## 🛠️ Code Implementation Guidelines (for Frontend Generator)
- **Framework:** React + Tailwind CSS.
- **Icons:** Lucide React or Heroicons (Outline style).
- **Components Directory:** Keep components small (`Button.tsx`, `Card.tsx`, `Badge.tsx`).
- **Responsive:** Ensure `md:hidden` or `lg:block` classes are used correctly if adapting for desktop later, but prioritize generic mobile styles first.
