import { useStore } from "zustand"
import Peer from "peerjs";
import { useState, useEffect, useRef } from "react";

const usePeer = () => {
    const {name, audio, video, room, socket, setMyPeer} = useStore();
    // const [peer, setMyPeer] = useState(null)
    const [myId, setMyId] = useState('')
    const isPeerSet = useRef(false)

    useEffect(() => {
        if (isPeerSet.current || !room || !socket) return;
        isPeerSet.current = true;
        let peer;
        (async function initPeer() {
            peer = new Peer();
            setMyPeer(peer)

            peer.on('open', (id) => {
                console.log(`your peer id is ${id}`)
                setMyId(id)
                socket?.emit('join-room', room, name, audio, video, id)
            })
        })()
    }, [audio, name, room, setMyPeer, socket, video])

    return {myId}
}

export default usePeer;