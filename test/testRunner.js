/**
 * User: jbaumbach
 * Date: 12/28/12
 * Time: 12:25 AM
 */

/*
    To run tests, put cursor in this file and type ctrl-alt-R.  Or, to debug tests,
    type ctrl-alt-D.
    
    See: 
        http://dailyjs.com/2011/12/08/mocha/
        http://wuntusk.blogspot.com/2012/06/using-webstorm-or-phpstorm-and-mocha.html
 */

// todo: read test files programmatically from /test directory

//var testFiles=["./test/common/testGlobalFunctions.js"]; // comma separated values of your files
//var testFiles = ["./test/data/testUserManager.js"];
var testFiles = ["./test/routes/testUser.js"];

var Mocha = require('mocha');
var mocha = new Mocha;

mocha.reporter('spec').ui('tdd');  // tdd -> Defines "suites"

for (var i =0;i<testFiles.length;i++){
    mocha.addFile(testFiles[i]);
}

var runner = mocha.run(function(){
    console.log('[*=- Finished -=*]');
});
