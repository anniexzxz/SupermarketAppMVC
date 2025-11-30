const Category = require('../models/Category');

// Function-based Category controller (Express + EJS)
// Adjust view names/routes to match your app wiring.
const CategoryController = {
    // List all categories (admin only)
    list(req, res) {
        const user = req.session.user || null;
        const role = user ? user.role : null;

        Category.getAll(role, (err, categories) => {
            if (err) {
                return res.status(err.message && err.message.includes('Access denied') ? 403 : 500)
                    .render('category', {
                        categories: [],
                        category: null,
                        error: err.message || 'Failed to load categories.',
                        user,
                        messages: req.flash ? req.flash('success') : [],
                        errors: req.flash ? req.flash('error') : []
                    });
            }

            res.render('category', {
                categories,
                category: null,
                error: null,
                user,
                messages: req.flash ? req.flash('success') : [],
                errors: req.flash ? req.flash('error') : []
            });
        });
    },

    // Show a single category by ID (admin + user)
    show(req, res) {
        const categoryId = req.params.id;
        const user = req.session.user || null;
        const role = user ? user.role : null;

        Category.getById(categoryId, role, (err, category) => {
            if (err) {
                return res.status(err.message && err.message.includes('Access denied') ? 403 : 500)
                    .render('category', {
                        categories: [],
                        category: null,
                        error: err.message || 'Failed to load category.',
                        user,
                        messages: req.flash ? req.flash('success') : [],
                        errors: req.flash ? req.flash('error') : []
                    });
            }
            if (!category) {
                return res.status(404).render('category', {
                    categories: [],
                    category: null,
                    error: 'Category not found.',
                    user,
                    messages: req.flash ? req.flash('success') : [],
                    errors: req.flash ? req.flash('error') : []
                });
            }

            res.render('category', {
                categories: [],
                category,
                error: null,
                user,
                messages: req.flash ? req.flash('success') : [],
                errors: req.flash ? req.flash('error') : []
            });
        });
    },

    // Add a new category (admin only)
    create(req, res) {
        const user = req.session.user || null;
        const role = user ? user.role : null;
        const category = {
            category_name: req.body.category_name || req.body.name,
            description: req.body.description || ''
        };

        Category.add(category, role, (err) => {
            if (err) {
                if (req.flash) req.flash('error', err.message || 'Failed to add category.');
                return res.redirect('/categories');
            }
            if (req.flash) req.flash('success', 'Category added.');
            return res.redirect('/categories');
        });
    },

    // Update an existing category (admin only)
    update(req, res) {
        const categoryId = req.params.id;
        const user = req.session.user || null;
        const role = user ? user.role : null;
        const category = {
            category_name: req.body.category_name || req.body.name,
            description: req.body.description || ''
        };

        Category.update(categoryId, category, role, (err) => {
            if (err) {
                if (req.flash) req.flash('error', err.message || 'Failed to update category.');
                return res.redirect('/categories');
            }
            if (req.flash) req.flash('success', 'Category updated.');
            return res.redirect('/categories');
        });
    },

    // Delete a category (admin only; will fail if products reference it)
    delete(req, res) {
        const categoryId = req.params.id;
        const user = req.session.user || null;
        const role = user ? user.role : null;

        Category.delete(categoryId, role, (err) => {
            if (err) {
                if (req.flash) req.flash('error', err.message || 'Failed to delete category.');
                return res.redirect('/categories');
            }
            if (req.flash) req.flash('success', 'Category deleted.');
            return res.redirect('/categories');
        });
    }
};

module.exports = CategoryController;
