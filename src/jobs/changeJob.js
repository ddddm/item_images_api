var excelParser = require('../../services/excelParser');
var zipEntriesParser = require('../../services/zipEntriesParser');
var changeService = require('../../services/changeService');
var config = require('./../../config');

class ChangeJob {
    constructor({
        spreadsheetPath,
        archivePath
    }) {
        this.spreadsheetPath = spreadsheetPath;
        this.archivePath = archivePath;
        this.validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
        this.archiveEntries = null;
    }

    saveImage(image) {
        const imageName = image.entry.name;
        const imagePath = path.join(
            config.IMAGE_FILE.ABS_PATH,
            imageName
        )
        image.entry.stream(image.entry.name, function (err, imageStream) {
            if(err) {
                console.error('Error extracting stream for file: ' + image.entry.name)
                return;
            }
            const file = fs.createWriteStream(
                path.join(config.IMAGE_FILE.ABS_PATH, item.image_file)
            );
            imageStream.pipe(file);
        });
    }

    getImage(item) {
        const imageName = item.image_file;
        const itemId = item.code;
        const possibleFilename = (code, ext) => [code, ext].join('.');
        
        if (this.archiveEntries[imageName]) {
            entry = this.archiveEntries[imageName];
            entryName = imageName;
            
            return {entry, name: entryName};
        }
        
        // if the image doesn't have the exact name
        // search for file using naming convention:
        // item code + validExtension
        let entry;
        let entryName;
        _.each(this.validExtensions, ext => {
            var name = possibleFilename(item.code, ext);
            if (!entry && zipEntries[name]) {
                entry = zipEntries[name];
                entryName = name;
            }
        });
    } 

    async process() {
        const unusedFiles = [];
        const unusedItems = [];
        const invalidItems = [];
        const validItems = [];

        const [items, zipEntries] = await Promise.all([
            excelParser.exportedChange(this.spreadsheetPath),
            zipEntriesParser.parse(this.archivePath)
        ])
        this.archiveEntries = zipEntries;

        return Promise.resolve()
    }

    result() {
        return {
            items: this.items,
        }
    }
}

module.exports = ChangeJob;