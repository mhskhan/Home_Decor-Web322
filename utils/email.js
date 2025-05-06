const Mailgun = require("mailgun.js");
const formData = require("form-data");

// Function to send a welcome email
async function sendSimpleMessage(firstName, lastName, email) {
    const mailgun = new Mailgun(formData); // Use 'formData' instead of 'FormData'
    const mg = mailgun.client({
        username: "api",
        key: process.env.API_KEY, // Use environment variable for the API key
    });

    try {
        const data = await mg.messages.create("sandbox11f5c9a668ac48699c61feb79a71ac83.mailgun.org", {
            from: "Hunter_Decor <postmaster@sandbox11f5c9a668ac48699c61feb79a71ac83.mailgun.org>",
            to: `${firstName} ${lastName} <${email}>`, // Use template literals for dynamic values
            subject: `Welcome to Home_Decor, ${firstName}!`, // Personalized subject
            text: `Welcome to Home_Decor, ${firstName} ${lastName}!

We're excited to have you on board. Let's hunt for decorating the our beautiful world Home. 

Best Wishes From
Home_Decor - Hasin`,
        });

        console.log("Email sent successfully:", data); // Log success message
    } catch (error) {
        console.error("Error sending email:", error); // Log error message
    }
}



async function sendOrderConfirmation(user, items, subtotal, tax, grandTotal) {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
        username: "api",
        key: process.env.API_KEY,
    });

    // Create email content
    let emailText = `Thank you for your order, ${user.firstName}!\n\n`;
    emailText += "Here are your order details:\n\n";

    items.forEach(item => {
        const price = item.product.salePrice || item.product.price;
        const total = price * item.quantity;
        emailText += `${item.product.title} x ${item.quantity} - $${total.toFixed(2)}\n`;
    });

    emailText += "\n";
    emailText += `Subtotal: $${subtotal.toFixed(2)}\n`;
    emailText += `Tax (10%): $${tax.toFixed(2)}\n`;
    emailText += `Grand Total: $${grandTotal.toFixed(2)}\n\n`;
    emailText += "Thank you for shopping with HunterDecor!\n";

    try {
        await mg.messages.create("sandbox11f5c9a668ac48699c61feb79a71ac83.mailgun.org", {
            from: "Hunter_Decor <postmaster@sandbox11f5c9a668ac48699c61feb79a71ac83.mailgun.org>",
            to: `${user.firstName} ${user.lastName} <${user.email}>`,
            subject: `Your HunterDecor Order Confirmation`,
            text: emailText
        });
    } catch (error) {
        console.error("Error sending order confirmation:", error);
        throw error;
    }
}

// Update exports
module.exports = { 
    sendSimpleMessage, 
    sendOrderConfirmation 
};

