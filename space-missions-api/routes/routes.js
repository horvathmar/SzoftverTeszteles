const express = require('express');
const controller = require('../controller/controller');

const router = express.Router();

router.post('/', controller.createMission);
router.get('/', controller.getAllMissions);
router.get('/:id', controller.getMissionById);
router.patch('/:id', controller.updateMission);
router.delete('/:id', controller.deleteMission);

module.exports = router;
