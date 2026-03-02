import React, { useEffect, useRef, useState } from 'react';
import Camera from '../svgs/Camera';
import Mic from '../svgs/Mic';
import Call from '../svgs/Call';
import Copy from '../svgs/Copy';
import Canvas from '../svgs/Canvas';
import { useNavigate } from 'react-router-dom';
import usePeer from '../hooks/usePeer.tsx';
import useSockets from '../hooks/useSockets.tsx';
import useMediaStream from '../hooks/useMediaStream.tsx';
import userStore from '../store/store.tsx';
import { copyText } from '../utils/copyText';

/*
 create peer -> send peerId to server to join room -> 
 other user will receive that peerId -> 
 call on that peerId with there stream -> 
 call.on() -> we will receive incoming stream from above function ->
 set the stream in your local state with desired audiio/video option ->
 on call leave remove user from local state and close peerConnection.
*/

const Room = () => {
    const videoContainerRef = useRef(); 
    const mediaFunctions = useMediaStream();
    const socketFunctions = useSockets();
    const peerFunctions = usePeer();
    const store = userStore();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    const handleSendMessage = () => {
        store.socket.emit('messageToRoom', { roomName: store.room, name: store.username, message: messageInput });
        setMessageInput('');
    };

    // create Peer & get mediaStream
    useEffect(()=>{
        mediaFunctions.getUserStream({ audio:store.audio, video:store.video }).then((stream) => {
            const video = document.getElementById('video-self');
            video.srcObject = stream;
        });
        peerFunctions.createPeer(store.room,store.username,store.audio,store.video);
    },[]);

    useEffect(()=>{
        store.socket.on('join-room', socketFunctions.handleJoinRoom)
        store.socket.on('user-disconnected', socketFunctions.handleLeaveRoom);
        store.socket.on('user-toggle-stream', socketFunctions.toggleStream);
        store.socket.on('user-toggle-stream', socketFunctions.toggleStream);
        store.socket.on('message', ({ message, name, socketId }) => {
            store.setMessages((prev) => [...prev, { message, name, socketId }]);
        });
        
        return(()=>{
            store.socket.off('join-room',socketFunctions.handleJoinRoom);
            store.socket.off('user-disconnected', socketFunctions.handleLeaveRoom);
            store.socket.off('user-toggle-stream', socketFunctions.toggleStream);
            store.socket.off('user-toggle-stream', socketFunctions.toggleStream);
            store.socket.off('room:message',({ message, name, socketId }) => {
                setMessages((prev) => [...prev, { message, name, socketId }]);
            });
        })
    },[store.socket, socketFunctions.handleLeaveRoom, socketFunctions.handleJoinRoom, socketFunctions.handleGetUserDetails, store, socketFunctions.toggleStream])

    return (
        <div className='flex flex-col lg:flex-row w-[100dvw] h-[100dvh]'>
            <div className='flex flex-col h-full lg:w-[75%] bg-black'>
                <div ref={videoContainerRef} className='grid grid-cols-2 lg:gird-cols-3 justify-center items-center gap-1 w-full h-[90%] bg-black rounded-md overflow-y-auto p-2'>
                    {store.stream && (
                            <div className='flex relative'>
                                <video src={store.stream} id="video-self" className="border border-white rounded-md w-full h-full" autoPlay playsInline muted={!store.audio}/>
                                <div className='bg-black bg-opacity-15 text-white font-medium absolute bottom-0 w-full rounded-b px-1'>
                                    {store.username} {store.audio && "| audio"} {store.video && "| video"}
                                </div>
                            </div>
                        )
                    }
                    {store.roomMembers.map((member,index) => (
                        <div className='flex relative' key={member.socketId}>
                            <video ref={(video) => { if (video) video.srcObject = member.stream }} id="video-self" className="border border-white rounded-md w-full h-full" autoPlay playsInline muted={!member.audio}/>                            
                            <div className='bg-black bg-opacity-15 text-white font-medium absolute bottom-0 w-full rounded-b px-1'>
                                {member.username} {member.audio && "| audio"} {member.video && "| video"}
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex w-full lg:h-[10%] p-2 bg-black'>
                    <div className='bg-slate-200 rounded w-full h-full flex justify-between lg:justify-center items-center p-2 gap-3'>
                        <div onClick={() => copyText(store.room)} className='w-[15%] h-full flex justify-center items-center hover:underline cursor-pointer text-[12px] lg:text-[15px] font-medium gap-2'>
                            <Copy />
                            <span>Copy Joining Info</span>
                        </div>
                        <div className='w-1/3 lg:w-[70%] h-full flex justify-center items-center gap-3 p-1'>
                            <button onClick={()=>mediaFunctions.toggleStream(store.peerId,store.audio,!store.video)} className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'>
                                {store.video ? <Camera /> : <></>} 
                            </button>
                            <button onClick={()=>mediaFunctions.toggleStream(store.peerId,!store.audio,store.video)} className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'>
                                {store.audio ? <Mic /> : <></>} 
                                </button>
                            <button onClick={()=>{
                                peerFunctions.disconnectPeerCall();
                                navigate('/');
                                window.location.reload();
                            }} className='h-full aspect-square rounded-full bg-red-800 p-3 text-white font-medium'><Call /></button>
                        </div>
                        <div className='w-[15%] h-full flex gap-2 justify-center hover:underline cursor-pointer items-center text-[12px] lg:text-[15px] font-medium'>
                            <span>Open Canvas</span>
                            <Canvas />
                        </div>
                    </div>
                </div>
            </div>
            <div className='hidden lg:flex flex-col lg:w-[25%] border'>
                <div className='flex flex-col w-full lg:h-[90%] border gap-4 p-1'>
                    {messages.map((data) => (
                        <div key={data.socketId + data.message} className='bg-slate-300 rounded p-3 flex flex-col gap-1'>
                            <div className='text-[18px] font-semibold'>{data.name}</div>
                            <div className='text-[16px]'>{data.message}</div>
                        </div>
                    ))}
                </div>
                <div className='flex w-full lg:h-[10%] border p-1'>
                    <textarea rows={4} className='w-full border p-1' value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
                    <button onClick={handleSendMessage}>Send Message</button>
                </div>
            </div>
        </div>
    );
};

export default Room;

