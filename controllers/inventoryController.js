const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const fs = require("fs");
const path = require("path");
// const multer = require("multer");
const cloudinary = require("../config/cloudinary");
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
const { upload } = require("../server");


// Helper function to delete image file
const deleteImageFile = (imageUrl) => {
    if (imageUrl && imageUrl.startsWith("/images/")) {
        const imagePath = path.join(__dirname, "../public", imageUrl);
        if (fs.existsSync(imagePath)) {
            }
    }
};

// Inventory page
router.get("/", async (req, res) => {
    try {
        const [featuredProducts, allProducts] = await Promise.all([
            Product.find({ featured: true }),
            Product.find()
        ]);

        const productsByCategory = {};
        
        allProducts.forEach(product => {
            if (!product.featured) { // Only include non-featured products in categories
                if (!productsByCategory[product.category]) {
                    productsByCategory[product.category] = [];
                }
                productsByCategory[product.category].push(product);
            }
        });

        res.render("inventory", {
            title: "Inventory",
            productsByCategory: Object.keys(productsByCategory).map(category => ({
                category,
                products: productsByCategory[category]
            })),
            featuredProducts, // Pass featured products separately
            error: req.query.error || null
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).render("error", { 
            title: "Server Error",
            message: "Error fetching products" 
        });
    }
});

// Product list for data clerks
router.get("/list", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const products = await Product.find().sort({ title: 1 });
        res.render("inventory/list", {
            title: "Product List",
            products,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).render("error", { 
            title: "Server Error",
            message: "Error fetching products" 
        });
    }
});

// Add product - GET
router.get("/add", (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }
    res.render("inventory/add", { 
        title: "Add Product",
        error: req.query.error || null,
        formData: {
            title: "",
            description: "",
            category: "",
            price: "",
            salePrice: "",
            shippingWeight: "",
            shippingWidth: "",
            shippingLength: "",
            shippingHeight: "",
            imageUrl: "",
            featured: false
        }
    });
});

// Add product - POST
router.post("/add", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        // Validate image upload
        if (!req.files || !req.files.productImage) {
            return res.render("inventory/add", {
                title: "Add Product",
                error: "Product image is required",
                formData: req.body
            });
        }

        const productImage = req.files.productImage;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (!allowedTypes.includes(productImage.mimetype)) {
            return res.render("inventory/add", {
                title: "Add Product",
                error: "Only JPEG, PNG, or GIF images are allowed",
                formData: req.body
            });
        }

        // Generate unique filename
        const uniqueName = `product-${Date.now()}${path.extname(productImage.name)}`;
        const uploadPath = path.join(__dirname, "../public/images", uniqueName);

        // Move the uploaded file
        await productImage.mv(uploadPath);

        // Create product with imageUrl
        const newProduct = new Product({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            price: parseFloat(req.body.price),
            salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
            shippingWeight: parseInt(req.body.shippingWeight),
            shippingWidth: parseInt(req.body.shippingWidth),
            shippingLength: parseInt(req.body.shippingLength),
            shippingHeight: parseInt(req.body.shippingHeight),
            imageUrl: `/images/${uniqueName}`,  // This is the critical line
            featured: req.body.featured === "true"
        });

        await newProduct.save();
        res.redirect("/inventory/list?success=Product added successfully");
    } catch (err) {
        console.error("Error adding product:", err);
        res.render("inventory/add", {
            title: "Add Product",
            error: "Error adding product: " + err.message,
            formData: req.body
        });
    }
});

// Edit product - GET
router.get("/edit/:id", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect("/inventory/list?error=Product not found");
        }
        
        res.render("inventory/edit", {
            title: "Edit Product",
            product,
            error: req.query.error || null
        });
    } catch (err) {
        console.error("Error fetching product:", err);
        res.redirect("/inventory/list?error=Error fetching product");
    }
});



// Edit product - POST
// router.post("/edit/:id", upload.single("productImage"), async (req, res) => {
//     if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
//         return res.status(401).render("401", { title: "Unauthorized" });
//     }

//     try {
//         const productId = req.params.id;
//     const existingProduct = await Product.findById(productId);
//     if (!existingProduct) return res.status(404).send("Product not found");

//     let imageUrl = existingProduct.imageUrl;

//     if (req.file) {
//         const uploadResult = await new Promise((resolve, reject) => {
//             cloudinary.uploader.upload_stream({ resource_type: "image" }, (err, result) => {
//                 if (err) reject(err);
//                 else resolve(result);
//             }).end(req.file.buffer);
//         });
//         imageUrl = uploadResult.secure_url;
//     }
//         // const existingProduct = await Product.findById(productId);
        
//         // if (!existingProduct) {
//         //     return res.redirect("/inventory/list?error=Product not found");
//         // }

//         // let imageUrl = existingProduct.imageUrl;

//         // Handle new image upload if provided
//         if (req.files && req.files.productImage) {
//             const productImage = req.files.productImage;
//             const allowedTypes = ['image/jpeg', 'image/png', 'image/gif','image/jpg'];
            
//             if (!allowedTypes.includes(productImage.mimetype)) {
//                 return res.render("inventory/edit", {
//                     title: "Edit Product",
//                     product: { ...existingProduct.toObject(), ...req.body },
//                     error: "Only JPEG, PNG, or GIF images are allowed"
//                 });
//             }

//             // Delete old image file if it exists
//             if (existingProduct.imageUrl) {
//                 const oldImagePath = path.join(__dirname, '../public', existingProduct.imageUrl);
//                 if (fs.existsSync(oldImagePath)) {
//                     }
//             }

//             // Save new image
//             const uniqueName = `product-${Date.now()}${path.extname(productImage.name)}`;
//             const uploadPath = path.join(__dirname, '../public/images', uniqueName);
//             await productImage.mv(uploadPath);
//             imageUrl = `/images/${uniqueName}`;
//         }

//         // Update product
//         const updatedProduct = {
//             title: req.body.title,
//             description: req.body.description,
//             category: req.body.category,
//             price: parseFloat(req.body.price),
//             salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
//             shippingWeight: parseInt(req.body.shippingWeight),
//             shippingWidth: parseInt(req.body.shippingWidth),
//             shippingLength: parseInt(req.body.shippingLength),
//             shippingHeight: parseInt(req.body.shippingHeight),
//             imageUrl: imageUrl, // Use either the new or existing image URL
//             featured: !!req.body.featured 
//         };

//         await Product.findByIdAndUpdate(productId, updatedProduct);
//         res.redirect("/inventory/list?success=Product updated successfully");
//     } catch (err) {
//         console.error("Error updating product:", err);
//         res.render("inventory/edit", {
//             title: "Edit Product",
//             product: { ...existingProduct.toObject(), ...req.body },
//             error: "Error updating product: " + err.message
//         });
//     }
// });

router.post("/edit/:id", upload.single("productImage"), async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
      return res.status(401).render("401", { title: "Unauthorized" });
    }
  
    try {
      const productId = req.params.id;
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) return res.status(404).send("Product not found");
  
      let imageUrl = req.body.existingImageUrl || existingProduct.imageUrl;
  
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: "image" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }).end(req.file.buffer);
        });
        imageUrl = uploadResult.secure_url;
      }
  
      Object.assign(existingProduct, {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        price: parseFloat(req.body.price),
        salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : undefined,
        shippingWeight: parseInt(req.body.shippingWeight),
        shippingWidth: parseInt(req.body.shippingWidth),
        shippingLength: parseInt(req.body.shippingLength),
        shippingHeight: parseInt(req.body.shippingHeight),
        featured: req.body.featured ? true : false,
        imageUrl,
      });
  
      await existingProduct.save();
      res.redirect("/inventory/list");
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).render("error", {
        title: "Something broke!",
        message: "An error occurred while updating the product.",
      });
    }
  });
  
  

// Remove product - GET (confirmation)
router.get("/remove/:id", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect("/inventory/list?error=Product not found");
        }
        res.render("inventory/remove", {
            title: "Remove Product",
            product,
            error: req.query.error || null
        });
    } catch (err) {
        console.error("Error fetching product:", err);
        res.redirect("/inventory/list?error=Error fetching product");
    }
});

// Remove product - POST
router.post("/remove/:id", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "dataEntryClerk") {
        return res.status(401).render("401", { title: "Unauthorized" });
    }

    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.redirect("/inventory/list?error=Product not found");
        }
        
        // Delete the associated image file
        deleteImageFile(product.imageUrl);
        
        res.redirect("/inventory/list?success=Product deleted successfully");
    } catch (err) {
        console.error("Error deleting product:", err);
        res.redirect("/inventory/list?error=Error deleting product");
    }
});

module.exports = router;