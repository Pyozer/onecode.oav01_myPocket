module.exports = class User {
    constructor(id, nickname, password, email) {
        this.id = id
        this.nickname = nickname
        this.password = password
        this.email = email
    }

    isValidForInsert() {
        return this.nickname && this.password && this.email
    }

    toMap() {
        return [
            { key: "id", value: this.id },
            { key: "nickname", value: this.nickname },
            { key: "email", value: this.email },
            { key: "password", value: this.password },
        ].filter(item => item.value)
    }

    toMapWithoutId() {
        return this.toMap().filter(item => item.key != "id")
    }

    values() {
        return this.toMap().map(item => item.value)
    }

    valuesWithoutId() {
        return this.toMapWithoutId().map(item => item.value)
    }
}