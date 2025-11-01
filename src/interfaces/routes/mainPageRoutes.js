// src/interfaces/routes/mainPageRoutes.js
const express = require('express');
const router = express.Router();
const mainScreenController = require('../controllers/mainScreenController');

router.get('/main-screen', (req, res) => mainScreenController.getMainScreenPage(req, res));
router.post('/search', (req, res) => mainScreenController.searchByName(req, res));
router.post('/filter', (req, res) => mainScreenController.filterByCategory(req, res));
module.exports = router;