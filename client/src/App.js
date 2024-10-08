import './App.css';
import { useState } from 'react'; // Add this
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client'; // Add this
import Home from './pages/Home';
import Room from './pages/Room';

const socket = io.connect('http://localhost:4000'); // Add this -- our server will run on port 4000, so we connect to it from here

function App() {
  const [username, setUsername] = useState(''); // Add this
  const [room, setRoom] = useState(''); // Add this

  return (
    <Router>
        <Routes>
          <Route path='/' element={<Home username={username} setUsername={setUsername} room={room} setRoom={setRoom} socket={socket} />}/>
          <Route path='/room' element={<Room/>}/>
        </Routes>
    </Router>
  );
}

export default App;