/**
 * Auteur : Ali BEN AMEUR
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const util = require('./basic-nodejs-server-util');

const strDbug = 'debug';
const strHW = 'Hello world !\n';
const strTrc = 'Trace\n';
const str404 = 'Page not found !\n';
const str500 = 'Internal server error !\n';
const strListner = 'listner';
const strFile = 'file';
const strEchoHeaders = 'echoHeaders';
const strCheckHeaders = 'checkHeaders';
const rextResponse = '.response.json';
const strBody = 'body';
const strNl = '\n';
const strContentType = 'Content-Type';
const defaultMime = 'application/octet-stream';
const textMime = 'text/plain';
const mimes = {
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.ics': 'text/calendar',
    '.txt': textMime,
    '.xml': 'application/xml'

};
const regexpAny = /.*/;
const reValidMethod = /GET|POST|PUT|PATCH|DELETE|HEAD|CONNECT|OPTIONS|TRACE/i;
const regexpCRUD = /GET|POST|PUT|PATCH|DELETE/i;
const regexpGet = /GET/i;
const regexpPost = /POST/i;
const regexpPut = /PUT/i;
const regexpPatch = /PATCH/i;

argv = util.parseArgv();
if (!(strDbug in argv)) {
    argv[strDbug] = '';
}

const port = util.getPort(argv);
const host = util.getHost(argv);
const debugging = x => argv[strDbug].includes(x);

function fillResponse(response, status, message, queryParams, mime = textMime) {
    response.setHeader(strContentType, mime);
    response.writeHead(status);
    if (message != '') {
        response.write(message);
        response.write(strNl);
    }
    response.write(JSON.stringify(queryParams));
    response.end();
}

function controllerTrace(request, response, queryParams) {
    console.log('controllerTrace BEGIN');
    fillResponse(response, 200, strTrc, queryParams);
    const { headers, method, url } = request;
    console.log('method', method, 'url', url);
    console.log('headers', headers);
    console.log('queryParams', queryParams);
    console.log('controllerTrace END');
}

function controller200(request, response, queryParams) {
    console.log('basicController BEGIN');
    fillResponse(response, 200, strHW, queryParams);
    console.log('basicController END');
}

function controller404(request, response, queryParams) {
    console.log('controller404 BEGIN');
    fillResponse(response, 404, str404, queryParams);
    console.log('controller404 END');
}

function controller500(request, response, queryParams) {
    console.log('controller500 BEGIN');
    fillResponse(response, 500, str500, queryParams);
    console.log('controller500 END');
}

function controllerFile(request, response, queryParams) {
    console.log('controllerfile BEGIN');
    const mime = (queryParams.mime in mimes) ? mimes[queryParams.mime] : defaultMime;
    try {
        const data = fs.readFileSync(queryParams.dir + queryParams.filename + queryParams.mime);
        response.setHeader(strContentType, mime);
        response.writeHead(200);
        response.write(data);
        response.end();
        if (debugging(strFile))
            console.log(queryParams.dir + queryParams.filename + queryParams.mime, mime, data);
    } catch (err) {
        controller500(request, response, queryParams);
        console.error('controllerfile Error', err);
    }
    console.log('controllerfile END');
}

function controllerLsFile(request, response, queryParams) {
    console.log('controllerLsFile BEGIN');
    dirFilter = queryParams.dir.slice(1);  // on enlève le slash d'entête (chemin relatif)
    try {
        const dirContent = fs.readdirSync(dirFilter);
        data = [];
        pattern = null;
        if (queryParams.filename != '') {
            pattern = new RegExp(queryParams.filename);
        }
        dirContent.forEach(file => {
            if (debugging(strFile))
                console.log(file);
            if ((pattern == null) || file.match(pattern)) {
                data.push(file);
            }
        });
    } catch (err) {
        controller500(request, response, queryParams);
        console.error('controllerLsFile Error', err);
        console.log('controllerLsFile END');
        return;
    }
    response.setHeader(strContentType, textMime);
    response.writeHead(200);
    if (0 < data.length)
        response.write(data.join(strNl));
    response.end();
    if (debugging(strFile))
        console.log(queryParams.dir, queryParams.filename);
    console.log('controllerLsFile END');
}

function checkHeaders(response, headers, checkHeaders, queryParams) {
    for (hdr in checkHeaders) {
        if (checkHeaders[hdr][0] && !(hdr in headers)) {
            fillResponse(response, 400, 'Missing header ' + hdr, queryParams);
            return false;
        }
        if (hdr in headers && (checkHeaders[hdr][1] != '')) {
            const re = new RegExp(checkHeaders[hdr][1]);
            if (!headers[hdr].match(re)) {
                fillResponse(response, 400, 'Bad value for header ' + hdr, queryParams);
                return false;
            }
        }
    }
    return true;
}

function controllerResponse(request, response, queryParams) {
    console.log('controllerResponse BEGIN');
    try {
        const respDesc = JSON.parse(fs.readFileSync(queryParams.path_file + rextResponse));
        if ((strCheckHeaders in respDesc)
             && !checkHeaders(response, request.headers, respDesc.checkHeaders, queryParams)) {
                console.log('controllerResponse END');
                return;
        }
        for (hdr in respDesc.headers) {
            response.setHeader(hdr, respDesc.headers[hdr]);
        }
        if (strEchoHeaders in respDesc) {
            for (hdr of respDesc.echoHeaders) {
                if (hdr in request.headers)
                    response.setHeader(hdr, request.headers[hdr]);
            }
        }
        if (strBody in respDesc && respDesc.body != null && respDesc.body != '') {
            fileName = path.dirname(queryParams.path_file) + path.sep + respDesc.body;
            const data = fs.readFileSync(fileName);
            response.writeHead(respDesc.status);
            response.write(data);
        } else {
            response.writeHead(respDesc.status);
        }
        response.end();
    } catch (err) {
        controller500(request, response, queryParams);
        console.error('controllerLsFile Error', err);
    }
    console.log('controllerResponse END');
}

routes = [
    {
        method: regexpCRUD,
        route: /^\/file\/(?:(?<dir>(?:[^\/]+\/)+)(?<filename>[^\/]+)(?<mime>\.[^\/]+))$/,
        controller: controllerFile
    },
    {
        method: regexpCRUD,
        route: /^\/file(?<mime>\.[^\/]+)\/(?:(?<dir>(?:[^\/]+\/)+)(?<filename>[^\/]+))$/,
        controller: controllerFile
    },
    {
        method: regexpGet,
        route: /^\/ls(?:(?<dir>(?:\/[^\/]+)+)\/(?<filename>[^\/]*))$/,
        controller: controllerLsFile // controllerTrace
    },
    {
        method: regexpCRUD,
        route: /^\/response\/(?<path_file>[\/\w\W]+)$/,
        controller: controllerResponse // controllerTrace
    },
    {
        method: reValidMethod,
        route: /(\/\w+)+?/g,
        controller: controller200
    },
    {
        method: reValidMethod,
        route: regexpAny, // /^.*$/,
        controller: controller404
    }
]

const server = http.createServer(function (req, resp) { util.basicRequestListener(req, resp, routes, debugging(strListner)) });
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
    if (strDbug in argv && argv[strDbug] && argv[strDbug] != '')
        console.log('Debug mode:', argv[strDbug]);
});
