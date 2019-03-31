'use strict';

var expect = require( 'chai' ).expect;
var require_helper = require( '../require_helper' );
var index = require_helper( 'index' );

const files = [ 'api.js', 'api.min.js' ];

describe( 'openapi version check', function() {
    before( function() {
        this.plugin = index({});
    });
    it( 'throws an error if there is no openapi', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                }
            }) ).to.throw( "OpenAPI definition is missing 'openapi' field" );
    });
    it( 'throws an error if openapi is too low', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '2.0.0'
                }
            }) ).to.throw( 'OpenAPI version 2.0.0 not supported' );
    });
    it( 'throws an error if openapi is too high', function() {
        expect( this.plugin.makeExegesisPlugin.bind(
            this.plugin, {
                apiDoc: {
                    openapi: '4.0.0'
                }
            }) ).to.throw( 'OpenAPI version 4.0.0 not supported' );
    });
});

describe( 'No path in options', function() {
    before( function() {
        this.plugin = index();
        this.apiDoc = {
            openapi: '3.0.0'
        };
        this.controllers = {};
        this.instance = this.plugin.makeExegesisPlugin({ apiDoc: this.apiDoc });
        this.instance.preCompile({ apiDoc: this.apiDoc, options: {
            controllers: this.controllers
        } });
    });
    it( 'uses /client as default path', function() {
        expect( this.apiDoc.paths ).to.be.ok;
        for( let file of files ) {
            expect( this.apiDoc.paths['/client/' + file] ).to.be.ok;
            expect( this.apiDoc.paths['/client/' + file].get ).to.be.ok;
        }
    });
    it( 'creates controller function', function() {
        for( let file of files ) {
            expect( this.controllers[this.apiDoc.paths['/client/' + file].get['x-exegesis-controller']] ).to.be.ok;
            expect( this.controllers[this.apiDoc.paths['/client/' + file].get['x-exegesis-controller']][
            this.apiDoc.paths['/client/' + file].get.operationId] ).to.be.a( 'function' );
        }
    });
    for( let file of files ) {
        it( `responds with javascript code for ${file}`, async function() {
            var context = {
                res: {
                    set: function( header, value ) {
                        if( header === 'content-type' ) {
                            this.contenttype = value;
                        }
                    }
                },
                params: {
                }
            };
            let ret = await this.controllers[this.apiDoc.paths['/client/' + file].get['x-exegesis-controller']][
            this.apiDoc.paths['/client/' + file].get.operationId]( context );
            expect( context.res.contenttype ).to.equal( 'application/javascript' );
            expect( ret ).to.be.a( 'string' );
            expect( ret.length ).to.be.above( 2500 );
        });
    }
});

describe( 'Custom path in options', function() {
    before( function() {
        this.plugin = index({
            path: '/customClient'
        });
        this.apiDoc = {
            openapi: '3.0.0'
        };
        this.controllers = {};
        this.instance = this.plugin.makeExegesisPlugin({ apiDoc: this.apiDoc });
        this.instance.preCompile({ apiDoc: this.apiDoc, options: {
            controllers: this.controllers
        } });
    });
    it( 'uses /client as default path', function() {
        expect( this.apiDoc.paths ).to.be.ok;
        for( let file of files ) {
            expect( this.apiDoc.paths['/customClient/' + file] ).to.be.ok;
            expect( this.apiDoc.paths['/customClient/' + file].get ).to.be.ok;
        }
    });
    it( 'creates controller function', function() {
        for( let file of files ) {
            expect( this.controllers[this.apiDoc.paths['/customClient/' + file].get['x-exegesis-controller']] ).to.be.ok;
            expect( this.controllers[this.apiDoc.paths['/customClient/' + file].get['x-exegesis-controller']][
            this.apiDoc.paths['/customClient/' + file].get.operationId] ).to.be.a( 'function' );
        }
    });
    for( let file of files ) {
        it( `responds with javascript code for ${file}`, async function() {
            var context = {
                res: {
                    set: function( header, value ) {
                        if( header === 'content-type' ) {
                            this.contenttype = value;
                        }
                    }
                },
                params: {
                }
            };
            let ret = await this.controllers[this.apiDoc.paths['/customClient/' + file].get['x-exegesis-controller']][
            this.apiDoc.paths['/customClient/' + file].get.operationId]( context );
            expect( context.res.contenttype ).to.equal( 'application/javascript' );
            expect( ret ).to.be.a( 'string' );
            expect( ret.length ).to.be.above( 2500 );
        });
    }
});

