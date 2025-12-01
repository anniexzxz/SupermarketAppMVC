// ...existing code...
const Product = require('../models/Product');
const Category = require('../models/Category');

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
        const productid = req.params.id;
        Product.getById(productid, (err, product) => {
            if (err) return res.status(500).render('product', { product: null, error: 'Failed to load product.', user: req.session.user });
            if (!product) return res.status(404).render('product', { product: null, error: 'Product not found.', user: req.session.user });
            res.render('product', { product, error: null, user: req.session.user });
        });
    },

    // Render edit form for a product (GET /editProduct/:id) - admin only
    edit(req, res) {
        const productid = req.params.id;
        const role = req.session.user ? req.session.user.role : null;

        Product.getById(productid, (err, product) => {
            if (err) return res.status(500).render('editProduct', { product: null, categories: [], error: 'Failed to load product.', user: req.session.user });
            if (!product) return res.status(404).render('editProduct', { product: null, categories: [], error: 'Product not found.', user: req.session.user });

            Category.getAll(role, (catErr, categories) => {
                if (catErr) {
                    return res.status(500).render('editProduct', { product, categories: [], error: 'Failed to load categories.', user: req.session.user });
                }
                res.render('editProduct', { product, categories, error: null, user: req.session.user });
            });
        });
    },

    // Add a product (handles form POST; redirects to inventory on success)
    create(req, res) {
        // Support both legacy form field names and the current ones
        const productName = req.body.productName || req.body.name || '';
        const quantity = parseInt(req.body.quantity, 10);
        const price = parseFloat(req.body.price);
        const image = req.file ? req.file.filename : (req.body.image || req.body.currentImage || '');
        const categoryId = req.body.category_id ? parseInt(req.body.category_id, 10) : null;

        const product = {
            productName,
            quantity: Number.isNaN(quantity) ? 0 : quantity,
            price: Number.isNaN(price) ? 0 : price,
            image,
            category_id: Number.isNaN(categoryId) ? null : categoryId,
            user_id: req.session.user ? req.session.user.userid : null
        };

        Product.create(product, (err, result) => {
            if (err) {
                console.error('Product create failed:', err);
                const role = req.session.user ? req.session.user.role : null;
                return Category.getAll(role, (catErr, categories) => {
                    return res.status(500).render('addProduct', {
                        product,
                        categories: catErr ? [] : categories,
                        error: 'Failed to add product.',
                        user: req.session.user
                    });
                });
            }
            res.redirect('/inventory');
        });
    },

    // Update a product by ID (POST /editProduct/:id) - admin only
    update(req, res) {
        const productid = req.params.id;
        const productName = req.body.productName || req.body.name || '';
        const quantity = parseInt(req.body.quantity, 10);
        const price = parseFloat(req.body.price);
        const currentImage = req.body.currentImage || '';
        const uploadedImage = req.file ? req.file.filename : (req.body.image || '').trim();
        const categoryId = req.body.category_id ? parseInt(req.body.category_id, 10) : null;
        const product = {
            productName,
            quantity: Number.isNaN(quantity) ? 0 : quantity,
            price: Number.isNaN(price) ? 0 : price,
            image: uploadedImage || currentImage,
            category_id: Number.isNaN(categoryId) ? null : categoryId
        };

        const proceedUpdate = finalProduct => {
            // Support both model method names: update or edit
            const updater = (typeof Product.update === 'function') ? Product.update : Product.edit;

            updater.call(Product, productid, finalProduct, (err, result) => {
                if (err) {
                    return res.status(500).render('updateProduct', { product: Object.assign({ productid }, finalProduct), error: 'Failed to update product.', user: req.session.user });
                }
                res.redirect('/inventory');
            });
        };

        // If no image provided anywhere, fall back to stored image so it isn't cleared
        if (!product.image) {
            return Product.getById(productid, (err, existing) => {
                if (err || !existing) {
                    return res.status(500).render('updateProduct', { product: Object.assign({ productid }, product), error: 'Failed to load product image.', user: req.session.user });
                }
                proceedUpdate(Object.assign({}, product, { image: existing.image }));
            });
        }

        proceedUpdate(product);
    },

    // Delete a product by ID (redirects back to inventory)
    delete(req, res) {
        const productid = req.params.id;
        Product.delete(productid, (err, result) => {
            if (err) {
                return res.status(500).render('inventory', { products: [], error: 'Failed to delete product.', user: req.session.user });
            }
            res.redirect('/inventory');
        });
    }
};

module.exports = ProductController;

