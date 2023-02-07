# local-p2p-chat

> For our fun session on 10.02.23!

This is a very simple p2p chat program running in your terminal and _only_ on your local network. It makes use of [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) to find other peers who are available for chatting. After discovery these peers are added to your chat. You can write messages by typing directly in the terminal.

To play with it in your local network you can start the process in multiple shell sessions, better even on different computers on the same network if you have more than one.

## Requirements

* NodeJS environment (works only from `v17`!)
* Running mDNS service (Bonjour, Avahi, etc. - you probably have that already)
* [Wireshark](https://www.wireshark.org/) (to have fun)

## Usage

```bash
# Install dependencies
npm install

# Run it!
npm start
```

## License

`UNLICENSE`
