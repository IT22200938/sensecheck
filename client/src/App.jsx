import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Complete from './pages/Complete';
import ColorBlindnessTest from './modules/Visual/ColorBlindnessTest';
import VisualAcuityTest from './modules/Visual/VisualAcuityTest';
import MotorSkillsGame from './modules/Motor/MotorSkillsGame';
import LiteracyQuiz from './modules/Literacy/LiteracyQuiz';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/perception/color-blindness" element={<ColorBlindnessTest />} />
          <Route path="/perception/visual-acuity" element={<VisualAcuityTest />} />
          <Route path="/reaction/motor-skills" element={<MotorSkillsGame />} />
          <Route path="/knowledge/literacy" element={<LiteracyQuiz />} />
          <Route path="/complete" element={<Complete />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

