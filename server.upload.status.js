import express from "express";
import multer from "multer";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import fs from "fs";
import tokenBucket from "./tokenBucket"; // Import Token Bucket middleware

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(tokenBucket); // Use Token Bucket middleware

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Handle file upload with progress
app.post("/upload", upload.single('file'), (req, res) => {
  const totalSize = req.file.size;
  let uploadedBytes = 0;

  const readStream = fs.createReadStream(req.file.path);
  const writeStream = fs.createWriteStream(`uploads/${req.file.filename}`);

  readStream.on('data', (chunk) => {
    uploadedBytes += chunk.length;
    const progress = ((uploadedBytes / totalSize) * 100).toFixed(2);
    io.emit("uploadProgress", progress); // Send progress to frontend
  });

  readStream.pipe(writeStream);

  writeStream.on('finish', () => {
    io.emit("uploadProgress", "100"); // Ensure 100% is emitted
    res.status(200).json({ message: "File uploaded successfully" });
  });

  writeStream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// Start server
server.listen(8000, () => console.log("Server running on port 8000"));