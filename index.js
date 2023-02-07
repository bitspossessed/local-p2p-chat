import crypto from 'crypto';
import dgram from 'dgram';
import events from 'events';
import os from 'os';
import readline from 'readline';

import chalk from 'chalk';
import dns from 'dns-packet';

const BROADCAST_INTERVAL_MS = 5000;

const MDNS_ADDRESS = '224.0.0.251';
const MDNS_PORT = 5353;

const TOPIC = 'p2p-chat';

function getIPv4Address() {
  let result = '0.0.0.0';

  const interfaces = os.networkInterfaces();
  const names = Object.keys(interfaces);

  names.forEach((name) => {
    const addresses = interfaces[name];

    addresses.forEach(({ family, address, internal }) => {
      if ((family === 'IPv4' || family === 4) && !internal) {
        result = address;
      }
    });
  });

  return result;
}

function generateRandomId(len = 8) {
  const bytes = new Uint8Array((len || 40) / 2);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('hex');
}

class Chat {
  constructor(options) {
    const emitter = new events.EventEmitter();

    const socket = dgram.createSocket({
      type: 'udp4',
    });

    socket.on('message', (data, info) => {
      // Find identifier of this peer
      const peer = this.peers.find((peer) => {
        return peer.address === info.address && peer.port === info.port;
      });

      // Received data from unknown peer, let's ignore it
      if (!peer) {
        return;
      }

      // Show message
      const message = String.fromCharCode.apply(String, data);
      console.log(`${chalk.green.bold(peer.id)}: ${chalk.green(message)}`);
    });

    socket.on('listening', () => {
      const { port } = this.socket.address();
      console.log(`Listening UDP socket for p2p chat @ port ${port}`);

      emitter.emit('ready', port);
    });

    socket.bind();

    this.socket = socket;
    this.emitter = emitter;
    this.options = options;
    this.peers = [];
  }

  send(message) {
    const data = Buffer.from(message);

    this.peers.forEach(({ address, port }) => {
      this.socket.send(data, 0, data.length, port, address);
    });
  }

  addPeer({ address, port, id }) {
    // Check if peer is already registered
    const exists = this.peers.find((peer) => {
      return peer.id === id;
    });

    if (exists) {
      return;
    }

    this.peers.push({
      address,
      port: parseInt(port),
      id,
    });

    console.log(
      `${chalk.green('★')} Found new peer ${chalk.green.bold(
        id,
      )} @ ${address}:${port}`,
    );
  }
}

class Discovery {
  constructor(options) {
    const emitter = new events.EventEmitter();

    const socket = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true,
    });

    socket.on('listening', () => {
      const { port } = this.socket.address();
      console.log(`Listening UDP socket for mDNS @ port ${port}`);

      socket.setMulticastTTL(255);
      socket.setMulticastLoopback(true);

      // Start querying for peers interested in the same topic
      this.queryTopic();
      setInterval(() => {
        this.queryTopic();
      }, BROADCAST_INTERVAL_MS);
    });

    socket.on('error', (error) => {
      console.error(`Something went wrong: ${error.message}`);
    });

    socket.on('message', (data) => {
      const message = dns.decode(data);

      if (
        message.type === 'query' &&
        message.questions.length === 1 &&
        message.questions[0].type === 'PTR' &&
        message.questions[0].name === `${TOPIC}.local`
      ) {
        this.respondTopic();
      } else if (
        message.type === 'response' &&
        message.answers.length === 1 &&
        message.answers[0].type === 'PTR' &&
        message.answers[0].name === `${TOPIC}.local`
      ) {
        const [address, port, id] = message.answers[0].data.split('/');

        // Do only report found peers when it is _not_ us
        if (id !== options.id) {
          emitter.emit('peer', { address, port, id });
        }
      }
    });

    socket.bind(MDNS_PORT);

    this.socket = socket;
    this.emitter = emitter;
    this.options = options;
  }

  broadcast(message) {
    this.socket.send(message, 0, message.length, MDNS_PORT, MDNS_ADDRESS);
  }

  queryTopic() {
    const message = dns.encode({
      type: 'query',
      questions: [
        {
          type: 'PTR',
          name: `${TOPIC}.local`,
        },
      ],
    });

    this.broadcast(message);
  }

  respondTopic() {
    const { address, port, id } = this.options;

    const message = dns.encode({
      type: 'response',
      flags: 0 | dns.AUTHORITATIVE_ANSWER,
      answers: [
        {
          type: 'PTR',
          class: 'IN',
          name: `${TOPIC}.local`,
          data: `${address}/${port}/${id}`,
        },
      ],
    });

    this.broadcast(message);
  }
}

const address = getIPv4Address();
const id = generateRandomId();

console.log(chalk.blue.bold('p2p-chat'));
console.log(`${chalk.blue('IP4-Address')}: ${address}`);
console.log(`${chalk.blue('Peer ID')}: ${id}`);
console.log();

const chat = new Chat({ id });

chat.emitter.on('ready', (port) => {
  const discovery = new Discovery({
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
