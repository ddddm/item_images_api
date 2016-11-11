var models = require('./../models');
var _ = require('lodash');
var Promise = require('bluebird');

var validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

module.exports = {
    createItemsSequentially: function(items) {
        return Promise.reduce(
            items,
            function (total, item) {
                return models['Item']
                    .findOrCreate({
                        where: {
                            code: item.code
                        },
                        defaults: {
                            name: item.name,
                            description: item.description,
                            image_file: item.image_file
                        }

                    })
                    .spread(function (item) {
                        if(!total[item.id]) total[item.id] = item;
                        return total;
                    })
            },
            {}
        )
    },

    createFromItems: function(items) {
        return this.createItemsSequentially(items)
          .then(function (itemsHash) {
              return models['Change']
                  .create()
                  .then(function (change) {
                      change.setItems(_.values(itemsHash));
                      return change;
                  })
          });
    },

    findImage: function (item, zipEntries) {
        var entry, entryName;

        if (zipEntries[item.image_file]) {
            entry = zipEntries[item.image_file];
            entryName = item.image_file;
        }

        // if the image doesn't have the exact name
        // search for file using naming convention:
        // item code + validExtension

        function possibleFilename(code, ext) {
            return [code, ext].join('.');
        }

        _.each(validExtensions, function (ext) {
            var name = possibleFilename(item.code, ext);
            if (!entry && zipEntries[name]) {
                entry = zipEntries[name];
                entryName = name;
            }
        });

        if (entry) {
            return {entry: entry, name: entryName};
        }
        else {
            return null;
        }
    }
};
