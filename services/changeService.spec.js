const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const chai = require('chai');
const assert = require('chai').assert;

const changeService = require('./changeService');
const processItem = changeService.processItem;

describe('changeService', () => {
    describe('processItem', () => {

        it('should return a stream if found an image', () => {
            assert(false)
        })
        it('should return null if no image', () => {
            const results = processItem({}, null, {});
            assert(results.imageStream === null)
        })
        it('should return a stream', () => {
        })
        it('should return a stream', () => {
        })
    })
    
})
