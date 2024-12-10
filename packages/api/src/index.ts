#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { Agent } from './agent';

const argv = yargs(hideBin(process.argv))
  .version(pkg.version)
  .option('port', {
    type: 'number',
    describe: 'which port to run on',
    default: 3000,
  })
  .option('name', {
    type: 'string',
    describe: 'the agents name',
    demandOption: true,
  })
  .option('description', {
    type: 'string',
    describe: 'the agents description',
    demandOption: true
  })
  .option('prompt', {
    type: 'string',
    describe: 'the agents prompt',
    demandOption: true,
  })
  .option('model', {
    type: 'string',
    describe: 'the LLM model to use',
    demandOption: true,
  })
  .option('api-key', {
    type: 'string',
    describe: 'the API key to use for the LLM',
    demandOption: true,
  })
  .option('parent', {
    type: 'string',
    describe: 'the parent agents url to connect to',
  })
  .parseSync();

const agent = new Agent(argv);

agent.listen(() => {
  agent.log.info(`🚀 listening on port ${argv.port}...`);
});
