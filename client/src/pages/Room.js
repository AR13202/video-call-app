import React, { useCallback, useEffect, useState } from 'react'
import Camera from '../svgs/Camera';
import Mic from '../svgs/Mic';
import Call from '../svgs/Call';
import Copy from '../svgs/Copy';
import Canvas from '../svgs/Canvas';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';

const Room = () => {
    const navigate = useNavigate();
    const {username, room, socket, roomMembers, setRoomMembers} = useStore();

    const [messages, setMessages] = useState([]);

    const [messageInput, setMessageInput] = useState('');

    const handleDisconnectCall = useCallback(()=>{
        if(socket){
            socket.disconnect();
            navigate('/');
            window.location.reload();
        }
    },[socket,navigate]);

    const handleSendMessage = () => {
        console.log({room, username, messageInput});
        socket.emit('messageToRoom',{roomName: room, name: username, message:messageInput});
        setMessageInput('');
    }

    useEffect(()=>{
        socket.on('update',(({members})=>{
            setRoomMembers(members);
        }))

        socket.on('room:message',(({message,name,socketId})=>{
            setMessages((prev)=>[...prev, {message,name,socketId}])
        }))

        return (()=>{
            socket.off('update');
            socket.off('room:message');
        })
    },[messages, setRoomMembers, socket]);
    console.log("messages",messages);

  return (
    <div className='flex flex-col lg:flex-row w-[100dvw] h-[100dvh]'>
        <div className='flex flex-col lg:w-[75%] bg-black'>
            <div className='flex flex-wrap justify-center items-center w-full lg:h-[90%] bg-black rounded-md overflow-y-auto p-2'>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
                <div className='w-1/3 h-1/3 border border-slate-500 rounded bg-slate-600 p-1'></div>
            </div>
            <div className='flex w-full lg:h-[10%] p-2 bg-black'>
                <div className='bg-slate-200 rounded w-full h-full flex justify-center items-center p-2 gap-3'>
                    <div className='w-[15%] h-full flex justify-center items-center hover:underline cursor-pointer text-[15px] font-medium gap-2'>
                        <Copy/>
                        <span>Copy Joining Info</span>
                    </div>
                    <div className='w-[70%] h-full flex justify-center items-center gap-3 p-1'>
                        <button className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'><Camera/> </button>
                        <button className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'><Mic/></button>
                        <button onClick={handleDisconnectCall} className='h-full aspect-square rounded-full bg-red-800 p-3 text-white font-medium'><Call/></button>
                    </div>
                    <div className='w-[15%] h-full flex gap-2 justify-center hover:underline cursor-pointer items-center text-[15px] font-medium'>
                        <span>Open Canvas</span>
                        <Canvas/>
                    </div>
                </div>
            </div>
        </div>
        <div className='flex flex-col lg:w-[25%] border'>
            <div className='flex flex-col w-full lg:h-[90%] border'>
                {roomMembers.map((member)=>(
                    <p key={member.id}>{member.Name}</p>
                ))}
            </div>
            <div className='flex w-full lg:h-[10%] border p-1'>
                <textarea rows={4} className='w-full border p-1' value={messageInput} onChange={(e)=>setMessageInput(e.target.value)}/>
                <button onClick={handleSendMessage}>Send Message</button>
            </div>
        </div>
    </div>
  )
}

export default Room;