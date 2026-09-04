#!/usr/bin/env node
import { runCli } from './cli/run.js';

for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (error) => {
    if (error?.code === 'EPIPE') process.exit(0);
    throw error;
  });
}

process.exitCode = await runCli(process.argv.slice(2));
