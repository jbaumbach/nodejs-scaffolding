#!/usr/bin/env node
if (process.argv.length < 4) {
    console.log('Usage: ./scripts/process_tpl <template-var-name> <source-file>');
    process.exit(1);
}

var varname = process.argv[2], src = process.argv[3];
var file = require('fs').readFileSync(src).toString();
require('util').puts('var ' + varname + '= exports.' + varname + '=' + JSON.stringify(file) + ';');