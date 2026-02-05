const mongoose = require('mongoose');

const addressesSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false,
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password : {
        type: String,
        select: false,
    },
    fullName : {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        }
    },
    addresses: [addressesSchema],
    phone: {
        type: String,
        required: true
    },
    role : {
        type: String,
        enum: ['user', 'seller',],
        default: 'user',
    }
}, { timestamps: true })

const userModel = mongoose.model('user', userSchema)

module.exports = userModel;