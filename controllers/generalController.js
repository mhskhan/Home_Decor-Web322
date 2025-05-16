

const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const { sendSimpleMessage, sendOrderConfirmation } = require("../utils/email");
const { validateRegistrationForm, validateLoginForm } = require("../utils/validation");
const productUtil = require("../modules/product-util");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");

// In generalController.js, update the home route:
router.get("/", async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true });
        res.render("home", { 
            title: "Home", 
            featuredProducts 
        });
    } catch (err) {
        console.error("Error fetching featured products:", err);
        res.status(500).send("Error loading home page");
    }
});

// Registration routes
router.get("/sign-up", (req, res) => {
    res.render("sign-up", { title: "Sign Up", errors: null, formData: null });
});

router.post("/sign-up", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const errors = validateRegistrationForm(firstName, lastName, email, password);

    if (errors.length > 0) {
        res.render("sign-up", { title: "Sign Up", errors, formData: req.body });
    } else {
        try {
            // Check if email already exists
            const existingUser = await userModel.findOne({ email: email.trim().toLowerCase() });
            if (existingUser) {
                errors.push("Email already exists. Please use a different email.");
                res.render("sign-up", { title: "Sign Up", errors, formData: req.body });
            } else {
                // Hash the password
                const hashedPassword = await bcryptjs.hash(password, 10);

                // Create a new user
                const newUser = new userModel({
                    firstName,
                    lastName,
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                });

                await newUser.save();

                // Send welcome email
                sendSimpleMessage(firstName, lastName, email);

                // Redirect to welcome page
                res.redirect("/welcome");
            }
        } catch (err) {
            console.error("Error during registration:", err);
            res.render("sign-up", { title: "Sign Up", errors: ["An error occurred. Please try again."], formData: req.body });
        }
    }
});

// Login routes
router.get("/log-in", (req, res) => {
    res.render("log-in", { title: "Log In", errors: [], formData: null });
});

router.post("/log-in", async (req, res) => {
    const { email, password, role } = req.body;
    console.log("Login attempt:", { email, password: "*", role });

    const errors = validateLoginForm(email, password);

    if (errors.length > 0) {
        console.log("Validation errors:", errors);
        res.render("log-in", { title: "Log In", errors, formData: req.body });
    } else {
        try {
            // Trim and lowercase the email before querying the database
            const trimmedEmail = email.trim().toLowerCase();
            console.log("Searching for user with email:", trimmedEmail);
            
            const user = await userModel.findOne({ email: trimmedEmail });

            if (user) {
                console.log("User found:", { 
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    passwordLength: user.password ? user.password.length : 0
                });

                // Use the compareSync method similar to the second code
                const checkPassword = await bcryptjs.compareSync(password, user.password);
                console.log("Password comparison result:", checkPassword);

                if (checkPassword) {
                    // Create session with needed user information
                    req.session.user = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        _id: user._id,
                        role: role // Using the role from form submission
                    };

                    console.log(`User signed in as ${role}`);
                    
                    // Redirect based on role
                    if (role === "dataEntryClerk") {
                        console.log("Redirecting to inventory list");
                        return res.redirect("/inventory/list");
                    } else if (role === "customer") {
                        console.log("Redirecting to cart");
                        return res.redirect("/cart");
                    } else {
                        console.log("Invalid role:", role);
                        errors.push("Invalid role selection.");
                        return res.render("log-in", { 
                            title: "Log In", 
                            errors, 
                            formData: req.body 
                        });
                    }
                } else {
                    console.log("Password comparison failed");
                    errors.push("Invalid email or password.");
                    return res.render("log-in", { 
                        title: "Log In", 
                        errors, 
                        formData: req.body 
                    });
                }
            } else {
                console.log("User not found with email:", trimmedEmail);
                errors.push("Invalid email or password.");
                return res.render("log-in", { 
                    title: "Log In", 
                    errors, 
                    formData: req.body 
                });
            }
        } catch (err) {
            console.error("Error during login:", err);
            errors.push("An error occurred. Please try again.");
            return res.render("log-in", { 
                title: "Log In", 
                errors, 
                formData: req.body 
            });
        }
    }
});

// Logout route
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/log-in");
});

// Welcome route
router.get("/welcome", (req, res) => {
    res.render("welcome", { title: "Welcome" });
});

// Shopping cart route



// Add to cart
router.post("/cart/add", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const { productId } = req.body;
        const userId = req.session.user._id;

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({ product: productId, quantity: 1 });
        }

        await cart.save();
        res.redirect("/cart");
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).send("Error adding to cart");
    }
});

// Update cart item quantity
router.post("/cart/update", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const { productId, action } = req.body;
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.redirect("/cart");
        }

        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.redirect("/cart");
        }

        if (action === "increase") {
            item.quantity += 1;
        } else if (action === "decrease") {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart.items = cart.items.filter(i => i.product.toString() !== productId);
            }
        }

        await cart.save();
        res.redirect("/cart");
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).send("Error updating cart");
    }
});

// Remove from cart
router.post("/cart/remove", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const { productId } = req.body;
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.redirect("/cart");
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        res.redirect("/cart");
    } catch (err) {
        console.error("Error removing from cart:", err);
        res.status(500).send("Error removing from cart");
    }
});

// View cart
router.get("/cart", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.render("cart", {
                title: "Cart",
                user: req.session.user,
                cartItems: [],
                subtotal: 0,
                tax: 0,
                grandTotal: 0
            });
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            const price = item.product.salePrice || item.product.price;
            return sum + (price * item.quantity);
        }, 0);

        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;

        res.render("cart", {
            title: "Cart",
            user: req.session.user,
            cartItems: cart.items,
            subtotal,
            tax,
            grandTotal
        });
    } catch (err) {
        console.error("Error loading cart:", err);
        res.status(500).render("error", { 
            title: "Server Error",
            message: "Error loading cart" 
        });
    }
});

// Checkout
router.post("/cart/checkout", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.redirect("/cart");
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            const price = item.product.salePrice || item.product.price;
            return sum + (price * item.quantity);
        }, 0);

        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;

        // Send order confirmation email
        await sendOrderConfirmation(req.session.user, cart.items, subtotal, tax, grandTotal);

        // Clear the cart
        await Cart.findOneAndDelete({ user: userId });

        res.redirect("/cart?success=Order placed successfully");
    } catch (err) {
        console.error("Error during checkout:", err);
        res.status(500).render("error", { 
            title: "Server Error",
            message: "Error during checkout" 
        });
    }
});



module.exports = router;