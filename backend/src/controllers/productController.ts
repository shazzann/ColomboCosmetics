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

export const getPopularProducts = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        // Get products ordered most frequently (by number of order lines, not quantity)
        const popular = await prisma.orderItem.groupBy({
            by: ['product_id'],
            where: {
                product_id: { not: null },
            },
            _count: { product_id: true },
            orderBy: { _count: { product_id: 'desc' } },
            take: limit,
        });

        const productIds = popular
            .map((p) => p.product_id)
            .filter((id): id is string => id !== null);

        if (productIds.length === 0) {
            // Fallback: return newest products
            const products = await prisma.product.findMany({
                take: limit,
                orderBy: { created_at: 'desc' },
            });
            return res.json(products);
        }

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        // Sort by the same order as the popularity ranking
        const idOrder = new Map(productIds.map((id, i) => [id, i]));
        products.sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));

        res.json(products);
    } catch (error) {
        console.error('Error fetching popular products:', error);
        res.status(500).json({ message: 'Error fetching popular products' });
    }
};
