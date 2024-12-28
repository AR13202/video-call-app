import userStore from '../store/store.tsx';
import { roomMemberType } from '../types/userStoreTypes.tsx';
// functions for roomMembers stream handling
const useSockets = () => {

  const store = userStore();

    // when user joins a room   
  const handleJoinRoom = async ({socketId,name, peerId,audio,video}) => {
    console.log("new user joined",peerId,name,socketId);
    if(store.myPeer && store.stream){
        console.log("store.myPeer",store.myPeer);
        
        // this will trigger the call event on the other peer
        const call = store.myPeer.call(peerId, store.stream); 

        console.log("sending call",call)
        call.on('stream',(incomingStream:MediaStream)=>{
            console.log(incomingStream)
            console.log("incoming stream");
            console.log("roomMembers at handleJoin",store.roomMembers);
            const temp:roomMemberType[] = [
                ...store.roomMembers,
                {
                    stream:incomingStream,
                    audio:audio,
                    video:video,
                    peerId:peerId,
                }
            ];
            console.log("roomMembers after handleJoin",temp);
            store.setRoomMembers(temp);
        })
    }else{
        console.error("Peer or stream not found");
    }
  }

  // when user leaves a room
  const handleLeaveRoom = ({peerId}) => {
    const members = store.roomMembers;
    const newMembers = members.filter(member => member.peerId !== peerId);
    store.setRoomMembers(newMembers);
  }

  // toggle constraints of a stream
  const toggleStream = ({peerId,audio,video}) => {
    const members = store.roomMembers;
    for(const member of members){
        if(member.peerId === peerId){
            member.audio = audio;
            member.video = video;
        }
    }
    store.setRoomMembers(members);
}


  return {
    handleJoinRoom,
    handleLeaveRoom,
    toggleStream
  }
}

export default useSockets;