// socket.js

const socketIO = require("socket.io");

let io;

const initializeSocketIO = (server) => {
  io = socketIO(server);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle 'follow' event from the client
    socket.on("follow", ({ followerUserId, followedUserId }) => {
      // Emit a notification event to the user being followed (followedUserId)
      io.to(followedUserId).emit("notification", {
        title: "New Follower",
        message: "You have a new follower!",
      });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
};

const getSocketIOInstance = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }
  return io;
};

module.exports = { initializeSocketIO, getSocketIOInstance };
