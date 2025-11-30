const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');

const app = express();

// controllers (try both lowercase plural path requested and the actual filenames)
let ProductController;
let UserController;
let CartItemController;
let OrderHistoryController;
let ReviewController;
let CategoryController;
try {
    ProductController = require('./controllers/productControllers');
} catch (e) {
    ProductController = require('./controllers/ProductController');
}
try {
    UserController = require('./controllers/userControllers');
} catch (e) {
    UserController = require('./controllers/UserController');
}
try {
    CartItemController = require('./controllers/CartItemControllers');
} catch (e) {
    CartItemController = require('./controllers/CartItemController');
}
try {
    OrderHistoryController = require('./controllers/orderHistoryControllers');
} catch (e) {
    OrderHistoryController = require('./controllers/OrderHistoryController');
}
try {
    ReviewController = require('./controllers/reviewControllers');
} catch (e) {
    ReviewController = require('./controllers/ReviewController');
}
try {
    CategoryController = require('./controllers/categoryControllers');
} catch (e) {
    CategoryController = require('./controllers/CategoryController');
}

// If a controller wasn't found above this will throw early so errors are obvious
if (!ProductController) throw new Error('ProductController not found');
if (!UserController) throw new Error('UserController not found');
if (!CartItemController) throw new Error('CartItemController not found');
if (!OrderHistoryController) throw new Error('OrderHistoryController not found');
if (!ReviewController) throw new Error('ReviewController not found');
if (!CategoryController) throw new Error('CategoryController not found');

const db = require('./db'); // used for authentication (no direct connection code here)
const CartItemsController = require('./controllers/CartItemController');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'images')); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({ extended: false }));

// Session & flash
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));
app.use(flash());

// Middleware to check if user is logged in
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error', 'Please log in to view this resource');
    res.redirect('/login');
};

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    req.flash('error', 'Access denied');
    res.redirect('/shopping');
};

// Middleware for form validation
const validateRegistration = (req, res, next) => {
    const { username, email, password, address, contact, role } = req.body;
    if (!username || !email || !password || !address || !contact || !role) {
        return res.status(400).send('All fields are required.');
    }
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Routes using controllers

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

// Inventory (admin) - list all products
app.get('/inventory', checkAuthenticated, checkAdmin, (req, res, next) => {
    // delegate to controller
    ProductController.list(req, res, next);
});

// Shopping (user view of products) - reuse model via controller if available, otherwise use model directly
app.get('/shopping', checkAuthenticated, (req, res, next) => {
    // Prefer a controller method that renders shopping; fallback to model if not implemented
    if (typeof ProductController.listForShopping === 'function') {
        return ProductController.listForShopping(req, res, next);
    }
    // fallback: get all products and render shopping
    const Product = require('./models/Product');
    Product.getAll((err, products) => {
        if (err) return res.status(500).render('shopping', { user: req.session.user, products: [], error: 'Failed to load products.' });
        res.render('shopping', { user: req.session.user, products, error: null });
    });
});

// Category routes
app.get('/categories', checkAuthenticated, (req, res, next) => {
    CategoryController.list(req, res, next);
});
app.get('/categories/:id', checkAuthenticated, (req, res, next) => {
    CategoryController.show(req, res, next);
});
app.post('/categories', checkAuthenticated, checkAdmin, (req, res, next) => {
    CategoryController.create(req, res, next);
});
app.post('/categories/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    CategoryController.update(req, res, next);
});
app.post('/categories/:id/delete', checkAuthenticated, checkAdmin, (req, res, next) => {
    CategoryController.delete(req, res, next);
});

// View single product (used by both roles)
app.get('/product/:id', checkAuthenticated, (req, res, next) => {
    ProductController.show(req, res, next);
});

// Add product (form)
app.get('/addProduct', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('addProduct', { user: req.session.user });
});

// Add product (POST) - file upload handled then delegated to controller
app.post('/addProduct', checkAuthenticated, checkAdmin, upload.single('image'), (req, res, next) => {
    return ProductController.create(req, res, next);
});

// Update product (edit form)
app.get('/editProduct/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    return ProductController.edit(req, res, next);
});

// Also accept the old /updateProduct/:id URL and forward to the same handler
app.get('/updateProduct/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    return ProductController.edit(req, res, next);
});

// Handle update (POST) for both URLs (multer must match input name 'image')
app.post('/editProduct/:id', checkAuthenticated, checkAdmin, upload.single('image'), (req, res, next) => {
    return ProductController.update(req, res, next);
});
app.post('/updateProduct/:id', checkAuthenticated, checkAdmin, upload.single('image'), (req, res, next) => {
    return ProductController.update(req, res, next);
});

// Delete product
app.get('/deleteProduct/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    ProductController.delete(req, res, next);
});

// Users: list, show, create, update, delete via controller

// List users (admin)
app.get('/users', checkAuthenticated, checkAdmin, (req, res, next) => {
    UserController.list(req, res, next);
});

// Show user
app.get('/user/:id', checkAuthenticated, (req, res, next) => {
    UserController.show(req, res, next);
});

// Registration form
app.get('/register', (req, res) => {
    res.render('register', { user: req.session.user || null, messages: req.flash('error'), formData: req.flash('formData')[0] });
});

// Registration POST - delegate to user controller (handles DB via model)
app.post('/register', validateRegistration, (req, res, next) => {
    UserController.create(req, res, next);
});

// Edit user form (render using model fallback)
app.get('/editUser/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    // Prefer controller 'edit' view rendering if exists
    if (typeof UserController.edit === 'function') {
        return UserController.edit(req, res, next);
    }
    const User = require('./models/User');
    User.getById(req.params.id, (err, user) => {
        if (err) return res.status(500).send('Failed to load user');
        if (!user) return res.status(404).send('User not found');
        res.render('editUser', { user });
    });
});

// Update user (POST)
app.post('/editUser/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    UserController.update(req, res, next);
});

// Delete user
app.get('/deleteUser/:id', checkAuthenticated, checkAdmin, (req, res, next) => {
    UserController.delete(req, res, next);
});

// Login routes (authentication). Uses db.query from ./db (no direct connection creation in this file)
app.get('/login', (req, res) => {
    res.render('login', { user: req.session.user || null, messages: req.flash('success'), errors: req.flash('error') });
});
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }
    // authenticate using db module
    db.query('SELECT * FROM users WHERE email = ? AND password = SHA1(?)', [email, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            req.session.user = results[0];
            req.flash('success', 'Login successful!');
            if (req.session.user.role === 'user') return res.redirect('/shopping');
            return res.redirect('/inventory');
        } else {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }
    });
});

// Forgot password routes
app.get('/forgetPassword', (req, res, next) => {
    if (typeof UserController.renderForgetPassword === 'function') {
        return UserController.renderForgetPassword(req, res, next);
    }
    return res.render('forgetPassword', { user: req.session.user || null, messages: req.flash('success'), errors: req.flash('error') });
});

app.post('/forgetPassword', (req, res, next) => {
    if (typeof UserController.resetPassword === 'function') {
        return UserController.resetPassword(req, res, next);
    }

    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'Email and new password are required.');
        return res.redirect('/forgetPassword');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 characters long.');
        return res.redirect('/forgetPassword');
    }

    db.query('UPDATE users SET password = SHA1(?) WHERE email = ?', [password, email], (err, result) => {
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
});

// Add to cart (uses model to fetch product)
app.post('/add-to-cart/:id', checkAuthenticated, (req, res) => {
    // Reuse cart controller logic so quantities and totals stay consistent
    req.body.productId = req.params.id;
    CartItemController.add(req, res);
});

// Cart routes
app.get('/cart', checkAuthenticated, CartItemController.list);
app.post('/cart/add', checkAuthenticated, CartItemController.add);
app.post('/cart/update', checkAuthenticated, CartItemController.update);
app.post('/cart/remove', checkAuthenticated, CartItemController.remove);
app.post('/cart/clear', checkAuthenticated, CartItemController.clear);
app.post('/cart/checkout', checkAuthenticated, CartItemController.checkout);

// render invoice page (add this near other routes, after CartItemController.checkout route)
app.get('/invoice', checkAuthenticated, (req, res) => {
    const invoice = req.session.invoice;
    if (!invoice || !Array.isArray(invoice.products) || invoice.products.length === 0) {
        req.flash('error', 'No invoice available.');
        return res.redirect('/cart');
    }

    res.render('invoice', {
        user: req.session.user || null,
        products: invoice.products,
        total: invoice.total || 0
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// Order history routes
app.get('/orderHistory', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.list(req, res, next);
});

app.get('/orderHistory/:id', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.show(req, res, next);
});

app.post('/orderHistory', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.create(req, res, next);
});

app.post('/orderHistory/:id', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.update(req, res, next);
});

app.post('/orderHistory/:id/delete', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.delete(req, res, next);
});

app.post('/orderHistory/:id/review', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.review(req, res, next);
});

app.post('/orderHistory/:id/rate', checkAuthenticated, (req, res, next) => {
    OrderHistoryController.rate(req, res, next);
});

// Review routes
app.get('/reviews', checkAuthenticated, (req, res, next) => {
    ReviewController.list(req, res, next);
});

app.get('/reviews/:id', checkAuthenticated, (req, res, next) => {
    ReviewController.show(req, res, next);
});

app.post('/reviews', checkAuthenticated, (req, res, next) => {
    ReviewController.create(req, res, next);
});

app.post('/reviews/:id', checkAuthenticated, (req, res, next) => {
    ReviewController.update(req, res, next);
});

app.post('/reviews/:id/delete', checkAuthenticated, (req, res, next) => {
    ReviewController.delete(req, res, next);
});

// Fallback: start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
