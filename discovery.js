import dgram from 'dgram';
import dns from 'dns-packet';
import events from 'events';

// Frequency of broadcasting via mDNS
const BROADCAST_INTERVAL_MS = 5000;

// As defined per RFC 6762
const MDNS_ADDRESS = '224.0.0.251';
const MDNS_PORT = 5353;

export default class Discovery {
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
        message.questions[0].name === `${this.options.topic}.local`
      ) {
        this.respondTopic();
      } else if (
        message.type === 'response' &&
        message.answers.length === 1 &&
        message.answers[0].type === 'PTR' &&
        message.answers[0].name === `${this.options.topic}.local`
      ) {
        const [address, port, id] = message.answers[0].data.split('/');

        // Do only report found peers when it is _not_ us
        if (id !== options.id) {
          emitter.emit('peer', { address, port, id });
        }
      }
    });

    // Listen to mDNS port on all interfaces
    socket.bind(MDNS_PORT);

    this.socket = socket;
    this.emitter = emitter;
    this.options = options;
  }

  broadcast(message) {
    this.socket.send(message, 0, message.length, MDNS_PORT, MDNS_ADDRESS);
  }

  // Send a DNS query to ask if someone is interested in our topic
  queryTopic() {
    const message = dns.encode({
      type: 'query',
      questions: [
        {
          type: 'PTR',
          name: `${this.options.topic}.local`,
        },
      ],
    });

    this.broadcast(message);
  }

  // Send a DNS response to answer somebodies query
  respondTopic() {
    const { address, port, id, topic } = this.options;

    const message = dns.encode({
      type: 'response',
      flags: 0 | dns.AUTHORITATIVE_ANSWER,
      answers: [
        {
          type: 'PTR',
          class: 'IN',
          name: `${topic}.local`,
          data: `${address}/${port}/${id}`,
        },
      ],
    });

    this.broadcast(message);
  }
}
