// 内置 MQTT Broker（基于 aedes）
const Aedes = require('aedes');
const net = require('net');

const BROKER_PORT = 1883;

function startBroker() {
  return new Promise((resolve) => {
    const broker = Aedes.Server ? new Aedes.Server() : new Aedes();

    broker.authenticate = (client, username, password, callback) => {
      callback(null, true);
    };

    const server = net.createServer((socket) => {
      broker.handle(socket);
    });

    server.listen(BROKER_PORT, () => {
      console.log(`[Broker] Internal MQTT Broker running on port ${BROKER_PORT}`);

      broker.on('client', (client) => {
        console.log(`[Broker] Client connected: ${client.id}`);
      });
      broker.on('clientDisconnect', (client) => {
        console.log(`[Broker] Client disconnected: ${client.id}`);
      });
      broker.on('publish', (packet, client) => {
        if (client) console.log(`[Broker] Message on ${packet.topic} from ${client.id}`);
      });

      resolve(broker);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('[Broker] Port 1883 already in use, skipping.');
        resolve(null);
      } else {
        console.error('[Broker] Error:', err.message);
        resolve(null);
      }
    });
  });
}

module.exports = { startBroker };
