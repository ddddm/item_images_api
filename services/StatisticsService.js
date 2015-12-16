"use strict";
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = {
    analyzeChangedItems: function(items) {
        var stats = {
            created: 0,
            found: 0
        };
        _.each(items, function (item) {
            if(item.created) {
                stats.created++
            } else {
                stats.found++
            }
        });

        return stats;
    }
};