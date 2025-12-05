import { Server } from "socket.io";
import cors from "cors"; 

const io = new Server({
  cors: {
    origin: "http://localhost:3000",  
    methods: ["GET", "POST"],
    credentials: true
  }
});
// in memory DB
let chatMember = [];

const findOnlineUsers = (roomId) => {
  const onlineUsers = chatMember.filter((user) => user.roomId === roomId);
  const refactoredOnlineUsers = onlineUsers.map((u) => u.email);
  return refactoredOnlineUsers;
};

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    socket.join(data.roomId);
    chatMember.push({ ...data, socketId: socket.id });

    io.to(data.roomId).emit("user-joined", {
      email: data.email,
      text: `${data.email} has joined the group`,
    });

    const onlineUsers = findOnlineUsers(data.roomId);

    io.to(data.roomId).emit("online_users", onlineUsers);
  });

  socket.on("send-message", (data) => {
    io.to(data.roomId).emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    const idx = chatMember.findIndex((u) => u.socketId === socket.id);
  
    if (idx === -1) {
      console.warn(`[disconnect] unknown socket: ${socket.id}`);
      return;
    }
  
    const user = chatMember[idx];
  
    chatMember.splice(idx, 1);
  
    if (!user.roomId) {
      console.warn(`[disconnect] user has no roomId: ${user.email}`);
      return;
    }
  
    io.to(user.roomId).emit("user-joined", {
      email: user.email,
      text: `${user.email} has left the chat`,
    });
  
    const onlineUsers = findOnlineUsers(user.roomId);
  
    io.to(user.roomId).emit("online_users", onlineUsers);
  
  });
  });

io.listen(4000);
