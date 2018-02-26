const chai = require('chai')
const expect = chai.expect
const toypromise = require('../index')

describe("Toy promise test", function() {
    describe("Promise A++ test", function() {
        it("should pass all test", function() {
            require("promises-aplus-tests").mocha(toypromise)
        })
    })
})