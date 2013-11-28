/*
 * express-amqp
 * http://github.com/UsabilityDynamics/node-express-amqp
 *
 * @class express-amqp
 * @constructor
 * @version 0.1.0
 */
function AMQP() {

  // Force new instance.
  if( !( this instanceof AMQP ) ) {
    return new AMQP( arguments[0], arguments[1] );
  }

  var settings  = 'object' === typeof arguments[0] ? arguments[0] : {};
  var callback  = 'function' === typeof arguments[1] ? arguments[1] : AMQP.utility.noop;
  var self      = this;

  // @chainable
  return this;

}

/**
 * Instance Properties
 *
 */
Object.defineProperties( AMQP.prototype, {
  some_action: {
    /**
     * Some Actions
     *
     * @for express-amqp
     */
    value: function some_action() {},
    enumerable: true,
    configurable: true,
    writable: true
  }
});

/**
 * Constructor Properties
 *
 */
Object.defineProperties( module.exports = AMQP, {
  utility: {
    value: require( './utility' ),
    enumerable: false,
    writable: false
  },
  create: {
    /**
     * Create Instance
     *
     * @for express-amqp
     */
    value: function create() {},
    enumerable: true,
    configurable: true,
    writable: true
  }
});