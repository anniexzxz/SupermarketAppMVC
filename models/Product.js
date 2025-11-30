// ...existing code...
const db = require('../db');

const Product = {
    // Get all products
    getAll(callback) {
        const sql = 'SELECT productid, productName, quantity, price, image, category_id FROM products';
        db.query(sql, (err, results) => callback(err, results));
    },

    // Get a single product by ID
    getById(productid, callback) {
        const sql = 'SELECT productid, productName, quantity, price, image, category_id FROM products WHERE productid = ?';
        db.query(sql, [productid], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0] || null);
        });
    },

    // Add a new product – product: { productName, quantity, price, image, category_id }
    create(product, callback) {
        const sql = 'INSERT INTO products (productName, quantity, price, image, category_id) VALUES (?, ?, ?, ?, ?)';
        const params = [product.productName, product.quantity, product.price, product.image, product.category_id || null];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Update an existing product by ID – product: { productName, quantity, price, image, category_id }
    edit(productid, product, callback) {
        const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ?, category_id = ? WHERE productid = ?';
        const params = [product.productName, product.quantity, product.price, product.image, product.category_id || null, productid];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Alias to keep controller code flexible
    update(productid, product, callback) {
        return this.edit(productid, product, callback);
    },

    // Get products by category_id
    getByCategory(categoryId, callback) {
        const sql = 'SELECT productid, productName, quantity, price, image, category_id FROM products WHERE category_id = ?';
        db.query(sql, [categoryId], (err, results) => callback(err, results));
    },

    // Delete a product by ID
    delete(productid, callback) {
        const sql = 'DELETE FROM products WHERE productid = ?';
        db.query(sql, [productid], (err, result) => callback(err, result));
    },

    // Decrease quantity atomically if enough stock remains
    decreaseQuantity(productid, amount, callback) {
        const sql = 'UPDATE products SET quantity = quantity - ? WHERE productid = ? AND quantity >= ?';
        db.query(sql, [amount, productid, amount], (err, result) => {
            if (err) return callback(err);
            if (result.affectedRows === 0) {
                return callback(new Error('Insufficient stock'));
            }
            callback(null, result);
        });
    }
};

module.exports = Product;
