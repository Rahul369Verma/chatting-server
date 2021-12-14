const mongoose = require('mongoose')
const { Schema } = mongoose

const messageSchema = new Schema({
  conversationId: {
    type: String,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["send","delivered", "seen"]
  }
}, { timestamps: true })

mongoose.model('message', messageSchema)//messages = uses in database