var fs = require('fs');
var Busboy = require('busboy');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Grid = require('gridfs-stream');

module.exports = function(mongoPath) {
    return function(req, res, next) {
        req.files = [];
        if (!req.headers['content-type']) next();
        else {
            var busboy = new Busboy({
                headers: req.headers
            });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                req.files[fieldname] = {
                    toFile: function(pwd, _filename, cb) {
                        if (typeof _filename === 'function') {
                            cb = _filename;
                            _filename = filename;
                        }
                        file.on('end', function() {
                            cb(undefined, path.join(pwd, _filename));
                        });
                        file.on('error', function(err) {
                            cb(err, undefined);
                        });
                        file.pipe(fs.createWriteStream(path.join(pwd, _filename)));
                    },
                    toMongo: function(_filename, cb) {
                        if (typeof _filename === 'function') {
                            cb = _filename;
                            _filename = filename;
                        }
                        MongoClient.connect(mongoPath, function(_err, db) {
                            if (_err) cb(_err, undefined);
                            var gfs = Grid(db, mongodb);
                            var writeStream = gfs.createWriteStream({
                                filename: _filename
                            });
                            writeStream.on('close', function(_file) {
                                db.close();
                                cb(undefined, _file);
                            });
                            file.pipe(writeStream);
                        });
                    }
                };
                next();
            });
            req.pipe(busboy);
        }
    };
};
