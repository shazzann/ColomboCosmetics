import { Request, Response } from 'express';
import prisma from '../db/client';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search, limit } = req.query;
        const where: any = {};

        if (search) {
            where.name = {
                contains: String(search),
                mode: 'insensitive',
            };
        }

        const take = limit ? Number(limit) : undefined;

        const products = await prisma.product.findMany({
            where,
            take,
            orderBy: { created_at: 'desc' },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    const { name, cost_price, default_selling_price } = req.body;

    try {
        const product = await prisma.product.create({
            data: {
                name,
                cost_price: parseFloat(cost_price),
                default_selling_price: default_selling_price ? parseFloat(default_selling_price) : null,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { name, cost_price, default_selling_price } = req.body;

    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                cost_price: parseFloat(cost_price),
                default_selling_price: default_selling_price ? parseFloat(default_selling_price) : null,
            },
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    try {
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};
