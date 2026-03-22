const Room = require('../models/Room');

async function getAllRooms(req, res) {
  try {
    res.json(await Room.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createRoom(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const room = await Room.create(name.trim());
    // 广播给所有客户端
    const io = req.app.get('io');
    if (io) io.emit('room:changed', { action: 'create', room });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Room already exists' });
    res.status(500).json({ error: err.message });
  }
}

async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const fields = req.body; // { name?, fp_x?, fp_y?, fp_w?, fp_h? }
    const updated = await Room.update(id, fields);
    const io = req.app.get('io');
    if (io) io.emit('room:changed', { action: 'update', room: { id: Number(id), ...fields } });
    res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Room already exists' });
    res.status(500).json({ error: err.message });
  }
}

async function deleteRoom(req, res) {
  try {
    await Room.delete(req.params.id);
    const io = req.app.get('io');
    if (io) io.emit('room:changed', { action: 'delete', id: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reorderRooms(req, res) {
  try {
    const { ids } = req.body // [id1, id2, id3, ...]
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' })
    await Promise.all(ids.map((id, index) => Room.update(id, { sort_order: index })))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom, reorderRooms };
