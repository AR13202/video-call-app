import userStore from '../store/store.tsx';

const useMediaStream = () => {
    const store = userStore();

    const getUserStream = async (constraints:{audio:boolean,video:boolean}) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
            stream.getTracks().forEach((track:MediaStreamTrack) => {
                if (track.kind === "audio") {
                    track.enabled = constraints.audio;
                } else if (track.kind === "video") {
                    track.enabled = constraints.video;
                }
            })
            store.setStream(stream);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices.', error);
            store.setStream({} as MediaStream);
            return null;
        }
    };

    const getActiveRooms = () => {
        if(store.socket){
            store.socket.emit('success:connection');
    
            store.socket.on('activeRooms', (activeRooms) => {
              store.setActiveRooms(activeRooms);
            });
        }
    }

    const handleStreamInputChange = (audio:boolean,video:boolean) => {
        if (store.stream) {
            store.stream.getTracks().forEach((track:MediaStreamTrack) => {
                if (track.kind === "audio") {
                    track.enabled = audio;
                } else if (track.kind === "video") {
                    track.enabled = video;
                }
            })
        }
    }

    const toggleStream = (peerId:string, audio:boolean, video:boolean) => {
        store.setAudio(audio);
        store.setVideo(video);
        handleStreamInputChange(audio,video);
        store.socket.emit('user-toggle-stream', peerId,store.room, audio, video, store.socket.id);
    }

    return {
        getUserStream,
        getActiveRooms,
        toggleStream
    }
}

export default useMediaStream;