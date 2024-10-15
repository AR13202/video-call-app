import { create } from 'zustand';

const useStore = create((set) => ({
    username: "",
    room: "",
    socket: "",
    activeRooms: [],
    roomMembers: [],
    
    setUserName: (name) => set({username: name}),
    setRoom: (roomId) => set({room:roomId}),
    setSocket: (socketId) => set({socket:socketId}),
    setActiveRooms: (active) => set({activeRooms:active}),
    setRoomMembers: (members) => set({roomMembers: members}),
}));

export default useStore;
