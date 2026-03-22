// 设备控制器 - 实现设备列表查询、创建、更新、删除及排序逻辑
const Device = require('../models/Device');

async function getAllDevices(req, res) {
  try {
    const devices = await Device.findAll();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createDevice(req, res) {
  try {
    const { name, type, status, location, extra } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }
    const id = await Device.create({ name, type, status, location, extra });
    res.status(201).json({ id, name, type, status, location, extra });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateDevice(req, res) {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // 解析已存储的 JSON 字段
    const storedStatus = typeof device.status === 'string' ? JSON.parse(device.status) : (device.status ?? {})
    const storedExtra  = typeof device.extra  === 'string' ? JSON.parse(device.extra)  : (device.extra  ?? {})

    // 支持部分更新：只合并传入的字段
    const updated = {
      name:     req.body.name     ?? device.name,
      type:     req.body.type     ?? device.type,
      location: req.body.location ?? device.location,
      status:   req.body.status   != null ? { ...storedStatus, ...req.body.status } : storedStatus,
      extra:    req.body.extra    != null ? { ...storedExtra,  ...req.body.extra  } : storedExtra,
    };
    await Device.update(id, updated);

    // 同步更新 simulator 内存，防止 tick 用旧状态覆盖数据库
    const simulator = req.app.get('simulator');
    if (simulator) {
      simulator.devices.set(Number(id), {
        id:     Number(id),
        name:   updated.name,
        type:   updated.type,
        status: updated.status,
      });
    }

    res.json({ id: Number(id), ...updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteDevice(req, res) {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    await Device.delete(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reorderDevices(req, res) {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' })
    await Promise.all(ids.map((id, index) =>
      require('../utils/db').query('UPDATE devices SET sort_order=? WHERE id=?', [index, id])
    ))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getAllDevices, createDevice, updateDevice, deleteDevice, reorderDevices };
