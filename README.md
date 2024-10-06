## Basic Node JS Server for simple API test use cases

### Usage
- run :
`node basic-server.js host=<host name> port=<port number> debug=<comma separated list>`
    - localhost is the default host
    - 8000 is the default port
    - debug can be : listner and/or file
- basic routes:
    - `GET http://<host name>:<port number>` or GET `http://<host name>:<port number>/` responds 'Page no found !' status 404
    - `GET http://<host name>:<port number>/xxx` responds 'Hello world !' status 200
    - `GET http://<host name>:<port number>/ls/<dir>/[<file pattern>]` lists files in &lt;dir&gt; that match the optional &lt;file pattern&gt;
- simple responses (get a file) for GET, POST, PUT, PATCH, or DELETE :
    - `http://<host name>:<port number>/file/<dir>/<file name>.<mime>` responds with file &lt;dir&gt/&lt;file name&gt;.&lt;mime&gt; content
    - `http://<host name>:<port number>/file.<mime>/<dir>/<file name>` responds with file &lt;dir&gt/&lt;file name&gt;.&lt;mime&gt; content
- programmed responses (set headers and get a file ) for GET, POST, PUT, PATCH, or DELETE :
    - `http://<host name>:<port number>/response/<dir>/<file name>` executes response descriped in &lt;dir&gt;/&lt;file name&gt;.response.json
    - `<file name>.response.json` format is:
        ```json
        {
            "status": "status value",
            "body": "file name",
            "headers": {
                "key1": "value1"
            },
            "echoHeaders": [
                "header1", "header2"
            ],
            "checkHeaders": {
                "key1": ["required", "regexp1"]
            },
        }
        ```
        - `status` is required, status of the response
        - `body` is optional, file name with relative to current directory
        - `headers` is required, but may be empty, at least "Content-type"
        - `echoHeaders` is optional, list of request headers to return as headers in the response
        - `checkHeaders` is optional, list of request headers to check using regular expressions
            - `key1`: header
            - `"required"` : true (required) or false (optional)
            - `regexp1`: regular expression to match value of header
            - response status is 400 if required header is not received or if value doesn't match regexp


See examples of requests in file `basic-nodejs-server-tests`

### Test the server
- run : `node basic-nodejs-exec-tests.js host=<host name> port=<port number> [sync|async|sync async]`

### Extend the server with new use cases
- Add new routes to variable `routes`
    - A route is :
    ```js
        {
        method: /regular expression with accepted http methods/,
        route: /regular expression for route and parameters/,
        controller: controller_function
        },

    ``` 
- ...