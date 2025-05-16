   

const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    role: { 
        type: String, 
        enum: ["customer", "dataEntryClerk"], 
        default: "customer" 
    }
});


// Method to compare passwords during login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcryptjs.compare(candidatePassword, this.password);
    } catch (err) {
        console.error("Error comparing passwords:", err);
        throw err;
    }
};

// Synchronous method to compare passwords (similar to original code)
userSchema.methods.comparePasswordSync = function(candidatePassword) {
    return bcryptjs.compareSync(candidatePassword, this.password);
};

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;