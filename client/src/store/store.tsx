import Peer from 'peerjs';
import { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { roomMemberType, UserStoreType } from '../types/userStoreTypes';

const userStore = create<UserStoreType>((set) => ({
    username: "",
    room: "",
    socket: {} as Socket,
    peerId: "",
    activeRooms: [],
    roomMembers: [],
    stream: null,
    video:true,
    audio:true,
    myPeer: {} as Peer,
    
    // TODO: remove any Data Type from store
    setUserName: (name:string) => set({username: name}),
    setRoom: (roomId:string,) => set({room:roomId}),
    setSocket: (socketId:Socket) => set({socket:socketId}),
    setActiveRooms: (active:string[]) => set({activeRooms:active}),
    setRoomMembers: (members:roomMemberType[]) => set({roomMembers: members}),
    setStream: (remoteStream:MediaStream) => set({stream: remoteStream}),
    setAudio: (aud:boolean) => set({audio:aud}),
    setVideo: (vid:boolean) => set({video: vid}),
    setMyPeer: (peer:Peer) => set({myPeer:peer}),
    setPeerId: (peerId:string) => set({peerId:peerId}),
}));

export default userStore;
