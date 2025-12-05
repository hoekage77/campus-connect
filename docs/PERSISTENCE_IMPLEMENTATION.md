# Data Persistence Implementation

## Overview
This document describes the localStorage-based persistence layer implemented for the CampusConnect application to preserve user data across page refreshes without requiring a database backend.

## Implementation Details

### Core Methods

#### 1. `saveToLocalStorage()`
Serializes the entire DataStore state to JSON and saves it to localStorage.

**Serialization Strategy:**
- **Maps**: Converted to arrays of `[key, value]` pairs
- **Sets**: Converted to arrays
- **Nested Maps with Sets**: Sets within Map values are converted to arrays during serialization

**Data Structures Persisted:**
- `userLevels` (Map)
- `userPreferences` (Map)
- `chatRooms` (Map)
- `chatMessages` (Map with array values)
- `notifications` (Map with array values)
- `squads` (Map)
- `users` (Map)
- `usersByEmail` (Map)
- `usersByStudentId` (Map)
- `userPasswords` (Map)
- `groups` (Map)
- `groupMembers` (Map)
- `groupMembersByGroup` (Map with Set values)
- `groupMembersByUser` (Map with Set values)
- `sessions` (Map)
- `sessionsByGroup` (Map with Set values)
- `messages` (Map)
- `messagesByGroup` (Map with array values)
- `messagesBySession` (Map with array values)
- `rsvps` (Map)
- `rsvpsBySession` (Map with Set values)

**Storage Key:** `campusConnect_dataStore`

#### 2. `loadFromLocalStorage()`
Deserializes JSON data from localStorage and reconstructs the DataStore state.

**Returns:** `boolean` - `true` if data was successfully loaded, `false` otherwise

**Deserialization Process:**
- Arrays are converted back to Maps using `new Map(array)`
- Arrays within Map values are converted back to Sets where appropriate
- Console logs success or failure for debugging

#### 3. `clearPersistedData()`
Clears all in-memory data and removes the persisted data from localStorage.

**Actions:**
1. Calls `this.clear()` to reset all in-memory Maps and Sets
2. Removes the `campusConnect_dataStore` key from localStorage

#### 4. `resetToDefaults()`
Completely resets the application to demo data.

**Actions:**
1. Calls `clearPersistedData()` to wipe all data
2. Calls `seedDemoData()` to populate demo data
3. Calls `saveToLocalStorage()` to persist the demo data

### Auto-Save Implementation

The following mutation methods now automatically call `saveToLocalStorage()` after modifying data:

**User Methods:**
- `createUser()`
- `updateUser()`
- `setUserPassword()`

**Group Methods:**
- `createGroup()`
- `updateGroup()`
- `deleteGroup()`
- `addGroupMember()`
- `removeGroupMember()`

**Session Methods:**
- `createSession()`
- `updateSession()`
- `deleteSession()`

**RSVP Methods:**
- `createOrUpdateRSVP()` (both create and update paths)

**Message Methods:**
- `createMessage()` (group and session messages)

**Chat Methods:**
- `createChatRoom()`
- `addChatRoomMember()`
- `createChatMessage()`

**Notification Methods:**
- `createNotification()`
- `markNotificationAsRead()`

**Level & Preferences Methods:**
- `addActivityPoints()`
- `createOrUpdatePreferences()`

### Initialization

The DataStore automatically initializes on module load:

```typescript
if (typeof window !== "undefined") {
  if (!dataStore.loadFromLocalStorage()) {
    console.log("No persisted data found. Initializing with demo data...")
    dataStore.resetToDefaults()
  }
}
```

**Logic:**
1. Check if running in browser environment (`window` exists)
2. Try to load persisted data
3. If no persisted data exists, seed demo data and save it

## User Interface

### Clear Demo Data Button

**Location:** Dashboard page (`app/dashboard/page.tsx`)

**Placement:** Next to "Find More Squads" button in the profile header section

**Functionality:**
- Shows a confirmation dialog before clearing data
- Calls `dataStore.resetToDefaults()` to wipe and reseed data
- Reloads the page to reflect the changes

**Code:**
```tsx
<Button
  variant="outline"
  onClick={() => {
    if (confirm("Are you sure you want to clear all data and reset to demo data? This action cannot be undone.")) {
      const { dataStore } = require("@/lib/data/store")
      dataStore.resetToDefaults()
      window.location.reload()
    }
  }}
>
  Clear Demo Data
</Button>
```

## Testing Guide

### Verify Persistence Works

1. **Create New Data:**
   - Sign up with a new user account
   - Create a new group
   - Join some groups
   - Send messages

2. **Verify Persistence:**
   - Refresh the page (F5 or Cmd+R)
   - Verify all your data is still present
   - Check localStorage in browser DevTools → Application → Local Storage → `campusConnect_dataStore`

3. **Test Clear Functionality:**
   - Click "Clear Demo Data" button on dashboard
   - Confirm the dialog
   - Verify page reloads with fresh demo data
   - Try logging in with demo user credentials

### Browser DevTools Inspection

Open DevTools → Application → Local Storage → `campusConnect_dataStore`

You should see a large JSON object with all persisted data:
- `users`: Array of `[userId, userProfile]` pairs
- `groups`: Array of `[groupId, group]` pairs
- `groupMembers`: Array of `[memberId, groupMember]` pairs
- etc.

## Performance Considerations

### Storage Size
- localStorage has a typical limit of 5-10MB per domain
- Current implementation stores entire state on every mutation
- For production with large datasets, consider:
  - Debouncing save operations
  - Partial saves for specific entities
  - IndexedDB for larger storage limits

### Save Frequency
- Currently saves on every mutation (create, update, delete)
- This provides maximum data safety but may impact performance with high-frequency operations
- Consider implementing a debounced save strategy if performance issues occur

## Migration Path

When ready to add a backend database:

1. Keep the DataStore interface unchanged
2. Replace in-memory Maps with API calls
3. Remove `saveToLocalStorage()` calls
4. Remove `loadFromLocalStorage()` initialization
5. Add proper API error handling
6. Implement server-side data validation

The services layer (`services/LevelService.ts`) already provides abstraction over the DataStore, making this migration straightforward.

## Known Limitations

1. **No conflict resolution**: If multiple tabs are open, last write wins
2. **No versioning**: Data structure changes require manual migration
3. **Size limits**: Subject to browser localStorage limits (5-10MB)
4. **Browser-specific**: Data is not synced across browsers or devices
5. **No backup**: Clearing browser data will lose all information

## Future Enhancements

- [ ] Implement debounced saves to reduce write frequency
- [ ] Add data versioning for migration support
- [ ] Implement cross-tab synchronization using BroadcastChannel API
- [ ] Add export/import functionality for data backup
- [ ] Compress data before storing (using LZ-string or similar)
- [ ] Migrate to IndexedDB for better performance and larger storage
