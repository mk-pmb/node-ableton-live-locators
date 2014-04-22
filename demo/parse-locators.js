/* -*- coding: UTF-8, tab-width: 2 -*- */
/*jslint indent: 2, maxlen: 80, continue: true, unparam: true, node: true */
'use strict';

var EX = exports,
  async = require('async'),
  fs = require('fs'),
  pathLib = require('path'),
  demosDir = pathLib.dirname(module.filename),
  livelocators = require('../');


EX.runFromCLI = function () {
  fs.readdir(demosDir, function rcvFilesList(err, files) {
    var chkAlsRgx = /\.als$/i;
    if (err) { throw err; }
    chkAlsRgx = chkAlsRgx.exec.bind(chkAlsRgx);
    files = files.filter(chkAlsRgx);
    console.log('found ' + files.length + ' .als files.');
    async.forEach(files, EX.withFileContents.bind(null, EX.parseAndShowAlsXml));
  });
};


EX.withFileContents = function (whenRead, fn) {
  if ('function' !== typeof whenRead) { whenRead = this; }
  fs.readFile(pathLib.join(demosDir, fn), 'UTF-8', function (err, contents) {
    if (err) {
      console.error('failed to read "' + fn + '": ' + String(err));
      return;
    }
    whenRead.call(fn, contents);
  });
};


EX.parseAndShowAlsXml = function (xml) {
  var fn = this,
    locs = livelocators.scanLocators(xml);
  console.log('Locators in file "' + fn + '": ' +
    JSON.stringify(locs, null, 2));
};










if (require.main === module) { EX.runFromCLI(); }
