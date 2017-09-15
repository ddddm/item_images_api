var excelParser = require('../../services/excelParser');
var zipEntriesParser = require('../../services/zipEntriesParser');
var changeService = require('../../services/changeService');

class ChangeJob {
    constructor({
        spreadsheetPath,
        archivePath
    }) {
        this.spreadsheetPath = spreadsheetPath;
        this.archivePath = archivePath;
        this.items = null;
    }

    async process() {
        const unusedFiles = [];
        const unusedItems = [];
        const invalidItems = [];
        const validItems = [];

        const [items, zipEntries] = await Promise.all([
            excelParser.parse(this.spreadsheetPath),
            zipEntriesParser.parse(this.archivePath)
        ])
        this.items = items;
        return Promise.resolve()
    }

    result() {
        return {
            items: this.items,
        }
    }
}

module.exports = ChangeJob;