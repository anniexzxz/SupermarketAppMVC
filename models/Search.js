const db = require('../db');

const Search = {
    /**
     * Search products by keyword (matches productName or description).
     * @param {string} keyword
     * @param {(err: Error|null, results: any[]) => void} callback
     */
    search(keyword, callback) {
        const term = `%${keyword}%`;
        const sql = `
            SELECT productid, productName, quantity, price, image, category_id
            FROM products
            WHERE productName LIKE ?
        `;
        db.query(sql, [term], (err, results) => {
            if (err) return callback(err);
            callback(null, results || []);
        });
    }
};

module.exports = Search;
