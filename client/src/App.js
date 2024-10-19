import './App.css';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Home from './pages/Home';
import Room from './pages/Room';
import useStore from './store/store';

function App() {
  const {setSocket} = useStore();
  useEffect(()=>{
    const socket = io.connect(process.env.SERVER_URL || 'http://localhost:4000');
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