const CartItems = require('../models/CartItem');
const Product = require('../models/Product');
const OrderHistory = require('../models/OrderHistory');

const CartItemController = {
    // List all cart items for the logged-in user
    list(req, res) {
        const currentUser = req.session.user;
        CartItems.listByUser(currentUser.userid, (err, items) => {
            if (err) {
                return res.status(500).render('cart', {
                    cart: [],
                    total: 0,
                    user: currentUser,
                    messages: req.flash('success'),
                    errors: [ 'Failed to load cart.' ]
                });
            }
            const cart = items || [];
            const total = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
            res.render('cart', {
                cart,
                total,
                user: currentUser,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    },

    // Add a product to the cart
    add(req, res) {
        const currentUser = req.session.user;
        const productId = parseInt(req.body.productId || req.params.id, 10);
        const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

        Product.getById(productId, (err, product) => {
            if (err || !product) {
                req.flash('error', 'Product not found');
                return res.redirect('/cart');
            }

            CartItems.getByUserAndProduct(currentUser.userid, productId, (findErr, existing) => {
                const currentQty = existing ? Number(existing.quantity) : 0;
                const desiredQty = currentQty + quantity;

                if (desiredQty > Number(product.quantity)) {
                    req.flash('error', `Only ${product.quantity} in stock for ${product.productName}`);
                    return res.redirect('/cart');
                }

                const done = (dbErr) => {
                    if (dbErr) {
                        console.error(dbErr);
                        req.flash('error', 'Could not add to cart');
                    } else {
                        req.flash('success', 'Product added to cart');
                    }
                    return res.redirect('/cart');
                };

                if (existing) {
                    return CartItems.updateQuantity(currentUser.userid, productId, desiredQty, done);
                }
                return CartItems.add(currentUser.userid, productId, desiredQty, done);
            });
        });
    },

    // Remove a product from the cart
    remove(req, res) {
        const currentUser = req.session.user;
        const productId = parseInt(req.body.productId, 10);
        CartItems.remove(currentUser.userid, productId, (err) => {
            if (err) {
                req.flash('error', 'Failed to remove item');
            } else {
                req.flash('success', 'Product removed from cart');
            }
            return res.redirect('/cart');
        });
    },

    // Update quantity for a product in the cart
    update(req, res) {
        const currentUser = req.session.user;
        const productId = parseInt(req.body.productId, 10);
        const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

        Product.getById(productId, (err, product) => {
            if (err || !product) {
                req.flash('error', 'Product not found');
                return res.redirect('/cart');
            }

            if (quantity > Number(product.quantity)) {
                req.flash('error', `Only ${product.quantity} in stock for ${product.productName}`);
                return res.redirect('/cart');
            }

            CartItems.updateQuantity(currentUser.userid, productId, quantity, (updateErr) => {
                if (updateErr) {
                    req.flash('error', 'Failed to update cart');
                } else {
                    req.flash('success', 'Cart updated');
                }
                return res.redirect('/cart');
            });
        });
    },

    // Clear all products from the cart
    clear(req, res) {
        const currentUser = req.session.user;
        CartItems.clear(currentUser.userid, (err) => {
            if (err) {
                req.flash('error', 'Failed to clear cart');
            } else {
                req.flash('success', 'Cart cleared');
            }
            return res.redirect('/cart');
        });
    },

    // Checkout: build invoice from session cart, clear cart and redirect to /invoice
    checkout(req, res) {
        const currentUser = req.session.user;

        if (!currentUser) {
            req.flash('error', 'You must be logged in to checkout.');
            return res.redirect('/login');
        }

        CartItems.listByUser(currentUser.userid, (loadErr, items) => {
            if (loadErr) {
                req.flash('error', 'Unable to load cart for checkout.');
                return res.redirect('/cart');
            }

            const cart = items || [];
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

                // Persist order history entries
                runSeries(cart, (item, cb) => {
                    const orderData = {
                        userId: currentUser.userid,
                        productId: item.productId,
                        quantity: Number(item.quantity) || 1,
                        price: (Number(item.price) || 0) * (Number(item.quantity) || 1),
                        order_date: new Date()
                    };
                    OrderHistory.add(orderData, cb);
                }, (orderErr) => {
                    if (orderErr) {
                        req.flash('error', 'Checkout succeeded but failed to record order history. Please contact support.');
                        return res.redirect('/cart');
                    }

                    // Build invoice items from session cart
                    const products = cart.map(item => ({
                        productid: item.productId,
                        productName: item.productName,
                        image: item.image,
                        quantity: Number(item.quantity) || 1,
                        amount: (Number(item.price) || 0) * (Number(item.quantity) || 1)
                    }));

                    const total = products.reduce((sum, p) => sum + (p.amount || 0), 0);

                    // store invoice in session so GET /invoice can render it
                    req.session.invoice = { products, total, createdAt: new Date() };

                    // clear cart in DB
                    CartItems.clear(currentUser.userid, () => {});

                    // redirect to invoice page
                    return res.redirect('/invoice');
                });
            });
        });
        });
    }
};

module.exports = CartItemController;
