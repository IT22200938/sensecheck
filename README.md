# SenseCheck - Mission Control Assessment Game

A futuristic mission control game that assesses visual perception, motor coordination, and computer literacy through immersive gameplay scenarios.

## 🎮 Game Overview

Players take on the role of a mission control operator and must successfully complete three assessment protocols:

1. **Signal Recognition** - Tests color blindness and visual acuity through color-coded signals
2. **System Stability** - Tests motor coordination through a bubble-popping reactor stabilization game  
3. **System Access** - Tests computer literacy through UI element identification

## 🚀 Features

- **Immersive Futuristic Theme** - Cyberpunk-inspired design with glowing effects and animations
- **Real-time Assessment** - Live scoring and feedback during gameplay
- **Comprehensive Analytics** - Detailed impairment calculations and recommendations
- **Responsive Design** - Works on desktop and tablet devices
- **Data Persistence** - MongoDB storage for user profiles and results
- **Professional Results** - Printable certification with detailed breakdowns

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **TailwindCSS** for modern styling
- **Konva.js** for canvas-based animations and games
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express server
- **MongoDB** with Mongoose ODM
- **CORS** enabled for cross-origin requests
- **RESTful API** design

## 📁 Project Structure

```
sensecheck/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Game components
│   │   │   ├── SignalRecognition.jsx
│   │   │   ├── BubbleGame.jsx
│   │   │   └── LiteracyQuiz.jsx
│   │   ├── pages/          # Main pages
│   │   │   ├── IntroPage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useGameState.js
│   │   ├── utils/          # Utilities and API
│   │   │   ├── api.js
│   │   │   └── gameData.js
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   └── GameResult.js
│   ├── routes/             # API routes
│   │   └── gameRoutes.js
│   ├── controllers/        # Route controllers
│   │   └── gameController.js
│   ├── utils/              # Server utilities
│   │   └── scoringUtils.js
│   ├── index.js
│   └── package.json
└── package.json           # Root package for scripts
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or cloud cluster)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sensecheck
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

### 3. Environment Configuration

Create a `.env` file in the server directory:
```env
MONGODB_URI=mongodb://localhost:27017/sensecheck
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sensecheck
PORT=5000
NODE_ENV=production
```

### 4. Start the Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend only (port 5000)
npm run client  # Frontend only (port 3000)
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## 🎯 Game Mechanics

### Signal Recognition Protocol
- **Color Blindness Test**: Identify numbers within color-coded circles
- **Visual Acuity Test**: Recognize progressively smaller numbers
- **Scoring**: Based on accuracy and reaction time
- **Output**: Color vision percentage and Snellen ratio (e.g., 20/20)

### System Stability Protocol  
- **Bubble Game**: Pop colored bubbles before they reach the top
- **Dynamic Difficulty**: Speed and spawn rate increase over rounds
- **Scoring**: Accuracy percentage and reaction time trends
- **Output**: Motor coordination assessment

### System Access Protocol
- **UI Literacy Quiz**: Identify common interface elements
- **Timed Responses**: Speed affects final score
- **Scoring**: Correct answers with time bonus/penalty
- **Output**: Computer literacy percentage

## 📊 Assessment Calculations

### Color Vision Score
```javascript
score = (correct_answers / total_patterns) * 100
```

### Visual Acuity Score  
```javascript
// Convert smallest recognized size to Snellen ratio
mar = smallest_size / 10
snellen_denominator = 20 * mar
result = "20/" + snellen_denominator
```

### Motor Skills Score
```javascript
accuracy = (popped_bubbles / total_bubbles) * 100
reaction_trend = [reaction_times_by_round]
```

### Computer Literacy Score
```javascript
base_score = (correct_answers / total_questions) * 100
speed_weight = average_time < 5s ? 1.1 : average_time > 10s ? 0.9 : 1.0
final_score = base_score * speed_weight
```

### Overall Assessment
- **Excellent** (90%+): All systems optimal
- **Good** (75-89%): Minor improvements needed  
- **Fair** (60-74%): Some attention required
- **Needs Attention** (40-59%): Training recommended
- **Requires Training** (<40%): Additional training required

## 🔌 API Endpoints

### Users
- `POST /api/game/users` - Create new user
- `GET /api/game/users/:userId/results` - Get user's results

### Game Results  
- `POST /api/game/results` - Save game results
- `GET /api/game/results/:resultId` - Get specific result

### Health Check
- `GET /api/health` - Server status check

## 🎨 Design Features

### Cyberpunk Theme
- Neon color scheme (cyan, purple, green, red, yellow)
- Orbitron and Fira Code fonts
- Glowing effects and animations
- Futuristic UI panels with backdrop blur

### Responsive Layout
- Mobile-first design approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Scalable canvas elements

### Accessibility
- High contrast color combinations
- Large touch targets
- Clear visual feedback
- Keyboard navigation support

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration flow
- [ ] Signal recognition accuracy
- [ ] Bubble game performance
- [ ] Quiz question progression  
- [ ] Results calculation
- [ ] Data persistence
- [ ] Error handling

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Heroku/Railway)
```bash
cd server
# Set environment variables
# Deploy with MongoDB Atlas connection
```

### Environment Variables for Production
```env
MONGODB_URI=<your_mongodb_atlas_connection_string>
PORT=5000
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- [ ] Multiplayer assessment sessions
- [ ] Advanced analytics dashboard
- [ ] Custom assessment configurations
- [ ] Mobile app version
- [ ] VR/AR integration
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with learning management systems

## 🐛 Known Issues

- Canvas performance may vary on older devices
- MongoDB connection requires stable internet
- Print functionality needs browser print dialog

## 📞 Support

For support, email support@sensecheck.com or open an issue on GitHub.

---

**Made with ❤️ for mission-critical assessments**