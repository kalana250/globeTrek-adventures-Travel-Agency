const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

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

// ========== MOCK DATA (No Database) ==========
// Sample packages data
const packages = [
    {
        id: 1,
        title: 'Sri Lanka Heritage Tour',
        destination: 'Kandy, Sri Lanka',
        description: 'Explore the cultural triangle of Sri Lanka with ancient temples and scenic beauty.',
        activities: 'Temple visits, Cultural shows, Nature walks, Traditional cuisine',
        price: 299.99,
        duration_days: 5,
        image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=500&fit=crop&crop=center',
        available_seats: 15
    },
    {
        id: 2,
        title: 'Maldives Island Getaway',
        destination: 'Male, Maldives',
        description: 'Luxury island resort experience with crystal clear waters.',
        activities: 'Snorkeling, Diving, Beach activities, Sunset cruises',
        price: 599.99,
        duration_days: 4,
        image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=500&fit=crop&crop=center',
        available_seats: 8
    },
    {
        id: 3,
        title: 'Singapore City Explorer',
        destination: 'Singapore',
        description: 'Modern city adventure with futuristic architecture.',
        activities: 'Gardens by the Bay, Sentosa Island, Shopping, Street food',
        price: 399.99,
        duration_days: 3,
        image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=500&fit=crop&crop=center',
        available_seats: 12
    },
    {
        id: 4,
        title: 'Paris Romantic Getaway',
        destination: 'Paris, France',
        description: 'The city of love awaits! Explore iconic landmarks and charming cafes.',
        activities: 'Eiffel Tower visit, Louvre Museum tour, Seine river cruise, French cuisine',
        price: 699.99,
        duration_days: 5,
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop&crop=center',
        available_seats: 8
    }
];

// Mock users (for demo)
const users = [];

// ========== ROUTES ==========

// Home Page
app.get('/', (req, res) => {
    res.render('index', { packages: packages.slice(0, 3) });
});

// About Page
app.get('/about', (req, res) => {
    res.render('about');
});

// Packages Page
app.get('/packages', (req, res) => {
    const { search, destination, minPrice, maxPrice } = req.query;
    let filteredPackages = packages;
    
    if (search) {
        filteredPackages = filteredPackages.filter(p => 
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.destination.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (destination) {
        filteredPackages = filteredPackages.filter(p => 
            p.destination === destination
        );
    }
    if (minPrice) {
        filteredPackages = filteredPackages.filter(p => 
            p.price >= parseFloat(minPrice)
        );
    }
    if (maxPrice) {
        filteredPackages = filteredPackages.filter(p => 
            p.price <= parseFloat(maxPrice)
        );
    }
    
    const destinations = [...new Set(packages.map(p => p.destination))];
    res.render('packages', { 
        packages: filteredPackages, 
        destinations: destinations, 
        filters: req.query 
    });
});

// Package Detail
app.get('/packages/:id', (req, res) => {
    const pkg = packages.find(p => p.id === parseInt(req.params.id));
    if (!pkg) return res.redirect('/packages');
    res.render('package-detail', { package: pkg });
});

// Login
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Mock login - accepts any email/password
    if (email && password) {
        req.session.user = {
            id: 1,
            name: email.split('@')[0],
            email: email,
            role: 'customer'
        };
        return res.redirect('/dashboard');
    }
    res.render('login', { error: 'Invalid email or password' });
});

// Register
app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { error: null });
});

app.post('/register', (req, res) => {
    const { name, email, password, confirm_password } = req.body;
    if (password !== confirm_password) {
        return res.render('register', { error: 'Passwords do not match' });
    }
    req.session.user = {
        id: users.length + 1,
        name: name,
        email: email,
        role: 'customer'
    };
    res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    // Mock bookings
    const bookings = [];
    res.render('dashboard', { bookings });
});

// Booking
app.get('/book/:packageId', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const pkg = packages.find(p => p.id === parseInt(req.params.packageId));
    if (!pkg) return res.redirect('/packages');
    res.render('booking', { package: pkg, error: null });
});

app.post('/book', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.redirect('/dashboard');
});

// Contact/Inquiry
app.get('/contact', (req, res) => {
    res.render('inquiry', { success: null, error: null });
});

app.post('/contact', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('inquiry', { success: 'Your inquiry has been sent successfully!', error: null });
});

// Forgot Password
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { message: null, error: null });
});

app.post('/forgot-password', (req, res) => {
    res.render('forgot-password', { 
        message: 'Password reset link has been sent to your email', 
        error: null 
    });
});

// Admin
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin', { 
        users: users, 
        packages: packages, 
        bookings: [],
        inquiries: [],
        stats: {
            totalUsers: users.length,
            totalPackages: packages.length,
            totalBookings: 0,
            totalInquiries: 0
        }
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 GlobeTrek Adventures running on http://localhost:${PORT}`);
});