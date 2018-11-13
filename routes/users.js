const express = require('express')
const router = express.Router()
const { db } = require('../data/database')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = require('../models/user')
const Link = require('../models/link')

function sendUserNotExists(res) {
  res.status(404).json({ "status": "error", "error": "Not found", "message": "User is not exists !" })
}

function sendUserIdNotFound(res) {
  res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must pass a valid userId (int) in params !" })
}

function sendLinkNotExists(res) {
  res.status(404).json({ "status": "error", "error": "Not found", "message": "Link is not exists !" })
}

function sendLinkIdNotFound(res) {
  res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must pass a valid linkId (int) in params !" })
}

// GET '/users'
router.get('/', (req, res) => {
  db.all("SELECT id, nickname, email FROM user", (err, users) => {
    if (err) throw err
    res.json({ "status": "success", "users": users || [] })
  })
})

// POST '/users'
router.post('/', (req, res) => {
  const user = new User(null, req.body.nickname, req.body.password, req.body.email)

  if (!user.isValidForInsert()) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass 'nickname', 'password' and 'email' in post body" })
    return;
  }

  bcrypt.hash(user.password, saltRounds, (err, hash) => {
    user.password = hash

    db.run(
      "INSERT INTO user(nickname, password, email) VALUES ($nickname, $password, $email)",
      user.toJSONDB(),
      err => {
        if (err) throw err
        res.json({ "status": "success", "message": "User has been successfully added !" })
      }
    )
  })
})

// GET '/users/:userId'
router.get('/:userId', (req, res) => {
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
router.patch('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)

  if (!userId) {
    sendUserIdNotFound(res)
    return
  }

  const user = new User(userId, req.body.nickname, req.body.new_password, req.body.email)

  // Check body for new data
  if (!user.nickname && !user.email && !user.password) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass at least 'nickname', 'email' or 'new_password' in body" })
    return;
  }
  // Check if actual password is specify
  if (user.password && !req.body.actual_password) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must pass 'actual_password' in body" })
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
        res.json({ "status": "success", "message": "User data has been successfully updated !" })
      }
    )
  })
})

// DELETE '/users/:userId'
router.delete('/:userId', (req, res) => {
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
      res.json({ "status": "success", "message": "User has been successfully deleted !" })
    });
  })
})

// GET '/users/:userId/links'
router.get('/:userId/links', (req, res) => {
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
    db.all(`
      SELECT link.id as id_link, link.tags, link.url FROM link
      INNER JOIN user ON user.id = link.user_id
      WHERE link.user_id = ?
    `, [userId], (err, rows) => {
        if (err) throw err

        res.json({ "status": "success", "links": rows || [] })
      })
  })
})

// POST '/users/:userId/links'
router.post('/:userId/links', (req, res) => {
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
    const link = new Link(null, req.body.tags, req.body.url, userId)

    if (!link.isValidForInsert()) {
      res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must pass 'tags' and 'url' in body" })
      return;
    }

    db.run(
      "INSERT INTO link(tags, url, user_id) VALUES ($tags, $url, $user_id)",
      link.toJSONDB(),
      err => {
        if (err) throw err
        res.json({ "status": "success", "message": "Link has been successfully added !" })
      }
    )

  })
})

function getLink(user_id, link_id, callback) {
  db.get("SELECT * FROM link WHERE id = ? AND user_id = ?", [link_id, user_id], (err, row) => {
    if (err) throw err

    callback(row)
  })
}

// PATCH '/users/:userId/links'
router.patch('/:userId/links/:linkId', (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!userId) {
    sendUserIdNotFound(res)
    return
  }

  const linkId = parseInt(req.params.linkId)
  if (!linkId) {
    sendLinkIdNotFound(res)
    return
  }

  const link = new Link(linkId, req.body.tags, req.body.url, null)

  // Check body for new data
  if (!link.tags && !link.url) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to pass at least 'tags' or 'url' in body" })
    return
  }

  // Check if user pass exists
  getUser(userId, ['id'], userRow => {
    if (!userRow) {
      sendUserNotExists(res)
      return
    }
    // Check if link pass exists
    getLink(userId, linkId, linkRow => {
      if (!linkRow) {
        sendLinkNotExists(res)
        return
      }
      const reqParts = link.toJSON().map(e => `${e.key} = ${e.value ? '$' : ''}${e.key}`)
      const reqUpdate = `UPDATE link SET ${reqParts.join(', ')} WHERE id = $id`

      db.run(reqUpdate, link.toJSONDB(), err => {
        if (err) throw err

        res.json({ "status": "success", "message": "Link data has been successfully updated !" })
      })
    })
  })
})

// DELETE '/users/:userId/links/:linkId'
router.delete('/:userId/links/:linkId', (req, res) => {
  const userId = parseInt(req.params.userId)
  if (!userId) {
    sendUserIdNotFound(res)
    return
  }

  const linkId = parseInt(req.params.linkId)
  if (!linkId) {
    sendLinkIdNotFound(res)
    return
  }

  getUser(userId, ['id'], user => {
    if (!user) {
      sendUserNotExists(res)
      return
    }

    getLink(userId, linkId, link => {
      if (!link) {
        sendLinkNotExists(res)
        return
      }
      db.run("DELETE FROM link WHERE id = ?", [linkId], err => {
        if (err) throw err

        res.json({ "status": "success", "message": "Link has been successfully deleted !" })
      });
    })
  })
})

module.exports = router
