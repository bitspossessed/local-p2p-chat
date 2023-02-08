import chalk from 'chalk';
import readline from 'readline';

import Chat from './chat.js';
import Discovery from './discovery.js';
import { getIPv4Address, generateRandomId } from './utils.js';

const address = getIPv4Address();
const id = generateRandomId();

console.log(chalk.blue.bold('local-p2p-chat'));
console.log(`${chalk.blue('IP4-Address')}: ${address}`);
console.log(`${chalk.blue('Peer ID')}: ${id}`);
console.log();

const chat = new Chat({ id });

chat.emitter.on('ready', (port) => {
  const discovery = new Discovery({
    topic: 'p2p-chat',
    address,
    port,
    id,
  });

  discovery.emitter.on('peer', (peer) => {
    chat.addPeer(peer);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    chat.send(line);
  });
});
