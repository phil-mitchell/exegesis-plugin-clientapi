'use strict';

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
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 401 );
            });
        });
        it( 'can call the showPetById API', function() {
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 401 );
            });
        });
    });
    describe( 'with basic authentication', function() {
        before( function() {
            this.client = new this.api();
            this.client.setSecurity( 'basicAuth', 'MyBasicAuth' );
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                expect( response ).to.eql({ name: 'pet2', created: true });
            });
        });
        it( 'can call the showPetById API', function() {
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                expect( response ).to.eql({ name: 'pet123' });
            });
        });
    });
    describe( 'with header authentication', function() {
        before( function() {
            this.client = new this.api();
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth' );
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                expect( response ).to.eql({ name: 'pet2', created: true });
            });
        });
        it( 'can call the showPetById API', function() {
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                expect( response ).to.eql({ name: 'pet123' });
            });
        });
    });
    describe( 'with header authentication with expiry', function() {
        before( function() {
            this.client = new this.api();
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime() );
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the listPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime() );
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime() );
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 401 );
            });
        });
        it( 'can call the showPetById API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime() );
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 401 );
            });
        });
    });
    describe( 'with header authentication with expiry and refresh', function() {
        before( function() {
            this.client = new this.api();
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime(), async() => {
                this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth2' );
            });
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the listPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime(), async() => {
                this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth2' );
            });
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime(), async() => {
                this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth2' );
            });
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                expect( response ).to.eql({ name: 'pet2', created: true });
            });
        });
        it( 'can call the showPetById API', function() {
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime(), async() => {
                this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth2' );
            });
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                expect( response ).to.eql({ name: 'pet123' });
            });
        });
    });
    describe( 'with query-string authentication', function() {
        before( function() {
            this.client = new this.api();
            this.client.setSecurity( 'apiKeyQueryAuth', 'MyQueryAuth' );
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]().then( response => {
                expect( response ).to.eql( [ { name: 'pet1' } ] );
            });
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                expect( response ).to.eql( [ ] );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                expect( response ).to.eql({ name: 'pet2', created: true });
            });
        });
        it( 'can call the showPetById API', function() {
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                expect( response ).to.eql({ name: 'pet123' });
            });
        });
    });
});

