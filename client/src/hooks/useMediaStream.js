import {useState, useEffect, useRef} from 'react'
import { useStore } from 'zustand'


const useMediaStream = () => {
    const isStreamSet = useRef(false)
    const {stream, setStream, audio, video } = useStore();

    useEffect(() => {
        if (isStreamSet.current) return;
        isStreamSet.current = true;
        (async function initStream() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: audio,
                    video: video
                })
                console.log("setting your stream")
                setStream(stream)
            } catch (e) {
                console.log("Error in media navigator", e)
            }
        })()
    }, [setStream])

    return {
        myStream: stream
    }
}

export default useMediaStream;