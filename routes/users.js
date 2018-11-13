const express = require('express')
const router = express.Router()
const db = require('../data/database')
const User = require('../models/user')

// GET '/users'
router.get('/', (req, res) => {
  db.all("SELECT id, nickname, email FROM user", (err, rows) => {
    if (err) throw err
    res.json({
      "status": "success",
      "users": rows || []
    })
  })
})

// POST '/users'
router.post('/', (req, res) => {
  const user = new User(null, req.body.nickname, req.body.password, req.body.email)

  if (!user.isValidForInsert()) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass 'nickname', 'password' and 'email' in post body" })
    return;
  }

  const stmt = db.prepare("INSERT INTO user(nickname, password, email) VALUES (?, ?, ?)");
  stmt.run(user.valuesWithoutId()); // all user data except id
  stmt.finalize();

  res.json({
    "status": "success",
    "message": "User has been successfully added !" 
  })
})

// GET '/users/:userId'
router.get('/:userId', (req, res) => {
  if (!req.params.userId || !parseInt(req.params.userId)) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass userId (int) in params, like: '/users/12'" })
    return;
  }

  db.get("SELECT * FROM user WHERE id = ?", [req.params.userId], (err, row) => {
    if (err) throw err

    res.json({
      "status": "success",
      "user": row || {}
    })
  })
})

// PATCH '/users/:userId'
router.patch('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!userId) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass userId (int) in params, like: '/users/12'" })
    return
  }

  const user = new User(userId, req.body.nickname, req.body.password, req.body.email)

  if (!user.nickname && !user.email && !user.password) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass at least new nickname, email or password in body" })
    return;
  }

  const reqParts = user.toMapWithoutId().map(data => `${data.key} = ?`)
  const reqUpdate = `UPDATE user SET ${reqParts.join(', ')} WHERE id = ?`

  const stmt = db.prepare(reqUpdate);
  stmt.run([...user.valuesWithoutId(), userId]);
  stmt.finalize();
  res.json({ "status": "success", "message": "User data has been successfully updated !" })
})

// PATCH '/users/:userId'
router.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!userId) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass userId (int) in params, like: '/users/12'" })
    return
  }

  const stmt = db.prepare("DELETE FROM user WHERE id = ?");
  stmt.run(userId);
  stmt.finalize();
  res.json({ "status": "success", "message": "User has been successfully deleted !" })
})

module.exports = router
