const Queue = require('bull');
const ChangeJob = require('./src/jobs/changeJob');
const now = require("performance-now")

class CreateChangeQueue {
    constructor() {
        this.queue = new Queue('change creation');
        this.queue.process(async job => {
            const start = now()
            const changeJob = new ChangeJob(job.data);
            await changeJob.process();

            const end = now();
            return job.update(Object.assign(
                {
                    completedIn: (end-start).toFixed(3),
                },
                job.data,
                changeJob.result(),
            ));
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
