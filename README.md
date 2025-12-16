# Sensecheck Facility

An immersive web-based digital research lab for sensory and cognitive assessment.

## 🎮 Game Overview

Sensecheck Facility features three simulation chambers for research data collection:

1. **Perception Lab** - Visual impairment detection
   - Color blindness test (Ishihara-style plates)
   - Visual acuity assessment
   
2. **Reaction Lab** - Motor skills assessment
   - Interactive bubble-pop game with comprehensive interaction tracking
   
3. **Knowledge Console** - Computer literacy evaluation
   - Multiple-choice quiz on digital literacy

### User Information Collection

Before starting the assessment, participants provide:
- **Age** (required)
- **Gender** (required)

All data is collected anonymously for research purposes only.

## 🛠️ Tech Stack

### Frontend
- React 18 (Vite)
- Konva.js for canvas interactions
- TailwindCSS for styling
- Zustand for state management
- React Router for navigation

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Winston for centralized logging
- Daily rotating file system

## 📦 Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sensecheck
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Configure environment variables:

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sensecheck
NODE_ENV=development
```

4. Add Ishihara Plate Images (Required for Color Blindness Test):

Place the following images in `client/src/resources/`:
- `ishihara_1.jpg`
- `ishihara_3.jpg`
- `ishihara_11.jpg`
- `ishihara_19.jpg`

See `client/src/resources/.gitkeep` for details on obtaining these images.

**Note:** Without these images, the app will display placeholder circles instead.

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Run the application:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
sensecheck/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── modules/       # Game modules
│   │   │   ├── Visual/
│   │   │   ├── Motor/
│   │   │   └── Literacy/
│   │   ├── state/         # Zustand store
│   │   ├── utils/         # Helper functions
│   │   ├── hooks/         # Custom React hooks
│   │   └── resources/     # Images and assets
│   └── public/
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── services/         # Business logic & logging
│   ├── middleware/       # Express middleware
│   └── utils/            # Helper utilities
└── docs/                 # Documentation

```

## 🔌 API Endpoints

### Interaction Tracking (Bucket Pattern) 🆕
- `POST /api/interactions/log` - Log single interaction to bucket
- `POST /api/interactions/batch` - Log batch interactions to bucket
- `GET /api/interactions/session/:sessionId` - Get all interactions
- `GET /api/interactions/session/:sessionId/stats` - Get interaction statistics
- `GET /api/interactions/session/:sessionId/buckets` - Get bucket metadata

### Legacy Interaction Logs
- `POST /api/logs/interaction` - Store interaction data (deprecated)
- `POST /api/motor-skills/interaction` - Store motor skills data (deprecated)

### Results
- `POST /api/results/vision` - Store vision test results
- `POST /api/results/literacy` - Store literacy test results
- `GET /api/results/session/:sessionId` - Get all results for a session
- `POST /api/results/module-complete` - Mark module as completed

## 📦 MongoDB Bucket Pattern

The application uses MongoDB bucket pattern for efficient interaction storage with proper schema relationships:

### Schema Relationship
```
Session (1) ──────< InteractionBucket (Many)
  sessionId ←──── sessionId (validated)
```

### Benefits
- **Performance:** Reduced database operations through batch inserts
- **Scalability:** Lower storage overhead with shared metadata
- **Query Efficiency:** Fewer documents to scan for session data
- **Auto-bucketing:** Automatic bucket creation when reaching 1,000 interactions
- **Data Integrity:** Enforced relationship between sessions and interaction buckets

### Features
- **Validation:** InteractionBuckets can only be created for existing sessions
- **Virtual Fields:** Easy population of related data
- **Cascade Delete:** Removing a session automatically deletes its interaction buckets
- **Session Methods:** Direct access to interaction stats from session documents

### Architecture
- Each session gets separate buckets for 'global' and 'motor' interactions
- Buckets automatically close when full (1,000 interactions)
- Client-side batching (10 interactions or 2 seconds)
- Automatic periodic flush (every 10 seconds)

### Verification
Check bucket statistics and relationships:
```bash
cd server
npm run check-buckets
```

This will display:
- Session details (user info, device, completed modules)
- Total sessions with bucket data
- Bucket counts and fill status
- Sample interactions from each bucket
- Storage efficiency metrics

## 🎨 Design Theme

The interface uses a futuristic sci-fi aesthetic:
- Color palette: Blues, purples, soft gradients
- Typography: Clean, modern sans-serif
- Animations: Minimal, professional
- Tone: Calm, scientific, friendly

## 📊 Data Collection

The system collects data for research purposes:

### User Demographics
- Age (1-120)
- Gender (Male, Female, Other, Prefer not to say)

### Interaction Data
- Mouse/touch coordinates and timestamps
- Response times and accuracy
- Movement patterns and trajectories
- Focus shifts and hover events
- Device-specific metrics (pressure, touch area)

**Note:** Players do not see their results. All data is stored in the backend for researcher access only.

## 🔒 Privacy & Data Usage

- All data is anonymized using session IDs
- No personal identifying information (names, emails, etc.) is collected
- Demographic data (age, gender) is collected for research analysis only
- Data stored securely in MongoDB
- Used exclusively for research purposes
- Players do not see individual results
- Compliant with research ethics standards

## 📝 License

ISC

## 🤝 Contributing

This is a research assessment tool. Please maintain code quality and follow the established patterns.

