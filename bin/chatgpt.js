#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { ChatGPT } from '../index.js';

const { CHATGPT_SESSION_TOKEN: sessionToken } = process.env;

const rl = readline.createInterface({ input, output });

const chat = new ChatGPT({
  sessionToken,
});

while (true) {
  const request = await rl.question("You > ");
  rl.write(`ChatGPT: Waiting Response ...`);
  if (request === 'quit') {
    break;
  } else {
    const answer = await chat.getAnswer(request);
    rl.write(`\r${answer}\n`)
  }
}

console.log(`ChatGPT: Goodbye!`);

rl.close();