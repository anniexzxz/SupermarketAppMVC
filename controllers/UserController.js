// ...existing code...
const User = require('../models/User');

const UserController = {
    // List all users (renders viewUser.ejs)
    list(req, res) {
        const currentUser = req.session.user || null;
        const selectedId = req.query.selected;
        const messages = req.flash ? req.flash('success') : [];
        const errors = req.flash ? req.flash('error') : [];

        const renderPage = (status, data = {}) => {
            const { users = [], selectedUser = null, error = null } = data;
            res.status(status).render('viewUser', {
                user: currentUser,
                users,
                selectedUser,
                error,
                messages,
                errors
            });
        };

        User.getAll((err, users) => {
            if (err) return renderPage(500, { error: 'Failed to load users.' });

            if (selectedId) {
                return User.getById(selectedId, (detailErr, selectedUser) => {
                    if (detailErr) return renderPage(500, { users, error: 'Failed to load selected user.' });
                    if (!selectedUser) return renderPage(404, { users, error: 'Selected user not found.' });
                    return renderPage(200, { users, selectedUser });
                });
            }

            renderPage(200, { users });
        });
    },

    // Show a single user by ID (renders viewUser.ejs with selection)
    show(req, res) {
        const userid = req.params.id;
        const currentUser = req.session.user || null;
        const isAdmin = currentUser && currentUser.role === 'admin';
        const messages = req.flash ? req.flash('success') : [];
        const errors = req.flash ? req.flash('error') : [];

        if (!isAdmin && (!currentUser || String(currentUser.userid) !== String(userid))) {
            if (req.flash) req.flash('error', 'Access denied');
            return res.redirect('/shopping');
        }

        const renderPage = (status, users, selectedUser, error = null) => {
            res.status(status).render('viewUser', {
                user: currentUser,
                users,
                selectedUser,
                error,
                messages,
                errors
            });
        };

        User.getById(userid, (err, selectedUser) => {
            if (err) return renderPage(500, [], null, 'Failed to load user.');
            if (!selectedUser) return renderPage(404, [], null, 'User not found.');

            if (isAdmin) {
                return User.getAll((listErr, users) => {
                    if (listErr) return renderPage(500, [], selectedUser, 'Failed to load users.');
                    return renderPage(200, users, selectedUser);
                });
            }

            return renderPage(200, [], selectedUser);
        });
    },

    // Add a user (handles form POST; redirects to users list on success)
    create(req, res) {
        const user = {
            username: req.body.username,
            email: req.body.email,
            address: req.body.address || '',
            contact: req.body.contact || '',
            role: req.body.role || 'user',
            password: req.body.password && req.body.password.trim() ? req.body.password : null
        };

        User.create(user, (err, result) => {
            if (err) {
                if (req.flash) req.flash('error', 'Failed to add user.');
                return res.redirect('/users');
            }
            if (req.flash) req.flash('success', 'User created.');
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
            if (err) {
                if (req.flash) req.flash('error', 'Failed to update user.');
                return res.redirect(`/users?selected=${userid}`);
            }
            if (req.flash) req.flash('success', 'User updated.');
            res.redirect(`/users?selected=${userid}`);
        });
    },

    // Delete a user by ID (redirects back to users list)
    delete(req, res) {
        const userid = req.params.id;
        User.delete(userid, (err, result) => {
            if (err) {
                if (req.flash) req.flash('error', 'Failed to delete user.');
                return res.redirect('/users');
            }
            if (req.flash) req.flash('success', 'User deleted.');
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
