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
  var sqs = require( 'sqs' );
  var sns = require( 'aws-snsclient' );

  var queue = sqs({
    access: 'AKIAJD2H5SFPFLTM53OQ',
    secret: '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',
    region: 'us-east-1'
  });

  // @todo Identify all grunt available within application (cluster/service) tasks for RPC handling.

  /**
   * Route Handler.
   *
   * @param req
   * @param res
   * @param next
   */
  function serviceBusHandler( req, res, next ) {

    req.serviceBus = Object.create( serviceBus.prototype );

    req.serviceBus.on = function on( topic, callback ) {

      queue.pull( topic, function( message, done ) {
        callback( message, done );
      });

    }

    req.serviceBus.emit = function emit( topic, data, callback ) {
      queue.push( topic, data );
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