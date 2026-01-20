const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller.js');

router.get('/', getHealth);

module.exports = router;