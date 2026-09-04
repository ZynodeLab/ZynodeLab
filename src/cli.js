#!/usr/bin/env node
import { runCli } from './cli/run.js';

function swallowBrokenPipe(stream) {
  stream.on('error', (error) => {
    if (error?.code === 'EPIPE') process.exit(0);
    throw error;
  });
}

swallowBrokenPipe(process.stdout);
swallowBrokenPipe(process.stderr);
process.exitCode = await runCli(process.argv.slice(2));
