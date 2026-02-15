export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface Pin {
  id: string;
  url: string;
  width?: number;
  height?: number;
  description: string;
  author: string;
  userId: string;
  createdAt: number;
  tags?: string[];
  sector?: string; // New: Collection/Category
  aiDescription?: string;
  link?: string;
  likes?: Record<string, boolean>; // Map of userId -> true
  likeCount?: number;
  saves?: Record<string, boolean>; // Map of userId -> true (New)
  saveCount?: number;
  comments?: Record<string, Comment>;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface UserStats {
  entropy: number; // XP
  level: number;
  pinsCreated: number;
  likesGiven: number;
  pinsSaved: number; // New stat
  commentsMade: number;
  badges: string[]; // Array of badge IDs
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  threshold: number; // XP or count needed
  type: 'xp' | 'pins' | 'likes' | 'comments' | 'saves';
}

export interface LogEntry {
  id: string;
  action: 'UPLOAD' | 'LIKE' | 'SAVE' | 'COMMENT' | 'SYSTEM';
  user: string;
  detail: string;
  timestamp: number;
}

export interface PinterestImage {
  url: string;
  width: number;
  height: number;
}

export interface PinterestPinItem {
  id: string;
  media?: {
    images?: {
      '1200x'?: PinterestImage;
      '600x'?: PinterestImage;
      '400x300'?: PinterestImage;
    };
  };
  description?: string;
  title?: string;
  alt_text?: string;
  board_owner?: {
    username: string;
  };
  link?: string;
}

export interface PinterestAPIResponse {
  items: PinterestPinItem[];
}