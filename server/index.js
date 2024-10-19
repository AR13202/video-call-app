require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http')
const  { Server } = require('socket.io');
const PORT = 4000;

const socketToNameMapping = {};
const appLogs = [];
let activeRooms = [];
const roomToUserMapping = {};
const userToRoomMapping = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Allow requests from this origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true
  }
});

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

  socket.on('success:connection',()=>{
    io.emit('activeRooms',activeRooms)
  });

  // Join/Create a room
  socket.on('joinRoom', (roomName, Name) => {
    socket.join(roomName);
    socketToNameMapping[socket.id] = Name;
    console.log(`User ${socket.id} joined room: ${roomName}`);
    if (!activeRooms.find(room=>room===roomName)) {
      activeRooms.push(roomName);
      roomToUserMapping[roomName] = [{Name,id:socket.id}]
    }else{
      roomToUserMapping[roomName].push({Name,id:socket.id});
    }
    userToRoomMapping[socket.id] = roomName;
    io.to(roomName).emit('message',{
      message: `User ${socket.id} has joined the room`, //socket message
      members: roomToUserMapping[roomName] // details of members
    });
    appLogs.push(`${Name} joins room ${roomName} with socketId ${socket.id}`);
  });

  // Handle sending messages to a specific room
  socket.on('messageToRoom', ({ roomName, name, message }) => {
    console.log(`Message to room ${roomName} from ${name}: ${message}`);
    io.to(roomName).emit('room:message', {
      message, //socket message
      name, 
      socketId: socket.id
    });
    appLogs.push(`Message to room ${roomName}: ${message}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    delete socketToNameMapping[socket.id];
    roomToUserMapping[userToRoomMapping[socket.id]] = 
        roomToUserMapping[userToRoomMapping[socket.id]]?.filter((data)=>data.id!=socket.id); 
    if(roomToUserMapping[userToRoomMapping[socket.id]]?.length==0) {
      delete roomToUserMapping[userToRoomMapping[socket.id]];
      activeRooms = activeRooms.filter((data)=> data!==userToRoomMapping[socket.id])
    }else{
      io.to(userToRoomMapping[socket.id]).emit('update',{
        members:roomToUserMapping[userToRoomMapping[socket.id]]
      })
    }
    delete userToRoomMapping[socket.id];
    appLogs.push(`A user disconnected: ${socket.id}`);
    console.log('A user disconnected:', socket.id);
    // TODO: delete user from storage as well
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
    -> socketToNameMapping remove --> done
    -> check active Rooms -->
    -> roomToUserMapping Update --> done
    -> userToRoomMapping deletion. --> done

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