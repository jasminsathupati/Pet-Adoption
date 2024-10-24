const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

// Initialize app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // to handle form submissions
app.use(express.static('public')); // for static files (e.g., CSS, images, JS)

// MongoDB URI
const mongoURI = 'mongodb://localhost:27017/Pawfinds';

// Create MongoDB connection
mongoose.connect(mongoURI);
const db = mongoose.connection;
db.on('error', () => console.log("Error in connecting to the database"));
db.once('open', () => console.log("Connected to Database"));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Hashed password will be stored
});

// Order Schema
const orderSchema = new mongoose.Schema({
    petType: { type: String, required: true },
    petBreed: { type: String, required: true },
    cost: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    orderDate: { type: Date, required: true }, // To store the date when the order was placed
});

// Define User and Order models
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// User signup
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save a new user with the hashed password
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        console.log("User registered successfully");
        res.redirect('/index');
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send("Error registering user: " + err.message);
    }
});

// User signin
app.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("Attempting to log in with username:", username);

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            console.log("User not found:", username);
            return res.status(401).send("Invalid login credentials");
        }

        console.log("User found:", user);

        // Compare provided password with hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match status:", isMatch);

        if (isMatch) {
            console.log("Login successful");
            res.redirect('/index');
        } else {
            console.log("Password incorrect for user:", username);
            res.status(401).send("Invalid login credentials");
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Error logging in: " + err.message);
    }
});

// Handle order form submission
app.post('/order', async (req, res) => {
    const { petType, petBreed, cost, customerName, customerEmail, orderDate } = req.body;

    try {
        // Create a new order
        const date = new Date(orderDate)
        const newOrder = new Order({
            petType,
            petBreed,
            cost,
            customerName,
            customerEmail,
            orderDate: date
        });

        // Save the order to the database
        await newOrder.save()
        console.log('Order placed successfully:');

        res.status(200).send("Order placed successfully!");
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("Error placing order: " + err.message);
    }
});

// Route to index page after login
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Set up server port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
