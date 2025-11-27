// ...existing code...
const db = require('../db');

const Product = {
    // Get all products
    getAll(callback) {
        const sql = 'SELECT productid, productName, quantity, price, image FROM products';
        db.query(sql, (err, results) => callback(err, results));
    },

    // Get a single product by ID
    getById(productid, callback) {
        const sql = 'SELECT productid, productName, quantity, price, image FROM products WHERE productid = ?';
        db.query(sql, [productid], (err, results) => {
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
    edit(productid, product, callback) {
        const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productid = ?';
        const params = [product.productName, product.quantity, product.price, product.image, productid];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Alias to keep controller code flexible
    update(productid, product, callback) {
        return this.edit(productid, product, callback);
    },

    // Delete a product by ID
    delete(productid, callback) {
        const sql = 'DELETE FROM products WHERE productid = ?';
        db.query(sql, [productid], (err, result) => callback(err, result));
    }
};

module.exports = Product;
