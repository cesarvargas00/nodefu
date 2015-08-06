'use strict';

var request = require('supertest'),
    express = require('express'),
    nodefu = require('../index.js'),
    should = require('should'),
    assert = require('assert'),
    mongo = require('mongodb'),
    fs = require('fs'),
    MongoClient = require('mongodb').MongoClient;
var app;
var mongoPath = 'mongodb://127.0.0.1:27017/test';

beforeEach(function() {
    app = express();
    app.use(nodefu(mongoPath));
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
            .attach('fieldName', 'test/fixture/image.png')
            .expect(200, done);
    });

    it('should put a fields attribute on req', function(done) {
        app.post('/', function(req, res) {
            if (req.fields)
                res.sendStatus(200);
            else res.sendStatus(500);
        });

        request(app)
            .post('/')
            .field('name', 'Cesar Vargas')
            .attach('fieldName', 'test/fixture/image.png')
            .expect(200, done);
    });

    it('should let the fields attribute on req empty if no fields', function(done) {
        app.post('/', function(req, res) {
            var length = 0;
            for (var k in req.fields) {
                if (req.fields.hasOwnProperty(k)) {
                    length += 1;
                }
            }
            if (length === 0)
                res.sendStatus(200);
            else res.sendStatus(500);
        });

        request(app)
            .post('/')
            .attach('fieldName', 'test/fixture/image.png')
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
            req.files.fieldName.toFile('./', 'serverSide.png', function(err, data) {
                res.sendStatus(200);
            });
        });

        request(app)
            .post('/saveToDisk')
            .attach('fieldName', 'test/fixture/image.png')
            .end(function(err, res) {
                fs.existsSync('serverSide.png').should.be.ok;
                done();
            });
    });

    it('should be able to save multiple files', function(done) {
        app.post('/saveToDisk', function(req, res) {
            req.files.fieldName.toFile('./', 'serverSide.png', function(err, data) {
                req.files['fieldName2'].toFile('./', 'serverSide2.png', function() {
                    res.sendStatus(200);
                });
            });
        });
        request(app)
            .post('/saveToDisk')
            .attach('fieldName', 'test/fixture/image.png')
            .attach('fieldName2', 'test/fixture/image2.png')
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

describe('Saving file to mongo', function() {
    it('should save to mongo', function(done) {
        app.post('/save', function(req, res) {
            req.files.fieldName.toMongo('testing.png', function(err, data) {
                res.locals.fileId = data;
                res.json({
                    _id: data._id
                });
            });
        });
        request(app)
            .post('/save')
            .attach('fieldName', 'test/fixture/image.png')
            .end(function(err, res) {
                var Grid = require('gridfs-stream');
                MongoClient.connect(mongoPath, function(_err, db) {
                    var gfs = Grid(db, mongo);
                    gfs.exist(res.body, function(err, found) {
                        found.should.be.ok;
                        if (found) gfs.remove(res.body, function() {
                            done();
                        });
                    });
                });
            });
    });
});
