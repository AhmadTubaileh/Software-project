# Contract Management Page - Mobile App

## Overview
The Contract Management page is a mobile-optimized interface for viewing, reviewing, and managing installment contract applications. It provides comprehensive contract information with role-based access control and branch-level permissions.

## Access Control & Authorization

### User Roles Allowed:
- **Administrator** (user_type: 0) - Full access to all contracts from all branches
- **Senior Manager** (user_type: 1) - Can approve/reject contracts from accessible branches
- **Manager** (user_type: 2) - Can approve/reject contracts from accessible branches
- **Supervisor** (user_type: 3) - View-only access to contracts
- **Employee** (user_type: 4) - View-only access to contracts
- **Trainee** (user_type: 5) - **DENIED ACCESS** - Cannot access this page

### Permission Levels:
1. **View Contracts**: All authorized users (0-4) can view contracts
2. **Approve/Reject**: Only Admin (0), Senior Manager (1), and Manager (2) can approve/reject
3. **Branch Access**: Managers and Senior Managers can only approve/reject contracts from their accessible branches (fetched from `/api/employees/branches/accessible`)

## Features

### 1. Contract Filtering
- **Status Filter**: Filter contracts by status
  - Pending Review (⏳)
  - Active (✅)
  - Rejected (❌)
  - Completed (✓)
  - Deleted (🗑️)
  - All Contracts (📋)
  
- **Branch Filter**: Filter contracts by branch
  - Shows user's primary branch first (if available)
  - "All Branches" option
  - Lists all other branches
  - Automatically initializes to user's primary branch

### 2. Contract Statistics Cards
Displays real-time statistics:
- Total Active Contracts (excluding deleted)
- Pending Contracts count
- Active Contracts count
- Rejected Contracts count
- Completed Contracts count
- Active Contracts Total Value
- Overall Total Value

### 3. Contract Cards Display
Each contract card shows:
- **Header Section** (Horizontal Layout):
  - Item name (left)
  - Status badge with emoji (right)
  - Contract ID and Branch name (inline with separator)

- **Relationship Info** (Horizontal if multiple):
  - Reapplication indicator (if applicable)
  - Replacement contract indicator (if applicable)

- **Customer Section** (Mixed Layout):
  - Customer icon and label (horizontal)
  - Customer name (full width)
  - Phone and Worker name (horizontal with separator)

- **Financial Section** (Grid Layout):
  - Total Price | Down Payment (side by side)
  - Monthly Payment | Duration (side by side)
  - Payment Progress Bar (if payments exist)

- **Action Buttons**:
  - View Details (full width)
  - Approve & Reject (side by side, only for pending contracts with permission)

- **Footer**:
  - Creation date with calendar icon

### 4. Contract Details Modal
Opens when clicking "View Details" button. Features:

#### Tabbed Interface:
1. **Overview Tab** (📋):
   - Contract Information (mixed layout):
     - Contract ID | Sale ID (horizontal)
     - Item Name (full width)
     - Created By | Start Date (horizontal)
     - Status (full width with color coding)
   - Financial Summary (mixed layout):
     - Total Value (full width, highlighted)
     - Down Payment | Remaining (horizontal)
     - Duration | Monthly (horizontal)
     - Last Payment (full width)

2. **Customer Tab** (👤):
   - Full Name (full width)
   - Phone | ID Card (horizontal)
   - Email (full width, if available)
   - Address (full width, if available)
   - ID Card Image with "View Full Size" button

3. **Sponsors Tab** (👥):
   - Shows count badge
   - Each sponsor card displays:
     - Sponsor number and Relationship badge (horizontal)
     - Name (full width)
     - Phone | ID Card (horizontal)
     - Address (full width, if available)
     - ID Card Image with "View Full Size" button

4. **Payments Tab** (💰):
   - Payment Schedule (3-column grid):
     - Down Payment | Monthly | Last Payment (horizontal)
   - Total Contract Value (full width footer)

### 5. Approve Contract
- Available for: Admin, Senior Manager, Manager
- Branch access check: Managers can only approve contracts from accessible branches
- Shows confirmation modal with:
  - Contract details (Customer, Item, Total, Months)
  - Confirmation message
  - Effects: Contract activated, payment schedule created, item quantity remains reserved
- API Endpoint: `PUT /api/contracts/{id}/approve`
- Body: `{ approver_id, user_type }`

### 6. Reject Contract
- Available for: Admin, Senior Manager, Manager
- Branch access check: Managers can only reject contracts from accessible branches
- Shows rejection modal with:
  - Contract details
  - Required rejection reason textarea
  - Effects: Item quantity increased by 1 (reservation released)
- API Endpoint: `PUT /api/contracts/{id}/reject`
- Body: `{ approver_id, user_type, reason }`

### 7. Image Viewing
- View customer and sponsor ID card images
- Full-screen modal with:
  - Zoom controls (zoom in/out/reset)
  - Touch-friendly panning when zoomed
  - Person information footer
  - Supports both customer and sponsor images

## API Endpoints Used

1. **Fetch Contracts**: `GET /api/contracts/all`
   - Query params: `status`, `branch_id`, `userId`, `userType`, `showAllBranches`
   
2. **Fetch Contract Details**: `GET /api/contracts/{id}`
   
3. **Fetch Sponsors**: `GET /api/contracts/{id}/sponsors`
   
4. **Fetch Branches**: `GET /api/branches`
   
5. **Fetch Accessible Branches**: `GET /api/employees/branches/accessible?userId={id}`
   
6. **Approve Contract**: `PUT /api/contracts/{id}/approve`
   
7. **Reject Contract**: `PUT /api/contracts/{id}/reject`

## UI/UX Features

### Mobile Optimization:
- Touch-friendly button sizes (minimum 44px)
- Compact font sizes (11-16px)
- Mixed vertical/horizontal layouts for efficient space usage
- Scrollable content areas
- Loading states with spinners
- Empty states with helpful messages
- Toast notifications for user feedback

### Visual Design:
- Dark theme with gradient backgrounds
- Color-coded status badges
- Glassmorphism effects on cards
- Smooth transitions and animations
- Icons for quick visual scanning
- Progress bars for payment tracking

### Responsive Layout:
- Grid layouts for related information
- Flex layouts for inline elements
- Truncation for long text
- Break-all for ID card numbers
- Max-width constraints for branch names

## Navigation
- Accessible via navigation bar (📝 Contracts icon)
- Route: `/contract-management`
- Protected route (requires authentication)
- Only visible to users with user_type 0-4

## State Management
- Uses React hooks (useState, useEffect, useCallback)
- Session management via `useLocalSession` hook
- API calls via `apiClient` utility
- Toast notifications for user feedback

## Error Handling
- Access denied page for unauthorized users
- Error toasts for failed API calls
- Loading states during data fetching
- Empty states when no contracts match filters

## Key Components
1. **ContractManagement.jsx** - Main page component
2. **ContractsTable.jsx** - Contract cards list
3. **ContractDetailsModal.jsx** - Detailed contract view
4. **ApproveModal.jsx** - Approval confirmation
5. **RejectModal.jsx** - Rejection with reason
6. **StatsCards.jsx** - Statistics display
7. **ImageModal.jsx** - Full-screen image viewer

## Data Flow
1. User logs in → Session stored in localStorage
2. Page loads → Checks user role → Fetches accessible branches
3. Fetches all branches for filter dropdown
4. Fetches contracts based on current filters
5. User interacts → Updates filters or performs actions
6. Actions trigger API calls → Updates local state → Refreshes contract list

## Security Features
- Role-based access control
- Branch-level permission checks
- User authentication required
- Protected routes
- Session validation

