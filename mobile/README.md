# Mobile App

Mobile-optimized version of the Project Management System.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5174` (different port from desktop app)

### 3. Test on Mobile Device

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address
   ```

2. Access from mobile device on same WiFi:
   ```
   http://YOUR_IP:5174
   ```

## 📱 Pages

- `/my-tasks` - View and manage your tasks
- `/time-tracking` - Clock in/out and track time
- `/my-duty-hours` - View your duty hours report
- `/project-management` - Browse projects
- `/project/:id` - Project details
- `/admin-duty-hours` - Admin view of all duty hours

## 🔗 Backend Connection

The mobile app uses the same backend as the desktop app:
- Backend URL: `http://localhost:5000` (default)
- Can be configured via `VITE_API_URL` environment variable

## 📁 Project Structure

```
mobile/
├── src/
│   ├── pages/          # Mobile pages
│   ├── components/     # Mobile components
│   ├── shared/         # Shared utilities
│   └── hooks/          # Custom hooks
├── package.json
└── vite.config.js
```

## 🎨 Features

- Touch-optimized UI
- Bottom navigation
- Mobile-friendly layouts
- Shared authentication with desktop app
- Same backend APIs

## 🧪 Testing

### Browser DevTools
1. Open browser DevTools (F12)
2. Click device toggle (📱)
3. Select mobile device
4. Navigate to `http://localhost:5174`

### Real Device
1. Ensure phone is on same WiFi
2. Access `http://YOUR_IP:5174`
3. Test all features

## 📝 Notes

- The mobile app shares utilities with the desktop app via path aliases
- Uses the same `useLocalSession` hook for authentication
- All API calls go to the same backend server
