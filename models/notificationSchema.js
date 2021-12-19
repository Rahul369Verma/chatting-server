const mongoose = require('mongoose')
const { Schema } = mongoose

const notificationSchema = new Schema({
  senderEmail: {
    type: String,
    required: true,
  },
  receiverEmail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['notSeen', "seen"]
  },
  type: {
    type: String,
    required: true,
    enum: ['friendRequest', "acceptFriendRequest", "removeFriendRequest"]
  }
}, { timestamps: true })

mongoose.model('notification', notificationSchema)//users = uses in database
