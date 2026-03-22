// 场景路由 - 处理场景的查询、创建及触发接口
const { Router } = require('express');
const { getAllScenes, createScene, triggerScene } = require('../controllers/sceneController');

const router = Router();

router.get('/',              getAllScenes);
router.post('/',             createScene);
router.post('/:id/trigger',  triggerScene);

module.exports = router;
