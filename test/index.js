var request = require('supertest'),
    express = require('express'),
    nodefu = require('../index.js'),
    should = require('should'),
    assert = require('assert'),
    fs = require('fs');
var app;

beforeEach(function() {
    app = express();
    app.use(nodefu());
});

describe('The express middleware', function() {
    //is there a better way to test this?
    it('should put a files attribute on req', function(done) {
        app.post('/', function(req, res) {
            if (req.files)
                res.sendStatus(200);
            else res.sendStatus(500);
        });

        request(app)
            .post('/')
            .attach('fieldName', './fixture/image.png')
            .expect(200, done);
    });

    it('should let the files attribute on req empty if no file', function(done) {
        app.post('/', function(req, res) {
            req.files.should.be.empty
            if (req.files.length === 0)
                res.sendStatus(200);
            else res.sendStatus(500);
        });

        request(app)
            .post('/')
            .expect(200, done);
    });
});
describe('Saving file to disk', function() {
    it('should save a file on disk', function(done) {
        app.post('/saveToDisk', function(req, res) {
            req.files.fieldName.toFile('./', 'serverSide.png', function() {
                res.sendStatus(200);
            });
        });

        request(app)
            .post('/saveToDisk')
            .attach('fieldName', './fixture/image.png')
            .end(function(err, res) {
                fs.existsSync('serverSide.png').should.be.ok;
                done();
            });
    });

    it('should be able to save multiple files', function(done) {
        app.post('/saveToDisk', function(req, res) {
            req.files.fieldName.toFile('./', 'serverSide.png', function() {
                req.files['fieldName2'].toFile('./', 'serverSide2.png', function() {
                    res.sendStatus(200);
                });
            });
        });
        request(app)
            .post('/saveToDisk')
            .attach('fieldName', './fixture/image.png')
            .attach('fieldName2', './fixture/image2.png')
            .end(function(err, res) {
                fs.existsSync('serverSide.png').should.be.ok;
                fs.existsSync('serverSide2.png').should.be.ok;
                done();
            });
    });


    after(function() {
        fs.unlinkSync('serverSide.png');
        fs.unlinkSync('serverSide2.png');
    });
});
