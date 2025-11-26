const db = require('../db');

const CartItems = {
    getByUserId(userid, callback) {
        db.query('SELECT * FROM cart_items WHERE userid = ?', [userid], callback);
    },
    add(userid, productid, callback) {
        db.query('INSERT INTO cart_items (userid, productid) VALUES (?, ?)', [userid, productid], callback);
    },
    remove(userid, productid, callback) {
        db.query('DELETE FROM cart_items WHERE userid = ? AND productid = ?', [userid, productid], callback);
    },
    removeBulk(userid, productid, callback) {
        if (!productid || !productid.length) return callback(null);
        const placeholders = productid.map(() => '?').join(',');
        const sql = `DELETE FROM cart_items WHERE userid = ? AND productid IN (${placeholders})`;
        db.query(sql, [userid, ...productid], callback);
    },
    clear(userid, callback) {
        db.query('DELETE FROM cart_items WHERE userid = ?', [userid], callback);
    }
};

module.exports = CartItems;