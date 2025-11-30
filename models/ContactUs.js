const db = require('../db');

const ContactUs = {
    // Get all contact messages (ordered by latest first)
    getAll(callback) {
        const sql = 'SELECT message_id, name, email, message_text, submitted_at, status FROM contact_us ORDER BY submitted_at DESC';
        db.query(sql, (err, results) => {
            if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                // Fallback if status column is absent
                return db.query(
                    'SELECT message_id, name, email, message_text, submitted_at FROM contact_us ORDER BY submitted_at DESC',
                    (err2, results2) => callback(err2, results2)
                );
            }
            callback(err, results);
        });
    },

    // Get a single contact message by ID
    getById(messageId, callback) {
        const sql = 'SELECT message_id, name, email, message_text, submitted_at, status FROM contact_us WHERE message_id = ?';
        db.query(sql, [messageId], (err, results) => {
            if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                return db.query(
                    'SELECT message_id, name, email, message_text, submitted_at FROM contact_us WHERE message_id = ?',
                    [messageId],
                    (err2, results2) => callback(err2, results2 ? results2[0] || null : null)
                );
            }
            if (err) return callback(err);
            callback(null, results[0] || null);
        });
    },

    // Add a new contact message
    add(message, callback) {
        const sql = 'INSERT INTO contact_us (name, email, message_text, submitted_at, status) VALUES (?, ?, ?, NOW(), ?)';
        const params = [message.name, message.email, message.message_text, message.status || 'Pending'];
        db.query(sql, params, (err, result) => {
            if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                // Fallback insert without status column
                return db.query(
                    'INSERT INTO contact_us (name, email, message_text, submitted_at) VALUES (?, ?, ?, NOW())',
                    [message.name, message.email, message.message_text],
                    (err2, result2) => callback(err2, result2)
                );
            }
            callback(err, result);
        });
    },

    // Update an existing contact message by ID (supports status-only updates)
    update(messageId, message, callback) {
        const fields = [];
        const params = [];

        if (typeof message.name !== 'undefined') {
            fields.push('name = ?');
            params.push(message.name);
        }
        if (typeof message.email !== 'undefined') {
            fields.push('email = ?');
            params.push(message.email);
        }
        if (typeof message.message_text !== 'undefined') {
            fields.push('message_text = ?');
            params.push(message.message_text);
        }
        if (typeof message.status !== 'undefined') {
            fields.push('status = ?');
            params.push(message.status);
        }

        // If nothing to update, just return
        if (fields.length === 0) return callback(null, { affectedRows: 0 });

        const sql = `UPDATE contact_us SET ${fields.join(', ')} WHERE message_id = ?`;
        params.push(messageId);

        db.query(sql, params, (err, result) => {
            callback(err, result);
        });
    },

    // Delete a contact message by ID
    delete(messageId, callback) {
        const sql = 'DELETE FROM contact_us WHERE message_id = ?';
        db.query(sql, [messageId], (err, result) => callback(err, result));
    }
};

module.exports = ContactUs;
