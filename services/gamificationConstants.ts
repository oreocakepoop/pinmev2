import { Badge } from '../types';

export const LEVEL_THRESHOLDS = [
  0,      // Level 1: Observer
  100,    // Level 2: Scraper
  300,    // Level 3: Curator
  600,    // Level 4: Archivist
  1000,   // Level 5: Node Operator
  1500,   // Level 6: Data Broker
  2200,   // Level 7: System Architect
  3000,   // Level 8: Network Override
  4000,   // Level 9: Root Admin
  50000   // Level 10: The Singularity
];

export const LEVEL_TITLES = [
  "Null",
  "Observer",
  "Scraper",
  "Curator",
  "Archivist",
  "Node Operator",
  "Data Broker",
  "System Architect",
  "Network Override",
  "Root Admin",
  "Singularity"
];

export const XP_RATES = {
  CREATE_PIN: 50,
  LIKE_PIN: 5,
  SAVE_PIN: 10,
  COMMENT: 15,
  RECEIVE_LIKE: 2,
};

export const BADGES: Badge[] = [
  {
    id: 'genesis',
    name: 'Genesis Protocol',
    description: 'Upload your first visual entry to the database.',
    icon: 'Upload',
    threshold: 1,
    type: 'pins'
  },
  {
    id: 'curator_v1',
    name: 'Curator V1',
    description: 'Upload 5 entries.',
    icon: 'Layers',
    threshold: 5,
    type: 'pins'
  },
  {
    id: 'critic',
    name: 'Feedback Loop',
    description: 'Leave 5 comments on the network.',
    icon: 'MessageSquare',
    threshold: 5,
    type: 'comments'
  },
  {
    id: 'supporter',
    name: 'Signal Boost',
    description: 'Like 10 entries.',
    icon: 'Heart',
    threshold: 10,
    type: 'likes'
  },
  {
    id: 'collector',
    name: 'Data Hoarder',
    description: 'Save 10 entries to your collection.',
    icon: 'Bookmark',
    threshold: 10,
    type: 'saves'
  },
  {
    id: 'veteran',
    name: 'Core System',
    description: 'Reach 1000 Entropy (XP).',
    icon: 'Cpu',
    threshold: 1000,
    type: 'xp'
  }
];

export const getLevelFromEntropy = (entropy: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (entropy >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getNextLevelThreshold = (currentLevel: number): number => {
  return LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
};