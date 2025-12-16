# ML-Ready Schema Implementation - Complete ✅

## What Was Built

I've successfully restructured the entire database schema to support machine learning model training. Here's what's been implemented:

---

## 🗄️ New Database Models

### 1. **SessionMeta** (`server/models/Session.js`) - Enhanced
Added ML-ready fields:
- `participantId`: Anonymized stable identifier
- `device`: Normalized device info (pointer type, OS, browser)
- `screen`: Screen metrics (width, height, DPR)
- `game`: Game configuration (version, difficulty, bubble config)
- `perf`: Performance quality metrics (frame rate, input lag)
- `userInfo.ageBucket`: Privacy-preserving age ranges
- **TTL**: 365 days

### 2. **MotorPointerTraceBucket** (NEW)
Stores downsampled pointer movement samples (30-60Hz):
```javascript
{ round, tms, x, y, isDown, pointerType, pointerId, pressure }
```
- **Bucketing**: ~5000 samples per bucket
- **TTL**: 90 days
- **Use**: Tremor detection, sequence models

### 3. **MotorAttemptBucket** (NEW) ⭐ PRIMARY FOR ML
Stores attempt-level features with computed metrics:
```javascript
{
  round, attemptId, bubbleId,
  target: { x, y, radius },
  click: { hit, tms, x, y },
  timing: { reactionTimeMs, movementTimeMs, interTapMs },
  spatial: { errorDistNorm, pathLengthNorm, straightness },
  kinematics: { jerkRMS, submovementCount, overshootCount, ... },
  fitts: { D, W, ID, throughput }
}
```
- **Bucketing**: ~2000 attempts per bucket
- **TTL**: 90 days
- **Use**: Classical ML training

### 4. **MotorRoundSummary** (NEW)
Aggregated features per round:
```javascript
{
  sessionId, participantId, round,
  counts: { nHits, nMisses, hitRate },
  features: { reactionTime_mean, throughput_mean, jerkRMS_mean, ... }
}
```
- **Not bucketed**: 1 doc per session per round
- **TTL**: None (keep for research)

### 5. **MotorSessionSummary** (NEW)
Session-level features + labels for ML training:
```javascript
{
  sessionId, participantId,
  features: { r1_hitRate, r2_hitRate, hitRate_trend, ... },
  label: { level: "normal"|"mild"|"moderate"|"severe", source, score }
}
```
- **Not bucketed**: 1 doc per session
- **TTL**: None (keep indefinitely)

### 6. **GlobalInteractionBucket** (NEW)
Clean separation of UI/navigation interactions:
```javascript
{ eventType, timestamp, module, data: { position, target, url, ... } }
```
- **Bucketing**: ~1000 interactions per bucket
- **TTL**: 90 days

---

## 🧮 Feature Extraction (`server/utils/featureExtraction.js`)

Implemented **exact formulas** as specified:

✅ **Velocity, Acceleration, Jerk**  
✅ **jerkRMS** (Root Mean Square jerk)  
✅ **Submovement Count** (corrections via speed peaks)  
✅ **Overshoot Count** (direction reversals near target)  
✅ **Fitts' Law Throughput** (ID / movementTime)  

**Function**: `extractAttemptFeatures(samples, spawnTms, clickTms, target, prevClickTms)`

---

## 🛣️ New API Endpoints

### Motor Skills (`/api/motor`)
```
POST   /api/motor/trace                    - Log pointer samples
GET    /api/motor/trace/:sessionId         - Get samples
POST   /api/motor/attempts                 - Log attempts
GET    /api/motor/attempts/:sessionId      - Get attempts
GET    /api/motor/attempts/:sessionId/stats- Get statistics
POST   /api/motor/summary/round            - Compute round summary
POST   /api/motor/summary/session          - Compute session summary
GET    /api/motor/summary/round/:sessionId/:round
GET    /api/motor/summary/session/:sessionId
PATCH  /api/motor/summary/session/:sessionId/label
GET    /api/motor/training                 - Get training data (with filters)
```

### Global Interactions (`/api/global`)
```
POST   /api/global/interactions            - Log global interactions
GET    /api/global/interactions/:sessionId - Get all global interactions
```

---

## 📁 Files Created/Modified

### New Files
- ✅ `server/models/MotorPointerTraceBucket.js`
- ✅ `server/models/MotorAttemptBucket.js`
- ✅ `server/models/MotorSummary.js` (Round + Session)
- ✅ `server/models/GlobalInteractionBucket.js`
- ✅ `server/utils/featureExtraction.js`
- ✅ `server/controllers/motorController.js`
- ✅ `server/controllers/globalInteractionController.js`
- ✅ `server/routes/motor.js`
- ✅ `server/routes/global.js`
- ✅ `docs/ML_ARCHITECTURE.md`
- ✅ `ML_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files
- ✅ `server/models/Session.js` - Enhanced with ML fields
- ✅ `server/server.js` - Added new routes

---

## 🎯 Key Improvements

### 1. **Separation of Concerns**
- Raw traces → Processed attempts → Aggregated summaries
- No more mixed granularity in one collection

### 2. **Feature Leakage Prevention**
- Raw data contains NO aggregated statistics
- Summaries computed server-side consistently

### 3. **Efficient Queries**
- Separate buckets for traces vs attempts
- Proper indexes for ML training queries
- TTL strategy: raw (90d) vs derived (indefinite)

### 4. **ML-Ready**
- **Classical ML**: Use `MotorSessionSummary` features
- **Sequence Models**: Use `MotorPointerTraceBucket` traces
- **Longitudinal**: Track via `participantId`

### 5. **Proper Formulas**
All kinematic features use exact scientific formulas:
- Derivatives: velocity → acceleration → jerk
- jerkRMS for tremor quantification
- Submovement count for corrections
- Overshoot count for targeting difficulty
- Fitts' throughput for motor performance

---

## 🚀 How to Use

### 1. Start Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 2. Test API
```bash
# Create session
curl -X POST http://localhost:5000/api/results/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_001",
    "participantId": "participant_001",
    "device": {"pointerPrimary": "mouse"},
    "game": {"gameVersion": "1.0.0", "metricsVersion": "ms-v1", "bubbleRadiusPx": 40, "bubbleTTLms": 3000},
    "userInfo": {"age": 25, "gender": "Male", "ageBucket": "25-34"}
  }'

# Log pointer samples
curl -X POST http://localhost:5000/api/motor/trace \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_001",
    "samples": [
      {"round": 1, "tms": 100, "x": 0.5, "y": 0.5, "isDown": false, "pointerType": "mouse"}
    ]
  }'

# Log attempts
curl -X POST http://localhost:5000/api/motor/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_001",
    "attempts": [{
      "round": 1,
      "attemptId": "r1_001",
      "bubbleId": "b1",
      "spawnTms": 0,
      "target": {"x": 0.3, "y": 0.4, "radius": 0.03},
      "click": {"clicked": true, "hit": true, "tms": 800, "x": 0.31, "y": 0.41}
    }]
  }'

# Compute round summary
curl -X POST http://localhost:5000/api/motor/summary/round \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_001", "participantId": "participant_001", "round": 1}'

# Get training data
curl http://localhost:5000/api/motor/training?limit=100
```

---

## ⏭️ Next Steps (TODO)

### Client-Side Updates Needed
1. **Update motor skills tracking** to send data in new format:
   - Pointer samples → `/api/motor/trace`
   - Attempts → `/api/motor/attempts`
   - Normalize coordinates (0..1)

2. **Add participantId generation**:
   - Generate stable anonymous ID per user
   - Store in localStorage/sessionStorage

3. **Add game config to session creation**:
   ```javascript
   game: {
     gameVersion: "1.0.0",
     metricsVersion: "ms-v1",
     bubbleRadiusPx: 40,
     bubbleTTLms: 3000,
     roundCount: 3,
     columns: 5
   }
   ```

4. **Call summary endpoints** after each round/session:
   ```javascript
   // After round completes
   await fetch('/api/motor/summary/round', {
     method: 'POST',
     body: JSON.stringify({ sessionId, participantId, round })
   });

   // After all rounds complete
   await fetch('/api/motor/summary/session', {
     method: 'POST',
     body: JSON.stringify({ sessionId, participantId })
   });
   ```

5. **Update global tracking** to use new endpoint:
   - Change from `/api/interactions/batch` to `/api/global/interactions`

---

## 📊 Data Flow

```
User Session
    ↓
1. Create SessionMeta with device/game/perf metadata
    ↓
2. Game Starts
    ↓
3. Log pointer samples → MotorPointerTraceBucket (every 2s)
    ↓
4. Log attempts → MotorAttemptBucket (per bubble)
   Server computes features using extractAttemptFeatures()
    ↓
5. Round Ends → Compute MotorRoundSummary (aggregate attempts)
    ↓
6. Session Ends → Compute MotorSessionSummary (aggregate rounds)
    ↓
7. Later: Update label via PATCH /summary/session/:sessionId/label
    ↓
8. ML Training: GET /motor/training?labelLevel=mild
```

---

## 📚 Documentation

- **ML Architecture**: `docs/ML_ARCHITECTURE.md` (comprehensive guide)
- **API Reference**: All endpoints documented in controller comments
- **Feature Extraction**: `server/utils/featureExtraction.js` (inline docs)
- **Schema Relationships**: `docs/SCHEMA_RELATIONSHIPS.md`

---

## ✅ What's Complete

- ✅ All 6 database models with proper relationships
- ✅ Feature extraction with exact formulas
- ✅ 12 motor skill endpoints
- ✅ 2 global interaction endpoints
- ✅ Cascade delete on session removal
- ✅ Session validation for all buckets
- ✅ TTL strategy (raw: 90d, derived: indefinite)
- ✅ Proper indexing for ML queries
- ✅ Server-side feature computation
- ✅ Batch processing support
- ✅ Comprehensive documentation

---

## 🔄 Legacy Support

Old APIs still work:
- `/api/interactions/*` (unified bucket pattern)
- `/api/logs/*` (original interaction logging)
- `/api/motor-skills/*` (original motor tracking)

**Recommendation**: Migrate to new ML-ready APIs for future development.

---

## 🎓 For ML Engineers

### Training Pipeline

1. **Export data**:
```javascript
const response = await fetch('/api/motor/training?limit=10000');
const { summaries } = await response.json();
```

2. **Convert to pandas**:
```python
import pandas as pd
df = pd.DataFrame([s['features'] for s in summaries])
labels = [s['label']['level'] for s in summaries]
```

3. **Train model**:
```python
from sklearn.ensemble import RandomForestClassifier
clf = RandomForestClassifier()
clf.fit(df, labels)
```

4. **Update labels** (after prediction/validation):
```javascript
await fetch(`/api/motor/summary/session/${sessionId}/label`, {
  method: 'PATCH',
  body: JSON.stringify({
    label: { level: 'mild', score: 0.65, source: 'model', version: 2 }
  })
});
```

---

## 🎉 Summary

You now have a **production-ready, ML-optimized** motor skills assessment backend with:

- Proper data separation
- Exact kinematic feature extraction
- Efficient bucketing & indexing
- TTL management
- Label management
- Training data export

**Ready for both classical ML and deep learning approaches!**


