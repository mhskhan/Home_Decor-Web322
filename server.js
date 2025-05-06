// /*************************************************************************************
// * WEB322 - 2251 Project
// * I declare that this assignment is my own work in accordance with the Seneca Academic
// * Policy. No part of this assignment has been copied manually or electronically from
// * any other source (including web sites) or distributed to other students.
// *
// * Student Name  : Md Hasin Shadab Khan
// * Student Email : mhskhan@myseneca.ca
// * Course/Section: WEB322
// *
// **************************************************************************************/
const path = require("path");
const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const Mailgun = require("mailgun.js"); // Correct import
const formData = require("form-data"); // Required for Mailgun
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const loadDataController = require("./controllers/loadDataController");

// Load environment variables
dotenv.config({ path: "./.env" });

// Set up EJS and layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(expressLayouts);
app.set("layout", "layouts/main"); // Default layout

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Add middleware
app.use(fileUpload());


// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Set up session
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
// }));

const MongoStore = require("connect-mongo");

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 1 // 1 hour
    }
}));



// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    // Convert checkbox values
    if (req.body && typeof req.body.featured === 'undefined') {
        req.body.featured = false;
    }
    next();
});


// Middleware to make session data available in EJS templates
app.use((req, res, next) => {
    console.log("Session:", req.session); // Debugging: Log the session object
    res.locals.user = req.session.user; // Set to null if undefined
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));



// Use controllers
const generalController = require("./controllers/generalController");
const inventoryController = require("./controllers/inventoryController");



app.use("/", generalController);
app.use("/inventory", inventoryController);
app.use("/load-data", loadDataController);

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
});



// *** DO NOT MODIFY THE LINES BELOW ***

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}
  
// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine
// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(HTTP_PORT, onHttpStart); // Start the server after MongoDB connection is established
    })
    .catch(err => {
        console.log("Can't connect to the MongoDB: " + err);
    });