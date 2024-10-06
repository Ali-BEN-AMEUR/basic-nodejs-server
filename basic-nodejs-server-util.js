/**
 * Auteur : Ali BEN AMEUR
 */

'use strict';

const http = require('node:http');
const querystring = require('node:querystring');
const isIterable = x => !!(x && x[Symbol.iterator]);
const isFunction = x => !!(x && x.constructor && x.call && x.apply);
const strHost = 'host';
const strPort = 'port';
const strLocalHost = 'localhost';
const defaultHost = strLocalHost;
const defaultPort = 8000;


module.exports = {
    splitUrl,
    matchRoute,
    basicRequestListener,
    parseArgv,
    getHost,
    getPort,
    execHttpRequest
};

function splitUrl(url) {
    var route = '';
    var params = {};
    const splittedUrl = url.split('?');
    route = querystring.unescape(splittedUrl[0]);
    if (1 < splittedUrl.length) {
        const paramsBrut = querystring.parse(splittedUrl[1]);
        for (const k in paramsBrut) {
            params[querystring.unescape(k)] = querystring.unescape(paramsBrut[k]);
        }
    }
    return [route, params];
}

function matchRoute(exp, route) {
    const m = route.match(exp);
    if (m === null)
        return null;
    var groups = {};
    for (let i = 0; i < m.length; i++) {
        groups['$' + i] = m[i];
    }
    if (m.groups != undefined) {
        groups = { ...groups, ...m.groups };
    }
    return groups
}

function basicRequestListener(request, response, routes, dbug = false) {
    const { headers, method, url } = request;
    if (dbug)
        console.log('basicRequestListener BEGIN with method', method, 'url', url, 'headers', headers);
    var [askedRoute, queryParams] = splitUrl(url);
    for (const route of routes) {
        if (method.match(route.method) == null)
            continue;
        const routeArgs = matchRoute(route.route, askedRoute);
        if (routeArgs == null)
            continue;
        if (dbug)
            console.log('found route', route.method, route);
        const kwargs = { ...queryParams, ...routeArgs };
        try {
            if (dbug)
                console.log('calling controller', route.controller, 'with', kwargs);
            route.controller(request, response, kwargs);
            if (dbug)
                console.log('returned from', route.controller);
        } catch (error) {
            response.setHeader("Content-Type", "text/plain");
            response.writeHead(500);
            response.end('Internal server error');
            console.log('Route caused an internal server error', method, url, headers);
        }
        if (dbug)
            console.log('basicRequestListener END');
        return;
    }
    response.setHeader("Content-Type", "text/plain");
    response.writeHead(404);
    response.end('Page not found');
    console.log('Route not found for', method, url, headers);
    if (dbug)
        console.log('basicRequestListener END Route not found');
};

function parseArgv() {
    const argv = process.argv.slice(2);

    let args = {}
    for (const arg of argv) {
        let [k, v] = arg.split('=');
        if (k.startsWith('-')) {
            k = k.slice(1);
        }
        args[k] = v;
    }
    return args
}

function getHost(argv={}) {
    return (strHost in argv) ? argv[strHost] : defaultHost;
}

function getPort(argv={}) {
    return (strPort in argv) ? parseInt(argv[strPort]) : defaultPort;
}

async function execHttpRequest(options, data=null) {
    return new Promise((resolve, reject) => {
        const request = http.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                return reject(new Error(`HTTP status code ${res.statusCode}`))
            }
            const body = []
            res.on('data', (chunk) => body.push(chunk))
            res.on('end', () => {
                const resString = Buffer.concat(body).toString()
                resolve(resString)
            })
        });
        request.on('error', (err) => {
            reject(err);
        });
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('timed out'))
        });
        if (data != null) {
            execHttpRequest.write(data);
        }
        // http(s).request mut be ended to be executed
        request.end();
    })
}

