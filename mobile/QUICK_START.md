# 🚀 Mobile App Quick Start

## ✅ What's Been Created

Your mobile app is now set up with:
- ✅ All 6 pages (MyTasks, TimeTracking, MyDutyHours, ProjectManagement, ProjectDetails, AdminDutyHours)
- ✅ Mobile-optimized UI with bottom navigation
- ✅ Shared API client (connects to same backend)
- ✅ Shared authentication hook (uses same session as desktop)
- ✅ Touch-friendly components and styles

## 📋 Next Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Backend Server (if not running)

```bash
cd ../Backend
node server.js
```

### 3. Start Mobile App

```bash
cd mobile
npm run dev
```

The app will run on **http://localhost:5174**

### 4. Test in Browser

1. Open browser
2. Press `F12` to open DevTools
3. Click the device toggle icon (📱) or press `Ctrl+Shift+M`
4. Select a mobile device (iPhone, Android, etc.)
5. Navigate to `http://localhost:5174`

### 5. Test on Real Device (Optional)

1. Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. On your phone (same WiFi), open browser and go to:
   ```
   http://YOUR_IP:5174
   ```
   Example: `http://192.168.1.100:5174`

## 📱 Available Pages

- **`/my-tasks`** - View and manage your tasks
- **`/time-tracking`** - Clock in/out
- **`/my-duty-hours`** - View your duty hours
- **`/project-management`** - Browse projects
- **`/project/:id`** - Project details
- **`/admin-duty-hours`** - Admin view (requires admin/manager role)

## 🔧 Configuration

### Change Backend URL

Edit `mobile/src/shared/api/apiClient.js`:
```javascript
const API_BASE_URL = 'http://YOUR_BACKEND_URL:5000';
```

Or set environment variable:
```bash
VITE_API_URL=http://192.168.1.100:5000 npm run dev
```

## 🎨 Features

- **Bottom Navigation** - Easy thumb navigation
- **Touch-Optimized** - Large buttons (44px minimum)
- **Mobile-First Design** - Optimized for small screens
- **Same Backend** - Uses existing APIs
- **Shared Auth** - Same login session as desktop

## ⚠️ Important Notes

1. **Authentication**: You need to log in through the desktop app first, or implement a login page in mobile
2. **CORS**: Backend already allows requests, but if you test on a device, make sure backend CORS includes your IP
3. **Port**: Mobile runs on port 5174 (desktop uses 5173) to avoid conflicts

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Make sure backend is running on port 5000
- Check CORS settings in `Backend/server.js`
- If testing on device, use your computer's IP instead of localhost

### "Cannot find module" errors
- Run `npm install` in the mobile folder
- Make sure you're in the `mobile` directory

### Pages not loading
- Check browser console (F12) for errors
- Verify backend is running
- Check network tab for API call failures

## 📝 Next: Customize

You can now:
1. Customize the mobile UI styles
2. Add more mobile-specific features
3. Implement mobile login page
4. Add swipe gestures
5. Optimize for different screen sizes

Happy coding! 🎉
