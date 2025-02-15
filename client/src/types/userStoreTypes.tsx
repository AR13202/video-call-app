import Peer from "peerjs";
import { Socket } from "socket.io-client";

export type roomMemberType = {
    stream:MediaStream,
    audio:boolean,
    video:boolean,
    peerId:string,
    username:string,
    socketId:string
}

export type UserStoreType = {
    username: string,
    room: string,
    socket: Socket,
    peerId: string,
    activeRooms: string[],
    roomMembers: roomMemberType[],
    stream: MediaStream | null,
    video:boolean,
    audio:boolean,
    myPeer:Peer,

    setUserName: (name:string) => void,
    setRoom: (roomId:string) => void,
    setSocket: (socketId:Socket) => void,
    setActiveRooms: (active:string[]) => void,
    setRoomMembers: (members:roomMemberType[]) => void,
    setStream: (remoteStream:MediaStream) => void,
    setAudio: (aud:boolean) => void,
    setVideo: (vid:boolean) => void,
    setMyPeer: (peer:Peer) => void,
    setPeerId: (peerId:string) => void,
}