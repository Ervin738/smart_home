const express = require('express')
const router = express.Router({ mergeParams: true })
const { getState, updateState } = require('../controllers/deviceStateController')

// GET  /api/devices/:id/state
router.get('/', getState)

// PATCH /api/devices/:id/state
router.patch('/', updateState)

module.exports = router
