const { Router } = require('express')
const router = Router()

// GET '/'
router.get('/', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login')
  } else {
    res.render('index', { title: 'Home', user: req.session.user })
  }
})

module.exports = router
