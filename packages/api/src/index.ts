#!/usr/bin/env node

import http from 'node:http';
import express from 'express';
import debug from 'debug';
import cors from 'cors';
import socketio from 'socket.io';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';

const argv = yargs(hideBin(process.argv))
  .version(pkg.version)
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
  .parseSync();

const port = process.env.PORT || 3000;
const app = express();
const log = debug(`agents/${argv.name}`);
log.enabled = true;

app.use(express.json());
app.use(cors());

app.get('/', (_, res) => {
  res.json({
    name: argv.name,
    prompt: argv.prompt,
    model: argv.model
  });
});

const server = http.createServer(app);
const io = new socketio.Server(server);

io.on('connection', client => {
  client.on('event', () => log('event received...'));
  client.on('disconnect', () => log('disconnected...'));
});

app.listen(port, () => {
  log(`🚀 listening on port ${port}...`);
});
