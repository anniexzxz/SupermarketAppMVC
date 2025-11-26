// ...existing code...
const db = require('../db');

const Product = {
    // Get all products
    getAll(callback) {
        const sql = 'SELECT id, productName, quantity, price, image FROM products';
        db.query(sql, (err, results) => callback(err, results));
    },

    // Get a single product by ID
    getById(id, callback) {
        const sql = 'SELECT id, productName, quantity, price, image FROM products WHERE id = ?';
        db.query(sql, [id], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0] || null);
        });
    },

    // Add a new product — product: { productName, quantity, price, image }
    create(product, callback) {
        const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
        const params = [product.productName, product.quantity, product.price, product.image];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Update an existing product by ID — product: { productName, quantity, price, image }
    edit(id, product, callback) {
        const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE id = ?';
        const params = [product.productName, product.quantity, product.price, product.image, id];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Delete a product by ID
    delete(id, callback) {
        const sql = 'DELETE FROM products WHERE id = ?';
        db.query(sql, [id], (err, result) => callback(err, result));
    }
};

module.exports = Product;
// ...existing code...