import { socket } from "../socket";
import Peer from "peerjs";

const { useState, useEffect, useRef } = require("react")

const usePeer = () => {
    const [peer, setPeer] = useState(null)
    const [myId, setMyId] = useState('')
    const isPeerSet = useRef(false)

    useEffect(() => {
        if (isPeerSet.current || !socket) return;
        isPeerSet.current = true;//to prevent rerender
        (async function initPeer() {
            const myPeer = new Peer();
            setPeer(myPeer)

            myPeer.on('open', (id) => {//peerId
                console.log(`your peer id is ${id}`)
                setMyId(id)
                // socket?.emit('join-room', roomId, id,name)
            })
        })()
    }, [ socket])

    return {
        peer,
        myId
    }
}

export default usePeer;