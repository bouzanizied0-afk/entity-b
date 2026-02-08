import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Universal Moment (not a counter, monotonic only)
let moment = 0;

// One-way temporal source
setInterval(() => {
  moment++;
  io.emit("moment", moment);
}, 100); // granularity = 100ms

httpServer.listen(3000, () => {
  console.log("⏳ Temporal Authority online");
});
