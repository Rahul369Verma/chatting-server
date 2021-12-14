export const first = (req, res) => {
    return res.send({
        message: "you are in protected route and are verified"
    })
}
