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
	let pipeline = [
		{
			$match: {
				userId: req.jwtData._id
			}
		},
		{
			$unwind: {
				path: "$allFriends"
			}
		},
		{
			$match: {
				"allFriends.email": req.body.friendEmail
			}
		}
	]
	Friend.aggregate(pipeline, async (errFindFriend, findFriend) => {
		if (errFindFriend) {
			res.status(500).send("error finding friend")
		} else if (findFriend === null) {
			res.status(403).send("you both are not friends")
		} else {
			if (!req.body.conversationId) {
				let newConversation = {
					members: [
						{ name: req.body.friendName, email: req.body.friendEmail },
						{ name: req.body.myName, email: req.body.myEmail }
					],
					newMessage: true,
					senderEmail: messageBody.senderEmail,
					lastMessage: messageBody.message
				}
				await new Conversation(newConversation)
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
									// Conversation.updateOne({ _id: messageBody.conversationId }, { $set: { lastMessageId: messageSaved._id } }, (updateErr, updated) => {
									// 	if (updateErr) {
									// 		res.status(500).send("cant update conversation")
									// 	} else {
									// 		return res.status(200).send({ messageSaved: messageSaved, conversationSaved })
									// 	}
									// })
									return res.status(200).send({ messageSaved: messageSaved, conversationSaved })
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
						let newConversation = {
							newMessage: true,
							senderEmail: messageBody.senderEmail,
							lastMessage: messageBody.message,
						}
						Conversation.updateOne({ _id: messageBody.conversationId }, { $set: newConversation }, (updateErr, updated) => {
							if (updateErr) {
								res.status(500).send("cant update conversation")
							} else {
								return res.status(200).send({ messageSaved: messageSaved, conversationSaved: updated })
							}
						})
					}
				})
			}
		}
	})
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
	User.findOne({ _id: req.jwtData._id }, (err, data) => {
		if (err) {
			res.status(404).send("user not found")
		} else if (data === null) {
			res.status(404).send("user not found")
		} else {
			Conversation.find({ "members.email": { $in: [data.email] } }, async (err, conversationsFound) => {
				if (err) {
					res.status(500).send("error finding friend")
				} else if (conversationsFound === null) {
					console.log("null")
					res.send([])
				} else {
					console.log(conversationsFound)
					res.status(200).send(conversationsFound)
				}
			})
		}
	})
}

export const searchConversations = (req, res) => {
	User.findOne({ _id: req.jwtData._id }, (err, data) => {
		if (err) {
			res.status(404).send("user not found")
		} else if (data === null) {
			res.status(404).send("user not found")
		} else {
			let pipeline = [
				{
					$match: {
						"members": { $elemMatch: { email: data.email } }
					},
				},
				{
					$unwind: {
						path: "$members",
					}
				},
				{
					$match: {
						"members.email": { $not: { $eq: data.email } }
					}
				},
				{
					$match: {
						"members.name": { $regex: req.query.search, $options: "i" }
					}
				}
			]

			Conversation.aggregate(pipeline, (err, conversationsFound) => {
				if (err) {
					res.status(500).send("error finding conversation")
				} else if (conversationsFound === null) {
					console.log("not found")
					res.status(200).send([])
				} else {
					console.log(conversationsFound)
					res.status(200).send(conversationsFound)
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
			res.send(conversationsFound)
		}
	})
}

export const SearchFriends = (req, res) => {
	let pipeline = [
		{
			$match: {
				userId: req.jwtData._id
			}
		},
		{
			$unwind: {
				path: "$allFriends",
			}
		},
		{
			$match: {
				"allFriends.name": { $regex: req.query.search, $options: "i" }
			}
		},
		{
			$group: {
				_id: "$_id",
				userId: { $first: "$userId" },
				allFriends: { $first: "$allFriends" }
			}
		}
	]
	Friend.aggregate(pipeline, (errFindingFriends, friends) => {
		if (errFindingFriends) {
			res.status(500).send("error occurred for searching in database")
		} else if (friends === null) {
			res.status(200).send([])
		} else {
			console.log(friends)
			res.status(200).send(friends.allFriends)
		}
	});
}

export const OtherUsersGet = (req, res) => {
	console.log(req.body)
	try {
		User.find({
			$or: [{ name: { '$regex': req.body.name, "$options": 'i' } },
			{ email: { '$regex': req.body.name, "$options": 'i' } }]
		}, { password: 0 }, async (err, allUsers) => {
			if (err) {
				res.status(500).send("error occurred for searching in database")
			} else {
				let pipeline = [
					{
						$match: {
							userId: req.jwtData._id
						}
					},
					{
						$unwind: {
							path: "$allFriends",
						}
					},
					{
						$match: {
							"allFriends.name": { $regex: req.body.name, $options: "i" }
						}
					}
				]
				Friend.aggregate(pipeline, (errFindingFriends, friends) => {
					if (errFindingFriends) {
						res.status(500).send("error occurred for searching in database")
					} else {
						console.log(allUsers, friends)
						res.status(200).send({ allUsers, friends })
					}
				});
				// let others = []
				// for (let i = 0; i < searchUsers.length; i++) {
				// 	if (searchUsers[i]._id != String(req.jwtData._id)) {
				// 		await Friend.findOne({ members: { $all: [searchUsers[i].email, req.body.email] } }, async (err, friendFound) => {
				// 			if (err) {
				// 				console.log(err)
				// 				res.status(500).send("database error")
				// 			} else if (friendFound === null) {
				// 				searchUsers[i].password = null
				// 				others.push(searchUsers[i])
				// 			} else {
				// 			}
				// 		})
				// 	}
				// }
			}
		})
	} catch (error) {
		console.log("error in getting user", error)
		res.status(500).send("error occurred for searching in database")
	}
}
export const deleteMessages = (req, res) => {
	Message.deleteMany({ conversationId: req.body.id }, (err, done) => {
		if (err) {
			res.status(500).send("error")
		} else {
			res.send(done)
		}
	})
}

// export const IsFriend = (req, res) => {
// 	Friend.findOne({
// 		userId: req.jwtData._id,
// 		"allFriends.email": req.query.email
// 	}, (error, findFriend) => {
// 		if (error) {
// 			res.status(500).send("error finding friends")
// 		} else if (findFriend === null) {
// 			console.log("findFriend null", findFriend)
// 			res.status(200).send(false)
// 		} else {
// 			console.log("findFriend", findFriend)
// 			res.status(200).send(true)
// 		}
// 	})
// }

export const IsFriend = async (req, res) => {
	console.log(req.query.email)
	let user = await User.findById(req.jwtData._id)
	Friend.findOne({
		userId: req.jwtData._id,
		"allFriends.email": req.query.email
	}, (error, findFriend) => {
		if (error) {
			res.status(500).send("error finding friends")
		} else if (findFriend === null) {
			console.log("findFriend null", findFriend)
			res.status(200).send({ isFriend: false, conversation: false })
		} else {
			Conversation.findOne({ "members.email": { $all: [req.query.email, user.email] } },
				(errConversation, conversation) => {
					if (errConversation) {
						res.status(500).send("cant find conversation")
					} else if (conversation === null) {
						console.log("no conversation found")
						res.status(200).send({ isFriend: true, conversation: false })
					} else {
						console.log("findFriend", findFriend)
						res.status(200).send({ isFriend: true, conversation: conversation })
					}
				})
		}
	})
}

export const AllFriendsGet = (req, res) => {
	console.log("jwtData", req.jwtData)
	Friend.findOne({ userId: req.jwtData._id }, (error, findFriend) => {
		console.log(findFriend)
		if (error) {
			res.status(500).send("error finding friends")
		} else if (findFriend === null) {
			res.status(200).send([])
		} else {
			res.status(200).send(findFriend.allFriends)
		}
	})
}

	export const FriendDelete = async (req, res) => {
		let user = await User.findById(req.jwtData._id)
		let friend = await User.findOne({email: req.query.friendEmail})
		Friend.updateOne({ userId: user._id }, {
			$pull: {
				"allFriends": {
					name: friend.name,
					email: friend.email
				}
			}
		}, (error, ourFriendSaved) => {
			if (error) {
				res.status(500).send("cant Saved our Friend")
			} else {
				Friend.updateOne({ userId: friend._id }, {
					$pull: {
						"allFriends": {
							name: user.name,
							email: user.email
						}
					}
				}, (err, senderFriendSaved) => {
					if (err) {
						res.status(500).send("cant Saved sender Friend")
					} else {
						res.status(200).send("saved Successfully")
					}
				})
			}
		})

	// Friend.findOne({ members: { $all: [req.body.senderEmail, req.body.receiverEmail] } }, (err, friendFound) => {
	// 	if (err) {
	// 		res.status(500).send("error finding friend")
	// 	} else if (friendFound === null) {
	// 		new Friend({ members: [req.body.senderEmail, req.body.receiverEmail] })
	// 			.save((friendSaveErr, friendSaved) => {
	// 				if (friendSaveErr) {
	// 					return res.status(500).send("friend not been saved")
	// 				}
	// 				if (friendSaved) {
	// 					res.send(friendSaved)
	// 				}
	// 			})
	// 	} else if (friendFound) {
	// 		res.send(null)
	// 	}
	// })

}

// export const FriendGetById = (req, res) => {
// 	Friend.findOne({ _id: req.body.friendCollectionId }, (err, friendFound) => {
// 		if (err) {
// 			res.status(500).send("error finding friend")
// 		} else if (friendFound === null) {
// 			res.status(404).send("Friend Not Found")
// 		} else {
// 			res.send(friendFound)
// 		}
// 	})
// }

// export const FriendGetByEmail = (req, res) => {
// 	Friend.findOne({ members: { $all: [req.body.senderEmail, req.body.receiverEmail] } }, (err, friendFound) => {
// 		if (err) {
// 			res.status(500).send("error finding friend")
// 		} else if (friendFound === null) {
// 			res.status(404).send("Friend Not Found")
// 		} else {
// 			res.send(friendFound)
// 		}
// 	})
// }

export const allSeen = (req, res) => {
	Conversation.updateOne({ _id: req.body.id }, { $set: { newMessage: false } }, (err, conversationFound) => {
		if (err) {
			res.status(500).send("error finding friend")
		} else if (conversationFound === null) {
			res.status(404).send("Conversation Not Found")
		} else {
			res.status(200).send("false successfully")
		}
	})
}

export const Seen = (req, res) => {
	console.log("body", req.body)
	Message.updateOne({ _id: req.body.id }, { $set: { status: "seen" } }, (messageUpdateErr, messageUpdated) => {
		if (messageUpdateErr) {
			res.status(500).send("cant update seen")
		} else {
			console.log("seen", messageUpdated)
			res.send("Message Seen status success")
		}
	})
}
export const deliveredById = (req, res) => {
	Message.updateOne({ _id: req.body.id }, { $set: { status: "delivered" } }, (messageUpdateErr, messageUpdated) => {
		if (messageUpdateErr) {
			res.status(500).send("cant update seen")
		} else {
			res.send("Message Delivered status success")
		}
	})
}

export const deliveredByConversationId = (req, res) => {
	Message.updateMany({ conversationId: req.body.id, status: "send" }, { $set: { status: "delivered" } }, (messageUpdateErr, messageUpdated) => {
		if (messageUpdateErr) {
			res.status(500).send("cant update seen")
		} else {
			console.log(messageUpdated)
			res.send(messageUpdated)
		}
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
export const checkNotification = async (req, res) => {
	Notification.findOne({ senderEmail: req.body.firstEmail, receiverEmail: req.body.secondEmail, type: req.body.type }, (error, findOne) => {
		if (error) {
			res.status(500).send("cant check")
		} else if (findOne === null) {
			Notification.findOne({ senderEmail: req.body.secondEmail, receiverEmail: req.body.firstEmail, type: req.body.type }, (error, findTwo) => {
				if (error) {
					res.status(500).send("cant check")
				} else if (findTwo === null) {
					res.status(200).send(false)
				} else {
					res.status(200).send(findTwo)
				}
			})
		} else {
			res.status(200).send(findOne)
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

export const allFriendRequests = async (req, res) => {
	console.log(req.jwtData)
	const user = await User.findById(req.jwtData._id)
	Notification.find({ receiverEmail: user.email, type: "friendRequest" }, (error, all) => {
		if (error) {
			res.status(500).send("cant get")
		} else {
			console.log(all)
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
	console.log(req.body)
	let notificationBody = {
		senderEmail: req.body.data.receiverEmail,
		receiverEmail: req.body.data.senderEmail,
		status: "notSeen",
		type: "acceptFriendRequest"
	}
	try {
		const senderUser = await User.findOne({ email: notificationBody.senderEmail })
		const receiverUser = await User.findOne({ email: notificationBody.receiverEmail })
		const deleted = await Notification.deleteOne({ _id: req.body.data._id })
		if (deleted.deletedCount !== 0) {
			const senderFriend = await Friend.findOne({ userId: senderUser._id })
			if (senderFriend === null) {
				await new Friend({
					userId: senderUser._id,
					allFriends: [{ name: receiverUser.name, email: receiverUser.email }]
				}).save()
			} else {
				await Friend.updateOne({ userId: senderUser._id }, {
					$push: {
						"allFriends": {
							name: receiverUser.name, email: receiverUser.email
						}
					}
				})
			}
			const receiverFriend = await Friend.findOne({ userId: receiverUser._id })
			if (receiverFriend === null) {
				await new Friend({
					userId: receiverUser._id,
					allFriends: [{ name: senderUser.name, email: senderUser.email }]
				}).save()
			} else {
				await Friend.updateOne({ userId: receiverUser._id }, {
					$push: {
						"allFriends": {
							name: senderUser.name, email: senderUser.email
						}
					}
				})
			}
			await new Notification(notificationBody).save()
			res.status(200).send("you both are now friends")
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