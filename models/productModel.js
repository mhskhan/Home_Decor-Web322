const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    salePrice: {
        type: Number,
        min: 0.01
    },
    shippingWeight: {
        type: Number,
        required: true,
        min: 1
    },
    shippingWidth: {
        type: Number,
        required: true,
        min: 1
    },
    shippingLength: {
        type: Number,
        required: true,
        min: 1
    },
    shippingHeight: {
        type: Number,
        required: true,
        min: 1
    },
    imageUrl: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        required: true,
        default: false
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;