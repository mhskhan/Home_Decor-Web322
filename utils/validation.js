// Validation for registration form
function validateRegistrationForm(firstName, lastName, email, password) {
    const errors = [];

    // Check for empty fields
    if (!firstName) errors.push("First name is required.");
    if (!lastName) errors.push("Last name is required.");
    if (!email) errors.push("Email is required.");
    if (!password) errors.push("Password is required.");

    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push("Please enter a valid email address.");
    }

    // Password validation using regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
    if (password && !passwordRegex.test(password)) {
        errors.push("Password must be 8-12 characters long and include at least one lowercase letter, one uppercase letter, one number, and one symbol.");
    }

    return errors;
}

// Validation for login form
function validateLoginForm(email, password) {
    const errors = [];

    // Check for empty fields
    if (!email) errors.push("Email is required.");
    if (!password) errors.push("Password is required.");

    return errors;
}

module.exports = { validateRegistrationForm, validateLoginForm };