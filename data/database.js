const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./onecode_oav01.db')

module.exports = db