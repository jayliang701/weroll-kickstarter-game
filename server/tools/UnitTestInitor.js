/**
 * Created by Jay on 2016/1/26.
 */

var PATH = require("path");

var folderPath = PATH.dirname(module.filename);
folderPath = PATH.normalize(folderPath + "/../../");
global.APP_ROOT = folderPath;

var APP = require("weroll/App");
var app = new APP();

if (global.VARS.target) global.ENV = global.VARS.target;
else global.ENV = "localdev";