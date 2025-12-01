# Copilot Instructions for Software-Project

## Project Overview

**Electronic Store + Internal Management System** - A full-stack MERN application with role-based access (Customer, Worker/POS, Admin). Manages product sales, contracts, payments, employee duty hours, projects, and tasks.

## Architecture Quick Start

### Backend Stack
- **Runtime**: Node.js + Express (port 5000)
- **Database**: MySQL with `mysql2` driver
- **Key Dependencies**: `bcryptjs` (auth), `multer` (file uploads), `cors`, `dotenv`
- **Structure**: Routes → Models → Database
  - `routes/` - Express route handlers for each entity
  - `models/` - Database query methods (callback-based)
  - `config/database.js` - MySQL connection singleton

### Frontend Stack
- **Framework**: React 19 + Vite (dev: `npm run dev`, build: `npm run build`)
- **Routing**: React Router v7 DOM (page-based routing in `src/pages/`)
- **State Management**: LocalStorage + React hooks (no Redux/Context API yet)
- **Key Dependencies**: `react-hot-toast` (notifications), `react-router-dom`
- **Structure**: Components → Pages → Services → Utils

## Critical Developer Workflows

### Backend
```bash
cd Backend
npm run dev          # Start with nodemon (watches for changes)
npm start            # Production mode
```
**Environment Setup**: Create `.env` with `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`

### Frontend
```bash
cd Frontend/Frontend-Project
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build to dist/
npm run lint         # ESLint check
```
**API Base URL**: Hardcoded as `http://localhost:5000/api` in all service classes (e.g., `src/services/employeeApi.js`)

### Database Workflow
- Models use callback-based `db.query()` (not Promises)
- Employee model in `Backend/models/Employee.js` is the pattern: static methods accepting callbacks
- Password hashing: `bcryptjs` in auth routes; passwords stored hashed in `users` table

## Project-Specific Patterns

### 1. File Upload Handling
**Backend Difference**: Two upload strategies coexist:
- **Items** (`Backend/routes/items.js`): Uses memory storage → base64 encoding in response
- **Tasks** (`Backend/routes/tasks.js`): Uses disk storage → serves via `/uploads/tasks` static route
- **Middleware** (`Backend/middleware/upload.js`): Memory storage, 5MB limit, image-only filter

**Frontend**: FormData sent directly (no JSON headers) to multipart/form-data endpoints

Example:
```javascript
// Backend: Handle multipart form
router.post('/', upload.single('item_image'), (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null; // Memory storage
});

// Frontend: Use FormData
const formData = new FormData();
formData.append('name', item.name);
formData.append('item_image', fileInput.files[0]);
fetch(`${API_BASE_URL}/items`, { method: 'POST', body: formData });
```

### 2. Authentication & Session
- **Backend**: Validates against `users` table; returns user object with `id`, `username`, `email`, `user_type`
- **Frontend**: Session stored in `localStorage` key `frontend_user` (JSON string)
- **Hook**: `useLocalSession()` in `src/hooks/useLocalSession.js` reads/writes localStorage
- **Access**: Via `currentUser` state; clear on logout

**User Types**: "customer", "worker", "admin", "coadmin" (role-based menu visibility via sidebar)

### 3. API Service Classes
All frontend services use a static class pattern with `fetch` (no axios):
```javascript
// Example: src/services/employeeApi.js
class EmployeeApi {
  static async getAllEmployees() {
    const response = await fetch(`${API_BASE_URL}/employees`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  }
}
```
**Services Exist For**: employees, items, pos (create service if adding new domain)

### 4. Component Organization
- **Pages**: `src/pages/` - Route entry points (e.g., `MyTasks.jsx`, `ProjectManagement.jsx`)
- **Components**: `src/components/` - Reusable UI (organized by domain: `AdminDutyHours/`, `PaymentProcessing/`, etc.)
- **Data Access**: Fetch in useEffect; no context/provider pattern yet
- **Notifications**: `react-hot-toast` with `toast()` imported from 'react-hot-toast'

### 5. Routing Patterns
Routes defined in `src/App.jsx` (centralized):
- Public: `/`, `/contract-application`
- Auth-gated: `/employees`, `/items`, `/pos`, `/contract-management`, `/payment-processing`, `/my-tasks`, `/admin-duty-hours`
- Nested: `/project/:id`, `/task-archive`

**Sidebar Role Gating**: `AdminSidebar.jsx` hides menu items based on `currentUser.user_type`

## Key File Reference

| Purpose | Location |
|---------|----------|
| App routing | `Frontend/Frontend-Project/src/App.jsx` |
| Auth logic | `Backend/routes/auth.js` |
| Employee CRUD | `Backend/models/Employee.js`, `Backend/routes/employees.js` |
| Item images | `Backend/routes/items.js`, `src/services/itemApi.js` |
| Task attachments | `Backend/routes/tasks.js` (disk storage) |
| Session hook | `Frontend/Frontend-Project/src/hooks/useLocalSession.js` |
| Upload middleware | `Backend/middleware/upload.js` |
| Database config | `Backend/config/database.js` |

## Common Gotchas

1. **API Base URL**: Hardcoded in each service class; update all if changing port/domain
2. **FormData Uploads**: Do NOT set `Content-Type` header (let browser handle it)
3. **Callback-based DB Queries**: No Promises; all model methods use `(err, results) => {}` callbacks
4. **Image Encoding**: Items use base64 (buffer) in response; tasks use file paths
5. **localStorage Key**: Ensure `'frontend_user'` matches hook and auth routes
6. **Role-Based UI**: Check `currentUser.user_type` in components (no permissions system yet)

## Adding a New Domain (e.g., "Vendors")

1. **Backend**: Create `Backend/models/Vendor.js` (static methods with callbacks), `Backend/routes/vendors.js` (Express handlers)
2. **Frontend**: Add page in `src/pages/VendorManagement.jsx`, service in `src/services/vendorApi.js`, route in `App.jsx`
3. **Auth**: If new, add handler in `Backend/routes/auth.js`; validate `users.user_type` server-side
4. **Sidebar**: Add menu item in `src/components/AdminSidebar.jsx` with role check

## Testing & Debugging

- **Backend**: Logs to console; use `nodemon` for auto-restart
- **Frontend**: React DevTools browser extension; console warnings may include helpful context
- **Network**: Browser DevTools → Network tab; check multipart payloads for uploads
- **Database**: Use MySQL client directly to inspect `users`, `employees`, `items`, etc.

## Notes for Future Refactoring

- Consider migrating from callbacks to Promises/async-await (backend models)
- Centralize API base URL (currently scattered in service files)
- Introduce Context API for auth/cart state (currently localStorage only)
- Add TypeScript for type safety (currently vanilla JS/JSX)
