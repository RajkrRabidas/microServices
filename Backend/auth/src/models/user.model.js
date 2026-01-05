const mongoose = require('mongoose');

const addressesSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
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