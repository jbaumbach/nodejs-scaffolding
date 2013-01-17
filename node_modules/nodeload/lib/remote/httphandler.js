var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var installRemoteHandler = require('./slavenode').installRemoteHandler;
var HTTP_SERVER = require('../http').HTTP_SERVER;
}

// Install the handler for /remote for the global HTTP server
installRemoteHandler(HTTP_SERVER);