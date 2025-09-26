// Color blindness test patterns (Ishihara-like)
export const colorBlindnessPatterns = [
  {
    id: 1,
    number: 8,
    colors: ['#ff0000', '#00ff00'], // Red-Green test
    correctAnswer: 8,
    type: 'protanopia' // Red-blind
  },
  {
    id: 2,
    number: 3,
    colors: ['#ff8800', '#88ff00'], // Orange-Green test
    correctAnswer: 3,
    type: 'deuteranopia' // Green-blind
  },
  {
    id: 3,
    number: 5,
    colors: ['#0088ff', '#ffff00'], // Blue-Yellow test
    correctAnswer: 5,
    type: 'tritanopia' // Blue-blind
  },
  {
    id: 4,
    number: 2,
    colors: ['#ff4444', '#44ff44'], // Red-Green variation
    correctAnswer: 2,
    type: 'protanopia'
  },
  {
    id: 5,
    number: 7,
    colors: ['#ff0088', '#00ff88'], // Magenta-Cyan test
    correctAnswer: 7,
    type: 'general'
  }
];

// Visual acuity test sizes (decreasing)
export const acuitySizes = [
  { size: 40, label: '20/200' },
  { size: 32, label: '20/160' },
  { size: 24, label: '20/120' },
  { size: 20, label: '20/100' },
  { size: 16, label: '20/80' },
  { size: 14, label: '20/60' },
  { size: 12, label: '20/40' },
  { size: 10, label: '20/30' },
  { size: 8, label: '20/25' },
  { size: 6, label: '20/20' },
  { size: 4, label: '20/15' },
  { size: 3, label: '20/10' }
];

// Computer literacy quiz questions
export const literacyQuestions = [
  {
    id: 1,
    question: "Which icon typically represents 'Save'?",
    options: [
      { id: 'a', text: '💾', icon: '💾', correct: true },
      { id: 'b', text: '📁', icon: '📁', correct: false },
      { id: 'c', text: '🗑️', icon: '🗑️', correct: false },
      { id: 'd', text: '⚙️', icon: '⚙️', correct: false }
    ]
  },
  {
    id: 2,
    question: "What does the gear icon (⚙️) usually represent?",
    options: [
      { id: 'a', text: 'Delete', correct: false },
      { id: 'b', text: 'Settings', correct: true },
      { id: 'c', text: 'Home', correct: false },
      { id: 'd', text: 'Search', correct: false }
    ]
  },
  {
    id: 3,
    question: "Which symbol typically means 'Close' or 'Exit'?",
    options: [
      { id: 'a', text: '✓', correct: false },
      { id: 'b', text: '?', correct: false },
      { id: 'c', text: '×', correct: true },
      { id: 'd', text: '+', correct: false }
    ]
  },
  {
    id: 4,
    question: "What does a magnifying glass icon (🔍) represent?",
    options: [
      { id: 'a', text: 'Zoom', correct: false },
      { id: 'b', text: 'Search', correct: true },
      { id: 'c', text: 'View', correct: false },
      { id: 'd', text: 'Edit', correct: false }
    ]
  },
  {
    id: 5,
    question: "Which icon represents 'Home' or main page?",
    options: [
      { id: 'a', text: '🏠', correct: true },
      { id: 'b', text: '📧', correct: false },
      { id: 'c', text: '📋', correct: false },
      { id: 'd', text: '🔒', correct: false }
    ]
  },
  {
    id: 6,
    question: "What does the trash can icon (🗑️) represent?",
    options: [
      { id: 'a', text: 'Archive', correct: false },
      { id: 'b', text: 'Download', correct: false },
      { id: 'c', text: 'Delete', correct: true },
      { id: 'd', text: 'Move', correct: false }
    ]
  }
];

// Bubble game configurations
export const bubbleGameConfig = {
  rounds: [
    { duration: 20000, spawnRate: 1500, bubbleSpeed: 2.0 },    // Round 1: Easy - 1.5s intervals, slow speed
    { duration: 20000, spawnRate: 1200, bubbleSpeed: 2.5 },   // Round 2: Medium - 1.2s intervals, medium speed  
    { duration: 20000, spawnRate: 1000, bubbleSpeed: 3.0 }    // Round 3: Hard - 1.0s intervals, fast speed
  ],
  bubbleColors: ['#ff3366', '#00ff88', '#00f5ff', '#ffff00', '#ff8800'],
  bubbleSize: 35, // Fixed size for better clickability
  containerHeight: 600,
  containerWidth: 800,
  // Predefined movement patterns for consistency
  xPositions: [120, 240, 360, 480, 600], // 5 evenly spaced vertical lanes
  lanePattern: [
    // Prime index shuffle pattern
    2, 3, 0, 1, 4, 0, 2, 3, 1, 4,
    // Center-out pattern  
    2, 1, 3, 0, 4, 2, 4, 0, 3, 1,
    // Alternating pattern
    0, 4, 1, 3, 2, 2, 3, 1, 4, 0,
    // Random-like but predictable
    1, 4, 0, 3, 2, 4, 1, 0, 2, 3
  ], // 40-bubble repeating sequence for variety
  patternType: 'lane_switching' // bubbles follow predefined lane switching pattern
};

// Game narrative texts
export const narrativeTexts = {
  intro: {
    title: "MISSION CONTROL OPERATOR ASSESSMENT",
    subtitle: "Welcome to the SenseCheck System",
    description: "You are about to begin assessment protocols for mission-critical operator certification. Your visual perception, motor coordination, and system knowledge will be evaluated through realistic mission scenarios."
  },
  signalRecognition: {
    title: "SIGNAL RECOGNITION PROTOCOL",
    instruction: "Incoming signals detected on the control panel. Identify each signal number as it appears. Speed and accuracy are critical for mission success.",
    colorTest: "Color-coded priority signals incoming...",
    acuityTest: "Signal strength decreasing. Maintain recognition accuracy..."
  },
  systemStability: {
    title: "SYSTEM STABILITY PROTOCOL",
    instruction: "Critical system instability detected. Reactor particles must be contained before reaching critical threshold. Click to neutralize each particle.",
    warning: "Warning: System breach imminent!"
  },
  systemAccess: {
    title: "SYSTEM ACCESS VERIFICATION",
    instruction: "Security protocols require interface knowledge verification. Identify the correct system interface elements to maintain access clearance."
  },
  results: {
    title: "ASSESSMENT COMPLETE",
    subtitle: "Operator Certification Results"
  }
};

// Generate random numbers for tests
export const generateRandomNumber = (min = 0, max = 9) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random position within bounds
export const generateRandomPosition = (width, height, margin = 50) => {
  return {
    x: Math.random() * (width - margin * 2) + margin,
    y: Math.random() * (height - margin * 2) + margin
  };
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
