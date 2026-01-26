PROJECT NAME: MARS

PROJECT TYPE:
Software Engineering Graduation Project (Full-stack web + mobile)

PROJECT DESCRIPTION:
An integrated e‑commerce and internal management system for an electronics store. The system supports public product browsing and purchasing plus internal tools for point-of-sale (POS), contract management, payments, employee duty-hour tracking, project/task management, OCR-based receipts processing, and recommendation support for product suggestions.

TECH STACK:
Frontend: React (Vite) — client app in `Frontend/Frontend-Project/` (React 18+ assumed)
Mobile: React (Vite) mobile client in `mobile/` (shared services and hooks)
Backend: Node.js + Express (`Backend/`) with modular routes and controllers
Database: MySQL (access via `mysql2` driver, configured in `Backend/config/database.js`)
Authentication: Password hashing with `bcryptjs`; frontend session stored in `localStorage` (key `frontend_user`)
File uploads: `multer` middleware (mix of memory and disk storage strategies)
Deployment: Local development — Backend on port 5000, Frontend on Vite dev port (5173 default). Environment variables in `.env` for DB and PORT.

MAIN FEATURES:
- Product catalog and item management (CRUD) — `Backend/routes/items.js`, `Backend/models/Item.js`, frontend pages under `src/pages` and `src/services/itemApi.js`
- POS / Sales processing (create orders, manage payments) — `Backend/routes/pos.js`, `Backend/models/POS.js`
- Contract application and management — `Backend/routes/contracts.js`, `Backend/models/Contract.js`
- Payments and overdue tracking — `Backend/routes/payments.js`, `Backend/models/Payment.js`, `Backend/models/Overdue.js`
- Employee CRUD and duty-hour tracking — `Backend/routes/employees.js`, `Backend/models/Employee.js`, `Backend/routes/dutyHours.js`, `Backend/models/DutyHour.js`
- Project and task management with file attachments — `Backend/routes/projects.js`, `Backend/routes/tasks.js`, `Backend/models/Project.js`, `Backend/models/Task.js` (uploads in `uploads/tasks/`)
- OCR processing and recommendations services for receipts/products — `Backend/services/ocrService.js`, `Backend/services/recommendationService.js`, `Backend/routes/ocr.js`, `Backend/routes/recommendations.js`
- Role-based UI with user types `customer`, `worker`, `admin`, `coadmin` — enforced in frontend sidebars and backend auth routes

TARGET USERS:
- Customers: browse catalog, place orders, view contracts/payments
- Store workers / POS operators: handle in-store sales, manage inventory and orders
- Admins / Co-admins: system management, employee duty hours, projects, tasks, financial oversight

CONSTRAINTS:
- Time: graduation project timeline — limited development window for full production hardening
- Team size: small team; codebase favors pragmatic, callback-based models (MySQL callbacks) rather than large refactors
- Budget / Infrastructure: currently oriented for local or small-server deployment (MySQL, Node.js). External services (OCR training data present under `Backend/` but heavy compute or cloud OCR may be required for production)
- Data availability: recommendation and OCR effectiveness depend on dataset quality; training data (e.g., `ara.traineddata`, `eng.traineddata`) included but may need further tuning

NOTES (for report writing):
- The backend uses callback-style DB access (see `Backend/models/*`) — mention as a design/implementation choice and a candidate for refactor to Promises/async–await.
- Frontend services use direct `fetch` calls and hardcoded API base URL (`http://localhost:5000/api`) in service classes — note when describing integration and deployment.
- File upload mixes memory and disk strategies: items use memory (base64 returned), tasks use disk storage with static serving — document trade-offs.
- Authentication is basic (bcrypt + localStorage); highlight security considerations (JWT, HTTPS, session expiration) in the report.

-- End of project context --
