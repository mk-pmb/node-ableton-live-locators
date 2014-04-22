/* -*- coding: UTF-8, tab-width: 2 -*- */
/*jslint indent: 2, maxlen: 80, continue: true, unparam: true, node: true */
'use strict';

var EX = exports,
  async = require('async'),
  fs = require('fs'),
  pathLib = require('path'),
  demosDir = pathLib.dirname(module.filename),
  zlib = require('zlib'),
  livelocators = require('../');


EX.runFromCLI = function () {
  fs.readdir(demosDir, function rcvFilesList(err, files) {
    var fileCounts = { xml: 0, xmlgz: 0 },
      xmlgzRgx = /\.(als|xml\.gz)$/i,
      xmlRgx = /\.xml$/i;
    if (err) { throw err; }
    files.forEach(function (fn) {
      var stream = null, ftype = null, locs = [];
      if (xmlgzRgx.exec(fn)) { ftype = 'xmlgz'; }
      if (xmlRgx.exec(fn)) { ftype = 'xml'; }
      if (!ftype) { return; }
      fileCounts[ftype] += 1;
      stream = fs.createReadStream(pathLib.join(demosDir, fn), {
        encoding: (ftype === 'xml' ? 'UTF-8' : null),
        bufferSize: 16
      });
      if (ftype === 'xmlgz') {
        stream = stream.pipe(zlib.createGunzip());
      }
      stream = stream.pipe(livelocators.createLocatorsScanner());
      stream.on('data', function collect(data) { locs[locs.length] = data; });
      stream.on('end', function display() {
        console.log('locators in file "' + fn + '": ' +
          JSON.stringify(locs, null, 2));
      });
    });  // with each file
    console.log('files found: ' + JSON.stringify(fileCounts));
  });  // scan dir
};









if (require.main === module) { EX.runFromCLI(); }
