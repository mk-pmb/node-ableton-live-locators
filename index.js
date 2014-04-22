/* -*- coding: UTF-8, tab-width: 2 -*- */
/*jslint indent: 2, maxlen: 80, continue: true, unparam: true, node: true */
'use strict';

var EX = exports,
  hasOwn = Function.call.bind(Object.hasOwnProperty),
  xmlentities = require('xml-entities'),
  through = require('through');


EX.scanLocatorsInXml = function (xml, opts, resutsRcv) {
  var locs;
  if (!opts) { opts = {}; }
  if ('function' === typeof opts) {
    resutsRcv = opts;
    opts = {};
  }
  if ('function' !== typeof resutsRcv) { resutsRcv = null; }
  try {
    locs = String(xml).split(/<Locator>/i).slice(1).map(function (tag) {
      return EX.scanXmlAttribValues(tag, {
        attrName: (opts.attrName || 'value')
      });
    });
  } catch (err) {
    if (resutsRcv) { return resutsRcv(err, null); }
    throw err;
  }
  if (resutsRcv) { return resutsRcv(null, locs); }
  return locs;
};


EX.defaultAttConvert = {};
EX.defaultAttConvert.locator = {
  LomId: Number,
  Time: Number,
  IsSongStart: JSON.parse.bind(JSON),
};


EX.createLocatorsScanner = function (opts) {
  var ctx = { buf: '', skipForward: true }, rcvInputChunk;
  if (!opts) { opts = {}; }
  ctx.tagName = String(opts.tagName || 'Locator');
  ctx.tagStartRgx = ctx.tagName + '[/>\\s\\n]';
  ctx.tagOpenRgx = new RegExp('<' + ctx.tagStartRgx, 'i');
  ctx.tagCloseRgx = new RegExp('</' + ctx.tagStartRgx, 'i');
  ctx.bufSize = (opts.bufSize || 128);
  ctx.attrOpts = {
    attrName: (opts.attrName || 'value'),
    attrConvert: (opts.attrConvert ||
      EX.defaultAttConvert[ctx.tagName.toLowerCase()]),
  };
  rcvInputChunk = function (chunk) {
    var self = this, tags;
    ctx.buf += String(chunk || '');
    tags = ctx.buf.split(ctx.tagOpenRgx);
    tags.forEach(function (tag) {
      tag = tag.split(ctx.tagCloseRgx);
      ctx.buf = tag.pop();
      if (tag.length < 1) {
        // this tag is not yet closed, wait for more content
        return;
      }
      self.queue(EX.scanXmlAttribValues(tag[0], ctx.attrOpts));
    });
    if (ctx.skipForward) { ctx.buf = ctx.buf.substr(-ctx.bufSize); }
  };
  return through(rcvInputChunk);
};


EX.xmlIdentifierRgx = '[a-z0-9\\-]+';


EX.mkStrEqualChk = function (str) {
  str = String(str);
  return function (candidate) { return (String(candidate) === str); };
};


EX.scanXmlAttribValues = function (xml, opts) {
  var tagRgx, dataSet = {}, attrConvs;
  if (!opts) { opts = {}; }
  tagRgx = new RegExp('<(' + EX.xmlIdentifierRgx +
    ')[\\s\\n]*(' + (opts.attrName || EX.xmlIdentifierRgx) +
    ')="([\\x00-\\!\\#-\\uFFFF]*)"', 'ig');
  /*
  if (attrNameFilter) {
    if (attrNameFilter instanceof RegExp) {
      attrNameFilter = tagRgx.exec.bind(attrNameFilter);
    }
    if ('function' !== typeof attrNameFilter) {
      attrNameFilter = EX.mkStrEqualChk(attrNameFilter);
    }
  }
  */
  attrConvs = (opts.attrConvert || false);
  if ('function' === typeof attrConvs) { attrConvs = { '*': attrConvs }; }
  xml.replace(tagRgx, function (tagCode, tagName, attrName, attrVal) {
    var dataKey = tagName;
    if (opts.attrNameFilter) {
      if (!opts.attrNameFilter(attrName)) { return tagCode; }
    }
    if (hasOwn(dataSet, dataKey)) {
      throw new Error('scanXmlAttribValues: duplicate dataKey "' + dataKey +
        '" in XML input ' + xml);
    }
    try {
      attrVal = xmlentities.decode(attrVal);
      if (attrConvs) {
        attrVal = (attrConvs[dataKey] || attrConvs['*'] || String)(attrVal);
      }
      dataSet[dataKey] = attrVal;
    } catch (xmlDecodeErr) {
      xmlDecodeErr.dataKey = dataKey;
      xmlDecodeErr.xmlInput = xml;
      throw xmlDecodeErr;
    }
    return tagCode;
  });
  return dataSet;
};


EX.runFromCLI = function () {
  process.stdin.pipe(EX.createLocatorsScanner()).on('data', function (loc) {
    console.dir(loc);
  });
};







if (require.main === module) { EX.runFromCLI(); }
