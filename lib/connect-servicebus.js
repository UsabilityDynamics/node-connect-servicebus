/**
 * Express Middleware for AMQP / WebSocket task distribution.
 *
 * @class serviceBus
 * @constructor
 * @version 0.1.0
 */
function serviceBus( options ) {

  // Force Proper Instance.
  if( !( this instanceof serviceBus ) ) {
    return serviceBus.create( options || {} );
  }

  // Extend Child Instance with Event Emitter and Settings
  require( 'object-settings' ).mixin( this );

  var self = Object.defineProperties( this, {
    name: {
      /**
       * @property correlationId Correlation ID.
       *
       */
      get: function() {
        return ( this.options.name.replace( 'service-', '' ) ).replace( /-/g, '.' )
      },
      enumerable: false,
      configurable: true
    },
    parent: {
      /**
       * @property parent Application Context.
       *
       */
      value: null,
      enumerable: false,
      configurable: true
    },
    methods: {
      /**
       * @property methods Callable RPC Methods.
       *
       */
      get: function get_methods() {
        return this.options.methods
      },
      enumerable: false,
      configurable: true
    },
    correlationId: {
      /**
       * @property correlationId Shared ID for all request-response RPC calls for this instance.
       *
       */
      value: this.utility.uid( 16 ).toLowerCase(),
      enumerable: false,
      configurable: true,
      writable: true
    },
    instanceId: {
      /**
       * @property instanceId Instance ID.
       *
       * Does nothing, really.
       *
       */
      value: this.utility.uid( 16 ).toLowerCase(),
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
    }
  });

  // Configure Connection on next tick. This is to allow changes to options.
  process.nextTick( this.connect.bind( this ) );

  /**
   * Middleware Handler.
   *
   * Simulares Express Application.
   *
   */
  return Object.defineProperties( function serviceBusMiddleware() {}, {
    handle: {
      /**
       * Express Application Emulator.
       *
       * @param req
       * @param res
       * @param next
       */
      value: function handle( req, res, next ) {
        // console.log( 'serviceBusMiddleware.handle', req.url, req.app.settings.views );

        return function wrapped( req, res, next ) {

          /**
           * Extend Request with ServiceBus Methods.
           *
           */
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
            offload: {
              enumerable: false,
              /**
               * Service Bus Request
               *
               * @param method The target method to call.
               * @param callback Callback method to trigger upon RPC Response.
               */
              value: function offload( type, callback ) {

                try {

                  // Genreate Message ID for request and correlation response.
                  var messageId = self.utility.uid( 20 );

                  // Service RPC Work Request.
                  self.exchange.publish( '', {
                    params: self.utility.deep_extend( req.body, req.query, req.params ),
                    headers: req.headers || {},
                    session: req.session || {},
                    locals: res.locals || {}
                  }, {
                    messageId: messageId,
                    type: type,
                    replyTo: self.correlationId,
                    correlationId: self.correlationId,
                    mandatory: true,
                    deliveryMode: 2,
                    priority: 4,
                    contentType: 'application/json',
                    headers: {
                      'product': self.options.product,
                      'platform': self.options.platform,
                      'version': self.options.version,
                      'x-host': require( 'os' ).hostname().toLowerCase(),
                      'x-pid': process.pid
                    }
                  });

                  self.debug( 'Offloaded RPC Request type [%s] with messageId [%s]; subscribing to internal event [%s].', type, messageId, [ 'res', messageId ].join( '.' ) );

                  // Bind to EventEmitter Callback.
                  self.subscribe([ 'res', messageId ].join( '.' ), callback );

                } catch( error ) {
                  console.log( 'Offload', error );
                }

              },
              writable: false,
              configurable: true
            }
          });

          // continue
          next();

        }.call( self, req, res, next );

      },
      enumerable: true,
      configurable: true,
      writable: true
    },
    set: {
      value: function set() {
        console.log( 'something set', arguments );
      },
      enumerable: true,
      configurable: true,
      writable: true
    },
    emit: {
      /**
       * Called When Mounting.
       *
       * @param tag
       * @param parent
       */
      value: function emit( tag, parent ) {
        self.debug( 'serviceBusMiddleware mounted', parent.route );

        if( tag === 'mount' ) {
          self.parent= parent;

          // Extend Settings with Parent Settings. (e.g. Cluster Settings).
          // serviceBus.prototype.utility.extend( handler.prototype.application.settings, parent.settings );

        }

      },
      enumerable: true,
      configurable: true,
      writable: true
    }
  });

}

/**
 * serviceBus Instance Properties.
 *
 */
Object.defineProperties( serviceBus.prototype, {
  webSocket: {
    /**
     * WebSocket RPC Server
     *
     */
    value: function webSocket() {

       var ws  = require( 'ws' );

       // WebSocket Server.
       this.ws = ws.createServer({
       server: this.server,
       clientTracking: true
       //path: '/stream'
       });

       this.ws.on( 'connection', function( ws ) {
       // if( ws.open ) { ws.send( 'asdf' ); }
       // setInterval( function() {}, 1000 )
       // console.log( 'connection!!!' );
       });

    },
    enumerable: true,
    configurable: true
  },
  publish: {
    /**
     * Emit RPC Call
     *
     * @returns {*|emit|Function|emit}
     */
    get: function publish() {
      return this.options.emitter ? this.options.emitter.emit : process.emit.bind( process );
    },
    enumerable: true,
    configurable: true
  },
  subscribe: {
    /**
     * Subscribe to Local RPC Call
     *
     * @returns {*|on|on|on|Function|on}
     */
    get: function subscribe() {
      return this.options.emitter ? this.options.emitter.on : process.on.bind( process )
    },
    enumerable: true,
    configurable: true
  },
  debug: {
    /**
     * Instance Debugger.
     *
     */
    get: function() {

      if( !Object.getOwnPropertyDescriptor( this, 'debug' ) ) {
        Object.defineProperty( this, 'debug', {
          value: require( 'debug' )( 'connect:servicebus:' + this.options.name ),
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
      // console.log( this.options );

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

      this.connection = amqp.createConnection({
        host: target.hostname,
        port: target.port || 8000,
        login: target.auth ? target.auth.split( ':' )[0] : '',
        password: target.auth ? target.auth.split( ':' )[1] : '',
        clientProperties: {
          arch: process.arch,
          priority: this.options.priority,
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
          is_root: process.env.SUDO_UID || process.env.USER == 'root' ? true : false
        }
      });

      // AMQP Connection Failed.
      this.connection.once( 'error', function have_error( error ) {
        self.debug( 'connection:error [%s]', self.name );

        //console.log( require( 'util' ).inspect( error, { showHidden: true, colors: true, depth: 2 } ) )
        //console.log( 'connection:error [%s]', self.name, error.message );

      });

      // AMQP Connection Established.
      this.connection.once( 'ready', function is_ready() {
        self.debug( 'Connected to AMQP [name:%s].', self.name );

        // Service Exchange.
        self.exchange = self.connection.exchange( self.options.exchange, {
          passive: false,
          confirm: true,
          type: 'headers',
          noDeclare: false,
          durable: true,
          autoDelete: true
        });

        // Create Queues once Exchange is Ready.
        self.exchange.once( 'open', function exchange_open() {
          self.debug( 'Connected to Exchange [name:%s].', self.exchange.name );

          // Service Type Work Queue.
          self.connection.queue([ self.name, 'rpc' ].join( '.' ), {
            passive: false,
            durable: true,
            autoDelete: true,
            closeChannelOnUnsubscribe: true,
            noDeclare: false,
            arguments: {
              'product': self.options.product,
              'platform': self.options.platform,
              'version': self.options.version,
              'x-max-length': 1000,
              'x-message-ttl': 900000,
              'x-expires': 900000
            }
          }, function request_queue( queue ) {
            self.debug( 'Created RPC Queue [name:%s] with [state:%s].', queue.name, queue.state );

            // Bind to Service RPC.
            queue.bind_headers( self.options.exchange, {
              'product': self.options.product,
              'platform': self.options.platform,
              'version': self.options.version,
              'x-match': 'all'
            });

            // Consumer RPC Requests.
            queue.subscribe({ ack: self.options.acknowledge, prefetchCount: self.options.prefetch }, function( message, headers, deliveryInfo ) {
              self.debug( 'Received RPC Request [deliveryInfo.type:%s] with [deliveryInfo.messageId:%s] and [deliveryInfo.correlationId:%s].', deliveryInfo.type, deliveryInfo.messageId, deliveryInfo.correlationId );

              if( !deliveryInfo.type ) {
                return queue.shift( false );
              }

              /**
               * Response Callback passed into RPC Handler Method.
               *
               */
              function requestCallback( error, message ) {
                self.debug( 'requestCallback [requestCallback.messageId:%s] typeof message [%s];', requestCallback.messageId, typeof message );

                // Publish Response Messaage.
                self.exchange.publish([ self.name, 'cid', self.correlationId ].join( '.' ), message || error || {}, {
                  messageId: requestCallback.messageId,
                  correlationId: requestCallback.correlationId,
                  mandatory: true,
                  deliveryMode: 2,
                  priority: 3,
                  contentType: 'application/json',
                  headers: {
                    'correlationId': requestCallback.correlationId || '',
                    'product': self.options.product,
                    'x-host': self.options.version,
                    'x-pid': process.pid
                  }
                });

              }

              // Response Callback Properties.
              Object.defineProperties( requestCallback, {
                type: {
                  value: deliveryInfo.type,
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                correlationId: {
                  value: deliveryInfo.correlationId,
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                message: {
                  value: message || {},
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                headers: {
                  value: headers || {},
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                replyTo: {
                  value: deliveryInfo.replyTo,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                messageId: {
                  value: deliveryInfo.messageId,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                deliveryInfo: {
                  value: deliveryInfo,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                connection: {
                  value: self.connection,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                serviceBus: {
                  value: self,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                exchange: {
                  value: self.exchange,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                queue: {
                  value: queue,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                reject: {
                  value: function reject() {

                    if( self.options.acknowledge ) {
                      queue.shift( true );
                    }

                  },
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                acknowledge: {
                  value: function acknowledge() {

                    if( self.options.acknowledge ) {
                      queue.shift();
                    }

                  },
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                param: {
                  /**
                   * Emute Express param() Method
                   *
                   * Get a parameter.
                   *
                   * @param key
                   * @returns {*}
                   */
                  value: function param( key ) {
                    return key ? requestCallback.message[ key ] : requestCallback.message
                  },
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                send: {
                  /**
                   * Emute Express Send Method
                   *
                   * @param data
                   * @returns {*}
                   */
                  value: function send( data ) {
                    return requestCallback( null, data )
                  },
                  enumerable: true,
                  configurable: true,
                  writable: true
                }
              });

              // Automatically Acknowledge.
              requestCallback.acknowledge();

              // Call RPC Emitter, emulating Express properties.
              self.publish( requestCallback.type, requestCallback, requestCallback, requestCallback );

              // Call Message Handler.
              // self.publish([ 'req', requestCallback.type ].join( '.' ), null, requestCallback.message, requestCallback );

            });

          });

          /**
           * Instance Correlation Queue.
           *
           * Messages only routed into this queue when in direct response to a message originating form this instance.
           * Receive Messages sent to this specific insance, mostly RPC Responses.
           *
           */
          self.connection.queue([ self.name, 'cid', self.correlationId ].join( '.' ), {
            passive: false,
            durable: false,
            exclusive: true,
            autoDelete: true,
            closeChannelOnUnsubscribe: true,
            noDeclare: false,
            arguments: {
              'correlationId': self.correlationId,
              'name': self.name,
              'platform': self.options.platform,
              'product': self.options.product,
              'version': self.options.version,
              'x-host': os.hostname().toLowerCase(),
              'x-pid': process.pid,
              'x-max-length': 1000,
              'x-message-ttl': 900000,
              'x-expires': 900000
            }
          }, function correlation_queue( queue ) {
            self.debug( 'Created Correlation Queue [name:%s] with [state:%s].', queue.name, queue.state );

            // Bind to service exchange
            queue.bind_headers( self.options.exchange, { correlationId: self.correlationId });

            // Receive Messages sent to this specific insance, mostly RPC Responses.
            queue.subscribe({ ack: self.options.acknowledge, prefetchCount: self.options.prefetch }, function( message, headers, deliveryInfo ) {
              self.debug( 'Received RPC Response [deliveryInfo.messageId:%s].', deliveryInfo.messageId );

              /**
               * Correlation Message Callback.
               *
               */
              function responseCallback() {}

              // Response Callback Properties.
              Object.defineProperties( responseCallback, {
                type: {
                  value: deliveryInfo.type,
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                correlationId: {
                  value: deliveryInfo.correlationId,
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                message: {
                  value: message || {},
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                headers: {
                  value: headers || {},
                  enumerable: true,
                  configurable: true,
                  writable: true
                },
                replyTo: {
                  value: deliveryInfo.replyTo,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                messageId: {
                  value: deliveryInfo.messageId,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                deliveryInfo: {
                  value: deliveryInfo,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                connection: {
                  value: self.connection,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                serviceBus: {
                  value: self,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                exchange: {
                  value: self.exchange,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                queue: {
                  value: queue,
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                reject: {
                  value: function reject() {

                    if( self.options.acknowledge ) {
                      queue.shift( true );
                    }

                  },
                  enumerable: false,
                  configurable: true,
                  writable: true
                },
                acknowledge: {
                  value: function acknowledge() {

                    if( self.options.acknowledge ) {
                      queue.shift();
                    }

                  },
                  enumerable: false,
                  configurable: true,
                  writable: true
                }
              });

              // Acknowledge Receipt.
              responseCallback.acknowledge();

              // Call Message Handler.
              self.publish([ 'res', responseCallback.messageId ].join( '.' ), null, responseCallback.message );

            });

          });

        });

      });

      // Early Exit.
      process.once( 'SIGINT', function exit() {

        if( self.connection.close ) {
          self.debug( 'Got SIGINT. Closing ServiceBus Connection.' );
          self.connection.close();
        }

        process.exit();

      });

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
  },
  listeners: {
    value: function() {

      for( var key in this.methods ) {

        this.subscribe([ 'req', key ].join( '.' ), function( error, request, sendResponse ) {
          this.methods[ key ]( error, request, function( error, response ) {

            if( 'function' === typeof sendResponse ) {
              sendResponse( error, response );
            }

          });
        });

      }

    },
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
      priority: 3,
      prefetch: 0,
      exchange: 'service',
      platform: process.platform,
      product: require( '../package' ).name,
      version: require( '../package' ).version,
      application: 'node.js',
      emitter: null,
      methods: {}
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});
