const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const { getAllProducts } = require("../modules/product-util"); // Make sure path is correct

router.get("/products", async (req, res) => {
    try {
        // Check if user is logged in and is a data clerk
        if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
            return res.status(403).render("load-data", {
                title: "Load Data",
                message: "You are not authorized to add products",
                success: false
            });
        }

        // Check if products already exist
        const productCount = await Product.countDocuments();
        if (productCount > 0) {
            return res.render("load-data", {
                title: "Load Data",
                message: "Products already exist in database. Use update functionality instead.",
                success: false
            });
        }

        // Get products from product-util.js
        const products = getAllProducts();
        
        if (!products || products.length === 0) {
            return res.status(400).render("load-data", {
                title: "Load Data",
                message: "No products found to load",
                success: false
            });
        }

        // Validate each product before insertion
        const validProducts = [];
        const invalidProducts = [];

        for (const product of products) {  // Fixed: Changed from 'product' to 'products'
            try {
                // Create a new Product instance to validate
                const newProduct = new Product({
                    title: product.title,
                    description: product.description,
                    category: product.category,
                    price: product.price,
                    salePrice: product.salePrice || null, // Handle undefined
                    shippingWeight: product.shippingWeight,
                    shippingWidth: product.shippingWidth,
                    shippingLength: product.shippingLength,
                    shippingHeight: product.shippingHeight,
                    imageUrl: product.imageUrl || '/images/default-product.jpg', // Default image
                    featured: product.featured || false // Default to false
                });
                
                await newProduct.validate();
                validProducts.push(newProduct);
            } catch (validationError) {
                invalidProducts.push({
                    product: product.title,
                    error: validationError.message
                });
                console.error(`Invalid product: ${product.title}`, validationError.message);
            }
        }

        // Only proceed if we have valid products
        if (validProducts.length === 0) {
            return res.status(400).render("load-data", {
                title: "Load Data",
                message: "No valid products to insert",
                details: invalidProducts,
                success: false
            });
        }

        // Insert valid products into database
        const result = await Product.insertMany(validProducts, { ordered: false });

        // Prepare response message
        let message = `Successfully added ${result.length} products`;
        if (invalidProducts.length > 0) {
            message += ` (${invalidProducts.length} products failed validation)`;
        }

        res.render("load-data", {
            title: "Load Data",
            message: message,
            success: true,
            insertedCount: result.length,
            invalidProducts: invalidProducts.length > 0 ? invalidProducts : null
        });

    } catch (err) {
        console.error("Error loading products:", err);

        // Handle specific MongoDB errors
        let errorMessage = "Error loading products";
        if (err.name === 'MongoBulkWriteError') {
            errorMessage += `. Inserted ${err.result.result.nInserted} of ${err.result.result.nMatched + err.result.result.nInserted} products`;
        }

        res.status(500).render("load-data", {
            title: "Load Data",
            message: errorMessage,
            errorDetails: process.env.NODE_ENV === 'development' ? err.message : null,
            success: false
        });
    }
});

// Add endpoint to clear products (for testing/development)
router.get("/products/clear", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).send("This action is only allowed in development mode");
    }

    try {
        const result = await Product.deleteMany({});
        res.json({
            message: `Cleared ${result.deletedCount} products`,
            success: true
        });
    } catch (err) {
        console.error("Error clearing products:", err);
        res.status(500).json({
            message: "Error clearing products",
            error: err.message,
            success: false
        });
    }
});

module.exports = router;