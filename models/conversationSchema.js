const mongoose = require('mongoose')
const { Schema } = mongoose

const conversationSchema = new Schema({
  friendCollectionId: {
    type: String,
    required: true,
  },
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
  }
}, { timestamps: true })

mongoose.model('conversation', conversationSchema)//conversations = uses in database