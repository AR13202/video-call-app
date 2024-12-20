import React, { useCallback, useEffect, useRef, useState } from 'react';
import Camera from '../svgs/Camera';
import Mic from '../svgs/Mic';
import Call from '../svgs/Call';
import Copy from '../svgs/Copy';
import Canvas from '../svgs/Canvas';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';

const config = { iceServers: [{ urls: [
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:global.stun.twilio.com:3478",
] }] }
const Room = () => {
    const videoContainerRef = useRef(); 
    const { username, room, socket, setRoomMembers, audio, video, setStream } = useStore();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [peerConnections, setPeerConnections] = useState({});
    const audioTrackSent = {};
    const videoTrackSent = {};
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
            setRoomMembers(members);
        });

        socket.on('room:message', ({ message, name, socketId }) => {
            setMessages((prev) => [...prev, { message, name, socketId }]);
        });

        return () => {
            socket.off('update');
            socket.off('room:message');
        };
    }, [setRoomMembers, socket]);

    const handleCopyJoiningLink = (text) => {
        navigator.clipboard.writeText(text).then(
            () => console.log('Text successfully copied to clipboard!'),
            (err) => console.error('Failed to copy text: ', err)
        );
    };

    useEffect(() => {
        const initializeMediaStream = async () => {
            await getVideoAndAudio();
        };
        initializeMediaStream();
    }, [getVideoAndAudio]);

    const handleUserJoined = useCallback(() => {
        socket.emit('join-room', room, username,video, audio);
    },[audio, room, socket, username, video]);

    const startCall = useCallback((connections) => {
        navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(localStream => {
            const localVideoElement = document.getElementById('video-self'); 
            localVideoElement.srcObject = localStream;
            localVideoElement.muted = true;

            localStream.getTracks().forEach(track => {
                for (let key in connections) {
                    connections[key].addTrack(track, localStream);
                    if (track.kind === 'audio'){
                        audioTrackSent[key] = track;
                    }
                    if(track.kind ==='video'){
                        videoTrackSent[key] = track;
                    }
                }
            })

        })
        .catch((err)=>console.error("start call error",err));
    },[audio, audioTrackSent, video, videoTrackSent])

    const handleJoinRoom = useCallback(async ({id, message, members})=>{
        console.log("message",message,members);
        const tempConnection = peerConnections;
        if(members.length>1){
            await members.forEach((mem)=>{
                tempConnection[mem.id] = new RTCPeerConnection(config);
                tempConnection[mem.id].onicecandidate = function (event) {
                    if(event.candidate){
                        console.log("icecandidate fired for if", mem.id);
                        socket.emit('new-icecandidate', event.candidate,mem.id,room);
                    }
                };
                tempConnection[mem.id].ontrack = function (event){
                    if(!document.getElementById(`remote-stream-${mem.id}`)){
                        console.log("track event fired",mem.id);
                        const videoele = document.createElement('video');
                        videoele.autoplay = true;
                        videoele.playsInline = true;
                        videoele.id = `remote-stream-${mem.id}`;
                        videoele.className = "border border-black rounded-md";
                        videoele.srcObject = event.streams[0];
                        videoContainerRef.current.appendChild(videoele);
                    }
                }

                tempConnection[mem.id].onremovetrack = function (event) {
                    if (document.getElementById(`remote-stream-${mem.id}`)) {
                        document.getElementById(`remote-stream-${mem.id}`).remove();
                    }
                }

                tempConnection[mem.id].onnegotiationneeded = function (event) {
                    tempConnection[mem.id].createOffer()
                        .then(function (offer) {
                            return tempConnection[mem.id].setLocalDescription(offer);
                        })
                        .then(function () {
                            console.log("calling video-offer");
                            socket.emit('video-offer', tempConnection[mem.id].localDescription, mem.id,room); 
                        })
                        .catch((err)=>console.error("error on negotiation",err));
                };
            });
            setPeerConnections(tempConnection);
            startCall(tempConnection);
        }else{
            console.log("waiting for others to join");
            navigator.mediaDevices.getUserMedia({video:video,audio:audio})
        .then(localStream => {
            const localVideoElement = document.getElementById('video-self'); 
            localVideoElement.srcObject = localStream;
        })
        .catch((error)=>console.log("local stream error",error));
        }
    },[audio, peerConnections, room, socket, startCall, video])

    const handleVideoOffer = useCallback((offer,id,name,videoInfo,audioInfo)=>{
        if (!offer || !offer.type) {
            console.error("Received invalid offer:", offer);
            return;
        }
        if(!peerConnections[id]){
            console.log("video offer received",offer,id,name,videoInfo,audioInfo);
            // const tempPeerConnection = peerConnections;
            const newConnection = new RTCPeerConnection(config);
            setPeerConnections((prev)=>({...prev,[id]:newConnection}));
            newConnection[id].onicecandidate = function (event) {
                if(event.candidate) {
                    console.log("icecandiadte fired");
                    socket.emit('new-icecandidate',event.candidate,id,room);
                }
            };
            newConnection[id].ontrack = function (event){
                if(!document.getElementById(`remote-stream-${id}`)){
                    console.log("track event fired",id);
                    const videoele = document.createElement('video');
                    videoele.autoplay = true;
                    videoele.playsInline = true;
                    videoele.id = `remote-stream-${id}`;
                    videoele.className = "border border-black rounded-md";
                    videoele.srcObject = event.streams[0];
                    videoContainerRef.current.appendChild(videoele);
                }
            };
            newConnection[id].onremovetrack = function (event) {
                if (document.getElementById(`remote-stream-${id}`)) {
                    console.log("track removed");
                    document.getElementById(`remote-stream-${id}`).remove();
                }
            };
            newConnection[id].onnegotiationneeded = function () {

                peerConnections[id].createOffer()
                    .then(function (offer) {
                        return peerConnections[id].setLocalDescription(offer);
                    })
                    .then(function () {
                        socket.emit('video-offer', peerConnections[id].localDescription, id,room);
                    })
                    .catch((err)=>console.error("received error on nego",err));
            };
        }

        let desc = new RTCSessionDescription(offer);
            
        peerConnections[id].setRemoteDescription(desc)
        .then(() => { return navigator.mediaDevices.getUserMedia({video:videoInfo, audio:audioInfo}) })
        .then((localStream) => {
            localStream.getTracks().forEach(track => {
                peerConnections[id].addTrack(track, localStream);
                console.log('added local stream to peer')
            })
        })
        .then(() => {
            return peerConnections[id].createAnswer();
        })
        .then(answer => {
            return peerConnections[id].setLocalDescription(answer);
        })
        .then(() => {
            socket.emit('video-answer', peerConnections[id].localDescription, id,room);
        })
        .catch((err)=>console.error("error setting rtcPeerDescription",err));

    },[peerConnections, room, socket]);

    const handleNewIceCandidate = useCallback((candidate, id) => {
        if(!peerConnections[id]){
            console.warn(`Peer Connection not found for id: ${id}`);
            return;
        }
        if(peerConnections[id].remoteDescription){
            console.log("new candidate received",candidate);
            const newCandidate = new RTCIceCandidate(candidate);
            peerConnections[id].addIceCandidate(newCandidate).catch((err) => console.error("newicecandidate", err));    
        }else{
            console.warn(`Remote Description not setted for id: ${id}`);
        }
    }, [peerConnections]);

    const handleVideoAnswer = useCallback(async (answer,id)=>{
        console.log("answer handler called",answer);
        // const tempConnection = peerConnections;
        console.log("signalingState",peerConnections[id].signalingState);
        // if(peerConnections[id].signalingState !== "stable"){
            const ans = new RTCSessionDescription(answer);
            console.log("ans",ans);
            await peerConnections[id].setRemoteDescription(ans)
            .then(() => {
                console.log('Remote description set successfully');
            })
            .catch((err) => console.error("Error setting remote description:", err));
            // setPeerConnections(peerConnections);
        // }
    },[peerConnections])

    useEffect(()=>{
        socket.on('join-room', handleJoinRoom)
        socket.on('video-offer',handleVideoOffer);
        socket.on('new-icecandidate',handleNewIceCandidate);
        socket.on('video-answer',handleVideoAnswer);
        return(()=>{
            socket.off('join-room');
            socket.off('video-offer');
            socket.off('new-icecandidate');
            socket.off('video-answer');
        })
    },[handleJoinRoom, handleNewIceCandidate, handleVideoAnswer, handleVideoOffer, handleUserJoined, socket])
    useEffect(()=>{
        handleUserJoined();
    },[])
    useEffect(()=>{
        console.log("peerConnection",peerConnections)
    },[peerConnections])

    return (
        <div className='flex flex-col lg:flex-row w-[100dvw] h-[100dvh]'>
            <div className='flex flex-col lg:w-[75%] bg-black'>
                <div ref={videoContainerRef} className='flex flex-wrap justify-center items-center gap-1 w-full lg:h-[90%] bg-black rounded-md overflow-y-auto p-2'>
                    <video id="video-self" className="border border-black rounded-md" autoPlay playsInline></video>
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
