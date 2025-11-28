const db = require('../db');

// Function-based CartItem model (MySQL)
// Assumes cart_items table with fields: cart_itemsId, userId, productId, quantity, created_at
// and products table with productid, price, productName
const CartItems = {
    // List all cart items with product details and computed subtotal
    listAll(callback) {
        const sql = `
            SELECT ci.cart_itemsId, ci.userId, ci.productId, ci.quantity, ci.created_at,
                   p.productName, p.price, p.image, (ci.quantity * p.price) AS subtotal
            FROM cart_items ci
            JOIN products p ON ci.productId = p.productid
            ORDER BY ci.created_at DESC
        `;
        db.query(sql, callback);
    },

    // List cart items for a specific user
    listByUser(userId, callback) {
        const sql = `
            SELECT ci.cart_itemsId, ci.userId, ci.productId, ci.quantity, ci.created_at,
                   p.productName, p.price, p.image, (ci.quantity * p.price) AS subtotal
            FROM cart_items ci
            JOIN products p ON ci.productId = p.productid
            WHERE ci.userId = ?
            ORDER BY ci.created_at DESC
        `;
        db.query(sql, [userId], callback);
    },

    // Add a product to a user's cart
    add(userId, productId, quantity, callback) {
        const sql = 'INSERT INTO cart_items (userId, productId, quantity) VALUES (?, ?, ?)';
        db.query(sql, [userId, productId, quantity], callback);
    },

    // Update quantity; returns the updated row with recalculated subtotal
    updateQuantity(userId, productId, quantity, callback) {
        const sql = 'UPDATE cart_items SET quantity = ? WHERE userId = ? AND productId = ?';
        db.query(sql, [quantity, userId, productId], (err) => {
            if (err) return callback(err);

            const fetchSql = `
                SELECT ci.cart_itemsId, ci.userId, ci.productId, ci.quantity, ci.created_at,
                       p.productName, p.price, p.image, (ci.quantity * p.price) AS subtotal
                FROM cart_items ci
                JOIN products p ON ci.productId = p.productid
                WHERE ci.userId = ? AND ci.productId = ?
            `;
            db.query(fetchSql, [userId, productId], (fetchErr, rows) => callback(fetchErr, rows && rows[0] ? rows[0] : null));
        });
    },

    // Delete a single product from the cart
    remove(userId, productId, callback) {
        const sql = 'DELETE FROM cart_items WHERE userId = ? AND productId = ?';
        db.query(sql, [userId, productId], callback);
    },

    // Clear all products from a user's cart
    clear(userId, callback) {
        const sql = 'DELETE FROM cart_items WHERE userId = ?';
        db.query(sql, [userId], callback);
    },

    // Calculate per-item subtotals and overall totals for a user
    totals(userId, callback) {
        const sql = `
            SELECT ci.cart_itemsId, ci.userId, ci.productId, ci.quantity, ci.created_at,
                   p.productName, p.price, p.image, (ci.quantity * p.price) AS subtotal
            FROM cart_items ci
            JOIN products p ON ci.productId = p.productid
            WHERE ci.userId = ?
        `;
        db.query(sql, [userId], (err, rows) => {
            if (err) return callback(err);
            const items = rows || [];
            const total = items.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);
            const subtotal = total;
            callback(null, { items, subtotal, total });
        });
    }
};

module.exports = CartItems;
