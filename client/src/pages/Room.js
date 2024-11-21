import React, { useCallback, useEffect, useRef, useState } from 'react';
import Camera from '../svgs/Camera';
import Mic from '../svgs/Mic';
import Call from '../svgs/Call';
import Copy from '../svgs/Copy';
import Canvas from '../svgs/Canvas';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';
import usePeer from '../hooks/usePeer';
import useMediaStream from '../hooks/useMediaStream';
import Peer from 'peerjs';

const config = { iceServers: [{ urls: [
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:global.stun.twilio.com:3478",
] }] }


/*
 create peer -> send peerId to server to join room -> 
 other user will receive that peerId -> 
 call on that peerId with your stream -> 
 call.on() -> we will receive incoming stream from above function ->
 set the stream in your local state with desired audiio/video option ->
 on call leave remove user from local state and close peerConnection.
*/

const Room = () => {
    const videoContainerRef = useRef(); 
    const [myPeerId,setMyPeerId] = useState('');
    const { username, room, socket, setRoomMembers, roomMembers, setMyPeer, audio, video, setStream, myPeer, stream } = useStore();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const openMediaDevices = async (constraints) => {
        return await navigator.mediaDevices.getUserMedia(constraints);
    };

    const getVideoAndAudio = useCallback(async () => {
        try {
            if (audio || video) {
                const localStream = await openMediaDevices({ video, audio });
                console.log('Got MediaStream:', localStream);
                setStream(localStream);
                document.getElementById('video-self').srcObject = localStream;
            } else {
                setStream(null);
                document.getElementById('video-self').srcObject = null;
            }
        } catch (error) {
            console.error('Error accessing media devices.', error);
        }
    }, [audio, video, setStream]);

    const handleDisconnectCall = useCallback(() => {
        if (socket) {
            socket.disconnect();
            navigate('/');
            window.location.reload();
        }
    }, [socket, navigate]);

    const handleSendMessage = () => {
        socket.emit('messageToRoom', { roomName: room, name: username, message: messageInput });
        setMessageInput('');
    };

    useEffect(() => {
        socket.on('update', ({ members }) => {
            const newRoomMembers = members.map((member) => {
                // Find the corresponding roomMember in roomMembers
                const existingMember = roomMembers.find(
                    (roomMember) => roomMember.id === member.id
                );
        
                // Merge member with existingMember (if it exists), prioritizing values from member
                return { ...existingMember, ...member };
            });
            setRoomMembers(newRoomMembers);
        });

        socket.on('room:message', ({ message, name, socketId }) => {
            setMessages((prev) => [...prev, { message, name, socketId }]);
        });

        return () => {
            socket.off('update');
            socket.off('room:message');
        };
    }, [roomMembers, setRoomMembers, socket]);

    const handleCopyJoiningLink = (text) => {
        navigator.clipboard.writeText(text).then(
            () => console.log('Text successfully copied to clipboard!'),
            (err) => console.error('Failed to copy text: ', err)
        );
    };


    const handleJoinRoom = useCallback(async ({id, message, members, peerId})=>{
        console.log("message",message,members,peerId,stream);
        if(myPeer){
            console.log("myPeer",myPeer);
            const call = myPeer.call(peerId, stream);
            console.log("sending call",call)
            call.on('stream',(incomingStream)=>{
                console.log(incomingStream)
                console.log("incoming stream");
                console.log("roomMembers at handleJoin",roomMembers);
                const temp = [...roomMembers,{incomingCall:incomingStream,audio:true,video:true,id:peerId}];
                // temp.forEach((mem)=>{
                //     if(mem.peerId===peerId){
                //         mem.incomingCall = incomingStream;
                //     }
                // });
                console.log("roomMembers after handleJoin",temp);
                setRoomMembers(temp);
            })
        }else{
            console.error("MyPeer not found");
        }
    },[myPeer, roomMembers, setRoomMembers, stream])

    useEffect(() => {
        const peer = new Peer(undefined, { config });
        setMyPeer(peer);
        peer.on('open', (id) => {
            console.log(`your peer id is ${id}`)
            setMyPeerId(id);
            socket.emit('join-room', room, username, audio, video, id)
        })
        const initializeMediaStream = async () => {
            await getVideoAndAudio();
        };
        initializeMediaStream();
    }, [audio, getVideoAndAudio, room, setMyPeer, socket, username, video]);

    useEffect(()=>{
        if(myPeer && stream){
            myPeer.on('call',(call)=>{
                const {peer: callerId} = call;
                call.answer(stream);
                call.on("stream",(incomingStream)=>{
                    const temp = [...roomMembers,{incomingCall:incomingStream,audio:true,video:true,id:callerId}];
                    console.log("roomMembers after useEffect",temp);
                    setRoomMembers(temp);
                })
            })
        }
    },[myPeer, roomMembers, setRoomMembers, stream])

    useEffect(()=>{
        socket.on('join-room', handleJoinRoom)
        return(()=>{
            socket.off('join-room',handleJoinRoom);
        })
    },[handleJoinRoom,socket, myPeer, stream, roomMembers, setRoomMembers])

    return (
        <div className='flex flex-col lg:flex-row w-[100dvw] h-[100dvh]'>
            <div className='flex flex-col lg:w-[75%] bg-black'>
                <div ref={videoContainerRef} className='flex flex-wrap justify-center items-center gap-1 w-full lg:h-[90%] bg-black rounded-md overflow-y-auto p-2'>
                    {stream && <video src={stream} id="video-self" className="border border-black rounded-md" autoPlay playsInline muted></video>}
                    {roomMembers.map((member) => (
                        <video className='w-1/3 h-1/3' key={member.id} ref={(video) => { if (video) video.srcObject = member.incomingCall }} autoPlay playsInline></video>
                    ))}
                </div>
                <div className='flex w-full lg:h-[10%] p-2 bg-black'>
                    <div className='bg-slate-200 rounded w-full h-full flex justify-center items-center p-2 gap-3'>
                        <div onClick={() => handleCopyJoiningLink(room)} className='w-[15%] h-full flex justify-center items-center hover:underline cursor-pointer text-[15px] font-medium gap-2'>
                            <Copy />
                            <span>Copy Joining Info</span>
                        </div>
                        <div className='w-[70%] h-full flex justify-center items-center gap-3 p-1'>
                            <button className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'><Camera /> </button>
                            <button className='h-full aspect-square rounded-full bg-blue-800 p-3 text-white font-medium'><Mic /></button>
                            <button onClick={handleDisconnectCall} className='h-full aspect-square rounded-full bg-red-800 p-3 text-white font-medium'><Call /></button>
                        </div>
                        <div className='w-[15%] h-full flex gap-2 justify-center hover:underline cursor-pointer items-center text-[15px] font-medium'>
                            <span>Open Canvas</span>
                            <Canvas />
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-col lg:w-[25%] border'>
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

