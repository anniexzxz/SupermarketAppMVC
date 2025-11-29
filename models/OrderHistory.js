const db = require('../db');

// Function-based OrderHistory model (MySQL)
// Assumes order_history table with fields: orderHistory_id, userId, productId, quantity, price, order_date
// Linked to users.userid and products.productid via userId and productId
const OrderHistory = {
    // Get all order history records with optional user/product details
    getAll(callback) {
        const sql = `
            SELECT oh.orderHistory_id, oh.userId, oh.productId, oh.quantity, oh.price, oh.order_date,
                   NULL AS review, NULL AS rating,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM order_history oh
            LEFT JOIN users u ON oh.userId = u.userid
            LEFT JOIN products p ON oh.productId = p.productid
            ORDER BY oh.order_date DESC, oh.orderHistory_id DESC
        `;
        db.query(sql, callback);
    },

    // Get a single order history record by its ID
    getById(orderHistoryId, callback) {
        const sql = `
            SELECT oh.orderHistory_id, oh.userId, oh.productId, oh.quantity, oh.price, oh.order_date,
                   NULL AS review, NULL AS rating,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM order_history oh
            LEFT JOIN users u ON oh.userId = u.userid
            LEFT JOIN products p ON oh.productId = p.productid
            WHERE oh.orderHistory_id = ?
            LIMIT 1
        `;
        db.query(sql, [orderHistoryId], (err, rows) => callback(err, rows && rows[0] ? rows[0] : null));
    },

    // Add a new order history record
    add(orderData, callback) {
        const { userId, productId, quantity, price, order_date } = orderData;
        const sql = `
            INSERT INTO order_history (userId, productId, quantity, price, order_date)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [userId, productId, quantity, price, order_date || new Date()];
        db.query(sql, params, callback);
    },

    // Update an existing order history record by ID
    update(orderHistoryId, orderData, callback) {
        const { userId, productId, quantity, price, order_date } = orderData;
        const sql = `
            UPDATE order_history
            SET userId = ?, productId = ?, quantity = ?, price = ?, order_date = ?
            WHERE orderHistory_id = ?
        `;
        const params = [userId, productId, quantity, price, order_date || new Date(), orderHistoryId];
        db.query(sql, params, callback);
    },

    // Delete an order history record by ID
    delete(orderHistoryId, callback) {
        const sql = 'DELETE FROM order_history WHERE orderHistory_id = ?';
        db.query(sql, [orderHistoryId], callback);
    },

    // Get orders for a specific user
    getByUser(userId, callback) {
        const sql = `
            SELECT oh.orderHistory_id, oh.userId, oh.productId, oh.quantity, oh.price, oh.order_date,
                   NULL AS review, NULL AS rating,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM order_history oh
            LEFT JOIN users u ON oh.userId = u.userid
            LEFT JOIN products p ON oh.productId = p.productid
            WHERE oh.userId = ?
            ORDER BY oh.order_date DESC, oh.orderHistory_id DESC
        `;
        db.query(sql, [userId], callback);
    },

    // Add or update review text for an order history entry
    addReview(orderHistoryId, review, callback) {
        const sql = 'UPDATE order_history SET review = ? WHERE orderHistory_id = ?';
        db.query(sql, [review, orderHistoryId], callback);
    },

    // Add or update rating for an order history entry
    addRating(orderHistoryId, rating, callback) {
        const sql = 'UPDATE order_history SET rating = ? WHERE orderHistory_id = ?';
        db.query(sql, [rating, orderHistoryId], callback);
    }
};

module.exports = OrderHistory;
