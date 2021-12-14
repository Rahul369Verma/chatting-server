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
import { MessagePost, MessageGet, AllConversationGet, SearchUser, FriendGetById, FriendPost, FriendGetByEmail, ConversationGetFriendId, Seen, Delivered } from "./controllers/whatsap";

const url = process.env.MONGO_URL
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection
db.once('open', _ => {
	console.log('Database connected:', url)
})
db.on('error', err => {
	console.error('connection error:', err)
})

var corsOptions = {
	credentials: true,
	origin: "http://localhost:3000"
}

const app = express();
app.use(cors(corsOptions)) //for handling cors origin handling
app.use(express.json()) // to handle coming json data from client without body-parser
app.use(morgan("dev")) // to show each end point request in console log
app.use(cookieParser());




app.get("/", (req, res) => {res.send("chatting server is running")})
app.get("/refreshToken", refreshToken, newCookies)
app.post("/register", register)
app.post("/login", login)
app.get("/userData", verifyToken, userData)
app.post("/emailData", verifyToken, emailData)
app.get("/allEmails",verifyToken, getEmails)
app.get("/logout", logout)
app.get("/user", verifyToken, first)
app.post("/messagePost", verifyToken, MessagePost)
app.post("/messageGet", verifyToken, MessageGet)
// app.post("/conversation", verifyToken, ConversationPost)
app.get("/allConversations", verifyToken, AllConversationGet)
app.post("/ConversationId", verifyToken, ConversationGetFriendId)
app.post("/addFriend", verifyToken, FriendPost)
app.post("/friendId", verifyToken, FriendGetById)
app.post("/friendEmail", verifyToken, FriendGetByEmail)
app.post("/searchUsers", verifyToken, SearchUser)
app.post("/seen", verifyToken, Seen)
app.post("/delivered", verifyToken, Delivered)




app.listen(process.env.PORT || 5000, console.log("server running on port 5000"))