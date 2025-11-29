const db = require('../db');

// Function-based Review model (MySQL)
// Assumes reviews table: review_id, user_id, product_id, rating, review_text, review_date
// Linked via user_id -> users.userid and product_id -> products.productid
const Review = {
    // Get all reviews with optional user/product details
    getAll(callback) {
        const sql = `
            SELECT r.review_id, r.user_id, r.product_id, r.rating, r.review_text, r.review_date,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.userid
            LEFT JOIN products p ON r.product_id = p.productid
            ORDER BY r.review_date DESC, r.review_id DESC
        `;
        db.query(sql, callback);
    },

    // Get a single review by ID
    getById(reviewId, callback) {
        const sql = `
            SELECT r.review_id, r.user_id, r.product_id, r.rating, r.review_text, r.review_date,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.userid
            LEFT JOIN products p ON r.product_id = p.productid
            WHERE r.review_id = ?
            LIMIT 1
        `;
        db.query(sql, [reviewId], (err, rows) => callback(err, rows && rows[0] ? rows[0] : null));
    },

    // Get a single review by user + product (for upsert)
    getByUserAndProduct(userId, productId, callback) {
        const sql = `
            SELECT r.review_id, r.user_id, r.product_id, r.rating, r.review_text, r.review_date,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.userid
            LEFT JOIN products p ON r.product_id = p.productid
            WHERE r.user_id = ? AND r.product_id = ?
            LIMIT 1
        `;
        db.query(sql, [userId, productId], (err, rows) => callback(err, rows && rows[0] ? rows[0] : null));
    },

    // Get all reviews for a specific user
    getByUser(userId, callback) {
        const sql = `
            SELECT r.review_id, r.user_id, r.product_id, r.rating, r.review_text, r.review_date,
                   u.username AS userName, u.email AS userEmail,
                   p.productName, p.price AS productPrice, p.image AS productImage
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.userid
            LEFT JOIN products p ON r.product_id = p.productid
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC, r.review_id DESC
        `;
        db.query(sql, [userId], callback);
    },

    // Add a new review
    add(review, callback) {
        const { user_id, product_id, rating, review_text, review_date } = review;
        const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
        const sql = `
            INSERT INTO reviews (user_id, product_id, rating, review_text, review_date)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [user_id, product_id, safeRating, review_text || '', review_date || new Date()];
        db.query(sql, params, callback);
    },

    // Update an existing review
    update(reviewId, review, callback) {
        const { user_id, product_id, rating, review_text, review_date } = review;
        const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
        const sql = `
            UPDATE reviews
            SET user_id = ?, product_id = ?, rating = ?, review_text = ?, review_date = ?
            WHERE review_id = ?
        `;
        const params = [user_id, product_id, safeRating, review_text || '', review_date || new Date(), reviewId];
        db.query(sql, params, callback);
    },

    // Delete a review by ID
    delete(reviewId, callback) {
        const sql = 'DELETE FROM reviews WHERE review_id = ?';
        db.query(sql, [reviewId], callback);
    }
};

module.exports = Review;
