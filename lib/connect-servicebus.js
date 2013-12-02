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

  var self = this;
  var amqp = require( 'amqp' );

  var connection = amqp.createConnection({
    host: '216.22.20.141',
    port: 11000,
    login: 'raas.service',
    password: 'PieuPXGA7hRj$qkGUCb0',
    clientProperties: {
      product: 'service',
      platform: 'veneer',
      version: 1.2,
      applicationName: 'your-mother'
    }
  });

  connection.on('error', function ( error ) {
    console.log( 'bus error', error );
  });

  connection.on('ready', function (  ) {

    // Primary Message Router.
    connection.queue( 'service-queue', function( queue ) {

      /*
       queue.bind_headers({
       service: handler.prototype.get( 'id' ),
       type: handler.prototype.get( 'type' ),
       uid: handler.prototype.get( 'hash' ),
       'x-match': 'any'
       });

       queue.subscribe({ routingKeyInPayload: true }, function incomingMessave( message, headers, deliveryInfo ) {

       //console.log( headers );

       //headers.reply
       console.log( 'have direct message to Service', message.data.toString(), message._routingKey );

       });
       */

    });

  });

  /**
   * Route Handler.
   *
   * @param req
   * @param res
   * @param next
   */
  function serviceBusHandler( req, res, next ) {

    req.offload = function( data, callback ) {

      var reply_to = require( 'generate-key' ).generateKey().toLowerCase();

      connection.publish( 'raas.service', { 'what': 'testing distribution' }, {
        headers: {
          service: 'service-raas-account-v1',
          correlationId: handler.prototype.get( 'cid' ),
          replyTo: reply_to
        }
      });

      console.log( 'waiting for', reply_to );

      process.on( reply_to, function() {
        console.log( 'process.on called' );
        callback( null, { valid: true, age: 333, capabilities: 'asdfadsf' })
      })

    }

    next();

  }

  // return
  return serviceBusHandler;

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
  }
});