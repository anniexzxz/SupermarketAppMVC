const OrderHistory = require('../models/OrderHistory');
const Review = require('../models/Review');

// helper to upsert a review in the reviews table based on user + product
function upsertReview(userId, productId, payload, callback) {
    Review.getByUserAndProduct(userId, productId, (findErr, existing) => {
        if (findErr) return callback(findErr);

        const safeRating = Number.isFinite(Number(payload.rating)) ? Number(payload.rating) :
            (existing && Number.isFinite(Number(existing.rating)) ? Number(existing.rating) : 0);
        const data = {
            user_id: userId,
            product_id: productId,
            rating: safeRating,
            review_text: payload.review_text !== undefined ? payload.review_text : (existing ? existing.review_text : ''),
            review_date: new Date()
        };

        if (existing) {
            return Review.update(existing.review_id, data, callback);
        }
        return Review.add(data, callback);
    });
}

// Function-based OrderHistory controller (Express + EJS render helpers)
// Each handler delegates to the OrderHistory model and renders simple EJS views or returns JSON fallbacks.
const OrderHistoryController = {
    // List all order history entries
    list(req, res) {
        const currentUser = req.session.user;
        const handler = currentUser ? OrderHistory.getByUser.bind(OrderHistory, currentUser.userid) : OrderHistory.getAll.bind(OrderHistory);
        handler((err, orders) => {
            if (err) {
                return res.status(500).render('orderHistory', { orders: [], error: 'Failed to load order history.', user: currentUser, messages: req.flash('success'), errors: req.flash('error') });
            }
            res.render('orderHistory', { orders, error: null, user: currentUser, messages: req.flash('success'), errors: req.flash('error') });
        });
    },

    // Get a single order history entry by ID
    show(req, res) {
        const id = req.params.id;
        OrderHistory.getById(id, (err, order) => {
            if (err) return res.status(500).render('orderHistoryDetail', { order: null, error: 'Failed to load order.', user: req.session.user });
            if (!order) return res.status(404).render('orderHistoryDetail', { order: null, error: 'Order not found.', user: req.session.user });
            res.render('orderHistoryDetail', { order, error: null, user: req.session.user });
        });
    },

    // Add a new order history entry
    create(req, res) {
        const orderData = {
            userId: req.body.userId,
            productId: req.body.productId,
            quantity: req.body.quantity,
            price: req.body.price,
            order_date: req.body.order_date
        };

        OrderHistory.add(orderData, (err) => {
            if (err) return res.status(500).render('orderHistory', { orders: [], error: 'Failed to add order history.', user: req.session.user });
            res.redirect('/orderHistory');
        });
    },

    // Update an existing order history entry
    update(req, res) {
        const id = req.params.id;
        const orderData = {
            userId: req.body.userId,
            productId: req.body.productId,
            quantity: req.body.quantity,
            price: req.body.price,
            order_date: req.body.order_date
        };

        OrderHistory.update(id, orderData, (err) => {
            if (err) return res.status(500).render('orderHistoryDetail', { order: Object.assign({ orderHistory_id: id }, orderData), error: 'Failed to update order history.', user: req.session.user });
            res.redirect(`/orderHistory/${id}`);
        });
    },

    // Delete an order history entry
    delete(req, res) {
        const id = req.params.id;
        OrderHistory.delete(id, (err) => {
            if (err) return res.status(500).render('orderHistory', { orders: [], error: 'Failed to delete order history.', user: req.session.user });
            res.redirect('/orderHistory');
        });
    },

    // Add or update review text
    review(req, res) {
        const id = req.params.id;
        const reviewText = (req.body.review || '').trim();
        if (!reviewText) {
            req.flash('error', 'Review cannot be empty.');
            return res.redirect('/orderHistory');
        }

        OrderHistory.getById(id, (orderErr, order) => {
            if (orderErr || !order) {
                req.flash('error', 'Order not found.');
                return res.redirect('/orderHistory');
            }

            // ensure non-admin users can only review their own orders
            if (req.session.user && req.session.user.role !== 'admin' && order.userId !== req.session.user.userid) {
                req.flash('error', 'You cannot review this order.');
                return res.redirect('/orderHistory');
            }

            OrderHistory.addReview(id, reviewText, (err) => {
                if (err) {
                    req.flash('error', 'Failed to save review.');
                    return res.redirect('/orderHistory');
                }

                upsertReview(order.userId, order.productId, { review_text: reviewText }, (revErr) => {
                    if (revErr) {
                        console.error(revErr);
                        req.flash('error', 'Review saved on order, but failed to save in review list.');
                    } else {
                        req.flash('success', 'Review submitted.');
                    }
                    return res.redirect('/orderHistory');
                });
            });
        });
    },

    // Add or update rating
    rate(req, res) {
        const id = req.params.id;
        const rating = parseInt(req.body.rating, 10);
        if (!(rating >= 1 && rating <= 5)) {
            req.flash('error', 'Rating must be between 1 and 5.');
            return res.redirect('/orderHistory');
        }

        OrderHistory.getById(id, (orderErr, order) => {
            if (orderErr || !order) {
                req.flash('error', 'Order not found.');
                return res.redirect('/orderHistory');
            }

            // ensure non-admin users can only rate their own orders
            if (req.session.user && req.session.user.role !== 'admin' && order.userId !== req.session.user.userid) {
                req.flash('error', 'You cannot rate this order.');
                return res.redirect('/orderHistory');
            }

            OrderHistory.addRating(id, rating, (err) => {
                if (err) {
                    req.flash('error', 'Failed to save rating.');
                    return res.redirect('/orderHistory');
                }

                upsertReview(order.userId, order.productId, { rating }, (revErr) => {
                    if (revErr) {
                        console.error(revErr);
                        req.flash('error', 'Rating saved on order, but failed to save in review list.');
                    } else {
                        req.flash('success', 'Rating submitted.');
                    }
                    return res.redirect('/orderHistory');
                });
            });
        });
    }
};

module.exports = OrderHistoryController;
