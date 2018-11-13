module.exports = class Link {
    constructor(id, tags, url, user_id) {
        this.id = id
        this.tags = tags
        this.url = url
        this.user_id = user_id
    }

    isValid() {
        return this.tags && this.url && this.user_id
    }

    toJSON() {
        return [
            { key: "id", value: this.id },
            { key: "tags", value: this.tags },
            { key: "url", value: this.url },
            { key: "user_id", value: this.user_id },
        ].filter(item => item.value)
    }

    toJSONDB() {
        let obj = {}
        if (this.id) obj['$id'] = this.id
        if (this.tags) obj['$tags'] = this.tags
        if (this.url) obj['$url'] = this.url
        if (this.user_id) obj['$user_id'] = this.user_id

        return obj
    }
}