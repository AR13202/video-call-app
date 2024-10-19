import './App.css';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Home from './pages/Home';
import Room from './pages/Room';
import useStore from './store/store';

function App() {
  const {setSocket} = useStore();
  console.log("first",process.env.REACT_APP_SERVER_URL)
  useEffect(()=>{
    // const socket = io.connect(process.env.REACT_APP_SERVER_URL);
    const socket = io('https://video-call-app-sable.vercel.app');
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