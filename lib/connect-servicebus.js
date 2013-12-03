/*
 *
 *
 * @class serviceBus
 * @constructor
 * @version 0.1.0
 */
function serviceBus( options ) {

  // Force new instance.
  if( !( this instanceof serviceBus ) ) {
    return serviceBus.create( options );
  }

  var amqp  = require( 'amqp' );
  var self  = this;

  this.options = this.utility.defaults( options, serviceBus.defaults );

  /**
   * Route Handler.
   *
   * @param req
   * @param res
   * @param next
   */
  function serviceBusMiddleware( req, res, next ) {

    req.offload = function( data, callback ) {}

    next();

  }

  // Configure Connection on next tick. This is to allow changes to options.
  process.nextTick( function Configure() {
    //console.log( self.options );

    var target;
    
    try {
      target = require( 'url' ).parse( self.options.url );
    } catch( error ) { 
      console.error( error ); 
    }

    if( !target || !target.hostname ) {
      return serviceBusMiddleware;
    }

    var connection = amqp.createConnection({
      host: target.hostname,
      port: target.port || 8000,
      login: target.auth ? target.auth.split( ':' )[0] : '',
      password: target.auth ? target.auth.split( ':' )[1] : '',
      clientProperties: {
        product: self.options.product,
        platform: self.options.platform,
        version: self.options.version,
        applicationName: self.options.application
      }
    });

    connection.on( 'error', function have_error( error ) {
      console.log( 'connect.servicebus error', error );
    });

    connection.on( 'ready', function is_ready() {
      console.log( 'connect.servicebus ready' );

      // @todo Subscribe to service-type-specific work-request queue. header: type: work-request

      // @todo Subscribe to service-type-specific direct-delivery queue. header: type: direct-delivery, cid: [id-of-this-service-instance]

    });

  });

  // return
  return serviceBusMiddleware;

}

/**
 * serviceBus Instance Properties.
 *
 */
Object.defineProperties( serviceBus.prototype, {
  enqueue: {
    /**
     * Some Actions
     *
     * @for serviceBus
     */
    value: function enqueue() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  activity: {
    /**
     * Some Actions
     *
     * @for serviceBus
     */
    value: function activity() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  utility: {
    value: require( './common/utility' ),
    enumerable: false,
    configurable: true,
    writable: false
  }
});

/**
 * serviceBus Constructor Properties
 *
 */
Object.defineProperties( module.exports = serviceBus, {
  create: {
    /**
     * Create Instance
     *
     * @for serviceBus
     */
    value: function create( options ) {
      return new serviceBus( options || {} );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  defaults: {
    value: {
      url: 'amqp://guest:guest@localhost',
      product: 'my-product',
      platform: 'my-platofrm',
      version: '1.0.0',
      application: 'my-app',
      exchange: 'service',
      headers: {}
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});