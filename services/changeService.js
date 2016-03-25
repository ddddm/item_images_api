var models = require('./../models');
var _ = require('lodash');
var Promise = require('bluebird');

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
                    .spread(function (item, created) {
                        total.push(item);
                        return total;
                    })
            },
            []
        )
    },

    createFromItems: function(items) {
        return this.createItemsSequentially(items)
          .then(function (items) {
              return models['Change']
                  .create()
                  .then(function (change) {
                      return change.setItems(items);
                  })
          });
  }
};
