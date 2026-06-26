const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');

dotenv.config();

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Make user data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========== ROUTES ==========

// Home Page
app.get('/', async (req, res) => {
    try {
        const [packages] = await db.query('SELECT * FROM packages ORDER BY created_at DESC LIMIT 3');
        res.render('index', { packages });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.render('index', { packages: [] });
    }
});

// ✅ ABOUT PAGE - ADD THIS ROUTE
app.get('/about', (req, res) => {
    res.render('about');
});

// ===== AUTH ROUTES =====
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        const user = users[0];
        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
});

app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { name, email, password, confirm_password } = req.body;
    if (password !== confirm_password) {
        return res.render('register', { error: 'Passwords do not match' });
    }
    try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        res.redirect('/login');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('register', { error: 'Email already registered' });
        }
        console.error('Registration error:', error);
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ===== DASHBOARD =====
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const [bookings] = await db.query(
            `SELECT b.*, p.title, p.destination, p.price 
             FROM bookings b 
             JOIN packages p ON b.package_id = p.id 
             WHERE b.user_id = ? 
             ORDER BY b.created_at DESC`,
            [req.session.user.id]
        );
        res.render('dashboard', { bookings });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', { bookings: [] });
    }
});

// ===== PACKAGE ROUTES =====
app.get('/packages', async (req, res) => {
    const { search, destination, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM packages WHERE 1=1';
    const params = [];
    
    if (search) {
        query += ' AND (title LIKE ? OR destination LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    if (destination) {
        query += ' AND destination = ?';
        params.push(destination);
    }
    if (minPrice) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }
    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }
    query += ' ORDER BY created_at DESC';
    
    try {
        const [packages] = await db.query(query, params);
        const [destinations] = await db.query('SELECT DISTINCT destination FROM packages');
        res.render('packages', { 
            packages: packages, 
            destinations: destinations, 
            filters: req.query 
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.render('packages', { 
            packages: [], 
            destinations: [], 
            filters: {} 
        });
    }
});

app.get('/packages/:id', async (req, res) => {
    try {
        const [packages] = await db.query('SELECT * FROM packages WHERE id = ?', [req.params.id]);
        if (packages.length === 0) return res.redirect('/packages');
        res.render('package-detail', { package: packages[0] });
    } catch (error) {
        console.error('Error fetching package detail:', error);
        res.redirect('/packages');
    }
});

// ===== BOOKING ROUTES =====
app.get('/book/:packageId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        const [packages] = await db.query('SELECT * FROM packages WHERE id = ?', [req.params.packageId]);
        if (packages.length === 0) return res.redirect('/packages');
        res.render('booking', { 
            package: packages[0], 
            error: null 
        });
    } catch (error) {
        console.error('Error loading booking:', error);
        res.redirect('/packages');
    }
});

app.post('/book', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { package_id, travelers, booking_date, special_requirements } = req.body;
    try {
        const [pkg] = await db.query('SELECT * FROM packages WHERE id = ?', [package_id]);
        if (pkg.length === 0) return res.redirect('/packages');
        const total_price = pkg[0].price * travelers;
        await db.query(
            'INSERT INTO bookings (user_id, package_id, travelers, booking_date, total_price, special_requirements) VALUES (?, ?, ?, ?, ?, ?)',
            [req.session.user.id, package_id, travelers, booking_date, total_price, special_requirements || null]
        );
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Booking error:', error);
        res.redirect('/book/' + package_id);
    }
});

// ===== INQUIRY ROUTES =====
app.get('/contact', (req, res) => {
    res.render('inquiry', { success: null, error: null });
});

app.post('/contact', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { subject, message } = req.body;
    try {
        await db.query(
            'INSERT INTO inquiries (user_id, subject, message) VALUES (?, ?, ?)',
            [req.session.user.id, subject, message]
        );
        res.render('inquiry', { success: 'Your inquiry has been sent successfully!', error: null });
    } catch (error) {
        console.error('Inquiry error:', error);
        res.render('inquiry', { success: null, error: 'Failed to send inquiry. Please try again.' });
    }
});

// ===== FORGOT PASSWORD =====
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { message: null, error: null });
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.render('forgot-password', { 
                message: null, 
                error: 'Email not found' 
            });
        }
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000);
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [token, expiry, email]
        );
        res.render('forgot-password', { 
            message: 'Password reset link has been sent to your email', 
            error: null 
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.render('forgot-password', { 
            message: null, 
            error: 'Something went wrong' 
        });
    }
});

// ===== ADMIN ROUTES =====
app.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    try {
        const [users] = await db.query('SELECT * FROM users');
        const [packages] = await db.query('SELECT * FROM packages');
        const [bookings] = await db.query('SELECT b.*, u.name, p.title FROM bookings b JOIN users u ON b.user_id = u.id JOIN packages p ON b.package_id = p.id');
        const [inquiries] = await db.query('SELECT i.*, u.name FROM inquiries i JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC');
        
        res.render('admin', { 
            users, 
            packages, 
            bookings, 
            inquiries,
            stats: {
                totalUsers: users.length,
                totalPackages: packages.length,
                totalBookings: bookings.length,
                totalInquiries: inquiries.length
            }
        });
    } catch (error) {
        console.error('Admin error:', error);
        res.redirect('/dashboard');
    }
});

app.post('/admin/package', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { title, destination, description, activities, price, duration_days, image_url, available_seats } = req.body;
    try {
        await db.query(
            'INSERT INTO packages (title, destination, description, activities, price, duration_days, image_url, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, destination, description, activities, price, duration_days, image_url, available_seats]
        );
        res.redirect('/admin');
    } catch (error) {
        console.error('Add package error:', error);
        res.redirect('/admin');
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 GlobeTrek Adventures running on http://localhost:${PORT}`);
});