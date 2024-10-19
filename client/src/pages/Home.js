import { useCallback, useEffect } from "react";
import useStore from "../store/store";
import generateRoomId from "../utils/generateRoomId";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    const {username, room ,socket, activeRooms, setUserName, setRoom, setActiveRooms, roomMembers, setRoomMembers} = useStore();
    const getActiveRooms = useCallback(() => {
      if(socket){
        socket.emit('success:connection');

        socket.on('activeRooms', (activeRooms) => {
          console.log('Active rooms:', activeRooms);
          setActiveRooms(activeRooms);
        });
      }
    },[setActiveRooms, socket]);

    const joinRoomSocketConnection = useCallback((roomId,user) => {
      if(socket){
        socket.emit('joinRoom', roomId, user);
        
        socket.on('message',({message, members})=>{
          console.log("message",message,members);
          setRoomMembers(members);
        })
      }
      getActiveRooms();

      navigate(`/room/${roomId}`);
    },[getActiveRooms, navigate, setRoomMembers, socket]);

    useEffect(()=>{
      console.log("data", {username, room ,socket, activeRooms, roomMembers} );
    },[activeRooms, room, roomMembers, socket, username])

    useEffect(()=>{
      getActiveRooms();
    },[getActiveRooms]);

    const createRoom = () => {
      const res = generateRoomId();
      console.log(res);
      setRoom(res);
      joinRoomSocketConnection(res, username);  
    }

    const joinRoom = () => {
      console.log({room,username});
      joinRoomSocketConnection(room, username);   

    }


    return (
      <div className={"flex w-[100dvw] h-[100dvh]"}> 
        <div className="flex flex-col gap-3 w-[30%] h-full border bg-slate-100 justify-center items-center px-20">
            <h1 className="text-[30px] font-bold text-slate-700 font-sans">Video Call App</h1>
            <input value={username} onChange={(e)=>setUserName(e.target.value)} type="text" placeholder="Username" className="px-2 py-1 rounded w-full border border-slate-400"/>
            <button onClick={()=>createRoom()} className="px-3 py-1 rounded bg-slate-700 text-white hover:bg-opacity-90">Create Room</button>
            <div>------------------------------OR------------------------------</div>
            <input value={room} onChange={(e)=>{e.target.value.length<=6 && setRoom(e.target.value)}} type="text" placeholder="Room" className="px-2 py-1 rounded w-full border border-slate-400"/>
            <p className="text-[12px] italic"><b>Note</b>: room-id can only be of 6 letters</p>
            <button onClick={()=>joinRoom()} className="px-3 py-1 rounded text-white bg-slate-700 hover:bg-opacity-90">Join Room</button>

        </div>
        <div className="flex w-[70%] h-full border justify-center items-center">
            <img src="/assets/bg-2.jpg" alt="video-call-illustration" className="w-full h-fit"/>
        </div>
      </div> 
   )
}

export default Home