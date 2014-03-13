/**
 * API Tests
 *
 *
 */
module.exports = {

  'Connect ServiceBus': {

    'returns expected methods': function () {

      var cVarnish = require( '../' );

      cVarnish.should.have.property( 'create' );
      cVarnish.should.have.property( 'defaults' );
      cVarnish.should.have.property( 'prototype' );

      cVarnish.prototype.should.have.property( 'webSocket' );
      cVarnish.prototype.should.have.property( 'debug' );
      cVarnish.prototype.should.have.property( 'createConnection' );
      cVarnish.prototype.should.have.property( 'workQueue' );
      cVarnish.prototype.should.have.property( 'correlationQueue' );
      cVarnish.prototype.should.have.property( 'utility' );

      cVarnish.prototype.utility.should.have.property( 'uid' );
      cVarnish.prototype.utility.should.have.property( 'extend' );
      cVarnish.prototype.utility.should.have.property( 'defaults' );
      cVarnish.prototype.utility.should.have.property( 'noop' );

    }

  }

};