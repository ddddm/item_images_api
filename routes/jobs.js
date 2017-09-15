var Promise = require('bluebird');
var _ = require('lodash');
var express = require('express');
var router = express.Router();
const queue = require('../queue');

router.route('/jobs/:job_id').get(function (req, res) {
    const jobId = req.params.job_id;
    queue.get(jobId)
        .then(job => Promise.all([job.isCompleted(), job])
        .spread( (jobIsCompleted, job) => {
            return res.json(
                {
                    status:'ok',
                    result: {
                        id: job.id,
                        isCompleted: jobIsCompleted
                    }
                }
            );
        }))
        .catch( (error) => {
            process.nextTick(function() { throw error; });
            res.json({status: 'error'})
        });

});


module.exports = router;