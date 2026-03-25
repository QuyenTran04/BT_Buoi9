let inventoryModel = require('../schemas/inventories')

// GET /api/v1/inventories - Lấy tất cả inventory (join product)
const getAll = async (req, res) => {
    try {
        let data = await inventoryModel.find().populate({
            path: 'product',
            select: 'title slug price images category'
        })
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

// GET /api/v1/inventories/:id - Lấy inventory theo ID (join product)
const getById = async (req, res) => {
    try {
        let result = await inventoryModel.findById(req.params.id).populate({
            path: 'product',
            select: 'title slug price images category'
        })
        if (!result) return res.status(404).send({ message: 'Inventory not found' })
        res.send(result)
    } catch (error) {
        res.status(404).send({ message: error.message })
    }
}

// POST /api/v1/inventories/add-stock - Tăng stock
const addStock = async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product and quantity (> 0) are required' })

        let inventory = await inventoryModel.findOne({ product })
        if (!inventory) return res.status(404).send({ message: 'Inventory not found for this product' })

        inventory.stock += quantity
        await inventory.save()
        res.send(inventory)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

// POST /api/v1/inventories/remove-stock - Giảm stock
const removeStock = async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product and quantity (> 0) are required' })

        let inventory = await inventoryModel.findOne({ product })
        if (!inventory) return res.status(404).send({ message: 'Inventory not found for this product' })

        if (inventory.stock < quantity)
            return res.status(400).send({ message: `Not enough stock. Available: ${inventory.stock}` })

        inventory.stock -= quantity
        await inventory.save()
        res.send(inventory)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

// POST /api/v1/inventories/reservation - Giảm stock, tăng reserved
const reservation = async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product and quantity (> 0) are required' })

        let inventory = await inventoryModel.findOne({ product })
        if (!inventory) return res.status(404).send({ message: 'Inventory not found for this product' })

        if (inventory.stock < quantity)
            return res.status(400).send({ message: `Not enough stock to reserve. Available: ${inventory.stock}` })

        inventory.stock -= quantity
        inventory.reserved += quantity
        await inventory.save()
        res.send(inventory)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

// POST /api/v1/inventories/sold - Giảm reserved, tăng soldCount
const sold = async (req, res) => {
    try {
        let { product, quantity } = req.body
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product and quantity (> 0) are required' })

        let inventory = await inventoryModel.findOne({ product })
        if (!inventory) return res.status(404).send({ message: 'Inventory not found for this product' })

        if (inventory.reserved < quantity)
            return res.status(400).send({ message: `Not enough reserved quantity. Reserved: ${inventory.reserved}` })

        inventory.reserved -= quantity
        inventory.soldCount += quantity
        await inventory.save()
        res.send(inventory)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

module.exports = { getAll, getById, addStock, removeStock, reservation, sold }
