'use strict';

const semver = require( 'semver' );
const Terser = require( 'terser' );

const controllerName = 'exegesis-plugin-clientapi';
const methods = [ 'head', 'get', 'post', 'put', 'delete', 'connect', 'options', 'trace', 'patch' ];

function createAPIFunction( pathObject, operationObject ) {
    let clientOperation = {
        pathParameters: [],
        queryParameters: []
    };
    if( operationObject.parameters ) {
        for( let parameter of operationObject.parameters ) {
            if( parameter.in === 'path' ) {
                clientOperation.pathParameters.push( parameter.name );
            } else if( parameter.in === 'query' ) {
                clientOperation.queryParameters.push( parameter.name );
            }
        }
    }
    if( operationObject.requestBody ) {
        clientOperation.hasBody = true;
        clientOperation.requiresBody = operationObject.requestBody.required;
    }
    return clientOperation;
}

async function fetch( url, options ) {
    console.log( url );
    console.log( JSON.stringify( options, null, ' ' ) );
}

class ClientAPIPlugin {
    constructor( apiDoc, options ) {
        // Verify the apiDoc is an OpenAPI 3.x.x document, because this plugin
        // doesn't know how to handle anything else.
        if( !apiDoc.openapi ) {
            throw new Error( "OpenAPI definition is missing 'openapi' field" );
        }

        if( !semver.satisfies( apiDoc.openapi, '>=3.0.0 <4.0.0' ) ) {
            throw new Error( `OpenAPI version ${apiDoc.openapi} not supported` );
        }

        options = Object.assign({ path: '/client/api.js' }, options );
        this._options = options;

        apiDoc.paths[options.path] = {
            'get': {
                summary: 'Load the client API',
                'x-exegesis-controller': controllerName,
                'x-exegesis-clientapi-skip': true,
                operationId: 'get ' + options.path,
                security: [],
                responses: {
                    '200': {
                        description: 'The client API',
                        content: {
                            'text/plain': {
                                schema: { type: 'string' }
                            }
                        }
                    }
                }
            }
        };
    }

    preCompile({ apiDoc, options }) {
        var pluginOptions = this._options;

        var clientOperations = {};
        class ClientAPI {
            constructor() {
                return new Proxy( this, {
                    has: function( object, property ) {
                        if( typeof( property ) !== 'string' || Reflect.has( object, property ) ) {
                            return true;
                        }
                        return clientOperations.hasOwnProperty( property );
                    },
                    get: function( object, property ) {
                        if( typeof( property ) !== 'string' || Reflect.has( object, property ) ) {
                            return Reflect.get( object, property );
                        }
                        return Reflect.get( object, '$handleAPIOperation' ).bind( object, property );
                    }
                });
            }
            async $handleAPIOperation( operationName, ...inputParameters ) {
                let[ method, url ] = operationName.split( ' ', 2 );
                let operation = clientOperations[operationName];
                let body = undefined;
                let headers = {};
                for( let parameterName of operation.pathParameters ) {
                    let parameterValue = inputParameters.shift();
                    if( parameterValue === undefined || parameterValue === null ) {
                        throw Error( `Value for parmeter ${parameterName} is missing` );
                    }
                    if( typeof( parameterValue ) === 'object' ) {
                        throw Error( `Path parameter ${parameterName} must be a scalar value` );
                    }
                    url = url.replace( `{${parameterName}}`, parameterValue.toString() );
                }
                url = new URL( url, window.location.origin );
                if( operation.queryParameters.length > 0 ) {
                    let qs = inputParameters.shift() || {};
                    Object.keys( qs ).forEach( key => url.searchParams.append( key, qs[key] ) );
                }
                if( operation.hasBody && method !== 'get' && method !== 'head' ) {
                    body = inputParameters.shift();
                    if( operation.requiresBody && ( body === null || body === undefined ) ) {
                        throw Error( `Body is required` );
                    }
                    if( typeof( body ) === 'object' ) {
                        headers['content-type'] = 'application/json';
                        body = JSON.stringify( body );
                    }
                }
                if( inputParameters.length ) {
                    throw Error( `Extra parameters were provided` );
                }
                return fetch( url, {
                    method: method,
                    headers: headers,
                    body: body
                }).then( response => {
                    if( !response.ok ) {
                        let e = new Error( response.statusText );
                        e.response = response;
                        let contentType = response.headers.get( 'Content-Type' );
                        if( contentType.startsWith( 'application/json' ) ) {
                            return response.json().then( data => {
                                e.message = data.message || JSON.strigify( data );
                                e.data = data;
                                throw e;
                            });
                        } else if( contentType.startsWith( 'text/' ) ) {
                            return response.text().then( data => {
                                e.message = data;
                                throw e;
                            });
                        } else {
                            throw e;
                        }
                    }
                    if( response.status === 200 ) {
                        let contentType = response.headers.get( 'Content-Type' );
                        if( contentType.startsWith( 'application/json' ) ) {
                            return response.json();
                        } else if( contentType.startsWith( 'text/' ) ) {
                            return response.text();
                        } else if( contentType.startsWith( 'multipart/form-data' ) ) {
                            return response.formData();
                        }
                    }
                });
            }
        }

        for( let path of Object.keys( apiDoc.paths ) ) {
            let pathObject = apiDoc.paths[path];
            for( let method of methods ) {
                let operationObject = pathObject[method];
                if( !pathObject['x-exegesis-clientapi-skip'] && operationObject && !operationObject['x-exegesis-clientapi-skip'] ) {
                    clientOperations[`${method} ${path}`] = createAPIFunction( pathObject, operationObject );
                }
            }
        }

        options.controllers[controllerName] = options.controllers[controllerName] || {};
        options.controllers[controllerName]['get ' + pluginOptions.path ] = async function( context ) {
            var apiText = `const clientOperations = ${JSON.stringify( clientOperations, null, '  ' )};\nexport default ${ClientAPI.toString()}`;

            var clientAPI = {};
            clientAPI[pluginOptions.path] = apiText;
            var minified = Terser.minify( clientAPI );
            context.res.set( 'content-type', 'application/javascript' );
            return minified.code;
        };
    }
}

module.exports = function plugin( options ) {
    return{
        info: {
            name: 'exegesis-plugin-clientapi'
        },
        options: options,
        makeExegesisPlugin: function makeExegesisPlugin({ apiDoc }) {
            return new ClientAPIPlugin( apiDoc, options );
        }
    };
};
