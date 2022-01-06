const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require('mongoose')
const cookieParser = require("cookie-parser");
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

import { first } from "./protected_functions/first"
import { register, login, logout, userData, newCookies, getEmails, emailData } from "./controllers/index.js"
import { verifyToken, refreshToken } from "./middleware/authjwt.js";
import {
	MessagePost, MessageGet, AllConversationGet, ConversationGetFriendId, Seen, sendFriendRequest,
	cancelFriendRequest, removeFriendRequest, acceptFriendRequest,
	removeNotification, allNotifications, seenNotifications, AllFriendsGet, OtherUsersGet,
	deleteMessages, allSeen, SearchFriends,
	deliveredById, deliveredByConversationId, searchConversations, IsFriend, allFriendRequests, checkNotification, FriendDelete
} from "./controllers/whatsap";

const url = process.env.MONGO_URL
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection
db.once('open', _ => {
	console.log('Database connected:')
})
db.on('error', err => {
	console.error('connection error:', err)
})

var corsOptions = {
	credentials: true,
	optionsSuccessStatus: 200,
	origin: [process.env.FRONTEND_APP_URL]
}

const app = express();
app.use(cors(corsOptions)) //for handling cors origin handling
app.use(express.json()) // to handle coming json data from client without body-parser
app.use(morgan("dev")) // to show each end point request in console log
app.use(cookieParser());
app.use((req,res,next)=>{
	res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_APP_URL);
	res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
	res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
	next(); 
})





app.get("/", (req, res) => { res.send("chatting server is running") })
app.get("/refreshToken", refreshToken, newCookies)
app.post("/register", register)
app.post("/login", login)
app.get("/userData", verifyToken, userData)
app.post("/emailData", verifyToken, emailData)
app.get("/allEmails", verifyToken, getEmails)
app.get("/logout", logout)
app.get("/user", verifyToken, first)
app.post("/messagePost", verifyToken, MessagePost)
app.post("/messageGet", verifyToken, MessageGet)
// app.post("/conversation", verifyToken, ConversationPost)
app.get("/allConversations", verifyToken, AllConversationGet)
app.post("/ConversationId", verifyToken, ConversationGetFriendId)
app.get("/isFriend", verifyToken, IsFriend)
// app.post("/friendId", verifyToken, IsFriendConversation)
app.get("/allFriends", verifyToken, AllFriendsGet)
app.get("/unfriend", verifyToken, FriendDelete)
// app.post("/friendId", verifyToken, FriendGetById)
// app.post("/friendEmail", verifyToken, FriendGetByEmail)
app.post("/otherUsers", verifyToken, OtherUsersGet)
app.post("/allSeen", verifyToken, allSeen)
app.post("/seen", verifyToken, Seen)
app.post("/deliveredById", verifyToken, deliveredById)
app.post("/deliveredByConversationId", verifyToken, deliveredByConversationId)
app.get("/search/conversations", verifyToken, searchConversations)
app.get("/search/friends", verifyToken, SearchFriends)
app.post("/sendFriendRequest", verifyToken, sendFriendRequest)
app.post("/cancelFriendRequest", verifyToken, cancelFriendRequest)
app.post("/checkFriendRequest", verifyToken, checkNotification)
app.get("/allNotification", verifyToken, allNotifications)
app.get("/allRequests", verifyToken, allFriendRequests)
app.get("/seenNotifications", verifyToken, seenNotifications)
app.post("/acceptFriendRequest", verifyToken, acceptFriendRequest)
app.post("/removeFriendRequest", verifyToken, removeFriendRequest)
app.post("/removeNotification", verifyToken, removeNotification)
app.post("/deleteMessages", deleteMessages)





app.listen(process.env.PORT || 5000, console.log("server running on port 5000"))