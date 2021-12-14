import jwt from "jsonwebtoken"

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export const verifyToken = async (req, res, next) => {
    console.log(req.cookies);
    let { token } = req.cookies;
    if(token === undefined){
        console.log("Token not received");
        return res.status(403).send("Token not received")
    }
    token = token.split(" ")[1];
    try {
        req.jwtData = await jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN);
        next()
    } catch (error) {
        console.log("token expired");
        return res.status(403).send("Token expired");
    }
}

export const refreshToken = async (req, res, next) => {
    console.log(req.cookies);
    let { refreshToken } = req.cookies;
    if(refreshToken === undefined){
        return res.status(400).send("refreshToken not received")
    }
    refreshToken = refreshToken.split(" ")[1];
    try {
        req.jwtData = await jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN);
        next()
    } catch (error) {
        return res.status(400).send("refreshToken Token expired");
    }
}

