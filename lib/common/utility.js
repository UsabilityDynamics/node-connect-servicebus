/**
 * Utility Methods
 *
 * @class Utility
 * @constructor
 */
function Utility() {
  return Object.keys( arguments ) ? require( 'lodash' ).pick.apply( null, [ Utility, Array.prototype.slice.call( arguments ) ] ) : Utility;
}

Object.defineProperties( module.exports = Utility, {
  uid: {
    value: function generate_cid( length ) {
      return require( 'generate-key' ).generateKey( length || 16 ).toLowerCase()
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  extend: {
    /**
     * Deep Extend Object.
     *
     * @for Utility
     * @method extend
     */
    value: require( 'deep-extend' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  defaults: {
    /**
     * Placeholder Method
     *
     * @for Utility
     * @method noop
     */
    value: require( 'lodash' ).defaults,
    enumerable: true,
    configurable: true,
    writable: true
  },
  noop: {
    /**
     * Placeholder Method
     *
     * @for Utility
     * @method noop
     */
    value: function noop() {},
    enumerable: true,
    configurable: true,
    writable: true
  }
});