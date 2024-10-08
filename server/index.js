const express = require('express');
const app = express();
const http = require('http')
const  { Server } = require('socket.io');
const PORT = 4000;

const socketToNameMapping = {};
const appLogs = [];
const activeRooms = [];
const roomToUserMapping = {};
const userToRoomMapping = {};

const cors = require('cors');
const server = http.createServer(app);
const io = new Server(server);
app.use(cors());

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world',
  });
});

app.get('/', (req, res) => {
  res.send('Socket.io server with room functionality is running!');
});

app.get('/data', (req,res)=>{
  res.send({
    appLogs,
    activeRooms,
    socketToNameMapping,
    roomToUserMapping,
    userToRoomMapping,
  });
});


// Listen for incoming connections on the Socket.io server
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join/Create a room
  socket.on('joinRoom', (roomName, Name) => {
    socket.join(roomName);
    socketToNameMapping[socket.id] = Name;
    console.log(`User ${socket.id} joined room: ${roomName}`);
    socket.to(roomName).emit('message', `User ${socket.id} has joined the room`);
    appLogs.push(`${Name} joins room ${room} with socketId ${socket.id}`);

    if (!activeRooms.find(room=>room===roomName)) activeRooms.push(roomName);

  });

  // Handle sending messages to a specific room
  socket.on('messageToRoom', ({ roomName, message }) => {
    console.log(`Message to room ${roomName}: ${message}`);
    io.to(roomName).emit('message', message);
    appLogs.push(`Message to room ${roomName}: ${message}`)
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    delete socketToNameMapping[socket.id]
    appLogs.push(`A user disconnected: ${socket.id}`);
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

/*
app-flow
    const socketToNameMapping = {};
    const appLogs = [];
    const activeRooms = [];
    const roomToUserMapping = {};
    const userToRoomMapping = {};
1. user creates a room
    -> addition in socketToNameMapping
    -> appLog push
    -> activeRoom update
    -> roomToUserMapping = {[roomName]:[{socket.id,name}]};
    -> userToRoomMapping
2. User Joins Room
    -> addition in socketToNameMapping
    -> appLog push
    -> roomToUserMapping = {[roomName]:[...prev,{socket.id,name}]};
    -> userToRoomMapping
3. On sending Message
    -> appLog push
4. onLeaving a Room
    -> appLogPush
    -> socketToNameMapping remove
    -> check active Rooms
    -> roomToUserMapping Update
    -> userToRoomMapping deletion.

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
*/