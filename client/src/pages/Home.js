
const Home = ({ username, setUsername, room, setRoom, socket }) => {
    return (
      <div className={"flex w-[100dvw] h-[100dvh]"}> 
        <div className="flex flex-col gap-3 w-[30%] h-full border bg-slate-100 justify-center items-center px-20">
            <h1 className="text-[30px] font-bold text-slate-700 font-sans">Video Call App</h1>
            <input type="text" placeholder="Username" className="px-2 py-1 rounded w-full border border-slate-400"/>
            <button className="px-3 py-1 rounded bg-slate-700 text-white hover:bg-opacity-90">Create Room</button>
            <div>------------------------------OR------------------------------</div>
            <input type="text" placeholder="Room" className="px-2 py-1 rounded w-full border border-slate-400"/>
            <button className="px-3 py-1 rounded text-white bg-slate-700 hover:bg-opacity-90">Join Room</button>

        </div>
        <div className="flex w-[70%] h-full border justify-center items-center">
            <img src="/assets/bg-2.jpg" alt="video-call-illustration" className="w-full h-fit"/>
        </div>
      </div> 
   )
}

export default Home