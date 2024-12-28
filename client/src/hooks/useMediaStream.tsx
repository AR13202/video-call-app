import userStore from '../store/store.tsx';

const useMediaStream = () => {
    const store = userStore();

    const getUserStream = async (constraints:{audio:boolean,video:boolean}) => {
        console.log(constraints)
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // console.log('Got MediaStream:', stream);
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

    return {
        getUserStream,
        getActiveRooms
    }
}

export default useMediaStream;