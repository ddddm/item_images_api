var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();
const queue = require('../queue');

router.route('/jobs/:job_id').get(async function (req, res) {
    const jobId = req.params.job_id;
    const job = await queue.get(jobId);
    const isCompleted = await job.isCompleted();

    return res.json(
        {
            status:'ok',
            result: {
                id: job.id,
                isCompleted,
            }
        }
    );
});


module.exports = router;