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
    describe( 'with base url', function() {
        before( function() {
            this.client = new this.api({}, 'http://localhost:3001/asdf/' );
        });
        it( 'created the client', function() {
            expect( this.client ).to.exist;
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]().then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 404 );
                expect( err.response.url ).to.eql( 'http://localhost:3001/asdf/pets' );
            });
        });
        it( 'can call the listPets API', function() {
            return this.client[ 'get /pets' ]({ limit: 0 }).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 404 );
                expect( err.response.url ).to.eql( 'http://localhost:3001/asdf/pets?limit=0' );
            });
        });
        it( 'can call the createPets API', function() {
            return this.client[ 'post /pets' ]({ name: 'pet2' }).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 404 );
                expect( err.response.url ).to.eql( 'http://localhost:3001/asdf/pets' );
            });
        });
        it( 'can call the showPetById API', function() {
            return this.client[ 'get /pets/{petId}' ]( 123 ).then( response => {
                assert( false );
            }, err => {
                expect( err.response.status ).to.eql( 404 );
                expect( err.response.url ).to.eql( 'http://localhost:3001/asdf/pets/123' );
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
        it( 'can call the createPets API concurrently', function() {
            let refreshCount = 0;
            this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth', new Date().getTime(), async() => {
                refreshCount++;
                return new Promise( resolve => {
                    setTimeout( () => {
                        this.client.setSecurity( 'apiKeyHeaderAuth', 'MyHeaderAuth2' );
                        resolve();
                    }, 50 );
                });
            });
            return Promise.all( [
                this.client[ 'post /pets' ]({ name: 'pet2' }),
                this.client[ 'post /pets' ]({ name: 'pet3' })
            ] ).then( ( response ) => {
                expect( response[0] ).to.eql({ name: 'pet2', created: true });
                expect( response[1] ).to.eql({ name: 'pet3', created: true });
                expect( refreshCount ).to.eql( 1 );
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

