var models = require('./../models');
var _ = require('lodash');

module.exports = {
  createFromItems: function(items) {
    models['Item'].createFromList(items)
      .then(function (items) {
          return models['Change']
              .create()
              .then(function (change) {
                  return change.setItems(_.map(items, function (item) {
                      return item.item
                  }));
              })
      });
  }

}
