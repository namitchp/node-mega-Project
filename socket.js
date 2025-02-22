import { Server } from "socket.io";
import cookieParser from 'cookie-parser';
export const Socket=(server) => {
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, (err) => {
    if (err) return next(err);

    // const token = socket.request.cookies.token;
    // if (!token) return next(new Error("Authentication Error"));

    // const decoded = jwt.verify(token, secretKeyJWT);
    next();
  });
});

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  console.log("User Connected", socket);
  socket.to(socket.id).emit("receive-message", "hello");
  socket.on("message", ({ room, message }) => {
    console.log({ room, message });
    socket.to(room).emit("receive-message", message);
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  })
});
}