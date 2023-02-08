import chalk from 'chalk';
import dgram from 'dgram';
import events from 'events';

export default class Chat {
  // Create a UDP socket listening to a random port (given by the OS)
  // on all interfaces.
  //
  // React to incoming chat messages and show them in terminal.
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

    socket.bind();

    this.socket = socket;
    this.emitter = emitter;
    this.options = options;
    this.peers = [];
  }

  // Send a chat message to all known peers, one by one
  //
  // ✺ Or use UDP multicast here as well, but this example is maybe closer
  // to how you would do it with TCP (and without any cool routing, like gossiping)
  send(message) {
    const data = Buffer.from(message);

    this.peers.forEach(({ address, port }) => {
      this.socket.send(data, 0, data.length, port, address);
    });
  }

  // Add someone to our list of known peers, make sure there are no duplicates
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
