import { create } from 'zustand';

const useStore = create((set) => ({
    username: "",
    room: "",
    socket: "",
    activeRooms: [],
    roomMembers: [],
    stream: null,
    video:false,
    audio:false,
    
    setUserName: (name) => set({username: name}),
    setRoom: (roomId) => set({room:roomId}),
    setSocket: (socketId) => set({socket:socketId}),
    setActiveRooms: (active) => set({activeRooms:active}),
    setRoomMembers: (members) => set({roomMembers: members}),
    setStream: (remoteStream) => set({stream: remoteStream}),
    setAudio: (aud) => set({audio:aud}),
    setVideo: (vid) => set({video: vid}),
}));

export default useStore;
