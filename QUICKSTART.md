# Sensecheck Quick Start Guide

Get up and running with Sensecheck in 5 minutes!

## Prerequisites

Make sure you have these installed:
- ✅ Node.js 18 or higher ([Download](https://nodejs.org/))
- ✅ MongoDB ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- ✅ npm (comes with Node.js)

---

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server and client dependencies
cd server && npm install
cd ../client && npm install
cd ..
```

Or use the convenience command:
```bash
npm run install-all
```

### 2. Configure Environment Variables

**For Server:**

Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sensecheck
NODE_ENV=development
```

**For Client (optional):**

Create `client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Add Ishihara Plate Images (Required)

Place these image files in `client/src/resources/`:
- `ishihara_1.jpg`
- `ishihara_3.jpg`
- `ishihara_11.jpg`
- `ishihara_19.jpg`

**Where to get them:**
- Wikipedia: https://en.wikipedia.org/wiki/Ishihara_test
- Search: "Ishihara test plates public domain"
- See `client/src/resources/.gitkeep` for detailed instructions

**Without images:** The app will work but show placeholder circles in the Color Blindness Test.

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB from Services or run mongod.exe
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `server/.env`

### 5. Run the Application

**Option A: Run Everything at Once**
```bash
npm run dev
```

This starts both frontend and backend simultaneously!

**Option B: Run Separately**

Terminal 1 (Backend):
```bash
cd server
node server.js
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

---

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

---

## Verify Installation

1. Open http://localhost:5173 in your browser
2. You should see the Sensecheck Facility homepage
3. Click on any module to test functionality
4. Check the terminal for backend logs

---

## Project Structure Overview

```
sensecheck/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── modules/    # Game modules
│   │   ├── components/ # Reusable UI components
│   │   ├── state/      # Zustand store
│   │   └── utils/      # Helper functions
│   └── package.json
├── server/              # Node.js backend (Express)
│   ├── routes/         # API routes
│   ├── controllers/    # Route handlers
│   ├── models/         # MongoDB schemas
│   └── package.json
├── docs/                # Documentation
└── package.json         # Root package.json
```

---

## Available Scripts

### Root Directory
```bash
npm run dev          # Run both frontend and backend
npm run server       # Run backend only
npm run client       # Run frontend only
npm run install-all  # Install all dependencies
```

### Server Directory
```bash
npm start            # Start server (production)
npm run dev          # Start server with nodemon (development)
```

### Client Directory
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Testing the Modules

### 1. Perception Lab - Color Blindness Test
- Navigate to "Perception Lab" → "Color Blindness Test"
- View 4 Ishihara plates
- Enter numbers or select "I See Nothing"
- Complete test to see results

### 2. Perception Lab - Visual Acuity Test
- Navigate to "Perception Lab" → "Visual Acuity Test"
- Identify numbers in decreasing sizes
- Get Snellen visual acuity estimate

### 3. Reaction Lab - Motor Skills Game
- Navigate to "Reaction Lab" → "Motor Skills Game"
- Pop rising bubbles across 3 rounds
- Interactions tracked automatically

### 4. Knowledge Console - Literacy Quiz
- Navigate to "Knowledge Console" → "Literacy Quiz"
- Answer 15 multiple-choice questions
- Get computer literacy score

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change port in `server/.env` or kill the process
```bash
# Find process using port
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Frontend Can't Connect to Backend
**Solution:** Ensure backend is running on port 5000
- Check `server/.env` has `PORT=5000`
- Backend should show: "🚀 Server running on http://localhost:5000"

### Dependencies Installation Fails
**Solution:** Clear cache and reinstall
```bash
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json
npm run install-all
```

---

## What's Next?

✅ Explore the codebase
✅ Read the [Architecture Documentation](docs/ARCHITECTURE.md)
✅ Check the [API Documentation](docs/API.md)
✅ Review [Development Guide](docs/DEVELOPMENT.md)
✅ See [Deployment Guide](docs/DEPLOYMENT.md)

---

## Adding Ishihara Plate Images

The app uses placeholder images by default. To use real Ishihara plates:

1. Download or create Ishihara plate images
2. Place them in `client/src/resources/` with these names:
   - `ishihara_1.jpg`
   - `ishihara_3.jpg`
   - `ishihara_11.jpg`
   - `ishihara_19.jpg`

3. Update `ColorBlindnessTest.jsx` to load images:
```jsx
<img 
  src={`/src/resources/${currentPlate.imageName}`} 
  alt={`Plate ${currentPlate.plateId}`}
/>
```

---

## Need Help?

- 📚 Check the [documentation](docs/)
- 🐛 Report issues on GitHub
- 💬 Ask questions in discussions

---

## Quick Tips

- **Session ID:** Automatically generated and stored in sessionStorage
- **Data Persistence:** All interactions saved to MongoDB
- **Logs:** Check `server/logs/` for Winston logs
- **State Management:** Uses Zustand (lightweight alternative to Redux)
- **Styling:** TailwindCSS with custom cyber theme

---

## Development Mode Features

- Hot reload on frontend (Vite)
- Auto-restart on backend changes (use nodemon)
- Detailed console logging
- Winston file logging
- React DevTools support

---

Happy coding! 🚀

