import './App.css';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Home from './pages/Home.jsx';
import Room from './pages/Room.jsx';
import userStore from './store/store.tsx';

function App() {
  const {setSocket} = userStore();

  useEffect(()=>{
    const socket = io.connect(process.env.REACT_APP_SERVER_URL);
    // const socket = io.connect('http://localhost:4000/');

    console.log("socket Connected --> ",socket);

    setSocket(socket);

    return (()=>{
      socket.disconnect();
      console.log("<---Socket Disconnected--->");
    })

  },[setSocket])
  return (
    <Router>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/room/:roomId' element={<Room/>}/>
        </Routes>
    </Router>
  );
}


export default App;

/*
  * store socket to store
  * redirect to room
  * get stream
  * create peer
  * update store with userData
  * emit socket join-room
  * receive socket.on(user-connected)
  * receive peerConnection => peer.on('call',()=>{})
  * update members in store
  * handleToogleStreamConstraints => audio,video
  * 
  * *  
*/