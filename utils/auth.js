const bcrypt = require('bcrypt')

export const hashPassword = (password) => {
    return new Promise((resolve, reject) => {//used in async await fun return for wait pending when used this return in that fun
        bcrypt.genSalt(12, (err, salt) => {
            if (err) {
                reject(err)
            }
            bcrypt.hash(password, salt, (err, hash) =>{
                if (err) {
                    reject(err)
                }
                resolve(hash)
            })
        })
    })
}

export const comparePassword = (password, hash, next) => {
    bcrypt.compare(password, hash, next)
}