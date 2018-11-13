const { Router } = require('express')
const loginRouter = Router()
const registerRouter = Router()

const { db } = require('../data/database')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = require('../models/user')

function sendUserNotExists(res) {
    res.status(404).json({ "status": "error", "error": "Not found", "message": "User is not exists !" })
}


// POST '/users'
registerRouter.post('/', (req, res) => {
    const user = new User(null, req.body.nickname, req.body.password, req.body.email)

    if (!user.isValid()) {
        res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to enter your nickname, password and email" })
        return;
    }

    db.get('SELECT email, nickname FROM user WHERE email = ? OR nickname = ?', [user.email, user.nickname], (err, userRow) => {
        if (err) throw err

        if (userRow) {
            if (user.email == userRow.email)
                res.json({ "status": "error", "error": "User exists request", "message": "This email is already taken by another user !" })
            else
                res.json({ "status": "error", "error": "User exists request", "message": "This nickname is already taken by another user !" })
        } else {
            bcrypt.hash(user.password, saltRounds, (err, hash) => {
                user.password = hash

                db.run(
                    "INSERT INTO user(nickname, password, email) VALUES ($nickname, $password, $email)",
                    user.toJSONDB(),
                    err => {
                        if (err) throw err
                        req.session.isLogged = true;
                        res.json({ "status": "success", "message": "Your account has been successfully created !", "redirect": "/" })
                    }
                )
            })
        }
    })
})

registerRouter.get('/', (req, res) => {
    if (req.session.isLogged)
        res.redirect('/');
    else
        res.render('register', { title: 'Register' })
})

loginRouter.post('/', (req, res) => {
    const email = req.body.email
    const password = req.body.password

    if (!email || !password) {
        res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to enter your email and password" })
        return;
    }

    db.get('SELECT * FROM user WHERE email = ?', [email], (err, userRow) => {
        if (err) throw err

        if (!userRow) {
            sendUserNotExists(res)
        } else {
            const isPwdMatch = bcrypt.compareSync(password, userRow.password)
            if (!isPwdMatch) {
                res.status(401).json({ "status": "error", "error": "Credential fail", "message": "Email or password incorrect !" })
                return;
            }
            req.session.isLogged = true;
            res.json({ "status": "success", "message": "Login successfull", "redirect": "/" })
        }
    })
})

loginRouter.get('/', (req, res) => {
    if (req.session.isLogged)
        res.redirect('/');
    else
        res.render('login', { title: 'Register' })
})

module.exports = {
    registerRouter,
    loginRouter
}
