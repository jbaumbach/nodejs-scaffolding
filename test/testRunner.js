/*
    The vast majority of the time you will run your tests from the terminal with 
    the command:

      $ mocha --recursive --reporter spec
    
    That runs all the tests that it finds in the "./test" directory, including all
    subdirectories, using the nice formatting provided by the "spec" reporter.
    
    Occasionally, a test will fail and you don't know why.  In that case, it's useful
    to debug the test and your code.  That's where this file comes in.
    
    To debug tests in "WebStorm", put cursor in this file and type ctrl-alt-D.
    
    See: 
        http://dailyjs.com/2011/12/08/mocha/
        http://wuntusk.blogspot.com/2012/06/using-webstorm-or-phpstorm-and-mocha.html
 */

//
// Add the test file(s) you want to debug here.
//
//var testFiles = ["./test/routes/testUser.js"];
var testFiles = ["./test/common/testAuthorization.js"];

//var testFiles = ["./test/common/testGlobalFunctions.js"];
//var testFiles = ["./test/data/testUserManager.js"];

var Mocha = require('mocha');
var mocha = new Mocha;

mocha.reporter('spec').ui('tdd');  // 'tdd' -> Defines "suites"

for (var i =0;i<testFiles.length;i++){
    mocha.addFile(testFiles[i]);
}

var runner = mocha.run(function(){
    console.log('[*=- Finished -=*]');
});
