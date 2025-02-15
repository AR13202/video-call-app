import Peer, { MediaConnection } from "peerjs";
import userStore from "../store/store.tsx";
import { useRef } from "react";
import { roomMemberType } from "../types/userStoreTypes.tsx";
// for user stream handling
const config = { iceServers: [{ urls: [
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:global.stun.twilio.com:3478",
] }] }

let peerRef:Peer = {} as Peer;

const usePeer = () => {

    const tempMembers:roomMemberType[] = [];

    const store = userStore();
    const createPeer = (room:string, name:string, audio:boolean, video:boolean) => {
        const peer = new Peer({ config });
        store.setMyPeer(peer);
        Object.entries(peerRef).length===0 && peer.on('open', (id) => {
            console.log(`your peer id is ${id}`);
            store.setPeerId(id);
            receivePeerCall(peer);
            store.socket?.emit('join-room', room, name, audio, video, id);
        });
        peerRef = peer;
    };

    const destroyPeer = () => {
        store.myPeer.destroy();
    }

    const receivePeerCall = (peer:Peer) => {
        console.log("calling receivePeerCall")
        if(peer && store.stream){
            peer.on('call', (call:MediaConnection)=>{
                const {peer: callerId} = call;
                call.answer(store.stream as MediaStream|undefined);
                call.on("stream",(incomingStream)=>{
                    // Get the current room members from the store
                    console.log("incoming Stream",incomingStream);
                    const currentMembers = store.roomMembers;

                    // Check if the member already exists
                    const isExisting = currentMembers.some(member => member.socketId === call.metadata.socketId);
                    if (isExisting) return;

                    if(!tempMembers.find(e=>e.socketId===call.metadata.socketId)){
                        tempMembers.push(
                            {
                                stream:incomingStream,
                                audio:call.metadata.audio,
                                video:call.metadata.video,
                                peerId:callerId,
                                username:call.metadata.username || 'unknown',
                                socketId: call.metadata.socketId
                            },
                        );
                    }

                    console.log("Updated Room Members:", tempMembers);
                    store.setRoomMembers(tempMembers);
                })
            })
        }
    }

    const disconnectPeerCall = () => {
        if(store.socket && store.myPeer){
            store.socket.emit('user-disconnected', store.room);
            store.myPeer.disconnect();
            store.socket.disconnect();
        }
    }

    return {
        createPeer,
        receivePeerCall,
        destroyPeer,
        disconnectPeerCall
    }
}

export default usePeer;