# Mobile Customer Store Implementation

## Overview
This is a complete mobile-optimized customer store implementation for the MARS Store system. It provides a seamless shopping experience for customers on mobile devices, including branch selection, product browsing, cart management, checkout, and order tracking.

## Features Implemented

### 🏪 Branch Selection
- **Location**: `/` (root path)
- **Features**:
  - Display all available branches with images, addresses, and phone numbers
  - Select a branch to start shopping
  - Branch selection is stored in localStorage
  - Mobile-optimized card layout

### 🛍️ Store Home
- **Location**: `/store`
- **Features**:
  - Personalized product recommendations for logged-in users
  - Popular products for anonymous users
  - Category navigation bar
  - Mobile-optimized product grid (2 columns)
  - Quick "Add to Cart" functionality
  - Search functionality (integrated in header)

### 📱 Product Detail
- **Location**: `/store/product/:id`
- **Features**:
  - Full product information with description
  - Image gallery with thumbnails
  - Quantity selector
  - Add to cart functionality
  - Installment application option (if product supports it)
  - Item view tracking for recommendations
  - Mobile-optimized layout

### 🛒 Shopping Cart
- **Location**: `/store/cart`
- **Features**:
  - View all cart items with images and details
  - Remove items from cart
  - Calculate total amount
  - Proceed to checkout
  - Empty cart state

### 💳 Checkout
- **Features**:
  - Stripe payment integration
  - Billing address input
  - Card payment processing
  - Order confirmation
  - Error handling

### 📦 My Orders
- **Location**: `/store/my-orders`
- **Features**:
  - View all customer orders
  - Order status indicators (pending, approved, shipped, rejected)
  - Order details preview
  - Date formatting
  - Navigate to detailed order view

### 📄 Order Details
- **Location**: `/store/order/:orderId`
- **Features**:
  - Complete order information
  - Order items list with images
  - Billing address
  - Order status
  - Reason for decline (if rejected)
  - Order date and total amount

### 💰 My Installments
- **Location**: `/store/my-installments`
- **Features**:
  - View all installment contracts
  - Contract status (pending, active, completed, rejected)
  - Payment progress tracking
  - Monthly payment information
  - Remaining balance
  - Rejection reason (if rejected)

### 🏷️ Category Pages
- **Location**: `/store/category/:slug`
- **Features**:
  - Browse products by category
  - Category-specific product listings
  - Quick add to cart
  - Mobile-optimized grid layout

### 🔐 Authentication
- **Features**:
  - Login modal with username/password
  - Signup modal with:
    - Username, email, phone, password
    - ID card image upload (optional)
    - Customer role auto-assignment
  - Session management with localStorage
  - Logout functionality

## Technical Architecture

### File Structure
```
mobile/src/
├── pages/store/
│   ├── BranchSelection.jsx
│   ├── StoreHome.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── CategoryPage.jsx
│   ├── MyOrders.jsx
│   ├── MyInstallments.jsx
│   └── OrderDetails.jsx
├── components/store/
│   ├── MobileStoreHeader.jsx
│   ├── MobileStoreNav.jsx
│   ├── MobileProductGrid.jsx
│   ├── MobileStoreFooter.jsx
│   ├── MobileLoginModal.jsx
│   ├── MobileSignupModal.jsx
│   ├── MobileCheckout.jsx
│   └── MobileInstallmentModal.jsx
├── services/
│   ├── storeApi.js
│   └── recommendationApi.js
├── hooks/
│   ├── useLocalSession.js
│   └── useItemViewTracking.js
└── styles/
    └── MobileStore.css
```

### API Integration
All API calls are made to `http://localhost:5000/api/` endpoints:
- `/store/branches` - Get all branches
- `/store/items` - Get products (with branch filtering)
- `/store/items/:id` - Get product details
- `/cart/*` - Cart operations (add, remove, clear, get)
- `/store/checkout` - Process checkout
- `/store/create-payment-intent` - Create Stripe payment
- `/orders/*` - Order management
- `/contracts/*` - Installment contracts
- `/categories` - Get product categories
- `/recommendations/*` - Get personalized/popular recommendations
- `/auth/*` - Authentication (login, signup)

### State Management
- **Session**: localStorage with key `frontend_user`
- **Branch Selection**: localStorage with key `selectedBranchId`
- **Cart**: Server-side with user ID
- **Toast Notifications**: react-hot-toast for user feedback

### Styling
- Custom CSS with mobile-first approach
- Dark theme with gradient backgrounds
- Touch-optimized buttons and interactions
- Responsive grid layouts
- Smooth animations and transitions
- Color scheme: Primary #b53e20 (Mars red)

## Installation & Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

This will install all required packages including:
- React Router DOM for navigation
- Stripe for payment processing
- Lucide React for icons
- React Hot Toast for notifications
- All existing dependencies

### 2. Start Development Server
```bash
npm run dev
```

The mobile app will run on `http://localhost:5174`

### 3. Backend Requirements
Ensure the backend server is running on `http://localhost:5000` with all required endpoints.

## User Flow

### Customer Journey
1. **Landing** → Branch Selection page (`/`)
2. **Select Branch** → Store Home with products (`/store`)
3. **Browse Products** → View categories, search, or browse recommendations
4. **Product Detail** → View product info, add to cart, or apply for installment
5. **Shopping Cart** → Review items, adjust quantities, remove items
6. **Checkout** → Enter billing address, complete payment
7. **Order Tracking** → View orders in My Orders page
8. **Installments** → Track installment contracts in My Installments page

### Authentication Flow
- Users can browse without login
- Login/Signup required for:
  - Adding items to cart
  - Checkout
  - Viewing orders
  - Viewing installments
  - Applying for installments

## Mobile Optimizations

### Touch Interactions
- Large touch targets (minimum 44px)
- Active states for all interactive elements
- Swipe-friendly horizontal scrolling for categories
- Pull-to-refresh compatible

### Performance
- Lazy loading for images
- Optimized API calls
- Efficient re-renders with React hooks
- Minimal bundle size

### UX Enhancements
- Loading states for all async operations
- Error handling with user-friendly messages
- Empty states for cart, orders, installments
- Confirmation toasts for all actions
- Back navigation support
- Sticky headers and footers

### Responsive Design
- Mobile-first CSS
- Flexible grid layouts
- Viewport-based sizing
- Breakpoints for tablet/desktop views

## Payment Integration

### Stripe Setup
The checkout uses Stripe Elements for secure card payments:
- Test publishable key is included
- Payment intents created server-side
- Card validation and error handling
- 3D Secure support

### Test Cards
Use Stripe test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date and CVC

## Navigation Structure

### Store Routes (No Auth Required for Browsing)
- `/` - Branch Selection
- `/store` - Store Home
- `/store/product/:id` - Product Detail
- `/store/category/:slug` - Category Page

### Customer Account Routes (Auth Required)
- `/store/cart` - Shopping Cart
- `/store/my-orders` - Order History
- `/store/my-installments` - Installment Contracts
- `/store/order/:orderId` - Order Details

### Employee Routes (Protected)
- `/login` - Employee Login
- `/my-tasks` - Task Management
- `/time-tracking` - Time Tracking
- `/my-duty-hours` - Duty Hours
- `/project-management` - Projects
- `/admin-duty-hours` - Admin Duty Hours
- `/contract-management` - Contract Management

## Key Components

### MobileStoreHeader
- Logo and branding
- Cart icon (for logged-in users)
- Menu toggle
- Slide-out menu with user info and navigation

### MobileStoreNav
- Horizontal scrolling category navigation
- Fetches categories from API
- Links to category pages

### MobileProductGrid
- Displays products in 2-column grid
- Personalized recommendations for logged-in users
- Popular products for anonymous users
- Quick add to cart functionality

### MobileCheckout
- Stripe Elements integration
- Billing address form
- Payment processing
- Order confirmation

### MobileInstallmentModal
- Installment application form
- Down payment calculator
- Monthly payment preview
- Employment verification fields

## Future Enhancements

### Potential Additions
- Product reviews and ratings
- Wishlist functionality
- Order tracking with status updates
- Push notifications for order updates
- Barcode scanner for quick product lookup
- Social sharing
- Multiple payment methods
- Guest checkout option
- Order history filtering and search
- Installment payment reminders

## Troubleshooting

### Common Issues

**Products not loading**
- Check if backend server is running
- Verify branch is selected in localStorage
- Check API endpoint responses

**Cart not updating**
- Ensure user is logged in
- Check network requests for errors
- Verify user ID in localStorage

**Payment failing**
- Check Stripe keys are correct
- Verify backend payment intent creation
- Use valid test card numbers

**Images not displaying**
- Check image URLs in database
- Verify CORS settings on backend
- Check network tab for 404 errors

## Notes

- The mobile store shares the same backend and database as the desktop version
- Session storage is compatible between mobile and desktop
- All features are optimized for touch interactions
- The app is PWA-ready for future offline support
- Recommendation system tracks user behavior for personalization

## Support

For issues or questions:
1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Verify all dependencies are installed
4. Ensure backend is running on correct port
