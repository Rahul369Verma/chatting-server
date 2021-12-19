const mongoose = require('mongoose')
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
import jwt from "jsonwebtoken"
import { comparePassword, hashPassword } from "../utils/auth.js"
require("../models/userSchema")

const User = mongoose.model('user')

const TMaxAge = 1000 * 60 * 60 * 12
const TExpire = "12h"
const RTMaxAge = 1000 * 60 * 60 * 24 * 7
const RTExpire = "7d"


export const register = (req, res) => {
	try {
		const { name, email } = req.body
		if (!name || name.length < 3) {
			return res.status(400).send("Name is required or too short")
		}
		if (!req.body.password || req.body.password.length < 6) {
			return res.status(400).send("password should be at least 6 characters long")
		}
		if (!email) return res.status(400).send("Email is Required")
		User.findOne({ email }, async (err, db_user) => {
			console.log(db_user);
			if (!db_user) {
				req.body.password = await hashPassword(req.body.password)
				const data = {
					name: req.body.name,
					email: req.body.email,
					password: req.body.password,
					type: req.body.type
				}
				new User(data).save(async (err, savedUser) => {
					if (err) {
						console.log(err);
						return res.status(500).send("cant save the user please try again")
					}
					if (savedUser) {
						const token = await jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET_ACCESS_TOKEN, {
							expiresIn: TExpire
						})
						const refreshToken = await jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET_REFRESH_TOKEN, {
							expiresIn: RTExpire
						})
						console.log("login success", savedUser)
						// res.setHeader("Access-Control-Allow-Credentials", true)

						res.cookie("token", "Bearer " + token, {
							secure: process.env.NODE_ENV === "production",
							sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
							path: "/",
							httpOnly: true,
							maxAge: TMaxAge,
						})
						res.cookie("refreshToken", "Bearer " + refreshToken, {
							secure: process.env.NODE_ENV === "production",
							sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
							httpOnly: true,
							maxAge: RTMaxAge,
							path: "/refreshToken",
						})
						res.send({
							username: savedUser.name, email: savedUser.email, type: savedUser.type
						})
					}
				})
			} else if (err) {
				console.log(err);
				return res.status(400).send("some error ocurred please try again")
			} else {
				return res.status(400).send("Email is already Taken")
			}
		})
	} catch (err) {
		return res.status(400).send("Error Try Again")
	}
}

export const login = (req, res) => {
	console.log(req.body)
	User.findOne({ email: req.body.email }, (err, data) => {
		if (!data) {
			res.status(401).send("user Not Found")
		} else if (err) {
			return res.status(401).send("try again database error")
		} else {
			try {
				console.log(data.password)
				comparePassword(req.body.password, data.password, async (err, result) => {
					data.password = null
					if (err) {
						console.log(err)
						return res.status(401).send("can't compare password")
					} else if (result === true) {
						const token = await jwt.sign({ _id: data._id }, process.env.JWT_SECRET_ACCESS_TOKEN, {
							expiresIn: TExpire
						})
						const refreshToken = await jwt.sign({ _id: data._id }, process.env.JWT_SECRET_REFRESH_TOKEN, {
							expiresIn: RTExpire
						})
						console.log("login success", result)
						// res.setHeader("Access-Control-Allow-Credentials", true)

						res.cookie("token", "Bearer " + token, {
							secure: process.env.NODE_ENV === "production",
							sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
							path: "/",
							httpOnly: true,
							maxAge: TMaxAge,
						})
						res.cookie("refreshToken", "Bearer " + refreshToken, {
							secure: process.env.NODE_ENV === "production",
							sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
							httpOnly: true,
							maxAge: RTMaxAge,
							path: "/refreshToken",
						})
						res.send({
							username: data.name, email: data.email, type: data.type
						})
					} else {
						res.status(401).send("Wrong Password")
					}
				})
			} catch (error) {
				return res.status(401).send("try again")
			}
		}
	})
}

export const logout = (req, res) => {
	console.log("logout")
	res.clearCookie("refreshToken", {
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
		path: "/refreshToken"
	})
	res.clearCookie("token", {
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
		path: "/"
	})
	res.status(200).send(true)
}

export const userData = (req, res) => {
	console.log(req.jwtData);
	User.findOne({ _id: req.jwtData._id }, (err, data) => {
		if (err) {
			res.status(404).send("user not found")
		} else if (data === null) {
			res.status(404).send("user not found")
		} else {
			console.log(data)
			res.send({
				username: data.name, email: data.email, type: data.type
			})
		}
	})

}


export const newCookies = (req, res) => {
	console.log("RTData " + req.jwtData);
	User.findOne({ _id: req.jwtData._id }, async (err, data) => {
		if (err) {
			res.status(404).send("user not found in database")
		}
		const token = await jwt.sign({ _id: req.jwtData._id }, process.env.JWT_SECRET_ACCESS_TOKEN, {
			expiresIn: TExpire
		})
		const refreshToken = await jwt.sign({ _id: req.jwtData._id }, process.env.JWT_SECRET_REFRESH_TOKEN, {
			expiresIn: RTExpire
		})
		console.log("login success " + token)
		res.cookie("token", "Bearer " + token, {
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
			path: "/",
			httpOnly: true,
			maxAge: TMaxAge,
		})
			res.cookie("refreshToken", "Bearer " + refreshToken, {
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
				httpOnly: true,
				maxAge: RTMaxAge,
				path: "/refreshToken",
			})
			res.send({
				username: data.name, email: data.email, type: data.type
			})
	})

}

export const emailData = (req, res) => {
	console.log(req.body.email)
	User.findOne({ email: req.body.email }, (err, data) => {
		if (err) {
			res.status(500).send("user not found")
		} else if (data === null) {
			res.status(500).send("data not found")
		} else {
			data.password = null
			res.send(data)
		}
	})

}


export const getEmails = (req, res) => {
	User.find({}, { email: 1, name: 1 }, (err, data) => {
		res.send(data)
	})
}


