import express from 'express';
import cors from 'cors';
import { Server } from "socket.io";
import { createServer } from "http";
import autocannon from 'autocannon';
const app = express();
//multer middleware
app.use(
  cors({
    origin: ['http://localhost:8000', 'http://localhost:5173'],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // watch it
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.use(express.json());
// app.use('/ffmpeg', ffmpegRoute);
app.use(express.urlencoded({ extended: true }));

const instance = autocannon({
  url: 'http://localhost:8000/api',
  duration: 30
}, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('No of Request:', result);
    console.log('Result:', result.duration);
  }
});
// autocannon.track(instance,{renderResultsTable:false});
// autocannon.track(instance,{renderResultsTable:false,renderProgressBar:false});
// instance.on('done', (result) => {
//   // Handle the final results here
//   console.log('Test completed:', result);
app.listen(3000, function () {
  console.log('App is listening at port 3000...');
});
