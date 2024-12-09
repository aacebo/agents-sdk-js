import http from 'node:http';
import express from 'express';
import debug from 'debug';
import cors from 'cors';
import socketio from 'socket.io';

const port = process.env.PORT || 3000;
const log = debug('agents:api');
const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new socketio.Server(server);

io.on('connection', client => {
  client.on('event', () => log('event received...'));
  client.on('disconnect', () => log('disconnected...'));
});

app.listen(port, () => {
  log(`🚀 listening on port ${port}...`);
});
