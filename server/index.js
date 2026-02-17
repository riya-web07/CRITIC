const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow these actions
    allowedHeaders: ["Content-Type", "Authorization"], // Allow the Token header
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 1. Keep track of which user is in which room
const userSocketMap = {};

function getAllConnectedClients(roomId) {
  // Map socket IDs to usernames
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}

io.on("connection", (socket) => {
  // A. USER JOINS
  socket.on("join", ({ roomId, username }) => {
    // 1. Check existing users
    const clientsInRoom = getAllConnectedClients(roomId);
    const isNameTaken = clientsInRoom.some((client) => client.username === username);

    let finalUsername = username;

    // 2. Auto-Rename if needed
    if (isNameTaken) {
      finalUsername = `${username} (${Math.floor(100 + Math.random() * 900)})`;
    }

    // 3. Register User & Join Room
    userSocketMap[socket.id] = finalUsername;
    socket.join(roomId);

    // 4. Send the CONFIRMED name to the user who just joined
    // This fixes the "Split Brain" issue
    io.to(socket.id).emit("join:success", finalUsername);

    // 5. Broadcast to everyone else
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username: finalUsername,
        socketId: socket.id,
      });
    });
  });

  // B. CHAT MESSAGE (The Fix)
  socket.on("chat:send", ({ roomId, message }) => {
    // IGNORE the username from frontend. Use the server's truth.
    const username = userSocketMap[socket.id];

    io.to(roomId).emit("chat:receive", {
      username, // <--- This is now guaranteed to be "Test1 (311)"
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // ... (Keep your code-change, language-change, sync-code, disconnecting exactly as they were)
  socket.on("code-change", ({ roomId, code }) => {
    socket.in(roomId).emit("code-change", { code });
  });
  socket.on("language-change", ({ roomId, language }) => {
    socket.in(roomId).emit("language-change", { language });
  });
  socket.on("sync-code", ({ socketId, code, language }) => {
    io.to(socketId).emit("code-change", { code });
    io.to(socketId).emit("language-change", { language });
  });
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
