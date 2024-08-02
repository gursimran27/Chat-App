import {useState} from 'react'
import { cloneDeep } from 'lodash'
import { socket } from "../socket";
import { ResetAudioCallQueue } from '../redux/slices/audioCall';
import { useDispatch, useSelector } from 'react-redux';

const usePlayer = (myId, peer, stream) => {
  const [call_details] = useSelector((state) => state.audioCall.call_queue);

  const dispatch = useDispatch();

    const [players, setPlayers] = useState({})
    const playersCopy = cloneDeep(players)

    const playerHighlighted = playersCopy[myId]
    delete playersCopy[myId]

    const nonHighlightedPlayers = playersCopy
    // console.log(nonHighlightedPlayers)

    const leaveRoom = () => {
        socket.emit('user-leave', myId, call_details)
        // console.log("leaving room", roomId)
        peer?.disconnect();
        stream.getTracks().forEach(track => track.stop());
        dispatch(ResetAudioCallQueue());
    }

    const toggleAudio = () => {
        // console.log("I toggled my audio")
        setPlayers((prev) => {
            const copy = cloneDeep(prev)
            copy[myId].muted = !copy[myId].muted
            return {...copy}
        })
        socket.emit('user-toggle-audio', myId, call_details)//myId is my peerId
    }


    return {players, setPlayers, playerHighlighted, nonHighlightedPlayers, toggleAudio, leaveRoom}
}

export default usePlayer;