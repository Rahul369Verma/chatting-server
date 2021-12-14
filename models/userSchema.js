const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minLength: [3, "name is too short"],
        maxLength: 15
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['normal', 'admin'],
    }
},{timestamps: true})

mongoose.model('user', userSchema)//users = uses in database
