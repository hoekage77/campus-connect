# Campus Connect Chat Features Roadmap

## Current Features ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Basic Messaging | ✅ Done | Send/receive text messages in chat rooms |
| E2EE Encryption | ✅ Done | Full end-to-end encryption with libsodium (XChaCha20-Poly1305) |
| User Avatars | ✅ Done | Display sender name & avatar initials |
| Timestamps | ✅ Done | Message time display |
| Encryption Status | ✅ Done | Visual indicators (🔒 locked/unlocked/not encrypted) |
| Key Management | ✅ Done | Setup, unlock, lock, backup/restore keys |
| Room Encryption Toggle | ✅ Done | Enable E2EE for specific rooms |
| Optimistic Updates | ✅ Done | Messages show instantly while sending |
| Message Sorting | ✅ Done | Chronological order |

---

## Planned Features

### Phase 1: Core Chat Enhancements (High Priority)

These features have the highest impact for study group discussions.

#### 1. Message Reactions
- **Priority:** 🔴 High
- **Effort:** Medium (2-3 days)
- **Description:** Allow users to react to messages with emojis
- **Reactions:** 👍 ❤️ 😂 😮 😢 ✅ ❓ 🎉
- **Why:** Quick acknowledgment without cluttering chat - perfect for confirming understanding in study groups

#### 2. Reply to Messages (Threading)
- **Priority:** 🔴 High
- **Effort:** Medium (2-3 days)
- **Description:** Reply to specific messages with visual threading
- **Why:** Essential when discussing multiple questions/topics simultaneously

#### 3. @Mentions
- **Priority:** 🔴 High
- **Effort:** Medium (2-3 days)
- **Description:** Tag specific members with @username
- **Features:**
  - Autocomplete dropdown when typing @
  - Highlighted mentions in messages
  - Notification to mentioned user
- **Why:** Essential for group coordination ("@John can you explain problem #3?")

#### 4. Typing Indicators
- **Priority:** 🟡 Medium
- **Effort:** Low (1 day)
- **Description:** Show "User is typing..." indicator
- **Why:** Reduces duplicate answers, improves conversation flow

#### 5. Unread Count Badges
- **Priority:** 🟡 Medium
- **Effort:** Low (1-2 days)
- **Description:** Show unread message count per room
- **Features:**
  - Badge on room list
  - Track last read message per user
  - Mark as read on scroll/view
- **Why:** Know which rooms need attention

---

### Phase 2: Study-Focused Features

Features specifically designed for academic collaboration.

#### 6. File & Image Sharing
- **Priority:** 🔴 High
- **Effort:** High (4-5 days)
- **Description:** Share study materials, notes, images
- **Features:**
  - Image preview & lightbox
  - File attachments (PDF, docs)
  - E2EE for all files
  - Progress indicator for uploads
- **Why:** Share notes, screenshots of problems, study materials

#### 7. Pinned Messages
- **Priority:** 🟡 Medium
- **Effort:** Low (1-2 days)
- **Description:** Pin important messages to top of room
- **Use cases:**
  - Exam dates
  - Zoom/meeting links
  - Study resources
  - Group rules
- **Why:** Quick access to important info

#### 8. Code Snippets
- **Priority:** 🟡 Medium
- **Effort:** Medium (2 days)
- **Description:** Syntax-highlighted code blocks
- **Features:**
  - Language detection
  - Copy button
  - Line numbers (optional)
- **Syntax:** Triple backticks with language
- **Why:** Essential for CS/programming students

#### 9. Polls
- **Priority:** 🟡 Medium
- **Effort:** Medium (2-3 days)
- **Description:** Create quick polls in chat
- **Use cases:**
  - "Which chapter should we review?"
  - "When can everyone meet?"
  - "What topic for next session?"
- **Features:**
  - Multiple choice
  - Anonymous voting option
  - Results display
- **Why:** Quick group decisions

#### 10. Link Previews
- **Priority:** 🟢 Low
- **Effort:** Medium (2 days)
- **Description:** Rich previews for shared links
- **Supported:**
  - Google Docs/Sheets
  - YouTube videos
  - General websites (Open Graph)
- **Why:** Context for shared resources

#### 11. LaTeX/Math Rendering
- **Priority:** 🟢 Low
- **Effort:** Medium (2 days)
- **Description:** Render mathematical equations
- **Syntax:** `$inline$` and `$$block$$`
- **Library:** KaTeX
- **Why:** Essential for STEM students

---

### Phase 3: Real-time & Advanced Features

#### 12. Voice/Video Calls
- **Priority:** 🟡 Medium
- **Effort:** High (1-2 weeks)
- **Description:** WebRTC-based calls
- **Features:**
  - 1-on-1 calls
  - Group calls (up to 8)
  - Screen sharing
- **Integration:** Daily.co or custom WebRTC
- **Why:** Quick discussions without leaving app

#### 13. "Start Space" from Chat
- **Priority:** 🟡 Medium
- **Effort:** Low (1 day)
- **Description:** Button to start audio Space from chat
- **Why:** Seamless transition to live discussion

#### 14. Message Edit & Delete
- **Priority:** 🟡 Medium
- **Effort:** Medium (2 days)
- **Description:** Edit/delete your own messages
- **Features:**
  - Edit with "edited" indicator
  - Delete with "message deleted" placeholder
  - Time limit for editing (optional)
- **Why:** Fix typos, remove mistakes

#### 15. Read Receipts
- **Priority:** 🟢 Low
- **Effort:** Medium (2 days)
- **Description:** See who has read messages
- **Features:**
  - Opt-in per user (privacy)
  - "Seen by X, Y, Z" indicator
- **Why:** Know if questions were seen

#### 16. Study Timer / Pomodoro
- **Priority:** 🟢 Low
- **Effort:** Medium (3 days)
- **Description:** Shared study timer in chat
- **Features:**
  - Start 25/50 min focus sessions
  - Visible to all members
  - Break reminders
- **Why:** Group accountability for studying

---

### Phase 4: Trust & Safety

#### 17. Message Reporting
- **Priority:** 🟡 Medium
- **Effort:** Medium (2 days)
- **Description:** Report inappropriate content
- **Features:**
  - Report reasons (harassment, spam, etc.)
  - Optional: share decrypted copy with mods
  - Admin review queue
- **Why:** Safety in study groups

#### 18. Block Users
- **Priority:** 🟡 Medium
- **Effort:** Low (1 day)
- **Description:** Block users from DMs
- **Why:** Personal safety

#### 19. Slow Mode
- **Priority:** 🟢 Low
- **Effort:** Low (1 day)
- **Description:** Rate limit messages in busy rooms
- **Options:** 5s, 10s, 30s, 1min between messages
- **Why:** Prevent spam in large groups

---

## Implementation Priority Matrix

```
                    HIGH IMPACT
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     │  Message         │  File Sharing    │
     │  Reactions       │  Voice/Video     │
     │  Reply/Thread    │                  │
     │  @Mentions       │                  │
LOW  │──────────────────┼──────────────────│ HIGH
EFFORT                  │                  EFFORT
     │  Typing          │  Polls           │
     │  Indicators      │  LaTeX           │
     │  Unread Badges   │  Link Previews   │
     │  Pinned Messages │                  │
     │                  │                  │
     └──────────────────┼──────────────────┘
                        │
                    LOW IMPACT
```

---

## Suggested Sprint Plan

### Sprint 1 (Week 1-2)
- [ ] Message Reactions
- [ ] Reply to Messages
- [ ] @Mentions with notifications

### Sprint 2 (Week 3-4)
- [ ] Typing Indicators
- [ ] Unread Count Badges
- [ ] Pinned Messages

### Sprint 3 (Week 5-6)
- [ ] Image/File Sharing (E2EE)
- [ ] Code Block Formatting

### Sprint 4 (Week 7-8)
- [ ] Polls
- [ ] Message Edit/Delete
- [ ] Link Previews

### Future
- [ ] Voice/Video Calls
- [ ] LaTeX Rendering
- [ ] Read Receipts
- [ ] Study Timer

---

## Technical Considerations

### Database Changes Required

```sql
-- Reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id),
  user_id UUID REFERENCES users(id),
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Replies/Threading
ALTER TABLE chat_messages ADD COLUMN reply_to_id UUID REFERENCES chat_messages(id);

-- Mentions
CREATE TABLE message_mentions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id),
  mentioned_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pinned Messages
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id),
  message_id UUID REFERENCES chat_messages(id),
  pinned_by UUID REFERENCES users(id),
  pinned_at TIMESTAMP DEFAULT NOW()
);

-- Read Receipts / Unread Tracking
CREATE TABLE message_reads (
  user_id UUID REFERENCES users(id),
  chat_room_id UUID REFERENCES chat_rooms(id),
  last_read_message_id UUID REFERENCES chat_messages(id),
  last_read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(user_id, chat_room_id)
);

-- Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  user_id UUID REFERENCES users(id),
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
```

### E2EE Considerations

- **Reactions:** Can be unencrypted (metadata only)
- **Replies:** Reference message ID only (unencrypted)
- **Mentions:** User IDs can be unencrypted, but message content stays encrypted
- **File Sharing:** Must encrypt file before upload, decrypt on download
- **Polls:** Poll question/options can be encrypted if needed

---

## Next Steps

1. **Pick first feature** to implement (recommend: Message Reactions)
2. **Create database migration** for required tables
3. **Build API routes** for new functionality
4. **Update chat interface** with new UI components
5. **Test E2EE compatibility** if applicable
