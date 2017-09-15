var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();
const queue = require('../queue');

router.route('/jobs/:job_id').get(async function (req, res) {
    const jobId = req.params.job_id;
    try {
        const job = await queue.get(jobId);
        const isCompleted = await job.isCompleted();
    
        return res.json({
            status:'ok',
            result: Object.assign({
                isCompleted,
            }, job.data)
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: 'Job does not exist',
        })
    }
});


module.exports = router;