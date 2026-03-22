const Scene = require('../models/Scene');
const { applySceneRules } = require('../simulation/simulationService');
const { publishControl } = require('../utils/mqttService');

async function getAllScenes(req, res) {
  try {
    const scenes = await Scene.findAll();
    res.json(scenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createScene(req, res) {
  try {
    const { name, rules } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = await Scene.create({ name, rules });
    res.status(201).json({ id, name, rules: rules ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function triggerScene(req, res) {
  try {
    const { id } = req.params;
    const scene = await Scene.findById(id);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    // rules may be stored as a JSON string by MySQL
    const rules = typeof scene.rules === 'string'
      ? JSON.parse(scene.rules)
      : (scene.rules ?? []);

    const io = req.app.get('io');
    const results = await applySceneRules(rules, io);

    // Publish each rule as a MQTT control command
    for (const rule of rules) {
      publishControl(rule.deviceId, rule.status);
    }

    res.json({ sceneId: Number(id), results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllScenes, createScene, triggerScene };
