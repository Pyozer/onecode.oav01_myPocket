const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  if (!req.session.user)
    res.redirect('/login')
  else {
    console.log(req.session)
    res.render('index', { title: 'Home', user: req.session.user })
  }
})

module.exports = router
