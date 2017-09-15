const Queue = require('bull');

class CreateChangeQueue {
    constructor() {
        this.queue = new Queue('change creation');
        this.queue.process(job => {
            return new Promise(resolve => {
                console.log('processed', job.id);
                setTimeout(resolve, 2000);
            })
        })
    }

    add(items, zipEntries) {
        return this.queue.add({
            items,
            zipEntries,
        })
            .then(job => job.id);
    }

    get(jobId) {
        return this.queue.getJob(jobId)
    }
}

module.exports = new CreateChangeQueue();
