const mongoose = require('mongoose')
const { Schema } = mongoose

const conversationSchema = new Schema({
  newMessage: {
    type: Boolean,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true
  },
  lastMessage: {
    type: String,
    required: true
  },
  members: {
    type: Array,
    default: []
  }
}, { timestamps: true })

mongoose.model('conversation', conversationSchema)//conversations = uses in database