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

  var self      = this;
  var app       = require( 'express' ).call();
  var settings  = require( 'object-settings' );
  var emitter   = require( 'object-emitter' );
  var client    = require( 'varnish-client' );
  var format    = require( 'util' ).format;

  // Return Middleware Application Instance.
  return app.once( 'mount', function mounted( parent ) {
    self.debug( 'serviceBusMiddleware mounted to [route:%s]', parent.route );

    // Extend Parent Application.
    Object.defineProperties( this.parent, {
      settings: {
        /**
         * Options Instance.
         *
         * Mixing OS into parent's settings and set options with defaults.
         * Extend original settings, new options, and defaults into the injected instance of Object Settings.
         * Return settings object.
         *
         * Object Settings overwrites the "get" and "set" functions and hooks into events triggering
         * events such as "set.something" whenever this.set( 'something', 'blah' ) is used.
         *
         * @property settings
         */
        value: settings.inject( parent ).set( parent.settings ).set({ serviceBus: serviceBus.defaults }).set({ serviceBus: options }).get(),
        enumerable: true,
        configurable: true,
        writable: true
      }
    });

    // Extend Request with ServiceBus Methods.
    Object.defineProperties( this.parent.request, {
      bus_active: {
        /**
         * Service Bus Active Test
         *
         * @returns {readyEmitted|*}
         */
        get: function get() {
          return self.exchange && self.exchange.state ? true : false;
        },
        enumerable: true,
        configurable: true
      },
      offload: {
        /**
         * Service Bus Request
         *
         * @param type The target method to call.
         * @param callback Callback method to trigger upon RPC Response.
         */
        value: function offload( type, callback ) {
          // app.debug( 'offload [type:%s]', type );

          var req = this;
          var res = this.res;
          var app = this.app;

          if( !self.exchange ) {
            return callback( new Error( 'ServiceBus Exchange is not ready.' ), null )
          }

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
                'product': self.get( 'product' ),
                'platform': self.get( 'platform' ),
                'version': self.get( 'version' ),
                'x-host': require( 'os' ).hostname().toLowerCase(),
                'x-pid': process.pid
              }
            });

            self.debug( 'Offloaded RPC Request [%s] with [messageId:%s].', type, messageId );

            // Bind to EventEmitter Callback.
            self.on([ 'res', messageId ].join( '.' ), callback );

          } catch( error ) {
            app.debug( 'Offload Error. [message: %s].', error.message, error.stack );
            return callback( new Error( 'ServiceBus Exchange failed.'), null )
          }

        },
        enumerable: true,
        writable: true,
        configurable: true
      }
    });

    // Extend Middleware Application.
    Object.defineProperties( this, {
      engines: {
        /**
         * Use Parent's Settings.
         *
         */
        value: parent.engines,
        enumerable: true,
        configurable: true,
        writable: true
      },
      on: {
        /**
         * Use Parent's Method.
         *
         */
        value: parent.on,
        enumerable: true,
        configurable: true,
        writable: true
      },
      emit: {
        /**
         * Use Parent's Method.
         *
         */
        value: parent.emit,
        enumerable: true,
        configurable: true,
        writable: true
      },
      correlationId: {
        /**
         * @property correlationId Shared ID for all request-response RPC calls for this instance.
         *
         */
        value: serviceBus.prototype.utility.uid( 16 ).toLowerCase(),
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
        value: serviceBus.prototype.utility.uid( 16 ).toLowerCase(),
        enumerable: false,
        configurable: true,
        writable: true
      },
      settings: {
        get: function() {
          return this.parent.get( 'serviceBus' );
        },
        enumerable: true,
        configurable: true
      },
      set: {
        /**
         * @property connection AMQP connection.
         *
         */
        value: function( key, value ) {
          this.parent.set( 'serviceBus.' + key, value );
        },
        enumerable: false,
        configurable: true,
        writable: true
      },
      get: {
        /**
         * @property connection AMQP connection.
         *
         */
        value: function( key, defaults ) {
          return this.parent.get( 'serviceBus.' + key, defaults );
        },
        enumerable: false,
        configurable: true
      },
      createConnection: {
        /**
         * Bind Prototypal Method.
         *
         * @property connection AMQP connection.
         */
        value: serviceBus.prototype.createConnection.bind( this ),
        enumerable: false,
        configurable: true,
        writable: true
      },
      configureExchange: {
        /**
         * Bind Prototypal Method.
         *
         * @property connection AMQP connection.
         */
        value: serviceBus.prototype.configureExchange.bind( this ),
        enumerable: false,
        configurable: true,
        writable: true
      },
      webSocket: {
        /**
         * Bind Prototypal Method.
         *
         * @property connection AMQP connection.
         */
        value: serviceBus.prototype.webSocket.bind( this ),
        enumerable: false,
        configurable: true,
        writable: true
      },
      debug: {
        /**
         * Bind Prototypal Method.
         *
         * @property connection AMQP connection.
         */
        value: serviceBus.prototype.debug.bind( this ),
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

    // URL Changed.
    this.parent.on( 'set.serviceBus.url', function url_changed( error, value, path ) {
      app.debug( 'URL change detected, connecting to [%s].', app.get( 'url' ) );
      app.createConnection();
    });

    // Format Name.
    this.set( 'name', this.get( 'name' || '' ).replace( /-/g, '.' ) );

    // Configure Connection on next tick. This is to allow changes to options.
    if( this.get( 'url' )  ) {
      app.debug( 'Connecting to [%s].', this.get( 'url' ) );
      app.createConnection();
    }

    // @chainable
    return this;

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

       this.ws.on( 'connection', function( ws ) {});

    },
    enumerable: true,
    configurable: true
  },
  debug: {
    value: require( 'debug' )( 'connect:servicebus' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  createConnection: {
    /**
     * Establish Connection
     *
     * @for serviceBus
     */
    value: function createConnection() {
      // console.log( this.options );

      var self      = this;
      var amqp      = require( 'amqp' );
      var os        = require( 'os' );
      var cluster   = require( 'cluster' );
      var target;

      try {
        target = require( 'url' ).parse( this.get( 'url' ) );

        if( !target.hostname ) {
          throw new Error( 'Host name could not be determined.' );
        }

      } catch( error ) {
        console.log( 'createConnection', error, error.stack );
        return;
      }

      this.connection = amqp.createConnection({
        host: target.hostname,
        port: target.port || 8000,
        login: target.auth ? target.auth.split( ':' )[0] : '',
        password: target.auth ? target.auth.split( ':' )[1] : '',
        clientProperties: {
          arch: process.arch,
          hostname: this.get( 'hostname' ),
          priority: this.get( 'priority' ),
          product: this.get( 'product' ),
          platform: this.get( 'platform' ),
          version: this.get( 'version' ),
          applicationName: this.get( 'application' ),
          pid: process.pid,
          worker: cluster.isWorker ? cluster.worker.id : null,
          cpus: require( 'os' ).cpus().length || 1,
          total_memory: require( 'os' ).totalmem() || 0,
          user: process.env.USER || process.env.USERNAME
        }
      });

      // AMQP Connection Failed.
      this.connection.on( 'error', function have_error( error ) {
        self.debug( 'connection:error [%s], [message:%s]', self.get( 'name' ), error.message );
        // console.log( 'amqp.createConnection', error, error.stack );
      });

      // AMQP Connection Established.
      this.connection.once( 'ready', function is_ready() {
        self.debug( 'Connected to AMQP [name:%s].', self.get( 'name' ) );

        // Service Exchange.
        self.exchange = self.connection.exchange( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {
          type: 'headers',
          passive: false,
          confirm: true,
          noDeclare: false,
          durable: true,
          autoDelete: true
        });

        // Create Queues once Exchange is Ready. Must bind to main context or will be called in amqp connection context.
        self.exchange.once( 'open', serviceBus.prototype.configureExchange.bind( self, null, self.exchange ) );

      });

      // Early Exit.
      process.once( 'SIGINT', function exit() {

        if( self.connection.close ) {
          self.debug( 'Got SIGINT. Closing ServiceBus Connection.' );
          self.connection.close();
        }

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  configureExchange: {
    /**
     * Configure Exchange once Connected.
     *
     * @param error Always null, only for consistency.
     * @param exchange Exchange object.
     * @returns {*}
     */
    value: function configureExchange( error, exchange ) {
      this.debug( 'Connected to Exchange [name:%s].', exchange.name );

      // Service Type Work Queue.
      this.connection.queue([ exchange.name, 'rpc' ].join( '.' ), {
        passive: false,
        durable: true,
        autoDelete: true,
        closeChannelOnUnsubscribe: true,
        noDeclare: false,
        arguments: {
          'product': this.get( 'product' ),
          'platform': this.get( 'platform' ),
          'version': this.get( 'version' ),
          'x-max-length': 1000,
          'x-message-ttl': 900000,
          'x-expires': 60000
        }
      }, serviceBus.prototype.workQueue.bind( this ) );

      // Correlation Queue for Work Request Responses.
      this.connection.queue([ exchange.name, 'cid', this.correlationId ].join( '.' ), {
        passive: false,
        durable: false,
        exclusive: true,
        autoDelete: true,
        closeChannelOnUnsubscribe: true,
        noDeclare: false,
        arguments: {
          'correlationId': this.correlationId,
          'name': this.get( 'name' ),
          'platform': this.get( 'platform' ),
          'product': this.get( 'product' ),
          'version': this.get( 'version' ),
          'x-host': require( 'os' ).hostname().toLowerCase(),
          'x-pid': process.pid,
          'x-max-length': 1000,
          'x-message-ttl': 900000,
          'x-expires': 900000
        }
      }, serviceBus.prototype.correlationQueue.bind( this ) );

      // @chainable
      return this;

    },
    enumerable: false,
    configurable: true,
    writable: false
  },
  workQueue: {
    /**
     * Work Request Queue Configuration
     *
     * @param queue
     */
    value: function workQueue( queue ) {
      this.debug( 'Created RPC Queue [name:%s] with [state:%s].', queue.name, queue.state );

      var self = this;

      // Bind to Service RPC.
      queue.bind_headers( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {
        'product': self.get( 'product' ),
        'platform': self.get( 'platform' ),
        'version': self.get( 'version' ),
        'x-match': 'all'
      });

      // Consumer RPC Requests.
      queue.subscribe({ ack: self.get( 'acknowledge' ), prefetchCount: self.get( 'prefetch' ) }, function( message, headers, deliveryInfo ) {
        self.debug( 'Received RPC Request [%s] with [messageId:%s, correlationId:%s].', deliveryInfo.type, deliveryInfo.messageId, deliveryInfo.correlationId );

        if( !deliveryInfo.type ) {
          return queue.shift( false );
        }

        /**
         * Response Callback passed into RPC Handler Method.
         *
         */
        function requestCallback( error, message ) {
          self.debug( 'Publishing RPC Response [messageId:%s] typeof message [%s];', requestCallback.messageId, typeof message );

          // Publish Response Messaage.
          self.exchange.publish([ self.exchange.name, 'cid', self.correlationId ].join( '.' ), message || error || {}, {
            messageId: requestCallback.messageId,
            correlationId: requestCallback.correlationId,
            mandatory: true,
            deliveryMode: 2,
            priority: 3,
            contentType: 'application/json',
            headers: {
              'correlationId': requestCallback.correlationId || '',
              'product': self.get( 'product' ),
              'version': self.get( 'version' ),
              'x-host': require( 'os' ).hostname().toLowerCase(),
              'x-pid': process.pid
            }
          });

        }

        // Response Callback Properties. (Emulated both request and response streams, for now.)
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

              if( self.get( 'acknowledge' ) ) {
                queue.shift( true );
              }

            },
            enumerable: false,
            configurable: true,
            writable: true
          },
          acknowledge: {
            value: function acknowledge() {

              if( self.get( 'acknowledge' ) ) {
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
            value: function send( code, data ) {
              return requestCallback( code, data )
            },
            enumerable: true,
            configurable: true,
            writable: true
          }
        });

        // Engine Handler Exists.
        if( self.engines[ requestCallback.type ] ) {

          // Automatically Acknowledge.
          requestCallback.acknowledge();

          // Process Handler.
          self.engines[ requestCallback.type ]( requestCallback, requestCallback, requestCallback );

        }

      });

    },
    enumerable: false,
    configurable: true,
    writable: false
  },
  correlationQueue: {
    /**
     * Instance Correlation Queue.
     *
     * Messages only routed into this queue when in direct response to a message originating form this instance.
     * Receive Messages sent to this specific insance, mostly RPC Responses.
     *
     */
    value: function correlationQueue( queue ) {
      this.debug( 'Created Correlation Queue [name:%s] with [state:%s].', queue.name, queue.state );

      var self = this;

      // Bind to service exchange
      queue.bind_headers( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {
        correlationId: self.correlationId
      });

      // Receive Messages sent to this specific insance, mostly RPC Responses.
      queue.subscribe({ ack: self.get( 'acknowledge' ), prefetchCount: self.get( 'prefetch' ) }, function( message, headers, deliveryInfo ) {
        self.debug( 'Received RPC Response [messageId:%s].', deliveryInfo.messageId );

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

              if( self.get( 'acknowledge' ) ) {
                queue.shift( true );
              }

            },
            enumerable: false,
            configurable: true,
            writable: true
          },
          acknowledge: {
            value: function acknowledge() {

              if( self.get( 'acknowledge' ) ) {
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
        self.emit([ 'res', responseCallback.messageId ].join( '.' ), null, responseCallback.message, responseCallback.headers );

      });

    },
    enumerable: false,
    configurable: true,
    writable: false
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
      url: undefined,
      acknowledge: true,
      hostname: require( 'os' ).hostname().toLowerCase() || '',
      priority: 3,
      prefetch: 0,
      type: 'headers',
      platform: process.platform,
      product: require( '../package' ).name,
      version: require( '../package' ).version,
      application: 'node.js'
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});
