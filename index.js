import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import autocannon from 'autocannon';
// import { appPage } from './app.js';
import { Socket } from './socket.js';
import { ffmpeg } from './ffmpeg.js';
import { imageOptimizationFun} from './imageOptimizer.js';
const app = express();
app.use(cors());
//multer middleware 
app.use(express.json());
const httpServer = createServer(app);
app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({ extended: false }));
// app.use(
//   cors({
//     origin: 'http://localhost:5173',
//     credentials: true,
//     methods: ['GET', 'POST'],
//   })
// );
app.get('/login', (req, res) => {
  const token = jwt.sign({ _id: 'asdasjdhkasdasdas' }, secretKeyJWT);
  res
    .cookie('token',token, { httpOnly: true, secure: true, sameSite: 'none' })
    .json({
      message: 'Login Success',
    });
});
imageOptimizationFun(app);
// Socket(httpServer,app);
ffmpeg(app);
// const instance = autocannon({
//   url: 'http://localhost:8000/api',
//   duration: 30
// }, (err, result) => {
//   if (err) {
//     console.error('Error:', err);
//   } else {
//     console.log('No of Request:', result);
//     console.log('Result:', result.duration);
//   }
// });
// autocannon.track(instance,{renderResultsTable:false});
// autocannon.track(instance,{renderResultsTable:false,renderProgressBar:false});
// instance.on('done', (result) => {
//   // Handle the final results here
//   console.log('Test completed:', result);
httpServer.listen(8001, function () {
  console.log('App is listening at port 8001...');
});
