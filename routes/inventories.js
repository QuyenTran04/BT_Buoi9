var express = require('express')
var router = express.Router()
let { getAll, getById, addStock, removeStock, reservation, sold } = require('../controllers/inventories')

// GET /api/v1/inventories
router.get('/', getAll)

// GET /api/v1/inventories/:id
router.get('/:id', getById)

// POST /api/v1/inventories/add-stock
router.post('/add-stock', addStock)

// POST /api/v1/inventories/remove-stock
router.post('/remove-stock', removeStock)

// POST /api/v1/inventories/reservation
router.post('/reservation', reservation)

// POST /api/v1/inventories/sold
router.post('/sold', sold)

module.exports = router
