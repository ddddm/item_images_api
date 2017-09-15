class ChangeJob {
    constructor({
        spreadsheetPath,
        archivePath
    }) {
        this.spreadsheetPath = spreadsheetPath;
        this.archivePath = archivePath;
    }

    async process() {
        return Promise.resolve()
    }
}

module.exports = ChangeJob;