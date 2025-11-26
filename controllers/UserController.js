// ...existing code...
const User = require('../models/User');

const UserController = {
    // List all users (renders users.ejs)
    list(req, res) {
        User.getAll((err, users) => {
            if (err) return res.status(500).render('users', { users: [], error: 'Failed to load users.' });
            res.render('users', { users, error: null });
        });
    },

    // Show a single user by ID (renders user.ejs)
    show(req, res) {
        const id = req.params.id;
        User.getById(id, (err, user) => {
            if (err) return res.status(500).render('user', { user: null, error: 'Failed to load user.' });
            if (!user) return res.status(404).render('user', { user: null, error: 'User not found.' });
            res.render('user', { user, error: null });
        });
    },

    // Add a user (handles form POST; redirects to users list on success)
    create(req, res) {
        const user = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address || '',
            contact: req.body.contact || '',
            role: req.body.role || 'user'
        };

        User.create(user, (err, result) => {
            if (err) return res.status(500).render('addUser', { user, error: 'Failed to add user.' });
            res.redirect('/users');
        });
    },

    // Update a user by ID (handles form POST; redirects to users list on success)
    update(req, res) {
        const id = req.params.id;
        const user = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address || '',
            contact: req.body.contact || '',
            role: req.body.role || 'user'
        };

        User.update(id, user, (err, result) => {
            if (err) return res.status(500).render('editUser', { user: Object.assign({ id }, user), error: 'Failed to update user.' });
            res.redirect('/users');
        });
    },

    // Delete a user by ID (redirects back to users list)
    delete(req, res) {
        const id = req.params.id;
        User.delete(id, (err, result) => {
            if (err) return res.status(500).render('users', { users: [], error: 'Failed to delete user.' });
            res.redirect('/users');
        });
    }
};

module.exports = UserController;
// ...existing code...