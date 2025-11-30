const ContactUs = require('../models/ContactUs');

// Function-based ContactUs controller (Express + EJS)
const ContactUsController = {
    // List all messages
    list(req, res) {
        ContactUs.getAll((err, messages) => {
            if (err) return res.status(500).render('contactUs', { messages: [], message: null, error: 'Failed to load messages.', user: req.session.user || null });
            res.render('contactUs', { messages, message: null, error: null, user: req.session.user || null });
        });
    },

    // Show a single message
    show(req, res) {
        const id = req.params.id;
        ContactUs.getById(id, (err, message) => {
            if (err) return res.status(500).render('contactUs', { messages: [], message: null, error: 'Failed to load message.', user: req.session.user || null });
            if (!message) return res.status(404).render('contactUs', { messages: [], message: null, error: 'Message not found.', user: req.session.user || null });
            res.render('contactUs', { messages: [], message, error: null, user: req.session.user || null });
        });
    },

    // Add a new message
    create(req, res) {
        const payload = {
            name: req.body.name,
            email: req.body.email,
            message_text: req.body.message_text,
            status: 'Pending'
        };
        ContactUs.add(payload, (err) => {
            if (err) return res.status(500).render('contactUs', { messages: [], message: null, error: 'Failed to submit message.', user: req.session.user || null });
            res.redirect('/contact');
        });
    },

    // Update a message
    update(req, res) {
        const id = req.params.id;
        // Allow status-only updates from admin table; fall back to existing values if needed
        const payload = {
            status: req.body.status,
            name: req.body.name,
            email: req.body.email,
            message_text: req.body.message_text
        };

        ContactUs.update(id, payload, (err) => {
            if (err) {
                const friendly = err.code === 'ER_BAD_FIELD_ERROR'
                    ? 'Status column missing in contact_us. Please add it: ALTER TABLE contact_us ADD status VARCHAR(20) DEFAULT "Pending";'
                    : 'Failed to update message.';
                return res.status(500).render('contactUs', { messages: [], message: null, error: friendly, user: req.session.user || null });
            }
            res.redirect('/contact');
        });
    },

    // Delete a message
    delete(req, res) {
        const id = req.params.id;
        ContactUs.delete(id, (err) => {
            if (err) return res.status(500).render('contactUs', { messages: [], message: null, error: 'Failed to delete message.', user: req.session.user || null });
            res.redirect('/contact');
        });
    }
};

module.exports = ContactUsController;
