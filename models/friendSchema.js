const mongoose = require('mongoose')
const { Schema } = mongoose

const friendSchema = new Schema({
  members: {
    type: Array
  }
},{timestamps: true})

mongoose.model('friend', friendSchema)//conversations = uses in database