
import multer from 'multer';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process'; // watch out
import exp from 'constants';
// import { stderr, stdout } from 'process';
// import { error } from 'console';
const db = './db.json';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + uuidv4() + path.extname(file.originalname));
    },
  });
  // multer configuration
  const upload = multer({ storage: storage });
app.get('/video_list', function (req, res) {
  fs.readFile(db, 'utf8', async function (err, data) {
    if (err) throw err;
    const list= JSON.parse(data);
    if (list) {
      res.json ({ list, message: 'Data Fetch Successfully', valid: true });
    } else {
      res.json ({ message: 'Data Not Found', valid: false });
    }})
});
app.get('/', function (req, res) {
  res.json({ message: 'Stremming' });
});
app.post('/upload', upload.single('file'), async function (req, res) {
  const lessonId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/courses/${lessonId}`;
  const hlsPath = `${outputPath}/index.m3u8`;
  console.log('hlsPath', hlsPath);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // ffmpeg
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
  // const ffmpegCommand = `ffmpeg -i ${videoPath} -c:v libx264 -preset veryfast -b:v 1000k -c:a aac -b:a 128k -hls_time 10 -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath} `;


  // no queue because of POC, not to be used in production
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
    const videoUrl = `http://localhost:8080/uploads/courses/${lessonId}/index.m3u8`;
    //insert BD;
    fs.readFile(db, 'utf8', function (err, data) {
      if (err) throw err;
      let users = JSON.parse(data);
      users.push({id:users.length+1,videoUrl,lessonId});
      fs.writeFile(db, JSON.stringify(users), (err) => {
        if (err) {
          throw err;
        }
      });
    });


      res.json({
        message: 'Video converted to HLS format',
        videoUrl: videoUrl,
        lessonId: lessonId,
      });
    
  });
});

app.listen(8080, function () {
  console.log('App is listening at port 8080...');
});