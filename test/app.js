'use strict';

const express = require( 'express' );
const exegesisExpress = require( 'exegesis-express' );
const http = require( 'http' );
const path = require( 'path' );
const fs = require( 'fs-extra' );

const require_helper = require( './require_helper' );

async function createServer() {
    const app = express();

    const options = {
        controllers: {
            petStoreController: {
                listPets: ( context ) => {
                    if( context.params.query.limit === 0 ) {
                        return[];
                    }
                    return[ { name: 'pet1' } ];
                },
                createPets: ( context ) => {
                    return({ name: context.requestBody.name, created: true });
                },
                showPetById: ( context ) => {
                    return{ name: `pet${context.params.path.petId}` };
                }
            }
        },
        authenticators: {
            basicAuth: async function( context ) {
                if( !context.req.headers.authorization ) {
                    return{ type: 'missing' };
                }
                return{ type: 'success', user: { name: `basicUser ${context.params.header.authorization}` } };
            },
            apiKeyHeaderAuth: async function( context, info ) {
                if( !context.req.headers[info.name.toLowerCase()] ) {
                    return{ type: 'missing' };
                }
                return{ type: 'success', user: { name: `headerUser ${context.params.header[info.name]}` } };
            },
            apiKeyQueryAuth: async function( context, info ) {
                if( !context.req.query[info.name] ) {
                    return{ type: 'missing' };
                }
                return{ type: 'success', user: { name: `queryUser ${context.params.query[info.name]}` } };
            }
        },
        allowMissingControllers: true,
        plugins: [
            require_helper( 'index.js' )({
            })
        ]
    };

    const exegesisMiddleware = await exegesisExpress.middleware(
        path.resolve( __dirname, './petstore.yaml' ),
        options
    );

    app.use( exegesisMiddleware );
    // Return a 404
    app.use( ( req, res ) => {
        res.status( 404 ).json({ message: `Not found` });
    });

    // Handle any unexpected errors
    app.use( ( err, req, res, next ) => {
        res.status( 500 ).json({ message: `Internal error: ${err.message}` });
        next();
    });

    const server = http.createServer( app );

    return server;
}

if( process.env.REPORT_DIR_FOR_CODE_COVERAGE ) {
    const dumpCoverage = () => {
        console.warn( 'Outputting code coverage information to ' + process.env.REPORT_DIR_FOR_CODE_COVERAGE );
        fs.ensureDirSync( process.env.REPORT_DIR_FOR_CODE_COVERAGE );
        fs.writeFileSync(
            process.env.REPORT_DIR_FOR_CODE_COVERAGE + '/app.json',
            JSON.stringify( global['__coverage__'] ), 'utf8'
        );
    };
    process.on( 'exit', dumpCoverage );
    process.on( 'SIGINT', process.exit );
    process.on( 'SIGTERM', process.exit );
}

createServer()
.then( server => {
    server.listen( 3000 );
    console.log( 'Listening on port 3000' );
    console.log( 'Try visiting http://localhost:3000/client/api.js' );
})
.catch( err => {
    console.error( err.stack );
    process.exit( 1 );
});
