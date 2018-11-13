const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(`${__dirname}/onecode_oav01.db`)

function dbInitialize() {
    db.serialize(_ => {
        db.get("PRAGMA foreign_keys = ON")
        db.run(
            `CREATE TABLE IF NOT EXISTS user (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                nickname VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(320)
            )`
        )

        db.run(
            `CREATE TABLE IF NOT EXISTS link (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                tags VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL,
                user_id INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
            )`
        )
    })
}

module.exports = {
    db,
    dbInitialize
}