// ...existing code...
const Product = require('../models/Product');

const ProductController = {
    // Get all products (renders inventory.ejs)
    list(req, res) {
        Product.getAll((err, products) => {
            if (err) return res.status(500).render('inventory', { products: [], error: 'Failed to load products.', user: req.session.user });
            res.render('inventory', { products, error: null, user: req.session.user });
        });
    },

    // Show a single product by ID (renders product.ejs)
    show(req, res) {
        const id = req.params.id;
        Product.getById(id, (err, product) => {
            if (err) return res.status(500).render('product', { product: null, error: 'Failed to load product.', user: req.session.user });
            if (!product) return res.status(404).render('product', { product: null, error: 'Product not found.', user: req.session.user });
            res.render('product', { product, error: null, user: req.session.user });
        });
    },

    // Render edit form for a product (GET /editProduct/:id) - admin only
    edit(req, res) {
        const id = req.params.id;
        Product.getById(id, (err, product) => {
            if (err) return res.status(500).render('editProduct', { product: null, error: 'Failed to load product.', user: req.session.user });
            if (!product) return res.status(404).render('editProduct', { product: null, error: 'Product not found.', user: req.session.user });
            res.render('editProduct', { product, error: null, user: req.session.user });
        });
    },

    // Add a product (handles form POST; redirects to inventory on success)
    create(req, res) {
        const product = {
            productName: req.body.productName,
            quantity: parseInt(req.body.quantity, 10) || 0,
            price: parseFloat(req.body.price) || 0,
            image: req.file ? req.file.filename : (req.body.image || ''),
            user_id: req.session.user ? req.session.user.id : null
        };

        Product.create(product, (err, result) => {
            if (err) {
                return res.status(500).render('addProduct', { product, error: 'Failed to add product.', user: req.session.user });
            }
            res.redirect('/inventory');
        });
    },

    // Update a product by ID (POST /editProduct/:id) - admin only
    update(req, res) {
        const id = req.params.id;
        const product = {
            productName: req.body.productName,
            quantity: parseInt(req.body.quantity, 10) || 0,
            price: parseFloat(req.body.price) || 0,
            image: req.file ? req.file.filename : (req.body.image || '')
        };

        // Support both model method names: update or edit
        const updater = (typeof Product.update === 'function') ? Product.update : Product.edit;

        updater.call(Product, id, product, (err, result) => {
            if (err) {
                return res.status(500).render('updateProduct', { product: Object.assign({ id }, product), error: 'Failed to update product.', user: req.session.user });
            }
            res.redirect('/inventory');
        });
    },

    // Delete a product by ID (redirects back to inventory)
    delete(req, res) {
        const id = req.params.id;
        Product.delete(id, (err, result) => {
            if (err) {
                return res.status(500).render('inventory', { products: [], error: 'Failed to delete product.', user: req.session.user });
            }
            res.redirect('/inventory');
        });
    }
};

module.exports = ProductController;
// ...existing code...