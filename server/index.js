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
  // console.log(`User Connected: ${socket.id}`);

  socket.on("chat:send", ({ roomId, username, message }) => {
    // Broadcast to everyone in the room INCLUDING sender (so they see their own sync)
    io.to(roomId).emit("chat:receive", {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // A. USER JOINS A ROOM
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

    // --- NEW: Send Official Name to the User who joined ---
    io.to(socket.id).emit("join:success", finalUsername);
    // -----------------------------------------------------

    // 4. Broadcast to EVERYONE (to update Sidebars)
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username: finalUsername,
        socketId: socket.id,
      });
    });
  });

  // B. CODE CHANGE (Typing)
  socket.on("code-change", ({ roomId, code }) => {
    // Broadcast code to everyone inside the room EXCEPT the sender
    socket.in(roomId).emit("code-change", { code });
  });

  socket.on("language-change", ({ roomId, language }) => {
    // Tell everyone else in the room to switch language
    socket.in(roomId).emit("language-change", { language });
  });

  // C. SYNC CODE (Updated to include Language)
  // When a new user joins, we ask an existing user to send the current code
  socket.on("sync-code", ({ socketId, code, language }) => {
    io.to(socketId).emit("code-change", { code });
    io.to(socketId).emit("language-change", { language });
  });

  // D. DISCONNECT
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
