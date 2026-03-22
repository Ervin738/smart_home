const { Router } = require('express');
const { getAllScenes, createScene, triggerScene } = require('../controllers/sceneController');

const router = Router();

router.get('/',              getAllScenes);
router.post('/',             createScene);
router.post('/:id/trigger',  triggerScene);

module.exports = router;
