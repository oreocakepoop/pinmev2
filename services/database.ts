import { database } from '../firebase';
import { ref, push, onValue, query, orderByChild, limitToLast, update, remove, runTransaction, equalTo, get } from 'firebase/database';
import { Pin, Comment, UserStats, LogEntry } from '../types';
import { XP_RATES, BADGES, getLevelFromEntropy } from './gamificationConstants';

// --- System Logging (Global Activity) ---

const logActivity = async (action: LogEntry['action'], user: string, detail: string) => {
  const logsRef = ref(database, 'logs');
  const newLog: Omit<LogEntry, 'id'> = {
    action,
    user,
    detail,
    timestamp: Date.now()
  };
  // We don't await this to keep UI snappy
  push(logsRef, newLog);
};

export const subscribeToLogs = (callback: (logs: LogEntry[]) => void) => {
  const logsRef = query(ref(database, 'logs'), orderByChild('timestamp'), limitToLast(20));
  return onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const logs: LogEntry[] = Object.entries(data).map(([key, value]: [string, any]) => ({
      id: key,
      ...value
    })).sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  });
};

// --- Gamification Logic ---

const updateUserStats = async (userId: string, action: 'create' | 'like' | 'save' | 'comment' | 'xp_only', xpAmount: number = 0) => {
  const statsRef = ref(database, `users/${userId}/stats`);
  
  await runTransaction(statsRef, (currentStats: UserStats | null) => {
    if (!currentStats) {
      currentStats = { entropy: 0, level: 1, pinsCreated: 0, likesGiven: 0, pinsSaved: 0, commentsMade: 0, badges: [] };
    }

    // Update Counts
    if (action === 'create') currentStats.pinsCreated = (currentStats.pinsCreated || 0) + 1;
    if (action === 'like') currentStats.likesGiven = (currentStats.likesGiven || 0) + 1;
    if (action === 'save') currentStats.pinsSaved = (currentStats.pinsSaved || 0) + 1;
    if (action === 'comment') currentStats.commentsMade = (currentStats.commentsMade || 0) + 1;

    // Add XP
    currentStats.entropy = (currentStats.entropy || 0) + xpAmount;
    
    // Check Level Up
    const newLevel = getLevelFromEntropy(currentStats.entropy);
    if (newLevel > currentStats.level) {
       currentStats.level = newLevel;
    }

    // Check Badges
    BADGES.forEach(badge => {
      const alreadyHas = currentStats?.badges?.includes(badge.id);
      if (alreadyHas) return;

      let qualified = false;
      if (badge.type === 'pins' && (currentStats?.pinsCreated || 0) >= badge.threshold) qualified = true;
      if (badge.type === 'likes' && (currentStats?.likesGiven || 0) >= badge.threshold) qualified = true;
      if (badge.type === 'saves' && (currentStats?.pinsSaved || 0) >= badge.threshold) qualified = true;
      if (badge.type === 'comments' && (currentStats?.commentsMade || 0) >= badge.threshold) qualified = true;
      if (badge.type === 'xp' && (currentStats?.entropy || 0) >= badge.threshold) qualified = true;

      if (qualified) {
        if (!currentStats?.badges) currentStats.badges = [];
        currentStats.badges.push(badge.id);
      }
    });

    return currentStats;
  });
};

export const getUserStats = async (userId: string): Promise<UserStats | null> => {
   const statsRef = ref(database, `users/${userId}/stats`);
   const snapshot = await get(statsRef);
   return snapshot.val();
}

export const subscribeToUserStats = (userId: string, callback: (stats: UserStats) => void) => {
  const statsRef = ref(database, `users/${userId}/stats`);
  return onValue(statsRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || { entropy: 0, level: 1, pinsCreated: 0, likesGiven: 0, pinsSaved: 0, commentsMade: 0, badges: [] });
  });
};

// --- User Profile Data (Avatar, etc) ---

export const updateUserAvatar = async (userId: string, photoURL: string) => {
  const profileRef = ref(database, `users/${userId}/profile`);
  await update(profileRef, { photoURL });
};

export const subscribeToUserProfile = (userId: string, callback: (data: { photoURL?: string, displayName?: string } | null) => void) => {
  const profileRef = ref(database, `users/${userId}/profile`);
  return onValue(profileRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// --- Core Functions ---

export const savePin = async (pinData: Omit<Pin, 'id' | 'createdAt'>) => {
  const pinsRef = ref(database, 'pins');
  const newPin = {
    ...pinData,
    createdAt: Date.now(),
    likeCount: 0,
    saveCount: 0
  };
  await push(pinsRef, newPin);
  
  // System Log
  logActivity('UPLOAD', pinData.author, `Sector: ${pinData.sector || 'General'}`);

  // Award XP to Creator
  if (pinData.userId) {
    await updateUserStats(pinData.userId, 'create', XP_RATES.CREATE_PIN);
  }
};

export const deletePin = async (pinId: string) => {
  const pinRef = ref(database, `pins/${pinId}`);
  await remove(pinRef);
};

// Like (Heart)
export const toggleLike = async (pinId: string, userId: string) => {
  const pinRef = ref(database, `pins/${pinId}`);
  let pinAuthorId: string | null = null;
  let isLikeAction = false;

  await runTransaction(pinRef, (currentPin) => {
    if (currentPin) {
      pinAuthorId = currentPin.userId;
      if (currentPin.likes && currentPin.likes[userId]) {
        // Unlike
        currentPin.likes[userId] = null;
        currentPin.likeCount = (currentPin.likeCount || 1) - 1;
        isLikeAction = false;
      } else {
        // Like
        if (!currentPin.likes) currentPin.likes = {};
        currentPin.likes[userId] = true;
        currentPin.likeCount = (currentPin.likeCount || 0) + 1;
        isLikeAction = true;
      }
    }
    return currentPin;
  });

  if (isLikeAction) {
    await updateUserStats(userId, 'like', XP_RATES.LIKE_PIN);
    logActivity('LIKE', userId.substring(0, 6), `Signal locked on Pin #${pinId.substring(0,4)}`);
    if (pinAuthorId && pinAuthorId !== userId) {
       await updateUserStats(pinAuthorId!, 'xp_only', XP_RATES.RECEIVE_LIKE);
    }
  }
};

// Save (Bookmark) - Distinct from Like
export const toggleSave = async (pinId: string, userId: string) => {
  const pinRef = ref(database, `pins/${pinId}`);
  let isSaveAction = false;

  await runTransaction(pinRef, (currentPin) => {
    if (currentPin) {
      if (currentPin.saves && currentPin.saves[userId]) {
        // Unsave
        currentPin.saves[userId] = null;
        currentPin.saveCount = (currentPin.saveCount || 1) - 1;
        isSaveAction = false;
      } else {
        // Save
        if (!currentPin.saves) currentPin.saves = {};
        currentPin.saves[userId] = true;
        currentPin.saveCount = (currentPin.saveCount || 0) + 1;
        isSaveAction = true;
      }
    }
    return currentPin;
  });

  if (isSaveAction) {
    await updateUserStats(userId, 'save', XP_RATES.SAVE_PIN);
    logActivity('SAVE', userId.substring(0, 6), `Pin #${pinId.substring(0,4)} added to Collection`);
  }
};

export const addComment = async (pinId: string, user: { uid: string, displayName: string }, text: string) => {
  const commentsRef = ref(database, `pins/${pinId}/comments`);
  const newComment: Omit<Comment, 'id'> = {
    userId: user.uid,
    userName: user.displayName,
    text,
    createdAt: Date.now()
  };
  await push(commentsRef, newComment);

  logActivity('COMMENT', user.displayName, `Data appended to Pin #${pinId.substring(0,4)}`);
  await updateUserStats(user.uid, 'comment', XP_RATES.COMMENT);
};

export const deleteComment = async (pinId: string, commentId: string) => {
  const commentRef = ref(database, `pins/${pinId}/comments/${commentId}`);
  await remove(commentRef);
};

export const subscribeToPins = (callback: (pins: Pin[]) => void, userIdFilter?: string) => {
  let pinsRef;
  
  if (userIdFilter) {
    pinsRef = query(ref(database, 'pins'), orderByChild('userId'), equalTo(userIdFilter));
  } else {
    pinsRef = query(ref(database, 'pins'), orderByChild('createdAt'), limitToLast(100));
  }
  
  return onValue(pinsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const pinsList: Pin[] = Object.entries(data).map(([key, value]: [string, any]) => ({
      id: key,
      ...value,
      comments: value.comments || {}
    })).sort((a, b) => b.createdAt - a.createdAt); 
    
    callback(pinsList);
  });
};