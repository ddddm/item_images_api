var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var models = require('../models');

router.route('/changes/:change_id')
    .get(function (req, res) {
        var params = {
            include: [{
                model: models['Item']
            }]
        };

        models['Change'].findById(req.params.change_id, params)
            .then(function (change) {
                res.json({status: 'ok', result: change})
            });
    });


module.exports = router;