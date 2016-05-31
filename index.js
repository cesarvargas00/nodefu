'use strict';
var fs = require('fs');
var Busboy = require('busboy');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Grid = require('gridfs-stream');
var streamifier = require('streamifier');

module.exports = function(mongoPath) {
    return function(req, res, next) {
        req.files = [];
        req.fields = {};
        var headers = req.headers['content-type'];
        if (!headers || headers.slice(0, 19) !== 'multipart/form-data') next();
        else {
            var busboy = new Busboy({
                headers: req.headers
            });
            var fieldCount = 1;
            busboy.on('file', function(fieldname, file, filename) {
                var buffer = [];
                file.on('data', function(chunk) {
                    buffer.push(chunk);
                }).on('error', function() {
                    console.log('Errors streaming the file.');
                }).on('end', function() {
                    //When streaming finishes, makes a buffer
                    var finalBuffer = Buffer.concat(buffer);
                    //Put a files[fieldname] attribute on req with an object containing two functions.
                    //The first function is responsible for saving the buffer we just saved to a file.
                    //The second function is responsible for saving the buffer we just saved to mongodb.
                    //I think I should implement a third function that only returns a readableStream, so we can pipe it inside the route function.
                    if (req.files.hasOwnProperty(fieldname)){ //checks for duplicate keys
                      fieldname += fieldCount;
                      fieldCount += 1;
                    }

                    req.files[fieldname] = {
                        toFile: function(pwd, _filename, cb) {
                            if (typeof _filename === 'function') {
                                cb = _filename;
                                _filename = filename;
                            }
                            var r = streamifier.createReadStream(finalBuffer, {})
                                .pipe(fs.createWriteStream(path.join(pwd, _filename)));

                            r.on('finish', function() {
                                cb(undefined, path.join(pwd, _filename));
                            });
                        },
                        toMongo: function(_filename, cb) {
                            if (typeof _filename === 'function') {
                                cb = _filename;
                                _filename = filename;
                            }
                            MongoClient.connect(mongoPath, function(_err, db) {
                                if (_err) cb(_err, undefined);
                                var gfs = new Grid(db, mongodb);
                                var writeStream = gfs.createWriteStream({
                                    filename: _filename
                                });
                                writeStream.on('close', function(_file) {
                                    db.close();
                                    cb(undefined, _file);
                                });

                                streamifier.createReadStream(finalBuffer, {})
                                    .pipe(writeStream);
                            });
                        }
                    };
                });
            }).on('field', function(fieldname, val) {
                req.fields[fieldname] = val;
            }).on('finish', function() {
                next();
            });
            req.pipe(busboy);
        }
    };
};
