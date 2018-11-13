const { Router } = require('express')
const usersRouter = Router()

const { db } = require('../data/database')
const linksRouter = require('./links')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = require('../models/user')

function sendUserNotExists(res) {
    res.status(404).json({ "status": "error", "error": "Not found", "message": "User not exists !" })
}

function sendUserIdNotFound(res) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "Error when try to get user_id from url" })
}

// GET '/users'
usersRouter.get('/', (req, res) => {
  db.all("SELECT id, nickname, email FROM user", (err, users) => {
    if (err) throw err
    res.json({ "status": "success", "users": users || [] })
  })
})

// POST '/users'
usersRouter.post('/', (req, res) => {
  const user = new User(null, req.body.nickname, req.body.password, req.body.email)

  if (!user.isValid()) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must enter a nickname, password and your email !" })
    return;
  }

  bcrypt.hash(user.password, saltRounds, (err, hash) => {
    user.password = hash

    db.run(
      "INSERT INTO user(nickname, password, email) VALUES ($nickname, $password, $email)",
      user.toJSONDB(),
      err => {
        if (err) throw err
        res.json({ "status": "success", "message": "User successfully added !" })
      }
    )
  })
})

// GET '/users/:userId'
usersRouter.get('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)

  if (!userId) {
    sendUserIdNotFound(res)
    return;
  }

  getUser(userId, ['id', 'nickname', 'email'], user => {
    if (!user) {
      sendUserNotExists(res)
      return
    }
    res.json({ "status": "success", "user": user })
  })
})

function getUser(user_id, values, callback) {
  db.get(`SELECT ${values.join(',')} FROM user WHERE id = ?`, [user_id], (err, row) => {
    if (err) throw err
    callback(row)
  })
}

// PATCH '/users/:userId'
usersRouter.patch('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)

  if (!userId) {
    sendUserIdNotFound(res)
    return
  }

  const user = new User(userId, req.body.nickname, req.body.new_password, req.body.email)

  // Check body for new data
  if (!user.nickname && !user.email && !user.password) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to enter at least a new nickname, email or password" })
    return;
  }
  // Check if actual password is specify
  if (user.password && !req.body.actual_password) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must enter your actual password" })
    return;
  }

  // Check if actual password is correct
  getUser(userId, ['*'], userRow => {
    if (!userRow) {
      sendUserNotExists(res)
      return
    }
    if (user.password) { // If password need to be updated
      const isPasswordCorrect = bcrypt.compareSync(req.body.actual_password, userRow.password)
      if (!isPasswordCorrect) {
        res.status(401).json({ "status": "error", "error": "Unauthorized", "message": "The actual password is not correct !" })
        return;
      } else {
        // Actual password correct, so we can update it
        user.password = bcrypt.hashSync(user.password, saltRounds)
      }
    }

    const reqParts = user.toJSON().map(e => `${e.key} = ${e.value ? '$' : ''}${e.key}`)
    const reqUpdate = `UPDATE user SET ${reqParts.join(', ')} WHERE id = $id`

    db.run(
      reqUpdate,
      user.toJSONDB(),
      err => {
        if (err) throw err
        res.json({ "status": "success", "message": "Your data has been successfully updated !" })
      }
    )
  })
})

// DELETE '/users/:userId'
usersRouter.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!userId) {
    sendUserIdNotFound(res)
    return
  }

  getUser(userId, ['id'], user => {
    if (!user) {
      sendUserNotExists(res)
      return
    }
    db.run("DELETE FROM user WHERE id = ?", [userId], err => {
      if (err) throw err
      res.json({ "status": "success", "message": "User successfully deleted !" })
    });
  })
})

usersRouter.use('/:userId/links', linksRouter)

module.exports = usersRouter
