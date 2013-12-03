/*
 *
 *
 * @class serviceBus
 * @constructor
 * @version 0.1.0
 */
function serviceBus( options ) {

  // Force Proper Instance.
  if( !( this instanceof serviceBus ) ) {
    return serviceBus.create( options );
  }

  var self = Object.defineProperties( this, {
    options: {
      value: this.utility.defaults( options, serviceBus.defaults ),
      enumerable: true,
      configurable: true,
      writable: true
    },
    serviceBusMiddleware: {
      /**
       * Route Handler.
       *
       * @param req
       * @param res
       * @param next
       */
      value: function serviceBusMiddleware( req, res, next ) {

        req.offload = function( data, callback ) {};

        next();

      },
      enumerable: true,
      configurable: true,
      writable: true
    }
  });

  // Configure Connection on next tick. This is to allow changes to options.
  process.nextTick( this.connect.bind( this ) );

  // return connect middleware method
  return this.serviceBusMiddleware;

}

/**
 * serviceBus Instance Properties.
 *
 */
Object.defineProperties( serviceBus.prototype, {
  debug: {
    /**
     * Instance Debugger.
     *
     */
    get: function() {

      if( !Object.getOwnPropertyDescriptor( this, 'debug' ) ) {
        Object.defineProperty( this, 'debug', {
          value: require( 'debug' )( 'connect-servicebus:' + this.options.name ),
          enumerable: true,
          configurable: false
        })
      }

      return this.debug;

    },
    enumerable: true,
    configurable: true
  },
  connect: {
    /**
     * Establish Connection
     *
     * @for serviceBus
     */
    value: function connect() {
      //console.log( this.options );

      var self      = this;
      var amqp      = require( 'amqp' );
      var os        = require( 'os' );
      var cluster   = require( 'cluster' );
      var target;

      try {
        target = require( 'url' ).parse( this.options.url );
      } catch( error ) {
        console.error( error );
      }

      if( !target || !target.hostname ) {
        return this.serviceBusMiddleware;
      }

      var connection = amqp.createConnection({
        host: target.hostname,
        port: target.port || 8000,
        login: target.auth ? target.auth.split( ':' )[0] : '',
        password: target.auth ? target.auth.split( ':' )[1] : '',
        clientProperties: {
          product: this.options.product,
          platform: this.options.platform,
          version: this.options.version,
          applicationName: this.options.application,
          hostname: require( 'os' ).hostname().toLowerCase() || '',
          pid: process.pid,
          worker: cluster.isWorker ? cluster.worker.id : null,
          cpus: require( 'os' ).cpus().length || 1,
          total_memory: require( 'os' ).totalmem() || 0,
          user: process.env.USER || process.env.USERNAME,
          is_root: process.env.SUDO_UID || process.env.USER == 'root' ? true : false,
          gid: process.getgid ? process.getgid() : process.env.SUDO_GID ? process.env.SUDO_GID : undefined,
          uid: process.getuid ? process.getuid() : process.env.SUDO_UID ? process.env.SUDO_UID : undefined
        }
      });

      connection.on( 'error', function have_error( error ) {
        self.debug( 'connection:error [%s]', self.options.name, error.message );
        // connection.end();
      });

      connection.once( 'ready', function is_ready() {
        self.debug( 'connection:ready [%s]', self.options.name );

        var _options = {
          passive: false,
          durable: true,
          autoDelete: true,
          closeChannelOnUnsubscribe: true,
          noDeclare: false,
          arguments: {
            name: self.options.name,
            version: self.options.version
          }
        };

        connection.queue( self.options.name, _options, function queue_bound( queue ) {

          // Bind to service exchange
          queue.bind_headers( self.options.exchange, {
            name: self.options.name,
            version: self.options.version
          });

          // Receive Messages.
          queue.subscribe({ ack: self.options.acknowledge, prefetchCount: self.options.prefetch }, self.message.bind({
            connection: connection,
            queue: queue,
            shift: queue.shift
          }));

        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
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
  message: {
    /**
     * Receive Message
     *
     * @for serviceBus
     */
    value: function message( message, headers, deliveryInfo ) {

      console.log( message );

      // Acknowledge.
      this.shift();

    },
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
      product: 'servicebus',
      acknowledge: true,
      prefetch: 0,
      exchange: 'service',
      platform: process.platform,
      version: '1.0.0',
      application: 'node.js',
      headers: {}
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});