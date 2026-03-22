const Device = require('../models/Device');
const Scene = require('../models/Scene');
const Log = require('../models/Log');
const Room = require('../models/Room');
const { initDeviceStateTables } = require('../models/DeviceState');

async function initDb() {
  await Room.init();
  await Device.init();
  await Scene.init();
  await Log.init();
  await initDeviceStateTables();
  console.log('All tables initialized.');
}

module.exports = initDb;
