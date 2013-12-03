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