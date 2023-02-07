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

## How to use Wireshark?

1. Make sure to run wireshark with `sudo` rights to be able to inspect packages on your network interfaces.
2. Select the interface you want to inspect traffic on, it is usually your wlan interface `wlan0`, `wlp3s0`, etc.
3. You can filter incoming packages by type, just write `mdns` or `udp` in the filter input on the top

## How can you make this run on the internet?

For this we can't use mDNS anymore as this only works on local networks. To find others in p2p manner on the internet there are different techniques, but all of them usually need something like a "rendevouz" or "bootstrapping" server which helps to establish a connection between two peers (for example like an ICE server to establish WebRTC p2p connections). Another problem is that usually computers are behind NATs, so other peers can't know your local IP address from the outside. For this we need a technique called UDP hole-punching.

## License

`UNLICENSE`
