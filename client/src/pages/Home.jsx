import { useCallback, useEffect } from "react";
import generateRoomId from "../utils/generateRoomId";
import { useNavigate } from "react-router-dom";
import useMediaStream from "../hooks/useMediaStream.tsx";
import userStore from "../store/store.tsx";

const Home = () => {
    const navigate = useNavigate();
    const {username, room , setUserName, setRoom, setVideo, setAudio, video, audio} = userStore();
    const mediaStreamFunction = useMediaStream(); 

    /* socket handling */
    const joinRoomSocketConnection = useCallback(async (roomId) => {
      mediaStreamFunction.getActiveRooms();
      navigate(`/room/${roomId}`);
    },[mediaStreamFunction, navigate]);
    /* --------------- */

    useEffect(()=>{
      handleStream({audioToggle:audio,videoToggle:video});  
    },[])

    const handleStream = ({audioToggle,videoToggle})=>{
      const videoSrc = document.getElementById("video-self");
      mediaStreamFunction.getUserStream({audio:audioToggle,video:videoToggle}).then((stream)=>{videoSrc.srcObject = stream}).catch((err)=>console.log(err));
      console.log("setting stream")
    };
    /* ---------------- */

    // useEffect(()=>{
    //   getActiveRooms();
    // },[getActiveRooms]);

    const createRoom = () => {
      const res = generateRoomId();
      console.log(res);
      setRoom(res);
      joinRoomSocketConnection(res);  
    }

    const joinRoom = () => {
      console.log({room,username});
      joinRoomSocketConnection(room);   

    }

    return (
      <div className={"flex w-[100dvw] h-[100dvh] flex-col lg:flex-row"}> 
        <div className="flex flex-col gap-3 w-full h-full lg:w-[30%] lg:h-full border bg-slate-100 justify-center items-center px-20">
            <video id="video-self" className="border border-black rounded-md" autoPlay muted={audio} playsInline></video>
            <div className="flex gap-3">
              <button onClick={()=>{
                const tempVideo = !video;
                setVideo(tempVideo);
                handleStream({videoToggle:tempVideo,audioToggle:audio});
              }} className={`px-2 py-1 rounded border ${video ? 'bg-slate-700':'bg-red-700'} text-white cursor-pointer hover:border hover:border-black`}>Video</button>
              <button onClick={()=>{
                  const tempAudio = !audio; 
                  setAudio(tempAudio);
                  handleStream({videoToggle:video,audioToggle:tempAudio});
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
        <div className="hidden lg:flex lg:w-[70%] lg:h-full border justify-center items-center">
            <img src="/assets/bg-2.jpg" alt="video-call-illustration" className="w-full h-fit"/>
        </div>
      </div> 
   )
}

export default Home