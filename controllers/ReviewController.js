const Review = require('../models/Review');

// Function-based Review controller (Express + EJS)
// Renders EJS views; adjust view names/routes to match your app wiring.
const ReviewController = {
    // List all reviews
    list(req, res) {
        const currentUser = req.session.user;
        const isAdmin = currentUser && currentUser.role === 'admin';
        const loader = isAdmin ? Review.getAll.bind(Review) : Review.getByUser.bind(Review, currentUser.userid);

        loader((err, reviews) => {
            if (err) {
                return res.status(500).render('review', {
                    reviews: [],
                    error: 'Failed to load reviews.',
                    user: currentUser,
                    messages: req.flash('success'),
                    errors: req.flash('error')
                });
            }
            res.render('review', {
                reviews,
                error: null,
                user: currentUser,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    },

    // Show a single review by ID
    show(req, res) {
        const id = req.params.id;
        Review.getById(id, (err, review) => {
            if (err) {
                return res.status(500).render('reviewDetail', { review: null, error: 'Failed to load review.', user: req.session.user });
            }
            if (!review) {
                return res.status(404).render('reviewDetail', { review: null, error: 'Review not found.', user: req.session.user });
            }
            res.render('reviewDetail', { review, error: null, user: req.session.user });
        });
    },

    // Add a new review
    create(req, res) {
        const reviewData = {
            user_id: req.body.user_id,
            product_id: req.body.product_id,
            rating: req.body.rating,
            review_text: req.body.review_text,
            review_date: req.body.review_date
        };

        Review.add(reviewData, (err) => {
            if (err) {
                req.flash('error', 'Failed to add review.');
            } else {
                req.flash('success', 'Review added.');
            }
            return res.redirect('/reviews');
        });
    },

    // Update an existing review
    update(req, res) {
        const id = req.params.id;
        const reviewData = {
            user_id: req.body.user_id,
            product_id: req.body.product_id,
            rating: req.body.rating,
            review_text: req.body.review_text,
            review_date: req.body.review_date
        };

        Review.update(id, reviewData, (err) => {
            if (err) {
                req.flash('error', 'Failed to update review.');
            } else {
                req.flash('success', 'Review updated.');
            }
            return res.redirect('/reviews');
        });
    },

    // Delete a review
    delete(req, res) {
        const id = req.params.id;
        Review.delete(id, (err) => {
            if (err) {
                req.flash('error', 'Failed to delete review.');
            } else {
                req.flash('success', 'Review deleted.');
            }
            return res.redirect('/reviews');
        });
    }
};

module.exports = ReviewController;
