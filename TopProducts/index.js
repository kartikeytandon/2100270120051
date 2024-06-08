const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { query, validationResult } = require('express-validator');

const app = express();
const port = 3000;

const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
const baseUrl = 'http://20.244.56.144/test/companies';

const fetchProducts = async (company, category, top, minPrice, maxPrice) => {
    const url = `${baseUrl}/${company}/categories/${category}/products`;
    const response = await axios.get(url, {
        params: { top, minPrice, maxPrice }
    });
    return response.data.map(product => ({
        ...product,
        id: uuidv4(),
        company
    }));
};

app.get('/categories/:categoryname/products', [
    query('n').isInt({ min: 1 }).withMessage('n must be an integer greater than 0'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer greater than 0'),
    query('sort').optional().isIn(['rating', 'price', 'company', 'discount']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order value'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { categoryname } = req.params;
    const { n, minPrice = 0, maxPrice = Infinity, sort, order = 'asc', page = 1 } = req.query;

    try {
        const allProducts = [];
        for (const company of companies) {
            const products = await fetchProducts(company, categoryname, n, minPrice, maxPrice);
            allProducts.push(...products);
        }

        if (sort) {
            allProducts.sort((a, b) => {
                if (order === 'asc') {
                    return a[sort] > b[sort] ? 1 : -1;
                } else {
                    return a[sort] < b[sort] ? 1 : -1;
                }
            });
        }

        const startIndex = (page - 1) * n;
        const endIndex = page * n;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        res.json(paginatedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/categories/:categoryname/products/:productid', (req, res) => {
    const { categoryname, productid } = req.params;
    res.json({ message: `Details for product ${productid} in category ${categoryname}` });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});