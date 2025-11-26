# Sensecheck Facility - Project Summary

## 🎮 Overview

Sensecheck Facility is a production-quality, full-stack web application designed for comprehensive sensory and cognitive assessment. Built with the MERN stack, it features three interactive simulation chambers that collect detailed interaction data for research purposes.

---

## ✨ Key Features

### 🎯 Three Assessment Modules

1. **Perception Lab - Visual Impairment Detection**
   - Ishihara-style color blindness test (4 plates)
   - Visual acuity test with Snellen estimation
   - Real-time interaction tracking
   - Comprehensive results with diagnosis

2. **Reaction Lab - Motor Skills Assessment**
   - Interactive bubble-pop game with Konva.js
   - 3 rounds with progressive difficulty
   - Tracks coordinates, timing, velocity, pressure
   - No scoring - pure data collection

3. **Knowledge Console - Computer Literacy Evaluation**
   - 15 multiple-choice questions
   - 4 categories: icons, terminology, navigation, security
   - Computer Literacy Score (CLS) calculation
   - Category-wise performance breakdown

### 🎨 User Experience
- **Futuristic sci-fi theme** with cyber blues and purples
- **Responsive design** works on desktop, tablet, and mobile
- **Smooth animations** and professional transitions
- **Progress tracking** throughout each module
- **Comprehensive results page** with detailed metrics

### 📊 Data Collection
- **Comprehensive interaction logging**
  - Click/touch coordinates and timestamps
  - Mouse movement patterns and velocity
  - Hover events and durations
  - Focus shifts and navigation patterns
  - Response times for all actions
  - Device-specific metrics (pressure, touch area)

- **Centralized Winston logging**
  - Daily rotating file system
  - Separate logs for applications, errors, interactions
  - Automatic retention management

- **MongoDB storage**
  - Session tracking
  - All interactions indexed
  - Results with calculated metrics
  - Automatic TTL expiration

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern component-based UI
- **Vite** - Lightning-fast build tool
- **Konva.js** - High-performance canvas rendering
- **TailwindCSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Winston** - Logging framework
- **CORS** - Cross-origin support

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Auto-restart
- **Concurrently** - Run multiple commands

---

## 📁 Project Structure

```
sensecheck/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   ├── components/             # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── modules/                # Game modules
│   │   │   ├── Visual/
│   │   │   │   ├── ColorBlindnessTest.jsx
│   │   │   │   └── VisualAcuityTest.jsx
│   │   │   ├── Motor/
│   │   │   │   └── MotorSkillsGame.jsx
│   │   │   └── Literacy/
│   │   │       └── LiteracyQuiz.jsx
│   │   ├── pages/                  # Route pages
│   │   │   ├── Home.jsx
│   │   │   └── Results.jsx
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useInteractionTracking.js
│   │   │   └── useDeviceInfo.js
│   │   ├── state/                  # State management
│   │   │   └── store.js
│   │   ├── utils/                  # Utilities
│   │   │   ├── api.js
│   │   │   ├── colorBlindnessAnalysis.js
│   │   │   ├── visualAcuityCalculations.js
│   │   │   └── literacyQuestions.js
│   │   └── resources/              # Images and assets
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── server.js                   # Entry point
│   ├── routes/                     # API routes
│   │   ├── logs.js
│   │   └── results.js
│   ├── controllers/                # Business logic
│   │   ├── logController.js
│   │   └── resultsController.js
│   ├── models/                     # Mongoose schemas
│   │   ├── Session.js
│   │   ├── InteractionLog.js
│   │   ├── VisionResult.js
│   │   └── LiteracyResult.js
│   ├── services/                   # External services
│   │   └── logging/
│   │       └── logger.js
│   ├── middleware/                 # Express middleware
│   │   ├── requestLogger.js
│   │   └── errorHandler.js
│   ├── logs/                       # Winston logs (generated)
│   ├── .env.example
│   └── package.json
│
├── docs/                            # Documentation
│   ├── API.md                      # API reference
│   ├── ARCHITECTURE.md             # System architecture
│   ├── DEVELOPMENT.md              # Development guide
│   └── DEPLOYMENT.md               # Deployment guide
│
├── README.md                        # Project overview
├── QUICKSTART.md                    # Quick start guide
├── .gitignore                       # Git ignore rules
└── package.json                     # Root package.json
```

---

## 🚀 Quick Start

```bash
# 1. Install all dependencies
npm run install-all

# 2. Set up environment variables
# Copy server/.env.example to server/.env
# Edit with your MongoDB URI

# 3. Start MongoDB (if local)
mongod

# 4. Run the application
npm run dev
```

Access at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 📊 Database Schema

### Collections

1. **sessions** - User session tracking
2. **interactionlogs** - All user interactions
3. **visionresults** - Color blindness and visual acuity results
4. **literacyresults** - Computer literacy quiz results

### Indexes
- Compound indexes on `sessionId`, `module`, `timestamp`
- TTL indexes for automatic data expiration
- Unique indexes on `sessionId` for sessions

---

## 🔌 API Endpoints

### Session Management
- `POST /api/results/session` - Create/update session
- `GET /api/results/session/:sessionId` - Get session results

### Interaction Logging
- `POST /api/logs/interaction` - Log single interaction
- `POST /api/logs/batch` - Log multiple interactions
- `GET /api/logs/session/:sessionId` - Get session interactions

### Results
- `POST /api/results/vision` - Save vision test results
- `POST /api/results/literacy` - Save literacy test results

### Health Check
- `GET /api/health` - Server health status

---

## 🎯 Assessment Calculations

### Color Blindness
- **Score**: Percentage of correct normal vision answers
- **Diagnosis**: Based on pattern matching
  - Normal: ≥75% correct
  - Suspected Red-Green Deficiency: ≥2 color blind patterns

### Visual Acuity
- **Snellen Estimation**: Calculated from smallest resolved size
- **Formula**: 
  ```
  Visual Angle = 2 × arctan(object_size / (2 × viewing_distance))
  MAR = Visual Angle × 60 (arc minutes)
  Snellen = 20 / (20 × MAR)
  ```

### Computer Literacy
- **CLS Score**: Correct answers + time factor
- **Time Factor**:
  - <8s avg: -5 (too fast, likely guessing)
  - 8-20s avg: +5 (optimal pace)
  - >20s avg: -10 (very slow)

---

## 🔒 Security & Privacy

- ✅ **No personal information collected**
- ✅ **Session-based anonymous tracking**
- ✅ **CORS enabled for cross-origin**
- ✅ **Input validation on all endpoints**
- ✅ **MongoDB injection prevention**
- ✅ **Automatic data expiration (TTL)**

---

## 📈 Performance Features

### Frontend
- Component code splitting
- Lazy loading with React Router
- Efficient canvas rendering with Konva.js
- Throttled mouse tracking
- Optimized re-renders with Zustand

### Backend
- Async batch processing for interactions
- Connection pooling with Mongoose
- Indexed database queries
- Daily log rotation
- Request/response logging

---

## 🧪 Testing Checklist

- [x] Color blindness test - all plates functional
- [x] Visual acuity test - size reduction and scoring
- [x] Motor skills game - bubble spawn and click detection
- [x] Literacy quiz - all questions and scoring
- [x] Results page - data display
- [x] API endpoints - all functional
- [x] Database operations - CRUD working
- [x] Logging system - Winston files created
- [x] Session management - ID generation and storage
- [x] Interaction tracking - comprehensive data collection

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview and installation
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[docs/API.md](docs/API.md)** - Complete API reference
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development workflow
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment options

---

## 🎨 Design System

### Color Palette
- **Cyber Blue**: `#0077e6` (primary actions)
- **Cyber Purple**: `#7200e6` (secondary accent)
- **Gray Scale**: 50-900 (UI elements)
- **Gradients**: Blue to purple (hero sections)

### Typography
- **Headings**: Bold, large, gradient text
- **Body**: Clean sans-serif
- **Monospace**: Code and technical data

### Components
- **Cards**: Glass morphism effect
- **Buttons**: Gradient hover states
- **Inputs**: Focused ring states
- **Progress**: Smooth animations

---

## 🔄 Data Flow

```
User Action
    ↓
React Component
    ↓
Zustand Store (local state)
    ↓
useInteractionTracking Hook
    ↓
Axios → API Request
    ↓
Express Route Handler
    ↓
Controller Logic
    ↓
Mongoose Model
    ↓
MongoDB Database + Winston Logs
```

---

## 🌟 Highlights

### ✅ Production-Ready Features
- Comprehensive error handling
- Request/response logging
- Data validation
- Auto-expiring data with TTL
- Graceful shutdown handling
- Health check endpoint

### ✅ Research-Focused Design
- Detailed interaction tracking
- Timestamp precision
- Device-specific metrics
- Session-based analysis
- Exportable data format

### ✅ Modern Development Practices
- Modular component structure
- Custom hooks for reusability
- Centralized state management
- Environment-based configuration
- RESTful API design

---

## 🚀 Future Enhancements

### Potential Features
- [ ] Real-time dashboard for researchers
- [ ] Data export to CSV/JSON
- [ ] Advanced analytics and visualizations
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Progressive Web App (PWA)
- [ ] WebSocket for live updates
- [ ] Redis caching layer
- [ ] Rate limiting middleware
- [ ] User authentication (optional)

### Performance Optimizations
- [ ] Server-side rendering (SSR)
- [ ] CDN integration
- [ ] Image optimization
- [ ] Bundle size reduction
- [ ] Database query optimization
- [ ] Load testing and benchmarking

---

## 📊 Project Statistics

- **Total Files**: ~50+
- **Lines of Code**: ~5,000+
- **Components**: 15+
- **API Endpoints**: 7
- **Database Models**: 4
- **Custom Hooks**: 2
- **Utility Functions**: 20+

---

## 🤝 Contributing

This is a research assessment tool. Contributions should:
- Maintain code quality and patterns
- Include proper documentation
- Follow existing architecture
- Not collect personal information
- Preserve data tracking capabilities

---

## 📄 License

ISC License - See package.json for details

---

## 🎓 Learning Resources

This project demonstrates:
- Full-stack MERN development
- State management with Zustand
- Canvas animations with Konva.js
- RESTful API design
- MongoDB schema design
- Winston logging system
- TailwindCSS styling
- React Router navigation
- Custom React hooks
- Async/await patterns

Perfect for:
- Learning modern web development
- Understanding research data collection
- Studying interaction tracking
- Exploring assessment applications

---

## 📞 Support

For issues, questions, or contributions:
- 📖 Read the documentation
- 🐛 Report bugs on GitHub
- 💬 Start a discussion
- 📧 Contact maintainers

---

## ✨ Credits

Built with modern web technologies for research and educational purposes.

**Tech Stack Credits:**
- React Team - React framework
- Evan You - Vite build tool
- Tailwind Labs - TailwindCSS
- MongoDB Inc - MongoDB database
- Express.js Team - Express framework
- Konva.js Team - Canvas library
- Winston Team - Logging library

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Production Ready ✅

