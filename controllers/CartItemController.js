const CartItems = require('../models/CartItem');
const Product = require('../models/Product');

const CartItemController = {
    // List all cart items for the logged-in user
    list(req, res) {
        const userId = req.session.user.userId;
        CartItems.getByUserId(userId, (err, cartItems) => {
            if (err) return res.status(500).send('Error retrieving cart');
            res.render('cart', { cartItems, user: req.session.user });
        });
    },

    // Add a product to the cart
    add(req, res) {
        const userId = req.session.user.userId;
        const productId = parseInt(req.body.productId, 10);
        Product.getByIds([productId], (err, products) => {
            if (err || !products.length || products[0].paid) {
                req.flash('error', 'Cannot add paid or invalid product');
                return res.redirect('/products');
            }
            CartItems.add(userId, productId, (err) => {
                if (err) req.flash('error', 'Could not add to cart');
                else req.flash('success', 'Product added to cart');
                res.redirect('/products');
            });
        });
    },

    // Remove a product from the cart
    remove(req, res) {
        const userId = req.session.user.userId;
        const productId = parseInt(req.body.productId, 10);
        CartItems.remove(userId, productId, (err) => {
            if (req.headers['content-type'] === 'application/json') {
                // AJAX/fetch request, return JSON
                if (err) return res.status(500).json({ success: false, message: 'Could not remove from cart' });
                return res.json({ success: true, productId });
            } else {
                // Form POST, redirect
                if (err) req.flash('error', 'Could not remove from cart');
                else req.flash('success', 'Product removed from cart');
                res.redirect('/products');
            }
        });
    },

    // Clear all products from the cart
    clear(req, res) {
        const userId = req.session.user.userId;
        CartItems.clear(userId, (err) => {
            if (req.headers['content-type'] === 'application/json') {
                // AJAX/fetch request, return JSON
                if (err) return res.status(500).json({ success: false, message: 'Could not clear cart' });
                return res.json({ success: true });
            } else {
                // Form POST, redirect
                if (err) req.flash('error', 'Could not clear cart');
                else req.flash('success', 'Cart cleared');
                res.redirect('/products');
            }
        });
    },

    // Checkout: build invoice from session cart, clear cart and redirect to /invoice
    checkout(req, res) {
        const cart = req.session.cart || [];
        if (!cart.length) {
            req.flash('error', 'Cart is empty');
            return res.redirect('/cart');
        }

        // Build invoice items from session cart
        const products = cart.map(item => ({
            productId: item.productId,
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
    }
};

module.exports = CartItemController;