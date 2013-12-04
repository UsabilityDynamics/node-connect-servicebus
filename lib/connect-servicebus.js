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

  // Extend Child Instance with Event Emitter and Settings
  require( 'object-emitter' ).mixin( this );
  require( 'object-settings' ).mixin( this );

  var self = Object.defineProperties( this, {
    name: {
      /**
       * @property cid Correlation ID.
       *
       */
      get: function() {
        return this.options.name.replace( 'service-', '' )
      },
      enumerable: false,
      configurable: true
    },
    methods: {
      /**
       * @property methods Callable Methods.
       *
       */
      get: function get_methods() {
        return this.options.methods
      },
      enumerable: false,
      configurable: true
    },
    cid: {
      /**
       * @property cid Correlation ID.
       *
       */
      value: this.utility.uid( 16 ),
      enumerable: false,
      configurable: true,
      writable: true
    },
    server: {
      /**
       * @property server Target Express/Connect application.
       *
       */
      get: function() {
        return this.options.server;
      },
      enumerable: false,
      configurable: true
    },
    options: {
      /**
       * @property options Service configuration.
       *
       */
      value: this.utility.defaults( options, serviceBus.defaults ),
      enumerable: false,
      configurable: true,
      writable: true
    },
    connection: {
      /**
       * @property connection AMQP connection.
       *
       */
      value: null,
      enumerable: false,
      configurable: true,
      writable: true
    },
    exchange: {
      /**
       * @property exchange Service Request Exchange.
       *
       */
      value: null,
      enumerable: false,
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

        // Prevet double-adding.
        if( req.bus_queue ) {
          return next();
        }

        Object.defineProperties( req, {
          bus_active: {
            /**
             * Service Bus Active Test
             *
             * @returns {readyEmitted|*}
             */
            get: function get() {
              return self.exchange && self.exchange.state ? true : false;
            },
            enumerable: false,
            configurable: true
          },
          bus_queue: {
            value: [],
            enumerable: false,
            writable: true,
            configurable: true
          },
          offload: {
            enumerable: false,
            /**
             * Service Bus Request
             *
             * @param method The target method to call.
             * @param callback Callback method to trigger upon response.
             */
            value: function offload( cmd, callback ) {

              if( !callback ) {

                return function chained( cb ) {

                  offload( cmd, function( response ) {
                    cb( null, response );
                  });

                }

              }

              if( !self.exchange ) {
                return callback( new Error( 'Exchange is not available.' ) );
              }

              // Genreate Message ID for request and correlation response.
              var messageId = self.utility.uid( 20 );

              req.bus_queue[ messageId ] = self.exchange.publish( '', {
                cmd: cmd,
                type: 'rpc',
                params: self.utility.deep_extend( req.body, req.query, req.params ),
                session: req.session || null,
                headers: req.headers
              }, {
                messageId: messageId,
                replyTo: self.cid,
                mandatory: true,
                deliveryMode: 2,
                contentType: 'application/json',
                headers: {
                  name: self.name,
                  version: self.options.version,
                  request: true
                }
              });

              self.once( messageId, function have_rpc_response( message ) {
                //console.log( 'have response', messageId, message, callback );

                // Remove Bus Queue Message.
                delete req.bus_queue[ messageId ];

                // Trigger Callback.
                callback.call( this, null, message );

              });

            },
            writable: false,
            configurable: true
          }
        });

        // continue
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
  return function serviceBusMiddleware( req, res, next ) {
    self.serviceBusMiddleware.call( self, req, res, next );
  };

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

      var connection = this.connection = amqp.createConnection({
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
        self.debug( 'connection:error [%s]', self.name, error.message );
      });

      connection.once( 'ready', function is_ready() {
        self.debug( 'connection:ready [%s]', self.name );

        // Service Exchange.
        self.exchange = connection.exchange( self.options.exchange, {
          passive: false,
          confirm: true,
          type: 'headers',
          noDeclare: false,
          durable: true,
          autoDelete: true
        });

        // Create Queues once Exchange is Ready.
        self.exchange.once( 'open', function exchange_open() {

          // Service Type Work Queue.
          connection.queue( [ 'service', self.name ].join( '-' ), {
            passive: false,
            durable: true,
            autoDelete: true,
            closeChannelOnUnsubscribe: true,
            noDeclare: false,
            arguments: {
              name: self.name,
              version: self.options.version
            }
          }, function request_queue( queue ) {

            // Bind to service exchange
            queue.bind_headers( self.options.exchange, {
              name: self.name,
              version: self.options.version,
              request: true,
              'x-match': 'all'
            });

            // Receive Messages.
            queue.subscribe({ ack: self.options.acknowledge, prefetchCount: self.options.prefetch }, function( message, headers, deliveryInfo ) {

              try {

                var _context = {
                  id: deliveryInfo.messageId,
                  server: self.server,
                  type: ( message ? message.type : 'rpc' ).toLowerCase(),
                  cmd: message ? message.cmd : undefined,
                  message: message || {},
                  headers: headers || {},
                  deliveryInfo: deliveryInfo,
                  from: deliveryInfo.replyTo,
                  connection: connection,
                  serviceBus: self,
                  exchange: self.exchange,
                  queue: queue,
                  response: function response( error, message ) {

                    if( !message ) {
                      message = error;
                    }

                    if( 'object' !== typeof message ) {

                      message = {
                        message: message
                      }

                    }

                    self.exchange.publish( '', message, {
                      messageId: _context.id,
                      mandatory: false,
                      deliveryMode: 2,
                      contentType: 'application/json',
                      headers: {
                        name: self.name,
                        version: self.options.version,
                        cid: _context.from
                      }
                    });

                    // console.log( 'response sent to', _context.from, message );

                    // @chainable
                    return _context;

                  },
                  reject: function reject() {

                    if( self.options.acknowledge ) {
                      queue.shift( true );
                    }

                    // @chainable
                    return _context;
                  },
                  acknowledge: function acknowledge() {
                    if( self.options.acknowledge ) {
                      queue.shift();
                    }

                    // @chainable
                    return _context;
                  }
                };

                self.message.call( _context, _context.message, _context.headers, _context.deliveryInfo );

              } catch( error ) {
                console.log( 'serviceBus Request Message Error', error );
              }

            });

          });

          // Instance Correlation Queue.
          connection.queue( [ 'correlation', self.cid ].join( '-' ), {
            passive: false,
            durable: false,
            exclusive: true,
            autoDelete: true,
            closeChannelOnUnsubscribe: true,
            noDeclare: false,
            arguments: {
              name: self.name,
              version: self.options.version,
              correlation: true
            }
          }, function correlation_queue( queue ) {
            self.debug( 'Created queue [%s] with state [%s].', queue.name, queue.state );

            // Bind to service exchange
            queue.bind_headers( self.options.exchange, {
              cid: self.cid,
              name: self.name,
              version: self.options.version
            });

            // Receive Messages.
            queue.subscribe({ ack: self.options.acknowledge, prefetchCount: self.options.prefetch }, function( message, headers, deliveryInfo ) {

              try {

                var _context = {
                  id: deliveryInfo.messageId,
                  server: self.server,
                  type: 'correlation',
                  message: message || {},
                  headers: headers || {},
                  deliveryInfo: deliveryInfo,
                  connection: connection,
                  serviceBus: self,
                  exchange: self.exchange,
                  queue: queue,
                  reject: function reject() {

                    if( self.options.acknowledge ) {
                      queue.shift( true );
                    }

                    return _context;
                  },
                  acknowledge: function acknowledge() {
                    if( self.options.acknowledge ) {
                      queue.shift();
                    }
                    return _context;
                  }                };

                self.message.call( _context, _context.message, _context.headers, _context.deliveryInfo );

              } catch( error ) {
                console.log( 'serviceBus Correlation Message Error', error );
              }

            });

          });

        });

      });

      process.once( 'SIGINT', function() {
        self.debug( 'Got SIGINT. Closing ServiceBus connextion.' );

        if( connection.close ) {
          connection.close();
        }

        process.exit();

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  message: {
    /**
     * Receive Message
     *
     * ## Context Properties.
     * - this.message - Message object.
     * - this.headers - Message object.
     * - this.deliveryInfo - deliveryInfo object.
     * - this.reject() - Reject request.
     * - this.acknowledge() - Acknowledge request.
     *
     * @for serviceBus
     */
    value: function message( message, headers, deliveryInfo ) {

      // Test if RPC server has routes.
      if( !this.server || !this.server.routes ) {
        return this.reject();
      }

      // console.log( 'have messsage', this.type );

      switch( this.type ) {

        // RPC Request
        case 'rpc':
          // console.log( 'Received message [cmd:%s,type:%s] #%s from [%s].', this.cmd, this.type, this.id, this.from );

          if( this.serviceBus.methods[ this.cmd ] ) {
            this.serviceBus.methods[ this.cmd ].call( this.serviceBus.methods, this.response );
          }

          this.acknowledge();
        break;

        // Correlation Message (response from RPC)
        case 'correlation':
          // console.log( 'Received message [type:%s] #%s.', this.type, this.id );
          this.serviceBus.emit( this.id, message );
          this.acknowledge();
        break;

        // REST Request
        case 'delete':
        case 'post':
        case 'get':
          this.reject();
        break;

        // Stream Request
        case 'stream':
          this.reject();
        break;

        // Unspecified Request.
        default:
          this.reject();
        break;

      }

    },
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
      acknowledge: true,
      prefetch: 1,
      exchange: 'service',
      platform: process.platform,
      product: require( '../package' ).name,
      version: require( '../package' ).version,
      application: 'node.js',
      headers: {},
      methods: {}
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});