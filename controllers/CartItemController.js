const CartItems = require('../models/CartItem');
const Product = require('../models/Product');

const CartItemController = {
    // List all cart items for the logged-in user
    list(req, res) {
        const cart = req.session.cart || [];
        const total = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
        res.render('cart', {
            cart,
            total,
            user: req.session.user,
            messages: req.flash('success'),
            errors: req.flash('error')
        });
    },

    // Add a product to the cart
    add(req, res) {
        const productId = parseInt(req.body.productId || req.params.id, 10);
        const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

        Product.getById(productId, (err, product) => {
            if (err || !product) {
                req.flash('error', 'Product not found');
                return res.redirect('/cart');
            }

            if (!req.session.cart) req.session.cart = [];
            const existing = req.session.cart.find(item => item.productId === productId);
            const currentQty = existing ? Number(existing.quantity) : 0;
            const desiredQty = currentQty + quantity;

            if (desiredQty > Number(product.quantity)) {
                req.flash('error', `Only ${product.quantity} in stock for ${product.productName}`);
                return res.redirect('/cart');
            }

            if (existing) {
                existing.quantity = desiredQty;
            } else {
                req.session.cart.push({
                    productId: product.productid,
                    productName: product.productName,
                    price: Number(product.price),
                    quantity,
                    image: product.image,
                    availableQuantity: Number(product.quantity)
                });
            }

            req.flash('success', 'Product added to cart');
            return res.redirect('/cart');
        });
    },

    // Remove a product from the cart
    remove(req, res) {
        const productId = parseInt(req.body.productId, 10);
        req.session.cart = (req.session.cart || []).filter(item => item.productId !== productId);
        req.flash('success', 'Product removed from cart');
        return res.redirect('/cart');
    },

    // Update quantity for a product in the cart
    update(req, res) {
        const productId = parseInt(req.body.productId, 10);
        const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

        const cart = req.session.cart || [];
        const item = cart.find(ci => ci.productId === productId);
        if (!item) {
            req.flash('error', 'Item not found in cart');
            return res.redirect('/cart');
        }

        Product.getById(productId, (err, product) => {
            if (err || !product) {
                req.flash('error', 'Product not found');
                return res.redirect('/cart');
            }

            if (quantity > Number(product.quantity)) {
                req.flash('error', `Only ${product.quantity} in stock for ${product.productName}`);
                return res.redirect('/cart');
            }

            item.quantity = quantity;
            item.availableQuantity = Number(product.quantity);
            req.session.cart = cart;
            req.flash('success', 'Cart updated');
            return res.redirect('/cart');
        });
    },

    // Clear all products from the cart
    clear(req, res) {
        req.session.cart = [];
        req.flash('success', 'Cart cleared');
        return res.redirect('/cart');
    },

    // Checkout: build invoice from session cart, clear cart and redirect to /invoice
    checkout(req, res) {
        const cart = req.session.cart || [];
        if (!cart.length) {
            req.flash('error', 'Cart is empty');
            return res.redirect('/cart');
        }

        // helper to run async tasks sequentially
        const runSeries = (items, worker, done) => {
            let index = 0;
            const next = () => {
                if (index >= items.length) return done();
                worker(items[index], (err) => {
                    if (err) return done(err);
                    index += 1;
                    next();
                });
            };
            next();
        };

        // first validate stock availability
        runSeries(cart, (item, cb) => {
            Product.getById(item.productId, (err, product) => {
                if (err || !product) return cb(new Error('Product not found'));
                if (Number(product.quantity) < Number(item.quantity)) {
                    return cb(new Error(`Insufficient stock for ${product.productName}`));
                }
                cb();
            });
        }, (validateErr) => {
            if (validateErr) {
                req.flash('error', validateErr.message);
                return res.redirect('/cart');
            }

            // apply stock deductions
            runSeries(cart, (item, cb) => {
                Product.decreaseQuantity(item.productId, Number(item.quantity), cb);
            }, (updateErr) => {
                if (updateErr) {
                    req.flash('error', 'Could not update stock during checkout. Please try again.');
                    return res.redirect('/cart');
                }

                // Build invoice items from session cart
                const products = cart.map(item => ({
                    productid: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity) || 1,
                    amount: (Number(item.price) || 0) * (Number(item.quantity) || 1)
                }));

                const total = products.reduce((sum, p) => sum + (p.amount || 0), 0);

                // store invoice in session so GET /invoice can render it
                req.session.invoice = { products, total, createdAt: new Date() };

                // clear cart
                req.session.cart = [];

                // redirect to invoice page
                return res.redirect('/invoice');
            });
        });
    }
};

module.exports = CartItemController;
