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
        const userid = req.params.id;
        User.getById(userid, (err, user) => {
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
        const userid = req.params.id;
        const user = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address || '',
            contact: req.body.contact || '',
            role: req.body.role || 'user'
        };

        User.update(userid, user, (err, result) => {
            if (err) return res.status(500).render('editUser', { user: Object.assign({ id: userid }, user), error: 'Failed to update user.' });
            res.redirect('/users');
        });
    },

    // Delete a user by ID (redirects back to users list)
    delete(req, res) {
        const userid = req.params.id;
        User.delete(userid, (err, result) => {
            if (err) return res.status(500).render('users', { users: [], error: 'Failed to delete user.' });
            res.redirect('/users');
        });
    },

    // Render forgot password form
    renderForgetPassword(req, res) {
        res.render('forgetPassword', { user: req.session.user || null, messages: req.flash('success'), errors: req.flash('error') });
    },

    // Handle password reset
    resetPassword(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'Email and new password are required.');
            return res.redirect('/forgetPassword');
        }

        if (password.length < 6) {
            req.flash('error', 'Password should be at least 6 characters long.');
            return res.redirect('/forgetPassword');
        }

        User.updatePasswordByEmail(email, password, (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Failed to reset password. Please try again.');
                return res.redirect('/forgetPassword');
            }

            if (!result || result.affectedRows === 0) {
                req.flash('error', 'No account found with that email.');
                return res.redirect('/forgetPassword');
            }

            req.flash('success', 'Password has been reset successfully.');
            return res.redirect('/login');
        });
    }
};

module.exports = UserController;
// ...existing code...