// Backend Services Architecture for Campus Connect
// These services provide the business logic layer between API routes and DataStore

import type { 
  UserLevelData, UserPreferences, 
  Notification, Achievement, ChatRoom, ChatMessage
} from '@/types';
import { dataStore } from '@/lib/data/store';
import { getSupabaseRepository } from '@/lib/supabase/repository';

/**
 * CHAT SERVICE
 * Handles all chat-related operations: rooms, messages, members
 */
export class ChatService {
  private static repo: ReturnType<typeof getSupabaseRepository> | null = null;

  private static getRepo() {
    if (!this.repo) {
      this.repo = getSupabaseRepository();
    }
    return this.repo;
  }

  /**
   * Create a new chat room in a group
   */
  static async createRoom(
    groupId: string,
    name: string
  ): Promise<ChatRoom> {
    if (!groupId || !name) throw new Error('Group ID and name required');
    if (name.length > 50) throw new Error('Room name too long');
    
    return await this.getRepo().createChatRoom({
      groupId,
      name: name.toLowerCase().trim(),
    });
  }

  /**
   * Get all messages in a chat room (paginated)
   */
  static async getMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    if (!roomId) throw new Error('Room ID required');
    if (limit > 100) limit = 100;
    
    return await this.getRepo().getChatMessages(roomId, limit, offset);
  }

  /**
   * Get all chat rooms for a group
   */
  static async getRoomsByGroup(groupId: string): Promise<ChatRoom[]> {
    if (!groupId) throw new Error('Group ID required');
    
    return await this.getRepo().getChatRoomsByGroup(groupId);
  }

  /**
   * Send a message to a chat room
   * @param encrypted - Whether the content is ciphertext (E2EE)
   * @param nonce - The nonce used for encryption
   * @param keyVersion - The group key version used
   * @param replyToId - ID of message being replied to
   * @param mediaType - Type of media (gif, image, video, etc.)
   * @param mediaUrl - URL to the media content
   */
  static async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    options?: {
      encrypted?: boolean
      nonce?: string
      keyVersion?: number
      replyToId?: string
      mediaType?: 'gif' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'space'
      mediaUrl?: string
      mediaThumbnail?: string
      mediaWidth?: number
      mediaHeight?: number
      mediaProvider?: string
    }
  ): Promise<ChatMessage> {
    if (!roomId || !senderId) throw new Error('Missing required fields');
    // Allow empty content for media messages
    if (!content && !options?.mediaType) throw new Error('Content or media required');
    if (content && content.length > 10000) throw new Error('Message too long'); // Allow longer for encrypted

    const message = await this.getRepo().createChatMessage({
      chatRoomId: roomId,
      senderId,
      content: content?.trim() || '',
      encrypted: options?.encrypted,
      nonce: options?.nonce,
      keyVersion: options?.keyVersion,
      replyToId: options?.replyToId,
      mediaType: options?.mediaType,
      mediaUrl: options?.mediaUrl,
      mediaThumbnail: options?.mediaThumbnail,
      mediaWidth: options?.mediaWidth,
      mediaHeight: options?.mediaHeight,
      mediaProvider: options?.mediaProvider,
    });

    // Track activity points for messaging
    await LevelService.trackActivity(senderId, 'message', 1);

    // Create notifications for other room members (message notifications)
    // Note: For encrypted messages, we only show "New encrypted message" preview
    try {
      const room = await this.getRepo().getChatRoom(roomId);
      if (room) {
        const groupId = room.groupId;
        // Get group members to notify (excluding sender)
        const groupMembers = await this.getRepo().getGroupMembers(groupId);
        const sender = await this.getRepo().getUser(senderId);
        
        // Build notification preview (hide content for encrypted messages)
        const isEncrypted = options?.encrypted === true
        const preview = isEncrypted 
          ? '🔒 Sent an encrypted message'
          : `${content.slice(0, 80)}${content.length > 80 ? '…' : ''}`
        
        for (const member of groupMembers) {
          if (member.userId === senderId) continue;
          
          try {
            NotificationService.createNotification(
              member.userId,
              'message',
              'New Chat Message',
              `${sender?.name || 'Someone'}: ${preview}`,
              `/groups/${groupId}/chat/${room.id}`,
              room.id
            )
          } catch (err) {
            console.error('[ChatService] Failed to create message notification', err)
          }
        }

        // Mention/tag notification: detect @username in content (skip for encrypted)
        if (!isEncrypted) {
          const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/g)
          if (mentionMatches) {
            const usernames = mentionMatches.map(m => m.slice(1).toLowerCase())
            // Get all users to find mentioned users
            const allUsers = await this.getRepo().getAllUsers();
            for (const uname of usernames) {
              const mentionedUser = allUsers.find(u => u.username.toLowerCase() === uname)
              if (mentionedUser && mentionedUser.id !== senderId) {
                try {
                  NotificationService.createNotification(
                    mentionedUser.id,
                    'message',
                    'You were mentioned',
                    `${sender?.name || 'Someone'} mentioned you in chat: "${content.slice(0, 80)}${content.length > 80 ? '…' : ''}"`,
                    `/groups/${groupId}/chat/${room.id}`,
                    groupId
                  )
                } catch (err) {
                  console.error('[ChatService] Failed to create mention notification', err)
                }
              }
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error('[ChatService] Notification fan-out error', notifyErr);
    }

    return message;
  }

  /**
   * Add a user to a chat room
   * Note: Chat room membership is handled through group membership in Supabase
   */
  static async addMember(roomId: string, userId: string): Promise<void> {
    if (!roomId || !userId) throw new Error('Room ID and User ID required');
    // Membership is handled at group level - no-op for now
    console.log(`[ChatService] Adding member ${userId} to room ${roomId} (handled via group membership)`);
  }

  /**
   * Get message count for a chat room
   */
  static async getMessageCount(roomId: string): Promise<number> {
    const messages = await this.getRepo().getChatMessages(roomId, 1000, 0); // Get up to 1000 messages
    return messages.length;
  }
}

/**
 * LEVEL SERVICE
 * Handles user levels, activity tracking, achievements, leaderboards
 */
export class LevelService {
  /**
   * Add activity points to a user
   * Types: message, event, squad, achievement, etc.
   */
  static async trackActivity(
    userId: string,
    type: 'message' | 'event' | 'squad' | 'achievement' | 'login',
    points: number
  ): Promise<void> {
    if (!userId || !type || points <= 0) throw new Error('Invalid activity data');

    // Fetch current stats
    let levelData = await this.getLevelStats(userId);
    const oldLevel = levelData.currentLevel;
    
    // Update stats
    const updates: Partial<UserLevelData> = {
      totalPoints: (levelData.totalPoints || 0) + points
    };
    
    if (type === 'message') updates.totalMessagesCount = (levelData.totalMessagesCount || 0) + 1;
    if (type === 'event') updates.totalEventsAttended = (levelData.totalEventsAttended || 0) + 1;
    if (type === 'squad') updates.totalSquadsCreated = (levelData.totalSquadsCreated || 0) + 1;
    
    // Calculate new level
    const levels = ['Novice', 'Learner', 'Collaborator', 'Expert', 'Master'];
    let newLevel = levelData.currentLevel;
    const newTotalPoints = updates.totalPoints!;
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (newTotalPoints >= this.getLevelThreshold(levels[i])) {
        newLevel = levels[i] as any;
        break;
      }
    }
    
    if (newLevel !== levelData.currentLevel) {
      updates.currentLevel = newLevel;
    }
    
    // Save updates
    await getSupabaseRepository().updateUserLevel(userId, updates);
    
    // Refresh levelData for subsequent logic
    levelData = { ...levelData, ...updates };

    // Level up notification
    if (newLevel !== oldLevel) {
      try {
        await NotificationService.createNotification(
          userId,
          'level-up',
          'Level Up!',
          `Congratulations! You reached level ${newLevel}.`,
          '/dashboard',
          undefined
        )
      } catch (err) {
        console.warn('[LevelService] Level up notification error', err)
      }
    }
    // Achievement logic
    const achievements = await this.checkAchievements(userId);
    for (const achievement of achievements) {
      // Notify user of achievement
      try {
        await NotificationService.createNotification(
          userId,
          'event-reminder', // Use valid notification type
          'Achievement Unlocked!',
          `You unlocked: ${achievement.name}`,
          '/dashboard',
          undefined
        )
      } catch (err) {
        console.warn('[LevelService] Achievement notification error', err)
      }
    }
  }

  /**
   * Get user's level data including stats
   */
  static async getLevelStats(userId: string): Promise<UserLevelData> {
    if (!userId) throw new Error('User ID required');
    
    const level = await getSupabaseRepository().getUserLevel(userId);
    if (!level) {
      // If no level data exists, return default/empty structure or throw
      // For now, let's return a default structure to avoid breaking flows
      return {
        userId,
        currentLevel: 'Novice',
        totalPoints: 0,
        totalEventsAttended: 0,
        totalSquadsCreated: 0,
        totalMessagesCount: 0,
        loginStreak: 0,
        achievements: []
      }
    }
    
    return level;
  }

  /**
   * Get user's level progress to next level
   * Returns current points and points needed for next level
   */
  static async getLevelProgress(userId: string): Promise<{
    currentLevel: string;
    currentPoints: number;
    nextLevelAt: number;
    progressPercent: number;
  }> {
    const level = await this.getLevelStats(userId);
    
    // Level thresholds
    const thresholds: Record<string, number> = {
      'Novice': 0,
      'Learner': 100,
      'Collaborator': 300,
      'Expert': 700,
      'Master': 1500,
    };

    const levels = ['Novice', 'Learner', 'Collaborator', 'Expert', 'Master'];
    const currentLevelIndex = levels.indexOf(level.currentLevel);
    const nextLevelThreshold = thresholds[levels[currentLevelIndex + 1]] || Infinity;
    const currentLevelThreshold = currentLevelIndex === 0 ? 0 : thresholds[levels[currentLevelIndex]];

    const pointsInCurrentLevel = level.totalPoints - currentLevelThreshold;
    const pointsNeededForLevel = nextLevelThreshold - currentLevelThreshold;
    const progressPercent = (pointsInCurrentLevel / pointsNeededForLevel) * 100;

    return {
      currentLevel: level.currentLevel,
      currentPoints: level.totalPoints,
      nextLevelAt: nextLevelThreshold,
      progressPercent: Math.min(progressPercent, 100),
    };
  }

  static getLevelThreshold(level: string): number {
    const thresholds: Record<string, number> = {
      'Novice': 0,
      'Learner': 100,
      'Collaborator': 300,
      'Expert': 700,
      'Master': 1500,
    };
    return thresholds[level] ?? 0;
  }

  /**
   * Get global leaderboard
   */
  static async getLeaderboard(limit: number = 50): Promise<UserLevelData[]> {
    if (limit > 500) limit = 500;

    return await getSupabaseRepository().getLeaderboard(limit);
  }

  /**
   * Get user's rank on leaderboard
   */
  static async getUserRank(userId: string): Promise<number> {
    const leaderboard = await this.getLeaderboard(10000);
    const rank = leaderboard.findIndex(u => u.userId === userId);
    return rank === -1 ? 0 : rank + 1;
  }

  /**
   * Check if user has earned new achievements
   */
  static async checkAchievements(userId: string): Promise<Achievement[]> {
    if (!userId) throw new Error('User ID required');

    const level = await this.getLevelStats(userId);
    const earnedAchievements: Achievement[] = [];

    // Define achievement criteria
    const achievementCriteria = [
      {
        id: 'first-message',
        title: 'First Message',
        condition: level.totalMessagesCount >= 1,
      },
      {
        id: 'event-attendee',
        title: 'Event Attendee',
        condition: level.totalEventsAttended >= 1,
      },
      {
        id: 'squad-creator',
        title: 'Squad Creator',
        condition: level.totalSquadsCreated >= 1,
      },
      {
        id: 'chat-master',
        title: 'Chat Master',
        condition: level.totalMessagesCount >= 100,
      },
      {
        id: 'event-enthusiast',
        title: 'Event Enthusiast',
        condition: level.totalEventsAttended >= 10,
      },
      {
        id: 'expert-level',
        title: 'Expert Level',
        condition: level.currentLevel === 'Expert',
      },
    ];

    for (const criteria of achievementCriteria) {
      if (criteria.condition) {
        earnedAchievements.push({
          id: criteria.id,
          name: criteria.title,
          description: criteria.title,
          unlockedAt: new Date(),
        });
      }
    }

    return earnedAchievements;
  }
}

/**
 * PREFERENCES SERVICE
 * Handles user preferences, interests, notifications settings, discovery
 */
export class PreferencesService {
  /**
   * Get user's preferences
   */
  static async getPreferences(userId: string): Promise<UserPreferences> {
    if (!userId) throw new Error('User ID required');

    const prefs = dataStore.getUserPreferences(userId);
    if (!prefs) {
      // Create default preferences if none exist
      const created = this.createDefaultPreferences(userId);
      dataStore.createOrUpdatePreferences?.(created);
      return created;
    }
    
    return prefs;
  }

  /**
   * Update user's preferences
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    if (!userId) throw new Error('User ID required');

    const current = await this.getPreferences(userId);
    const updated = { ...current, ...updates, userId };

    dataStore.createOrUpdatePreferences(updated);
    return updated;
  }

  /**
   * Add interest to user
   */
  static async addInterest(userId: string, interest: string): Promise<void> {
    if (!userId || !interest) throw new Error('User ID and interest required');

    const prefs = await this.getPreferences(userId);
    if (!prefs.interests.includes(interest)) {
      prefs.interests.push(interest);
      await this.updatePreferences(userId, { interests: prefs.interests });
    }
  }

  /**
   * Remove interest from user
   */
  static async removeInterest(userId: string, interest: string): Promise<void> {
    const prefs = await this.getPreferences(userId);
    prefs.interests = prefs.interests.filter(i => i !== interest);
    await this.updatePreferences(userId, { interests: prefs.interests });
  }

  /**
   * Get recommended groups based on user interests
   */
  static async getRecommendations(userId: string): Promise<any[]> {
    const prefs = await this.getPreferences(userId);
    // This would integrate with a recommendation engine
    // For now, return public groups
    return [];
  }

  /**
   * Private: Create default preferences for new user
   */
  private static createDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      interests: [],
      preferredEventTypes: [],
      notificationFrequency: 'daily',
      discoveryEnabled: true,
      preferredSquadTopics: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * NOTIFICATION SERVICE
 * Handles creating and managing notifications
 */
export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(
    userId: string,
    type: 'level-up' | 'interest-match' | 'event-reminder' | 'squad-invite' | 'message',
    title: string,
    message: string,
    actionUrl?: string,
    relatedId?: string
  ): Promise<Notification> {
    if (!userId || !type || !title || !message) {
      throw new Error('Missing required notification fields');
    }

    return await getSupabaseRepository().createNotification({
      userId,
      type,
      title,
      message,
      actionUrl,
      relatedId
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    if (!userId || !notificationId) throw new Error('User ID and Notification ID required');
    
    await getSupabaseRepository().markNotificationAsRead(notificationId);
  }

  /**
   * Get user's notifications (paginated)
   */
  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    if (!userId) throw new Error('User ID required');

    return await getSupabaseRepository().getUserNotifications(userId, limit);
  }

  /**
   * Send level-up notification
   */
  static async notifyLevelUp(userId: string, newLevel: string): Promise<void> {
    await this.createNotification(
      userId,
      'level-up',
      '🎉 Level Up!',
      `Congratulations! You've reached ${newLevel} level!`,
      `/dashboard/profile`
    );
  }

  /**
   * Send achievement notification
   */
  static async notifyAchievement(userId: string, achievementTitle: string): Promise<void> {
    await this.createNotification(
      userId,
      'message',
      '🏆 Achievement Unlocked!',
      `You've unlocked the "${achievementTitle}" achievement!`,
      `/dashboard/profile`
    );
  }
}

export default {
  ChatService,
  LevelService,
  PreferencesService,
  NotificationService,
};
