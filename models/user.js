module.exports = class User {
    constructor(id, nickname, password, email) {
        this.id = id
        this.nickname = nickname
        this.password = password
        this.email = email
    }

    isValid() {
        return this.nickname && this.password && this.email
    }

    toJSON() {
        return [
            { key: "id", value: this.id },
            { key: "nickname", value: this.nickname },
            { key: "password", value: this.password },
            { key: "email", value: this.email },
        ].filter(item => item.value)
    }

    toJSONDB() {
        let obj = {}
        if (this.id) obj['$id'] = this.id
        if (this.nickname) obj['$nickname'] = this.nickname
        if (this.password) obj['$password'] = this.password
        if (this.email) obj['$email'] = this.email

        return obj
    }
}