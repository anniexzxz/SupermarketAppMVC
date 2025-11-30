const db = require('../db');

const isAdmin = (role) => role === 'admin';
const isViewer = (role) => role === 'admin' || role === 'user';

const Category = {
    getAll(role, callback) {
        if (!isViewer(role)) return callback(new Error('Access denied.'));

        const sql = `
            SELECT c.category_id, c.category_name, c.description, c.category_image,
                   COUNT(p.productid) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.category_id
            GROUP BY c.category_id, c.category_name, c.description, c.category_image
            ORDER BY c.category_name
        `;

        db.query(sql, (err, results) => callback(err, results));
    },

    getById(categoryId, role, callback) {
        if (!isViewer(role)) return callback(new Error('Access denied.'));

        const sql = `
            SELECT c.category_id, c.category_name, c.description, c.category_image,
                   COUNT(p.productid) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.category_id
            WHERE c.category_id = ?
            GROUP BY c.category_id, c.category_name, c.description, c.category_image
        `;

        db.query(sql, [categoryId], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows[0] || null);
        });
    },

    add(category, role, callback) {
        if (!isAdmin(role)) return callback(new Error('Access denied: admin only.'));

        const sql = 'INSERT INTO categories (category_name, description, category_image) VALUES (?, ?, ?)';
        const params = [category.category_name, category.description || null, category.category_image || null];

        db.query(sql, params, (err, result) => callback(err, result));
    },

    update(categoryId, category, role, callback) {
        if (!isAdmin(role)) return callback(new Error('Access denied: admin only.'));

        const sql = 'UPDATE categories SET category_name = ?, description = ?, category_image = ? WHERE category_id = ?';
        const params = [category.category_name, category.description || null, category.category_image || null, categoryId];

        db.query(sql, params, (err, result) => callback(err, result));
    },

    delete(categoryId, role, callback) {
        if (!isAdmin(role)) return callback(new Error('Access denied: admin only.'));

        const sql = `
            DELETE FROM categories
            WHERE category_id = ?
              AND NOT EXISTS (SELECT 1 FROM products WHERE category_id = ?)
        `;

        db.query(sql, [categoryId, categoryId], (err, result) => {
            if (err) return callback(err);
            if (result.affectedRows === 0) {
                return callback(new Error('Category has related products or does not exist.'));
            }
            callback(null, result);
        });
    }
};

module.exports = Category;
