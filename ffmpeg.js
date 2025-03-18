import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { Server } from 'socket.io';
import { promisify } from 'util';

const execPromise = promisify(exec);

const db = './db.json';

export const ffmpeg = (app, server) => {
  const io = new Server(server, { cors: { origin: '*' } });
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/video/original');
    },
    filename: function (req, file, cb) {
      const { folderName } = req.query;
      var ext = path.extname(file.originalname);
      var filename = path.basename(file.originalname, ext);
      cb(null, `${folderName || 'folder'}-${filename}-${Date.now()}${ext}`);
    },
  });
  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      console.log(file.originalname);
      console.log(file.mimetype);
      // Set the filetypes, it is optional
      var filetypes = /mp4|audio|mp3|wav/;
      var mimetype = filetypes.test(file.mimetype);
      var extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(
        'Error: File upload only supports the ' +
          'following filetypes - ' +
          filetypes
      );
    },
  });
  app.get('/video_list', function (req, res) {
    fs.readFile(db, 'utf8', async function (err, data) {
      if (err) throw err;
      const list = JSON.parse(data);
      if (list) {
        res.json({ list, message: 'Data Fetch Successfully', valid: true });
      } else {
        res.json({ message: 'Data Not Found', valid: false });
      }
    });
  });
  app.get('/', function (req, res) {
    res.json({ message: 'Streaming' });
  });
  app.post('/v0/video/upload',upload.single('file'),async function (req, res) {
      const lessonId = req.file.filename.split('.')[0];
      const videoPath = req.file.path;
      const outputPath = `uploads/video/stream/${lessonId}`;
      const hlsPath = `${outputPath}/index.m3u8`;
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      // Get the total duration of the video using ffprobe
      // const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoPath}`;
      // const { stdout: durationOutput } = await execPromise(ffprobeCommand);
      // const totalDuration = parseFloat(durationOutput.trim());
      // console.log('Total duration:', totalDuration);
      // io.emit('videoDuration', totalDuration);
      const maxSegmentSize = 4 * 1024 * 1024; // 4 MB
      const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 20 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 -flush_packets 1 -fs ${maxSegmentSize} -progress pipe:1 ${hlsPath}`;
      const ffmpegProcess = exec(ffmpegCommand);
      const fullUrl = `${req.protocol}://${req.get('host')}/${hlsPath}`;
      res.json({
        message: 'Video converted to HLS format',
        videoUrl: fullUrl,
        lessonId: lessonId,
      });
      // ffmpegProcess.stdout.on('data', (data) => {
      // console.log(data);
      // const sizeMatch = data.match(/out_time_ms=(\d+)/);
      // if (sizeMatch) {
      //   const size = sizeMatch[1];
      //   io.emit('ffmpegSize', `${size} bytes`);
      // }
      // const outTimeMatch = data.match(/out_time_ms=(\d+)/);
      // if (outTimeMatch) {
      //   const outTimeMs = parseInt(outTimeMatch[1], 10);
      //   const progress = (outTimeMs / (totalDuration * 1000)) * 100;
      //   console.log('Progress:', progress);
      //   io.emit('ffmpegProgress', progress.toFixed(2));
      // }
      // });
      ffmpegProcess.on('close', (code) => {
        console.log(code);
        // if (code === 0) {
          // const videoUrl = `http://148.72.168.56:8001/uploads/courses/${lessonId}/index.m3u8`;
          // fs.readFile(db, 'utf8', function (err, data) {
          //   if (err) throw err;
          //   let users = JSON.parse(data);
          //   users.push({ id: users.length + 1, videoUrl, lessonId });
          //   fs.writeFile(db, JSON.stringify(users), (err) => {
          //     if (err) throw err;
          //   });
          // });
          // res.json({
          //   message: 'Video converted to HLS format',
          //   videoUrl: videoUrl,
          //   lessonId: lessonId,
          // });
        // } else {
          // res.status(500).json({ error: 'ffmpeg process failed' });
        // }
      });
    }
  );
  console.log('App is using ffmpeg at port 8000...');
};
