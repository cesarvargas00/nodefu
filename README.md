Description
===========
multipart/form-data saving to disk made easy.

Requirements
============

* [node.js](http://nodejs.org/) -- v0.8.0 or newer
* [busboy](https://www.npmjs.com/package/busboy) -- v0.2.9 or newer
* [gridfs-stream](https://www.npmjs.com/package/gridfs-stream) -- v0.5.3 or newer
* [mongodb](https://www.npmjs.com/package/mongodb) -- v1.4.30 (haven't tested with ~2.0)


Install
=======

    npm install nodefu

#### Usage

```js
var express = require('express')
var nodefu  = require('nodefu')

var app = express()
app.use(nodefu())
```

You can access the files in the `request` object and save them to disk like this:

```js
req.files.fieldName.toFile(path,[filename],callback)
```
* `fieldName`: the name of the input field on your html
* `path`: string containing the save path
* `filename`: optional parameter string that specifies the name of the file ( if none is passed, the file name will be the same )
* `callback`: callback function with **err** and **data** attributes, respectively

And to save the uploaded files to **mongodb**, first you have to specify the mongodb path when using the middleware:

```js
app.use(nodefu('mongodb://127.0.0.1:27017/test'))
```


And now you can call this method from the request object:
```js
req.files.fieldName.toMongo([filename],callback)
```
* `fieldName`: the name of the input field on your html
* `filename`: optional parameter string that specifies the name of the file ( if none is passed, the file name will be the same )
* `callback`: callback function with **err** and **data** attributes, respectively

##### HTML

```html
<form id="uploadForm" enctype="multipart/form-data" action="/actionRoute" method="post">
    <input type="file" name="fieldName"></input>
    <input type="submit" name="submit" value="Upload File"></input>
</form>
```
