import { useCallback, useEffect } from "react";
import useStore from "../store/store";
import generateRoomId from "../utils/generateRoomId";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    const {username, room ,socket, setUserName, setRoom, setActiveRooms, setStream, setVideo, setAudio, video, audio} = useStore();
    
    const getActiveRooms = useCallback(() => {
      if(socket){
        socket.emit('success:connection');

        socket.on('activeRooms', (activeRooms) => {
          setActiveRooms(activeRooms);
        });
      }
    },[setActiveRooms, socket]);

    /* socket handling */
    const joinRoomSocketConnection = useCallback(async (roomId,user) => {
      getActiveRooms();
      navigate(`/room/${roomId}`);
    },[getActiveRooms, navigate]);
    /* --------------- */

    /* handling streams */
    const openMediaDevices = async (constraints,videoSrc) => {
      return await navigator.mediaDevices.getUserMedia(constraints).then(local=>videoSrc.srcObject=local);
    }

    const getVideoAndAudio = useCallback( async (ele) =>{
      try {
          if(audio || video){
            const stream = await openMediaDevices({'video':video,'audio':audio},ele);
            console.log('Got MediaStream:', stream);
            setStream(stream);
          }else{
            setStream(null);
            ele.srcObject = null;
          }
      } catch(error) {
          console.error('Error accessing media devices.', error);
      }
    },[audio, setStream, video]);

    useEffect(()=>{
      const videoSrc = document.getElementById("video-self");
      getVideoAndAudio(videoSrc);
    },[getVideoAndAudio, video, audio]);
    /* ---------------- */

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
            <video id="video-self" className="border border-black rounded-md" autoPlay muted playsInline></video>
            <div className="flex gap-3">
              <button onClick={()=>{
                if(video) setVideo(false);
                else setVideo(true);
              }} className={`px-2 py-1 rounded border ${video ? 'bg-slate-700':'bg-red-700'} text-white cursor-pointer hover:border hover:border-black`}>Video</button>
              <button onClick={()=>{
                  if(audio) setAudio(false);
                  else setAudio(true);
                }} className={`px-2 py-1 rounded border ${audio ?'bg-slate-700':'bg-red-700'} text-white cursor-pointer hover:border hover:border-black`}>Audio</button>
            </div>
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