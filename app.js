const createError = require('http-errors')
const express = require('express')
const session = require('express-session')
const path = require('path')
const logger = require('morgan')
const { dbInitialize } = require('./data/database')

// Init database table
dbInitialize()

// Routes index
const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')

const app = express()
const PORT = 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(session(
  {
    secret: 'VerySecureKey',
    cookie: { maxAge: 60000 }
  }
))

// Global routes
app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/login', authRouter.loginRouter)
app.use('/register', authRouter.registerRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // render the error page
  res.status(err.status || 500)
  res.render('error', { err: err, title: `${err.status} | ${err.message}` })
})

// Start server
app.listen(PORT, () => console.log(`Server running and listening on port ${PORT}!`))
