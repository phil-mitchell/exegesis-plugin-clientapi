'use strict';

const semver = require( 'semver' );
const Terser = require( 'terser' );

const controllerName = 'exegesis-plugin-clientapi';
const methods = [ 'head', 'get', 'post', 'put', 'delete', 'connect', 'options', 'trace', 'patch' ];

const files = {
    'api.js': {
        type: 'module',
        minified: false
    },
    'api.min.js': {
        type: 'module',
        minified: true
    }
};

function createAPIFunction( pathObject, operationObject, globalSecurity ) {
    let clientOperation = {
        pathParameters: [],
        queryParameters: [],
        security: operationObject.security ?
            ( operationObject.security || [] ).reduce( ( acc, x ) => acc.concat( Object.keys( x ) ), [] ) :
            globalSecurity
    };
    if( operationObject.parameters ) {
        for( let parameter of operationObject.parameters ) {
            if( parameter.in === 'path' ) {
                clientOperation.pathParameters.push( parameter.name );
            } else if( parameter.in === 'query' ) {
                clientOperation.queryParameters.push( parameter.name );
            } else if( parameter.in === 'header' ) {
                clientOperation.headerParameters.push( parameter.name );
            } else if( parameter.in === 'cookie' ) {
                clientOperation.sendCookies = true;
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

        options = Object.assign({ path: '/client' }, options );
        this._options = options;

        apiDoc.paths = apiDoc.paths || {};
        for( let file of Object.keys( files ) ) {
            let path = options.path + '/' + file;
            apiDoc.paths[path] = {
                'get': {
                    summary: 'Load the client API',
                    'x-exegesis-controller': controllerName,
                    'x-exegesis-clientapi-skip': true,
                    operationId: 'get ' + path,
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
    }

    preCompile({ apiDoc, options }) {
        var pluginOptions = this._options;

        var clientOperations = {};
        var securitySchemes = Object.assign({}, ( apiDoc.components || {}).securitySchemes || {});
        var allowCORS = !!pluginOptions.allowCORS;
        class ClientAPI {
            constructor( fetchArgs ) {
                this._fetchArgs = fetchArgs || {};
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
                        if( !this.has( object, property ) ) {
                            return undefined;
                        }
                        return Reflect.get( object, '$handleAPIOperation' ).bind( object, property );
                    }
                });
            }
            set fetchArgs( value ) {
                this._fetchArgs = value || {};
            }
            get fetchArgs() {
                return this._fetchArgs;
            }
            setSecurity( name, value, expiry, refreshCallback ) {
                var scheme = securitySchemes[name];
                if( !scheme ) {
                    throw Error( `Unknown security scheme: ${name}` );
                }
                this.security = this.security || {};
                this.security[name] = {
                    expiry: expiry,
                    refreshCallback: refreshCallback
                };
                if( scheme.type === 'http' ) {
                    this.security[name].headers = {
                        authorization: `${scheme.scheme} ${value}`
                    };
                } else if( scheme.type === 'apiKey' ) {
                    if( scheme.in === 'header' ) {
                        this.security[name].headers = {};
                        this.security[name].headers[scheme.name] = value;
                    } else if( scheme.in === 'query' ) {
                        this.security[name].queryParameters = {};
                        this.security[name].queryParameters[scheme.name] = value;
                    } else if( scheme.in === 'cookie' ) {
                        this.security[name].credentials = value || ( allowCORS ? 'include' : 'same-origin' );
                    } else {
                        throw Error( `Don't know how to handle scheme parameter in ${scheme.in}` );
                    }
                } else {
                    throw Error( `Don't know how to handle scheme type ${scheme.type}` );
                }
            }
            unsetSecurity( name ) {
                delete this.security[name];
            }
            clearSecurity() {
                delete this.security;
            }

            async $applySecurityScheme( schemeName, headers, queryParameters ) {
                let scheme = ( this.security || {})[schemeName];
                while( scheme && scheme.expiry && new Date().getTime() >= ( scheme.expiry - 60000 ) ) {
                    // token is (nearly) expired
                    if( scheme.refreshCallback ) {
                        if( !scheme.refreshTokenPromise ) {
                            scheme.refreshTokenPromise = new Promise( async( resolve, reject ) => {
                                try {
                                    resolve( await scheme.refreshCallback() );
                                } catch( e ) {
                                    reject( e );
                                }
                            });
                        }
                        await scheme.refreshTokenPromise;
                    } else {
                        delete this.security[schemeName];
                    }
                    scheme = ( this.security || {})[schemeName];
                }
                if( scheme ) {
                    Object.assign( headers, scheme.headers || {});
                    Object.assign( queryParameters, scheme.queryParameters || {});
                    return scheme.credentials;
                }
                return null;
            }

            async $handleAPIOperation( operationName, ...inputParameters ) {
                let[ method, url ] = operationName.split( ' ', 2 );
                let operation = clientOperations[operationName];
                let body = undefined;
                let headers = this.fetchArgs.headers || {};
                let queryParameters = {};
                let credentials = this.fetchArgs.credentials || (
                    operation.sendCookies ? ( allowCORS ? 'include' : 'same-origin' ) : 'omit'
                );
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
                if( operation.queryParameters.length > 0 ) {
                    Object.assign( queryParameters, inputParameters.shift() || {});
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
                    Object.assign( headers, inputParameters.shift() || {});
                }
                if( inputParameters.length ) {
                    throw Error( `Extra parameters were provided` );
                }
                for( let schemeName of operation.security || [] ) {
                    credentials = ( await this.$applySecurityScheme( schemeName, headers, queryParameters ) ) || credentials;
                }

                url = new URL( url, window.location.origin );
                Object.keys( queryParameters ).forEach( key => url.searchParams.append( key, queryParameters[key] ) );

                var fetchArgs = Object.assign({}, this.fetchArgs, {
                    method: method,
                    headers: headers,
                    credentials: credentials,
                    body: body
                });
                return fetch( url, fetchArgs ).then( response => {
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

        for( let path of Object.keys( apiDoc.paths || {}) ) {
            let pathObject = apiDoc.paths[path];
            for( let method of methods ) {
                let operationObject = pathObject[method];
                if( !pathObject['x-exegesis-clientapi-skip'] && operationObject && !operationObject['x-exegesis-clientapi-skip'] ) {
                    clientOperations[`${method} ${path}`] = createAPIFunction(
                        pathObject, operationObject, (
                            apiDoc.security || [] ).reduce( ( acc, x ) => acc.concat( Object.keys( x ) ), [] )  );
                }
            }
        }

        options.controllers[controllerName] = options.controllers[controllerName] || {};
        for( let file of Object.keys( files ) ) {
            let path = pluginOptions.path + '/' + file;
            options.controllers[controllerName]['get ' + path ] = async function( context ) {
                var apiText = '';
                if( files[file].type === 'module' ) {
                    apiText = `const securitySchemes = ${JSON.stringify( securitySchemes )};\n` +
                        `const clientOperations = ${JSON.stringify( clientOperations, null, '  ' )};\n` +
                        `const allowCORS = ${JSON.stringify( allowCORS, null, ' ' )};\n` +
                        `export default ${ClientAPI.toString()}`;
                }

                if( files[file].minified ) {
                    var clientAPI = {};
                    clientAPI[pluginOptions.path] = apiText;
                    apiText = ( await Terser.minify( clientAPI ) ).code;
                }

                context.res.set( 'content-type', 'application/javascript' );
                return apiText;
            };
        }
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
