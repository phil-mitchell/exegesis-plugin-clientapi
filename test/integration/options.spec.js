'use strict';

/* global expect */
/* global System */

describe( 'ES6 module', function() {
    before( function() {
        return import( 'http://localhost:3001/client/api.js' ).then( apiModule => {
            this.api = apiModule.default;
        });
    });
    it( 'loaded the API module', function() {
        expect( this.api ).to.exist;
    });
    describe( 'no options', function() {
        before( function() {
            this.client = new this.api();
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                expect( response ).to.eql({ name: 'pet2', created: true });
            });
        });
    });
});

