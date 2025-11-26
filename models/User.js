// ...existing code...
const db = require('../db');

const User = {
    // Get all users (without passwords)
    getAll(callback) {
        const sql = 'SELECT id, username, email, address, contact, role FROM users';
        db.query(sql, (err, results) => callback(err, results));
    },

    // Get a single user by ID (without password)
    getById(id, callback) {
        const sql = 'SELECT id, username, email, address, contact, role FROM users WHERE id = ?';
        db.query(sql, [id], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0] || null);
        });
    },

    // Create a new user — user: { username, email, password, address, contact, role }
    create(user, callback) {
        const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, ?, ?, ?, ?)';
        const params = [user.username, user.email, user.password, user.address || '', user.contact || '', user.role || 'user'];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Update an existing user by ID — user: { username, email, password, address, contact, role }
    update(id, user, callback) {
        const sql = 'UPDATE users SET username = ?, email = ?, password = ?, address = ?, contact = ?, role = ? WHERE id = ?';
        const params = [user.username, user.email, user.password, user.address || '', user.contact || '', user.role || 'user', id];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Delete a user by ID
    delete(id, callback) {
        const sql = 'DELETE FROM users WHERE id = ?';
        db.query(sql, [id], (err, result) => callback(err, result));
    },

    // Get products associated with a given user_id (uses products.user_id FK)
    getProductsByUser(userId, callback) {
        const sql = 'SELECT id, productName, quantity, price, image FROM products WHERE user_id = ?';
        db.query(sql, [userId], (err, results) => callback(err, results));
    },

    // Return user info and their products (if any)
    getUserWithProducts(userId, callback) {
        const sql = `
            SELECT u.id AS userId, u.username, u.email, u.address, u.contact, u.role,
                   p.id AS productId, p.productName, p.quantity, p.price, p.image
            FROM users u
            LEFT JOIN products p ON p.user_id = u.id
            WHERE u.id = ?
        `;
        db.query(sql, [userId], (err, rows) => {
            if (err) return callback(err);
            if (!rows || rows.length === 0) return callback(null, null);

            const user = {
                id: rows[0].userId,
                username: rows[0].username,
                email: rows[0].email,
                address: rows[0].address,
                contact: rows[0].contact,
                role: rows[0].role,
                products: []
            };

            rows.forEach(r => {
                if (r.productId) {
                    user.products.push({
                        id: r.productId,
                        productName: r.productName,
                        quantity: r.quantity,
                        price: r.price,
                        image: r.image
                    });
                }
            });

            callback(null, user);
        });
    },

    // Check whether a user can add/edit a product.
    // According to your rules: only users with role = 'admin' can add/edit; 'user' role can only view.
    canModifyProducts(userId, callback) {
        const sql = 'SELECT role FROM users WHERE id = ?';
        db.query(sql, [userId], (err, results) => {
            if (err) return callback(err);
            const row = results[0];
            if (!row) return callback(null, false);
            const canModify = row.role === 'admin';
            callback(null, canModify);
        });
    },

    // Optional helper: check if a user can view a specific product (admins and users can view;
    // additional ownership logic could be added if needed)
    canViewProduct(userId, productId, callback) {
        // By default both 'admin' and 'user' roles can view products by id.
        const sql = 'SELECT role FROM users WHERE id = ?';
        db.query(sql, [userId], (err, results) => {
            if (err) return callback(err);
            if (!results[0]) return callback(null, false);
            // both roles allowed to view; return true if user exists
            callback(null, true);
        });
    }
};

module.exports = User;
// ...existing code...