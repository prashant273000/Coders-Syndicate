# 1v1 Coding Battle Platform - Setup Guide

This document explains how to set up and run the real-time 1v1 coding battle feature with Judge0 code execution.

## Features Implemented

### 1. Real Matchmaking System (Socket.io)
- Users can join a matchmaking queue from the Arena page
- When 2+ users are in the queue, they get paired together
- Both users receive match data including opponent info, room ID, and a random coding question
- Users are automatically redirected to the Battle page

### 2. Real-time Battle Features
- Live code typing indicator (shows when opponent is typing)
- Real-time score updates when either player submits
- Opponent disconnect detection
- 15-minute countdown timer with auto-submit when time runs out

### 3. Judge0 Code Execution
- **Run Code**: Execute code with custom input and see output immediately
- **Submit**: Run code against all test cases and get a score
- Supports 5 languages: JavaScript, Python, C++, Java, C
- Shows detailed test case results with pass/fail status

### 4. Battle Result System
- Winner determination based on test case scores
- Beautiful result modal with win/lose/draw animations
- Score comparison display

## Backend Setup

### 1. Install Dependencies
```bash
cd auth/backend
npm install
```

### 2. Configure Environment Variables
Add the following to `auth/backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JUDGE0_API_KEY=your_rapidapi_key_here
```

**Important**: You need to get a Judge0 API key from RapidAPI:
1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Subscribe to the API (free tier available)
3. Copy your API key to the `.env` file

### 3. Start the Backend Server
```bash
cd auth/backend
node server.js
```

The server will start on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd web_frontend
npm install
```

### 2. Configure Environment Variables
The `.env` file should contain:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start the Frontend
```bash
cd web_frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## How to Test

### Testing Matchmaking (Requires 2 Users)

1. Open two browser windows/tabs
2. Log in with different accounts in each window
3. Go to the Arena page in both windows
4. Click "FIND MATCH" in both windows
5. The system will pair the two users and redirect to Battle

### Testing Code Execution (Single User)

You can test the code execution without matchmaking by:
1. Going directly to `/battle` (you'll need to set sessionStorage manually)
2. Or use the Arena page and quickly find a match

### Sample Code for Testing

**JavaScript - Two Sum Solution:**
```javascript
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// For custom input testing, use console.log:
// console.log(JSON.stringify(twoSum([2,7,11,15], 9)));
```

**Python - Two Sum Solution:**
```python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

## API Endpoints

### POST `/api/battle/run`
Run code with custom input.

**Request Body:**
```json
{
  "code": "console.log('Hello World');",
  "languageId": 63,
  "stdin": ""
}
```

**Response:**
```json
{
  "stdout": "Hello World\n",
  "stderr": "",
  "status": "Accepted",
  "time": "0.012",
  "memory": "12345"
}
```

### POST `/api/battle/submit`
Submit code for scoring against all test cases.

**Request Body:**
```json
{
  "roomId": "room-uuid",
  "userId": "user-uid",
  "code": "function solve() {...}",
  "languageId": 63,
  "language": "JavaScript"
}
```

**Response:**
```json
{
  "verdict": "Accepted",
  "score": 100,
  "passedCount": 3,
  "totalCases": 3,
  "testResults": [...]
}
```

## Socket Events

### Client → Server
- `joinQueue`: Join matchmaking queue
- `leaveQueue`: Leave matchmaking queue
- `joinRoom`: Join a battle room
- `codeUpdate`: Send typing indicator
- `submitResult`: Submit code result (from route)

### Server → Client
- `matchFound`: Match found with opponent
- `opponentJoined`: Opponent joined the room
- `opponentTyping`: Opponent is typing
- `opponentDisconnected`: Opponent disconnected
- `submissionUpdate`: Score update
- `battleOver`: Battle finished

## Questions Database

The system includes 5 pre-configured questions:
1. **Two Sum** (Easy)
2. **Reverse String** (Easy)
3. **Valid Parentheses** (Medium)
4. **Maximum Subarray** (Medium)
5. **Merge Two Sorted Lists** (Medium)

Each question has:
- Title and description
- Examples
- 3+ test cases for automated scoring

## Troubleshooting

### Matchmaking not working
- Ensure both users are connected to the same Socket.io server
- Check browser console for connection errors
- Verify `VITE_SOCKET_URL` is correct

### Code execution failing
- Verify `JUDGE0_API_KEY` is set correctly in backend `.env`
- Check RapidAPI subscription status
- Ensure the code syntax is valid for the selected language

### Timer not counting down
- Check browser tab is not in background (some browsers throttle timers)
- Verify the Battle page loaded correctly

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Frontend      │
│  (Player 1)     │     │  (Player 2)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    Socket.io          │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Backend Server      │
         │   (Node.js + Express) │
         │   + Socket.io         │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Judge0 API          │
         │   (Code Execution)    │
         └───────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   MongoDB             │
         │   (Battle Records)    │
         └───────────────────────┘
```

## Notes

- The styling and layout of Battle.jsx have been preserved exactly as requested
- All CSS classes and glassmorphism effects remain unchanged
- Only the logic and functionality have been updated
- The system uses Firebase UID for user identification