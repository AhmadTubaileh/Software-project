## Frontend Architecture and Spec (Electronic Store + Internal Management)

This document outlines the initial frontend plan to build the online store and the internal management system, with role-based access for Customer, Worker (POS), and Admin.

### Goals
- Customer-facing online store with browsing, cart, and checkout.
- Authentication with username, email, and password.
- Role-based worker/admin UI (hidden menu items for privileged users).
- Installment vs cash selection per item; payment on delivery (no online payments yet).
- Installment requests carry a status: `pending`, `accepted`, `rejected` managed by Admin/Co-admin.
- Maintenance/service flow to log and track repair tickets (scaffold only in MVP UI).

### Tech Stack (Frontend)
- React (current CRA setup)
- React Router (for navigation)
- State: minimal local state to start; elevate to context for auth/session and cart
- UI Library: to be confirmed (MUI/AntD/Tailwind). Default: vanilla + simple components until approved

### App Structure (Proposed)
```
src/
  app/
    routes.tsx            // central routing config
    AppProviders.tsx      // Context providers (Auth, Cart, UI)
  components/
    Navbar/
    Sidebar/
    ProtectedRoute/
    RoleGate/             // show/hide by role
    Modal/
  features/
    auth/
      AuthContext.tsx
      SignInUpModal.tsx
      types.ts
    cart/
      CartContext.tsx
      CartDrawer.tsx
    catalog/
      Home.tsx
      ProductDetails.tsx
    checkout/
      Checkout.tsx
      InstallmentForm.tsx
    dashboard/
      Dashboard.tsx       // role-based layout
      POS.tsx
      Inventory.tsx
      Orders.tsx
      ServiceTickets.tsx
      UsersRoles.tsx       // admin only
  utils/
    storage.ts            // localStorage helpers (mock persistence)
    forms.ts
  index.js                // wraps App with providers and router
  App.js                  // high-level layout + routes outlet
```

### Pages & Routes (V1)
- Public
  - `/` Home (Store) — list products, filter/sort
  - `/product/:id` Product Details — description, price, choose cash/installment (selection stored in cart line item)
  - `/cart` Cart — items, totals, proceed to checkout (gated if not logged in)
  - `/sign` Sign modal triggered as needed (modal route or UI state)
- Auth-Gated (Customer)
  - `/checkout` Checkout — confirm shipping/contact, choose payment-on-delivery
- Auth-Gated (Worker/Admin)
  - `/dashboard` Dashboard landing (role-aware)
  - `/dashboard/pos` POS — add via search/scan (barcode later), create orders
  - `/dashboard/inventory` Inventory — CRUD products (admin/worker with permission)
  - `/dashboard/orders` Orders — list/search, view details
  - `/dashboard/service-tickets` Service Tickets — create/update statuses
  - `/dashboard/users` Users & Roles — admin only

Route protection logic:
- Use `ProtectedRoute` to guard paths; use `RoleGate` to hide/show specific UI (sidebar items).

### Roles & Permissions
- Customer: browse, cart, checkout, view own orders.
- Worker (POS): access POS, inventory (as configured), orders, service tickets.
- Admin/Co-admin: all worker pages plus users/roles, approve installment requests.

### Authentication (Mock for now)
- Sign Up: username, email, password.
- Sign In: username (or email) + password.
- Session persisted in `localStorage` (until backend API exists).
- User object shape:
```ts
type User = {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'worker' | 'admin' | 'coadmin';
};
```

### Cart & Checkout
- Cart line item includes payment preference: `cash` or `installment` (selected per item).
- Checkout confirms delivery info and payment-on-delivery.
- If any item is `installment`, create an Installment Request.

### Installment Requests
- Status lifecycle: `pending` → (`accepted` | `rejected`) by Admin/Co-admin.
- Additional fields required when choosing installment:
  - Personal ID number
  - Sponsor information (one or more sponsors: full name, phone, relation, ID)
  - Employment/income info (optional for now, placeholder fields)
- Data model (frontend mock):
```ts
type InstallmentRequest = {
  id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string; // ISO
  personalId: string;
  sponsors: Array<{ name: string; phone: string; relation: string; idNumber: string }>;
  notes?: string;
};
```

### Service/Maintenance (Scaffold)
- Create and track tickets with simple statuses: `received`, `in_progress`, `ready`, `delivered`.
- Assign to technicians later (role to be added in future).

### Navigation UI
- Top `Navbar` for store pages (Home, Cart, Sign In/Out).
- `Sidebar` on Dashboard for worker/admin; items filtered by role.

### State Management
- `AuthContext`: current user, sign-in/up/out, role checks.
- `CartContext`: items, add/remove/update, payment preference per item.
- LocalStorage-backed persistence for session/cart in MVP.

### Modals & Gated Actions
- Attempting checkout when not signed-in triggers `SignInUpModal`.
- Choosing `installment` for an item triggers `InstallmentForm` modal to collect required fields.

### Backend Integration (Later)
- Replace mock services with API calls (Node.js backend).
- Auth endpoints: `/auth/register`, `/auth/login`, `/auth/me`.
- Products: `/products`, `/products/:id`.
- Orders: `/orders`.
- Installments: `/installments` (approve/reject by Admin/Co-admin).
- Service Tickets: `/tickets`.

### Accessibility & i18n
- Use semantic elements, labeled inputs, focus traps for modals.
- Prepare strings for i18n later.

### MVP Checklist
- Routing skeleton
- Auth context + mock persistence
- Role-gated navigation
- Store pages (Home, Product, Cart)
- Checkout with payment-on-delivery
- Installment selection + data capture (modal)
- Dashboard pages (POS, Inventory, Orders, Service Tickets, Users)

---
Review this structure. Once you approve, I will scaffold the folders/files and minimal components, without backend, and wire mock auth and protected routes.


