const mongoose = require('mongoose')
const { Schema } = mongoose

const friendSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  allFriends: {
    type: Array,
    default: []
  }
},{timestamps: true})

mongoose.model('friend', friendSchema)//conversations = uses in database