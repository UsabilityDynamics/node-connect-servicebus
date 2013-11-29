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

  /**
   * Route Handler.
   *
   * @param req
   * @param res
   * @param next
   */
  function serviceBusHandler( req, res, next ) {

    // req.on( 'activity.enqueue', serviceBus.enqueue );
    // req.on( 'activity.update', serviceBus.update );
    // req.on( 'closed', serviceBus.closed );
    // res.on( 'send', serviceBus.send );
    // res.on( 'send', serviceBus.send );

    req.serviceBus = Object.create( serviceBus.prototype );

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