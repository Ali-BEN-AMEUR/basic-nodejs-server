/**
 * Auteur : Ali BEN AMEUR
 */

const test = require('./basic-nodejs-server-tests');
const util = require('./basic-nodejs-server-util');

argv = util.parseArgv();
let clientOptions = {
    host: util.getHost(argv),
    port: util.getPort(argv),
    method: 'GET',
    headers: {
        'Accept': '*/*'
    },
    timeout: 1000
};

test.testAll(clientOptions);
