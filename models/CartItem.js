const db = require('../db');

const CartItems = {
    getByUserId(userId, callback) {
        db.query('SELECT * FROM cart_items WHERE userId = ?', [userId], callback);
    },
    add(userId, productId, callback) {
        db.query('INSERT INTO cart_items (userId, productId) VALUES (?, ?)', [userId, productId], callback);
    },
    remove(userId, productId, callback) {
        db.query('DELETE FROM cart_items WHERE userId = ? AND productId = ?', [userId, productId], callback);
    },
    removeBulk(userId, productIds, callback) {
        if (!productIds || !productIds.length) return callback(null);
        const placeholders = productIds.map(() => '?').join(',');
        const sql = `DELETE FROM cart_items WHERE userId = ? AND productId IN (${placeholders})`;
        db.query(sql, [userId, ...productIds], callback);
    },
    clear(userId, callback) {
        db.query('DELETE FROM cart_items WHERE userId = ?', [userId], callback);
    }
};

module.exports = CartItems;