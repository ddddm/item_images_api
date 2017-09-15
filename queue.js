const Queue = require('bull');
const ChangeJob = require('./src/jobs/changeJob');

class CreateChangeQueue {
    constructor() {
        this.queue = new Queue('change creation');
        this.queue.process(job => {
            const changeJob = new ChangeJob(job.data);
            return changeJob.process()
        })
    }

    add( { spreadsheetPath, archivePath} ) {
        return this.queue.add({
            spreadsheetPath,
            archivePath
        })
            .then(job => job.id);
    }

    get(jobId) {
        return this.queue.getJob(jobId)
    }

    empty() {
        return this.queue.empty()
    }
}

module.exports = new CreateChangeQueue();
