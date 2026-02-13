"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const client_1 = __importDefault(require("../db/client"));
const getProducts = async (req, res) => {
    try {
        const products = await client_1.default.product.findMany({
            orderBy: { created_at: 'desc' },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    const { name, cost_price, default_selling_price } = req.body;
    try {
        const product = await client_1.default.product.create({
            data: {
                name,
                cost_price: parseFloat(cost_price),
                default_selling_price: default_selling_price ? parseFloat(default_selling_price) : null,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating product' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, cost_price, default_selling_price } = req.body;
    try {
        const product = await client_1.default.product.update({
            where: { id },
            data: {
                name,
                cost_price: parseFloat(cost_price),
                default_selling_price: default_selling_price ? parseFloat(default_selling_price) : null,
            },
        });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await client_1.default.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};
exports.deleteProduct = deleteProduct;
