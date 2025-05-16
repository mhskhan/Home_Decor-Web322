       const products = [
        {
            title: "Modern Chair",
            description: "A sleek and modern chair for your living room.",
            category: "Living Room Furniture",
            price: 89.99,
            salePrice: 79.99,
            shippingWeight: 10,
            shippingWidth: 50,
            shippingLength: 50,
            shippingHeight: 80,
            imageUrl: "/images/modernchair.jpg",
            featured: true
        },
        {
            title: "Kitchen Set",
            description: "A complete kitchen set for your home and living room.",
            category: "Kitchen Furniture",
            price: 199.99,
            salePrice: 179.99,
            shippingWeight: 25,
            shippingWidth: 100,
            shippingLength: 100,
            shippingHeight: 100,
            imageUrl: "/images/kitchenset.jpg",
            featured: true
        },
        {
            title: "Decorative Lamp",
            description: "A stylish lamp for your bedroom.",
            category: "Living Room Furniture",
            price: 39.99,
            salePrice: 29.99,
            shippingWeight: 5,
            shippingWidth: 20,
            shippingLength: 20,
            shippingHeight: 40,
            imageUrl: "/images/lamp.jpg",
            featured: false
        },
        {
            title: "Cozy Sofa",
            description: "A comfortable sofa for your living room.",
            category: "Living Room Furniture",
            price: 299.99,
            salePrice: 249.99,
            shippingWeight: 30,
            shippingWidth: 120,
            shippingLength: 80,
            shippingHeight: 90,
            imageUrl: "/images/cozysofa.jpg",
            featured: false
        },
        {
            title: "Dining Table",
            description: "A sturdy dining table for your kitchen.",
            category: "Kitchen Furniture",
            price: 149.99,
            salePrice: 129.99,
            shippingWeight: 20,
            shippingWidth: 150,
            shippingLength: 90,
            shippingHeight: 75,
            imageUrl: "/images/DiningTable.jpg",
            featured: false
        },
        {
            title: "Recliner Chair",
            description: "A luxurious recliner chair for your living room.",
            category: "Living Room Furniture",
            price: 199.99,
            salePrice: 179.99,
            shippingWeight: 25,
            shippingWidth: 90,
            shippingLength: 90,
            shippingHeight: 100,
            imageUrl: "/images/rChair.jpg",
            featured: true
        }
    ];

function getAllProducts() {
    return products;
}

function getFeaturedProducts() {
    return products.filter(product => product.featured);
}

function getProductsByCategory() {
    const categories = {};
    products.forEach(product => {
        if (!categories[product.category]) {
            categories[product.category] = [];
        }
        categories[product.category].push(product);
    });
    return Object.keys(categories).map(category => ({
        category,
        products: categories[category]
    }));
}

module.exports = {
    getAllProducts,
    getFeaturedProducts,
    getProductsByCategory
};