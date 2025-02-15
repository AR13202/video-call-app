import userStore from '../store/store.tsx';
import { roomMemberType } from '../types/userStoreTypes.tsx';
// functions for roomMembers stream handling
const useSockets = () => {

  const store = userStore();

    // when user joins a room   
  const handleJoinRoom = async ({socketId,name, peerId,audio,video}) => {
    if(store.myPeer && store.stream){        
        // this will trigger the call event on the other peer
        console.log("calling handleJoinRoom")
        const call = store.myPeer.call(peerId, store.stream, {
          metadata: {
              username: store.username,
              audio:store.audio,
              video:store.video,
              socketId: store.socket.id,
          },
        });
        console.log("sending metaData + stream for id",socketId,peerId)
        call.on('stream',(incomingStream:MediaStream)=>{
          console.log("received stream",incomingStream);
            const temp:roomMemberType[] = [
                ...store.roomMembers,
                {
                    stream:incomingStream,
                    audio:audio,
                    video:video,
                    peerId:peerId,
                    username:name,
                    socketId
                }
            ];
            store.setRoomMembers(temp);
        })
    }else{
        console.error("Peer or stream not found");
    }
  }

  // when user leaves a room
  const handleLeaveRoom = (res:{socketId:string,peerId:string,name:string}) => {
    const {socketId,peerId,name} = res;
    const members = store.roomMembers;
    const newMembers = members.filter(member => member.socketId!==socketId);
    console.log("newRoomMembers",newMembers)
    store.setRoomMembers([...newMembers]);
  }

  const handleRoomMemberStream = (stream:MediaStream, audio:boolean,video:boolean) => {
    stream.getTracks().forEach((track:MediaStreamTrack) => {
      if (track.kind === "audio") {
        track.enabled = audio;
      } else if (track.kind === "video") {
        track.enabled = video;
      }
    })
  }

  // toggle constraints of a stream
  const toggleStream = ({ socketId, peerId, audio, video }) => {
    const members = store.roomMembers.map((member) => {
        if (member.socketId === socketId) {
            if (member.stream) {
                handleRoomMemberStream(member.stream, audio, video);
            }
            return { ...member, audio, video };
        }
        return member;
    });

    store.setRoomMembers(members);
};



  return {
    handleJoinRoom,
    handleLeaveRoom,
    toggleStream
  }
}

export default useSockets;