/**
 * Auteur : Ali BEN AMEUR
 */

'use strict';
const assert = require('assert');
const util = require('./basic-nodejs-server-util');
const strSync = 'sync'
const strAsync = 'async'

module.exports = {
    testAll
}

function testSplitUrl(splitUrl) {
    const tests = [
        ['/', '/', {}],
        ['/hello', '/hello', {}],
        ['/hello?', '/hello', {}],
        ['/?', '/', {}],
        ['/?hello', '/', { hello: '' }],
        ['/hello?toto=titi', '/hello', { toto: 'titi' }],
        ['/hello?toto=titi&tutu=tata', '/hello', { toto: 'titi', tutu: 'tata' }],
        ['/hello?toto=titi&tutu=ta%20ta', '/hello', { toto: 'titi', tutu: 'ta ta' }],
        ['/hello?toto=titi&tu%20tu=ta%20ta', '/hello', { toto: 'titi', 'tu tu': 'ta ta' }],
        ['/hello/world/a%20bc', '/hello/world/a bc', {}],
    ];

    for (const test of tests) {
        const [route, params] = splitUrl(test[0]);
        try {
            assert.equal(route, test[1], 'bad rute');
            assert.deepEqual(params, test[2], 'Bad params');
        } catch (error) {
            console.log('Error', error);
            console.log('expected route', test[1], 'found', route);
            console.log('expected params', test[2], 'found', params);
            console.log('testSplitUrl KO');
            return;
        }
    }
    console.log('testSplitUrl OK')
}

function testMatchRoute(matchRoute) {
    const tests = [
        {
            route_re: /\/.*/,
            routes: [
                ['/', { '$0': '/' }],
                ['/a', { '$0': '/a' }],
                ['/a/b', { '$0': '/a/b' }],
                ['', null]
            ]
        },
        {
            route_re: /\/(.*)/,
            routes: [
                ['/', { '$0': '/', '$1': '' }],
                ['/a', { '$0': '/a', '$1': 'a' }],
                ['/a/b', { '$0': '/a/b', '$1': 'a/b' }],
                ['', null]
            ]
        },
        {
            route_re: /\/a\/(.*)\/c$/,
            routes: [
                ['/a/b/c', { '$0': '/a/b/c', '$1': 'b' }],
                ['/a/b/d/c', { '$0': '/a/b/d/c', '$1': 'b/d' }],
                ['/a/b/c/d', null],
            ]
        }
        ,
        {
            route_re: /\/a\/(.*)\/(?<id>\d+)/,
            routes: [
                ['/a/b/1', { '$0': '/a/b/1', '$1': 'b', '$2': '1', id: '1' }],
                ['/a/b/123', { '$0': '/a/b/123', '$1': 'b', '$2': '123', id: '123' }],
                ['/a/b/c', null]
            ]
        }
    ];
    for (const test of tests) {
        const route_re = test.route_re;
        for (const route_test of test.routes) {
            const params = matchRoute(test.route_re, route_test[0]);
            try {
                assert.deepEqual(params, route_test[1], 'Bad params')
            }
            catch (error) {
                console.log('Error', error);
                console.log('route_re', test.route_re);
                console.log('expected route', route_test, 'found', params);
                console.log('testMatchRoute KO');
                return;
            }
        }
    }
    console.log('testMatchRoute OK');
}

let testRequests = [
    {
        method: 'GET',
        path: '/',
        resp_body: undefined
    },
    {
        method: 'GET',
        path: '/home',
        resp_body: 'Hello world !\n\n{"$0":"/home"}'
    },
    {
        method: 'GET',
        path: '/ls/test/',
        resp_body: 'test-01.json\ntest-01.response.json'
    },
    {
        method: 'POST',
        path: '/file/test/test-01.json',
        resp_body: '{'
            + '\r\n    "first_name": "Basic",'
            + '\r\n    "last_name": "http server",'
            + '\r\n    "address" : {'
            + '\r\n        "location": "github",'
            + '\r\n        "url": "https://github.com/Ali-BEN-AMEUR/basic-server"'
            + '\r\n    }'
            + '\r\n}'
    },
    {
        method: 'PUT',
        path: '/file.json/test/test-01',
        resp_body: '{'
            + '\r\n    "first_name": "Basic",'
            + '\r\n    "last_name": "http server",'
            + '\r\n    "address" : {'
            + '\r\n        "location": "github",'
            + '\r\n        "url": "https://github.com/Ali-BEN-AMEUR/basic-server"'
            + '\r\n    }'
            + '\r\n}'
    },
    {
        method: 'DELETE',
        path: '/response/test/test-01',
        resp_body: '{'
            + '\r\n    "first_name": "Basic",'
            + '\r\n    "last_name": "http server",'
            + '\r\n    "address" : {'
            + '\r\n        "location": "github",'
            + '\r\n        "url": "https://github.com/Ali-BEN-AMEUR/basic-server"'
            + '\r\n    }'
            + '\r\n}'
    }
]

async function execRequestTestsAsync(clientOptions) {
    for (const test of testRequests) {
        clientOptions.method = test.method;
        clientOptions.path = test.path;
        util.execHttpRequest(clientOptions)
            .then(res => {
                try {
                    assert.equal(res, test.resp_body);
                    console.log('Test OK', clientOptions.method, test.path);
                } catch (error) {
                    console.log('Error', error);
                    console.log('Test', clientOptions.method, test.path);
                    console.log('expected response_body\n', test.resp_body, '\ngot\n', res);
                }
            })
            .catch(err => {
                if (test.resp_body != undefined) {
                    console.log('Test', clientOptions.method, test.path);
                    console.log('expected response_body\n', test.resp_body, '\ngot error\n', err);
                } else
                    console.log('Test OK', clientOptions.method, test.path);
            });
    }
}

async function execRequestTestsSync(clientOptions) {
    let errCount = 0;
    for (const test of testRequests) {
        try {
            clientOptions.method = test.method;
            clientOptions.path = test.path;
            const res = await util.execHttpRequest(clientOptions);
            assert.equal(res, test.resp_body);
            console.log('Test OK', clientOptions.method, test.path);
        } catch (error) {
            if (test.resp_body != undefined) {
                console.log('Test', clientOptions.method, test.path);
                console.log('expected response_body\n', test.resp_body, '\ngot error\n', error);
                errCount += 1;
            } else
                console.log('Test OK', clientOptions.method, test.path);
        }
    }
    if (errCount == 0) {
        console.log('Server tests OK');
    } else {
        console.log(String.format('Server tests KO, {} errors', errCount));
    }
}

function testAll(clientOptions) {
    testSplitUrl(util.splitUrl);
    testMatchRoute(util.matchRoute);
    if (clientOptions) {
        if (strAsync in argv)
            execRequestTestsAsync(clientOptions);
        if (!(strAsync in argv) || (strSync in argv))
            execRequestTestsSync(clientOptions);
    }
}