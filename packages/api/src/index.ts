#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { App } from './app';

const argv = yargs(hideBin(process.argv))
  .version(pkg.version)
  .option('port', {
    type: 'number',
    describe: 'which port to run on',
    default: +(process.env.PORT || 3000),
  })
  .option('name', {
    type: 'string',
    describe: 'the agents name',
    demandOption: true,
    default: process.env.AGENT_NAME
  })
  .option('description', {
    type: 'string',
    describe: 'the agents description',
    demandOption: true,
    default: process.env.AGENT_DESCRIPTION
  })
  .option('prompt', {
    type: 'string',
    describe: 'the agents prompt',
    demandOption: true,
    default: process.env.AGENT_PROMPT
  })
  .option('model', {
    type: 'string',
    describe: 'the LLM model to use',
    demandOption: true,
    default: process.env.AGENT_MODEL
  })
  .option('api-key', {
    type: 'string',
    describe: 'the API key to use for the LLM',
    demandOption: true,
    default: process.env.AGENT_API_KEY || process.env.OPENAI_API_KEY
  })
  .option('parent', {
    type: 'string',
    describe: 'the parent agents url to connect to',
    default: process.env.AGENT_PARENT
  })
  .parseSync();

const app = new App(argv);

app.listen(() => {
  app.log.info(`🚀 listening on port ${argv.port}...`);
});
