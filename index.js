var fs = require('fs');
var Busboy = require('busboy');
var path = require('path');

module.exports = function() {
    return function(req, res, next) {
        req.files = [];
        var callback = function() {};
        if (!req.headers['content-type']) next();
        else {
            var busboy = new Busboy({
                headers: req.headers
            });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                file.on('end', function() {
                    callback();
                });
                req.files[fieldname] = {
                    toFile: function(pwd, _filename, cb) {
                        if (typeof _filename === 'function') {
                            cb = _filename;
                            _filename = filename;
                        }
                        callback = cb;
                        file.pipe(fs.createWriteStream(path.join(pwd, _filename)));
                    }
                    // ,toMongo: function() {
                    //     console.log('NotImplementedYet');
                    // }
                };
                next();
            });
            req.pipe(busboy);
        }
    };
};
