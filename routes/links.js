const { Router } = require('express')
const router = Router({ mergeParams: true })
const { db } = require('../data/database')

const Link = require('../models/link')

function sendUserNotExists(res) {
    res.status(404).json({ "status": "error", "error": "Not found", "message": "User not exists !" })
}

function sendUserIdNotFound(res) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "Error when try to get user_id from url" })
}

function sendLinkNotExists(res) {
    res.status(404).json({ "status": "error", "error": "Not found", "message": "Link is not exists !" })
}

function sendLinkIdNotFound(res) {
    res.status(400).json({ "status": "error", "error": "Bad request", "message": "Error when try to get link_id from url" })
}

function getUser(user_id, values, callback) {
    db.get(`SELECT ${values.join(',')} FROM user WHERE id = ?`, [user_id], (err, row) => {
        if (err) throw err
        callback(row)
    })
}

// GET '/users/:userId/links'
router.get('/', (req, res) => {
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
        `, [userId], (err, links) => {
            if (err) throw err

            res.json({ "status": "success", "links": links || [] })
        })
    })
})

// POST '/users/:userId/links'
router.post('/', (req, res) => {
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

        if (!link.isValid()) {
            res.status(400).json({ "status": "error", "error": "Bad request", "message": "You must enter the tags and url" })
            return
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

function getLink(user_id, link_id, values, callback) {
    db.get(`SELECT ${values.join(',')} FROM link WHERE id = ? AND user_id = ?`, [link_id, user_id], (err, row) => {
        if (err) throw err
        callback(row)
    })
}

// GET '/users/:userId/links'
router.get('/:linkId', (req, res) => {
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

    // Check if user pass exists
    getUser(userId, ['id'], userRow => {
        if (!userRow) {
            sendUserNotExists(res)
            return
        }
        // Check if link pass exists
        getLink(userId, linkId, ['id', 'tags', 'url'], linkRow => {
            if (!linkRow) {
                sendLinkNotExists(res)
                return
            }
            res.json({ "status": "success", "link": linkRow })
        })
    })
})

// PATCH '/users/:userId/links'
router.patch('/:linkId', (req, res) => {
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
        res.status(400).json({ "status": "error", "error": "Bad request", "message": "You need to enter at least the tags or url" })
        return
    }

    // Check if user pass exists
    getUser(userId, ['id'], userRow => {
        if (!userRow) {
            sendUserNotExists(res)
            return
        }
        // Check if link pass exists
        getLink(userId, linkId, ['id'], linkRow => {
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
router.delete('/:linkId', (req, res) => {
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
        getLink(userId, linkId, ['link'], link => {
            if (!link) {
                sendLinkNotExists(res)
                return
            }
            db.run("DELETE FROM link WHERE id = ?", [linkId], err => {
                if (err) throw err

                res.json({ "status": "success", "message": "Link has been successfully deleted !" })
            })
        })
    })
})

module.exports = router
