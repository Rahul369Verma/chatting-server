const mongoose = require('mongoose')
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
require("../models/userSchema")
require("../models/conversationSchema")
require("../models/messageSchema")
require("../models/friendSchema")
require("../models/notificationSchema")


const User = mongoose.model('user')
const Message = mongoose.model('message')
const Conversation = mongoose.model("conversation")
const Friend = mongoose.model('friend')
const Notification = mongoose.model('notification')


export const MessagePost = async (req, res) => {
	let messageBody = {
		conversationId: req.body.conversationId,
		senderEmail: req.body.senderEmail,
		message: req.body.message,
		status: "send"
	}
	if (!req.body.conversationId) {
		await new Conversation({ friendCollectionId: req.body.friendId, newMessage: true, senderEmail: messageBody.senderEmail, lastMessage: messageBody.message })
			.save(async (conversationSaveErr, conversationSaved) => {
				if (conversationSaveErr) {
					return res.status(500).send("conversation error Message not been saved")
				}
				if (conversationSaved) {
					messageBody.conversationId = conversationSaved._id
					await new Message(messageBody).save((messageSaveErr, messageSaved) => {
						if (messageSaveErr) {
							return res.status(500).send("Message not been saved")
						}
						if (messageSaved) {
							return res.status(200).send(messageSaved)
						}
					})
				}
			})
	} else {
		await new Message(messageBody).save((messageSaveErr, messageSaved) => {
			if (messageSaveErr) {
				return res.status(500).send("Message not been saved")
			}
			if (messageSaved) {
				Conversation.updateOne({ _id: messageBody.conversationId }, { $set: { newMessage: true, senderEmail: messageBody.senderEmail, lastMessage: messageBody.message } }, (updateErr, updated) => {
					return res.send(messageSaved)
				})
			}
		})
	}

}

export const MessageGet = (req, res) => {
	Message.find({ conversationId: req.body.conversationId }, (err, messagesFound) => {
		if (err) {
			res.status(500).send("error finding conversation")
		} else if (messagesFound) {
			res.send(messagesFound)
		} else {
			res.send([])
		}
	})
}



// export const ConversationPost = (req, res) => {
// 	Friend.find({ senderEmail: jwtData, receivers: { $in: [req.body.receiverEmail] } }, (err, friendFound) => {
// 		if (err) {
// 			res.status(500).send("error checking friend before set conversation")
// 		} else if (friendFound) {
// 			new Conversation({ senderEmail: req.body.jwtData, receivers: [req.body.receiverEmail] })
// 				.save((conversationSaveErr, conversationSaved) => {
// 					if (conversationSaveErr) {
// 						return res.status(500).send("Message not been saved", conversationSaveErr)
// 					}
// 					if (conversationSaved) {
// 						res.send("conversation saved", conversationSaved)
// 					}
// 				})
// 		} else {
// 			res.status(404).send("You both are not friend")
// 		}
// 	})

// }


export const AllConversationGet = (req, res) => {
	console.log("jwtData", req.jwtData)
	let userEmail = ""
	let conversations = []
	User.findOne({ _id: req.jwtData._id }, (err, data) => {
		if (err) {
			res.status(404).send("user not found")
		} else if (data === null) {
			res.status(404).send("user not found")
		} else {
			userEmail = data.email
			Friend.find({ members: { $in: [userEmail] } }, async (err, friendFound) => {
				if (err) {
					res.status(500).send("error finding friend")
				} else if (friendFound === null) {
					res.send([])
				} else {
					console.log(userEmail)
					console.log("friends Found", friendFound)
					for (let i = 0; i < friendFound.length; i++) {
						const conversationFound = await Conversation.findOne({ friendCollectionId: friendFound[i]._id })
						if (conversationFound === null) {

						} else {
							conversations.push(conversationFound)
						}
					}
					if (conversations !== []) {
						console.log(conversations)
						res.status(200).send(conversations)
					}
				}
			})
		}
	})
}

export const ConversationGetFriendId = (req, res) => {
	console.log("jwtData", req.jwtData)
	Conversation.findOne({ friendCollectionId: req.body.friendId }, (err, conversationsFound) => {
		if (err) {
			res.status(500).send("error finding conversation")
		} else if (conversationsFound === null) {
			console.log("not found")
			res.send(null)
		} else {
			console.log("conversation found", conversationsFound)
			res.send(conversationsFound)
		}
	})
}

export const SearchUser = (req, res) => {
	console.log(req.body)
	User.find({ $or: [{ name: { '$regex': req.body.name, "$options": 'i' } }, { email: { '$regex': req.body.name, "$options": 'i' } }] }, async (err, allUsers) => {
		if (err) {
			res.status(500).send("error occurred for searching in database")
		}
		let friends = []
		let conversations = []
		let others = []
		let s = false
		for (let i = 0; i < allUsers.length; i++) {
			if (allUsers[i]._id != req.jwtData._id) {
				await Friend.findOne({ members: { $all: [allUsers[i].email, req.body.email] } }, async (err, friendFound) => {
					if (err) {
						return
					} else if (friendFound === null) {
						allUsers[i].password = null
						await others.push(allUsers[i])
						return
					} else {
						await friends.push(friendFound)
						return
					}
				})
			}
		}
		for (let i = 0; i < friends.length; i++) {
			await Conversation.findOne({ friendCollectionId: friends[i]._id }, async (err, conversationFound) => {
				if (err) {
					console.log(err)
				} else if (conversationFound === null) {
					return
				} else {
					await conversations.push(conversationFound)
					return
				}
			})
		}
		console.log(others, friends, conversations)
		res.send({ others, friends, conversations })
	})
}

export const FriendPost = (req, res) => {
	Friend.findOne({ members: { $all: [req.body.senderEmail, req.body.receiverEmail] } }, (err, friendFound) => {
		if (err) {
			res.status(500).send("error finding friend")
		} else if (friendFound === null) {
			new Friend({ members: [req.body.senderEmail, req.body.receiverEmail] })
				.save((friendSaveErr, friendSaved) => {
					if (friendSaveErr) {
						return res.status(500).send("friend not been saved")
					}
					if (friendSaved) {
						res.send(friendSaved)
					}
				})
		} else if (friendFound) {
			res.send(null)
		}
	})

}

export const FriendGetById = (req, res) => {
	Friend.findOne({ _id: req.body.friendCollectionId }, (err, friendFound) => {
		if (err) {
			res.status(500).send("error finding friend")
		} else if (friendFound === null) {
			res.status(404).send("Friend Not Found")
		} else {
			res.send(friendFound)
		}
	})
}

export const FriendGetByEmail = (req, res) => {
	Friend.findOne({ members: { $all: [req.body.senderEmail, req.body.receiverEmail] } }, (err, friendFound) => {
		if (err) {
			res.status(500).send("error finding friend")
		} else if (friendFound === null) {
			res.status(404).send("Friend Not Found")
		} else {
			res.send(friendFound)
		}
	})
}
export const Seen = (req, res) => {
	Conversation.updateOne({ _id: req.body.id }, { $set: { newMessage: false } }, (err, friendFound) => {
		if (err) {
			res.status(500).send("error finding friend")
		} else if (friendFound === null) {
			res.status(404).send("Friend Not Found")
		} else {
			Message.updateMany({ conversationId: req.body.id }, { $set: { status: "seen" } }, (messageUpdateErr, messageUpdated) => {
				res.send("Message Seen status success")
			})
		}
	})
}
export const Delivered = (req, res) => {
	Message.updateMany({ conversationId: req.body.id, status: "send" }, { $set: { status: "delivered" } }, (messageUpdateErr, messageUpdated) => {
		res.send("Message Seen status success")
	})
}

export const sendFriendRequest = (req, res) => {
	let notificationBody = {
		senderEmail: req.body.senderEmail,
		receiverEmail: req.body.receiverEmail,
		status: "notSeen",
		type: "friendRequest"
	}
	Notification.findOne(notificationBody, async (error, find) => {
		console.log(find)
		if (error) {
			res.status(500).send()
		} else if (find === null) {
			await new Notification(notificationBody).save()
			return res.status(200).send()
		} else {
			console.log("already send friend Request")
			res.status(500).send("already sended")
		}
	})

}
export const cancelFriendRequest = async (req, res) => {
	try {
		const deleted = await Notification.deleteOne({ senderEmail: req.body.senderEmail, receiverEmail: req.body.receiverEmail, type: "friendRequest" })
		if (deleted.deletedCount !== 0) {
			res.status(200).send(true)
		} else {
			res.status(500).send("Friend Request Accepted")
		}
	} catch (error) {
		res.status(500).send("cant cancel")
	}

}
export const checkFriendRequest = async (req, res) => {
	console.log(req.body)
	Notification.findOne({ senderEmail: req.body.senderEmail, receiverEmail: req.body.receiverEmail, type: req.body.type }, (error, find) => {
		if (error) {
			res.status(500).send("cant cancel")
		} else if (find === null) {
			res.status(200).send(false)
		} else {
			res.status(200).send(true)
		}
	})
}
export const allNotifications = async (req, res) => {
	console.log(req.jwtData)
	const user = await User.findById(req.jwtData._id)
	Notification.find({ receiverEmail: user.email }, (error, all) => {
		if (error) {
			res.status(500).send("cant get")
		} else {
			res.status(200).send(all)
		}
	})
}
export const seenNotifications = async (req, res) => {
	console.log(req.jwtData)
	const user = await User.findById(req.jwtData._id)
	Notification.updateMany({ receiverEmail: user.email, status: "notSeen" }, { status: "seen" }, (error, all) => {
		if (error) {
			res.status(500).send("cant get")
		} else {
			res.status(200).send(all)
		}
	})
}

export const acceptFriendRequest = async (req, res) => {
	let notificationBody = {
		senderEmail: req.body.data.receiverEmail,
		receiverEmail: req.body.data.senderEmail,
		status: "notSeen",
		type: "acceptFriendRequest"
	}
	try {
		const deleted = await Notification.deleteOne({ _id: req.body.data._id })
		if (deleted.deletedCount !== 0) {
			new Friend({ members: [req.body.data.senderEmail, req.body.data.receiverEmail] })
				.save(async (friendSaveErr, friendSaved) => {
					if (friendSaveErr) {
						return res.status(500).send("friend not been saved")
					}
					if (friendSaved) {
						await new Notification(notificationBody).save()
						res.status(200).send(friendSaved)
					}
				})
		} else {
			res.status(500).send("Notification Not Found")
		}
	} catch (error) {
		res.status(500).send(error)
	}
}
export const removeFriendRequest = async (req, res) => {
	let notificationBody = {
		senderEmail: req.body.data.receiverEmail,
		receiverEmail: req.body.data.senderEmail,
		status: "notSeen",
		type: "removeFriendRequest"
	}

	try {
		const deleted = await Notification.deleteOne({ _id: req.body.data._id })
		if (deleted.deletedCount !== 0) {
			console.log(notificationBody)
			await new Notification(notificationBody).save()
		}
		res.status(200).send(true)
	} catch (error) {
		res.status(500).send("cant remove")
	}
}
export const removeNotification = async (req, res) => {
	try {
		const deleted = await Notification.deleteOne({ _id: req.body.data._id })
		res.status(200).send(true)
	} catch (error) {
		res.status(500).send("cant remove")
	}
}