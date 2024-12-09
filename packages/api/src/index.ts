#!/usr/bin/env node

import http from 'node:http';
import express from 'express';
import debug from 'debug';
import cors from 'cors';
import socket from 'socket.io';
import socketClient from 'socket.io-client';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';

const argv = yargs(hideBin(process.argv))
  .version(pkg.version)
  .option('port', {
    type: 'number',
    describe: 'which port to run on',
    default: 3000
  })
  .option('name', {
    type: 'string',
    describe: 'the agents name',
    demandOption: true
  })
  .option('prompt', {
    type: 'string',
    describe: 'the agents prompt',
    demandOption: true
  })
  .option('model', {
    type: 'string',
    describe: 'the LLM model to use',
    demandOption: true
  })
  .option('api-key', {
    type: 'string',
    describe: 'the API key to use for the LLM',
    demandOption: true
  })
  .option('parent', {
    type: 'string',
    describe: 'the parent agents url to connect to'
  })
  .parseSync();

const app = express();
const log = debug(`agents/${argv.name}`);
log.enabled = true;

const sockets: Array<string> = [];

app.use(express.json());
app.use(cors());
app.get('/', (_, res) => {
  res.json({
    name: argv.name,
    prompt: argv.prompt,
    model: argv.model,
    parent: argv.parent,
    sockets
  });
});

const server = http.createServer(app);
const io = new socket.Server(server, {
  cors: { origin: '*' }
});

io.on('connection', socket => {
  const name = socket.handshake.auth.name;
  sockets.push(name);
  log(`${name} connected...`);
});

if (!!argv.parent) {
  const socket = socketClient(argv.parent, {
    auth: { name: argv.name },
    autoConnect: false
  });

  socket.on('connect', () => {
    log('connected to parent...');
  });

  socket.connect();
}

server.listen(argv.port, () => {
  log(`🚀 listening on port ${argv.port}...`);
});
