import Peer, { MediaConnection } from "peerjs";
import userStore from "../store/store.tsx";
// for user stream handling
const config = { iceServers: [{ urls: [
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:global.stun.twilio.com:3478",
] }] }


const usePeer = () => {
    const store = userStore();
    const createPeer = (room:string, name:string, audio:boolean, video:boolean) => {
        const peer = new Peer({ config });
        store.setMyPeer(peer);
        peer.on('open', (id) => {
            console.log(`your peer id is ${id}`);
            store.setPeerId(id);
            store.socket?.emit('join-room', room, name, audio, video, id);
        });
    };

    const destroyPeer = () => {
        store.myPeer.destroy();
    }

    const receivePeerCall = () => {
        if(store.myPeer && store.stream){
            store.myPeer.on('call',(call:MediaConnection)=>{
                const {peer: callerId} = call;
                call.answer(store.stream as MediaStream|undefined);
                call.on("stream",(incomingStream)=>{
                    const temp = [
                        ...store.roomMembers,
                        {
                            stream:incomingStream,
                            audio:true,
                            video:true,
                            peerId:callerId
                        }
                    ];
                    console.log("roomMembers after useEffect",temp);
                    store.setRoomMembers(temp);
                })
            })
        }
    }

    const disconnectPeerCall = () => {
        if(store.socket && store.myPeer){
            store.myPeer.disconnect();
            store.socket.disconnect();
            window.location.reload();
            store.socket.emit('user-disconnected', store.peerId);
        }
    }

    const toggleStream = (peerId:string, audio:boolean, video:boolean) => {
        store.setAudio(audio);
        store.setVideo(video);
        store.socket.emit('user-toggled-stream', peerId, audio, video);
    }

    return {
        createPeer,
        receivePeerCall,
        destroyPeer,
        toggleStream,
        disconnectPeerCall
    }
}

export default usePeer;