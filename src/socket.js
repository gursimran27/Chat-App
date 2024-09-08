import io from "socket.io-client"; // Add this

let socket;

const connectSocket = (user_id) => {
  socket = io("https://chat-app-backend-wppj.onrender.com/", {
    query: `user_id=${user_id}`,
  });
} // Add this -- our server will run on port 3001, so we connect to it from here

export {socket, connectSocket};