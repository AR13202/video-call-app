require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const PORT = 4000;

const socketToUser = {};
const appLogs = [];
let activeRooms = [];

const app = express();
const server = http.createServer(app);

const allowedOrigins = ['https://video-call-app-y4bz.vercel.app', 'http://localhost:3000','http://localhost:3001'];

const removeEmptyRooms = () => {
  const roomsMap = {};
  activeRooms.map((room)=>{
    roomsMap[room] = 0;
  })

  Object.keys(socketToUser).map((socket)=>{
    roomsMap[socketToUser[socket].room] = roomsMap[socketToUser[socket].room] + 1;
  })

  activeRooms = [];
  Object.keys(roomsMap).map((room)=>{
    if(roomsMap[room]>0){
      activeRooms.push(room);
    }
  })
  
}

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world',
  });
});

app.get('/', (req, res) => {
  res.send('Socket.io server with room functionality is running!');
});

app.get('/data', (req, res) => {
  res.send({
    appLogs,
    activeRooms,
    socketToUser,
  });
});

// Listen for incoming connections on the Socket.io server
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('success:connection', () => {
    io.emit('activeRooms', activeRooms);
  });
  //TODO: create a route to create a new ROOMID

  // Join/Create a room
  socket.on('join-room', (roomName, Name,video,audio, peerId) => {
    socket.join(roomName);
    socketToUser[socket.id] = {name:Name, video, audio,peerId,room:roomName};
    console.log(`User ${socket.id} joined room: ${roomName}`);
    if (!activeRooms.includes(roomName)) activeRooms.push(roomName);
    socket.broadcast.to(roomName).emit('join-room', {
      socketId:socket.id,
      name:Name,
      peerId:peerId,
      audio,
      video
    });
    appLogs.push(`${Name} joins room ${roomName} with socketId ${socket.id}`);
  });

  // Handle sending messages to a specific room
  socket.on('message', ({ roomName, name, message }) => {
    console.log(`Message to room ${roomName} from ${name}: ${message}`);
    io.to(roomName).emit('message', {
      message, // socket message
      name,
      socketId: socket.id,
    });
    appLogs.push(`Message to room ${roomName}: ${message}`);
  });

  // Handle disconnection
  socket.on('user-disconnected', (roomId) => {
    const temp = socketToUser[socket.id];
    delete socketToUser[socket.id];
    appLogs.push(`A user disconnected: ${socket.id}`);
    removeEmptyRooms(); // remove roomId from array if no one is present in room.
    socket.broadcast.to(roomId).emit('user-disconnected',{
      socketId:socket.id,
      // peerId: temp.peerId, //TODO: undefined
      name: temp.name
    });
  });

  socket.on('user-toggle-stream', (peerId, roomId,audio,video,socketId) => {
    socketToUser[peerId] = {...socketToUser[peerId],audio,video};
    socket.broadcast.to(roomId).emit('user-toggle-stream', {socketId,peerId,audio,video});
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


/*
app-flow
    const socketToUser = {};
    const appLogs = [];
    const activeRooms = [];
1. user creates a room
    -> addition in socketToUser
    -> appLog push
    -> activeRoom update
2. User Joins Room
    -> addition in socketToUser
    -> appLog push
3. On sending Message
    -> appLog push
4. onLeaving a Room
    -> appLogPush
    -> socketToUser remove --> done
    -> check active Rooms -->

----client-side-data-output----

1. On creating/joining room:
  -> required data of all users.
  -> update appLog.
2. On sending message:
  -> sending message to particular room with required Data.
  -> update appLog.
3. error Handling:
  -> check number of users in room before joining.
  -> should not be more than 8 users.

-----conventions-------
1. one userName should not be able to join more than 1 room.
2. no two rooms should have same name.
3. Not more than 9 users can join the call.
4. two users cannot have same name.

*/