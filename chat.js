import chalk from 'chalk';
import dgram from 'dgram';
import events from 'events';

export default class Chat {
  constructor(options) {
    const emitter = new events.EventEmitter();

    const socket = dgram.createSocket({
      type: 'udp4',
    });

    socket.on('listening', () => {
      const { port } = this.socket.address();
      console.log(`Listening UDP socket for p2p chat @ port ${port}`);

      emitter.emit('ready', port);
    });

    socket.on('error', (error) => {
      console.error(`Something went wrong: ${error.message}`);
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

    // Bind a UDP socket listening to a random port (given by the OS)
    socket.bind();

    this.socket = socket;
    this.emitter = emitter;
    this.options = options;
    this.peers = [];
  }

  send(message) {
    const data = Buffer.from(message);

    // Send a chat message to all known peers, one by one
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
