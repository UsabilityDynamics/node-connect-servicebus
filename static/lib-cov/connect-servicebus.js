// instrument by jscoverage, do not modifly this file
(function () {
  var BASE;
  if (typeof global === 'object') {
    BASE = global;
  } else if (typeof window === 'object') {
    BASE = window;
  } else {
    throw new Error('[jscoverage] unknow ENV!');
  }
  if (!BASE._$jscoverage) {
    BASE._$jscoverage = {};
    BASE._$jscoverage_cond = {};
    BASE._$jscoverage_done = function (file, line, express) {
      if (arguments.length === 2) {
        BASE._$jscoverage[file][line] ++;
      } else {
        BASE._$jscoverage_cond[file][line] ++;
        return express;
      }
    };
    BASE._$jscoverage_init = function (base, file, lines) {
      var tmp = [];
      for (var i = 0; i < lines.length; i ++) {
        tmp[lines[i]] = 0;
      }
      base[file] = tmp;
    };
  }
})();
_$jscoverage_init(_$jscoverage, "lib/connect-servicebus.js",[11,12,15,16,17,18,19,20,23,24,27,49,57,72,73,74,76,77,80,83,86,109,112,115,116,127,182,193,205,277,278,279,283,286,287,288,292,302,310,313,319,340,341,342,343,344,346,347,349,350,354,355,358,380,381,386,387,390,400,405,407,408,409,428,431,448,470,484,486,489,497,498,500,501,509,512,531,601,602,613,614,632,646,655,658,661,681,683,686,691,692,701,771,772,783,784,795,798,819,827]);
_$jscoverage_init(_$jscoverage_cond, "lib/connect-servicebus.js",[11,76,286,349,407,500,601,613,655,771,783]);
_$jscoverage["lib/connect-servicebus.js"].source = ["/**"," * Express Middleware for AMQP / WebSocket task distribution."," *"," * @class serviceBus"," * @constructor"," * @version 0.1.0"," */","function serviceBus( options ) {","","  // Force Proper Instance.","  if( !( this instanceof serviceBus ) ) {","    return serviceBus.create( options || {} );","  }","","  var self      = this;","  var app       = require( 'express' ).call();","  var settings  = require( 'object-settings' );","  var emitter   = require( 'object-emitter' );","  var client    = require( 'varnish-client' );","  var format    = require( 'util' ).format;","","  // Return Middleware Application Instance.","  return app.once( 'mount', function mounted( parent ) {","    self.debug( 'serviceBusMiddleware mounted to [route:%s]', parent.route );","","    // Extend Parent Application.","    Object.defineProperties( this.parent, {","      settings: {","        /**","         * Options Instance.","         *","         * Mixing OS into parent's settings and set options with defaults.","         * Extend original settings, new options, and defaults into the injected instance of Object Settings.","         * Return settings object.","         *","         * Object Settings overwrites the \"get\" and \"set\" functions and hooks into events triggering","         * events such as \"set.something\" whenever this.set( 'something', 'blah' ) is used.","         *","         * @property settings","         */","        value: settings.inject( parent ).set( parent.settings ).set({ serviceBus: serviceBus.defaults }).set({ serviceBus: options }).get(),","        enumerable: true,","        configurable: true,","        writable: true","      }","    });","","    // Extend Request with ServiceBus Methods.","    Object.defineProperties( this.parent.request, {","      bus_active: {","        /**","         * Service Bus Active Test","         *","         * @returns {readyEmitted|*}","         */","        get: function get() {","          return self.exchange && self.exchange.state ? true : false;","        },","        enumerable: true,","        configurable: true","      },","      offload: {","        /**","         * Service Bus Request","         *","         * @param type The target method to call.","         * @param callback Callback method to trigger upon RPC Response.","         */","        value: function offload( type, callback ) {","          // app.debug( 'offload [type:%s]', type );","","          var req = this;","          var res = this.res;","          var app = this.app;","","          if( !self.exchange ) {","            return callback( new Error( 'ServiceBus Exchange is not ready.' ), null )","          }","","          try {","","            // Genreate Message ID for request and correlation response.","            var messageId = self.utility.uid( 20 );","","            // Service RPC Work Request.","            self.exchange.publish( '', {","              params: self.utility.deep_extend( req.body, req.query, req.params ),","              headers: req.headers || {},","              session: req.session || {},","              locals: res.locals || {}","            }, {","              messageId: messageId,","              type: type,","              replyTo: self.correlationId,","              correlationId: self.correlationId,","              mandatory: true,","              deliveryMode: 2,","              priority: 4,","              contentType: 'application/json',","              headers: {","                'product': self.get( 'product' ),","                'platform': self.get( 'platform' ),","                'version': self.get( 'version' ),","                'x-host': require( 'os' ).hostname().toLowerCase(),","                'x-pid': process.pid","              }","            });","","            self.debug( 'Offloaded RPC Request [%s] with [messageId:%s].', type, messageId );","","            // Bind to EventEmitter Callback.","            self.on([ 'res', messageId ].join( '.' ), callback );","","          } catch( error ) {","            app.debug( 'Offload Error. [message: %s].', error.message, error.stack );","            return callback( new Error( 'ServiceBus Exchange failed.'), null )","          }","","        },","        enumerable: true,","        writable: true,","        configurable: true","      }","    });","","    // Extend Middleware Application.","    Object.defineProperties( this, {","      engines: {","        /**","         * Use Parent's Settings.","         *","         */","        value: parent.engines,","        enumerable: true,","        configurable: true,","        writable: true","      },","      on: {","        /**","         * Use Parent's Method.","         *","         */","        value: parent.on,","        enumerable: true,","        configurable: true,","        writable: true","      },","      emit: {","        /**","         * Use Parent's Method.","         *","         */","        value: parent.emit,","        enumerable: true,","        configurable: true,","        writable: true","      },","      correlationId: {","        /**","         * @property correlationId Shared ID for all request-response RPC calls for this instance.","         *","         */","        value: serviceBus.prototype.utility.uid( 16 ).toLowerCase(),","        enumerable: false,","        configurable: true,","        writable: true","      },","      instanceId: {","        /**","         * @property instanceId Instance ID.","         *","         * Does nothing, really.","         *","         */","        value: serviceBus.prototype.utility.uid( 16 ).toLowerCase(),","        enumerable: false,","        configurable: true,","        writable: true","      },","      settings: {","        get: function() {","          return this.parent.get( 'serviceBus' );","        },","        enumerable: true,","        configurable: true","      },","      set: {","        /**","         * @property connection AMQP connection.","         *","         */","        value: function( key, value ) {","          this.parent.set( 'serviceBus.' + key, value );","        },","        enumerable: false,","        configurable: true,","        writable: true","      },","      get: {","        /**","         * @property connection AMQP connection.","         *","         */","        value: function( key, defaults ) {","          return this.parent.get( 'serviceBus.' + key, defaults );","        },","        enumerable: false,","        configurable: true","      },","      createConnection: {","        /**","         * Bind Prototypal Method.","         *","         * @property connection AMQP connection.","         */","        value: serviceBus.prototype.createConnection.bind( this ),","        enumerable: false,","        configurable: true,","        writable: true","      },","      configureExchange: {","        /**","         * Bind Prototypal Method.","         *","         * @property connection AMQP connection.","         */","        value: serviceBus.prototype.configureExchange.bind( this ),","        enumerable: false,","        configurable: true,","        writable: true","      },","      webSocket: {","        /**","         * Bind Prototypal Method.","         *","         * @property connection AMQP connection.","         */","        value: serviceBus.prototype.webSocket.bind( this ),","        enumerable: false,","        configurable: true,","        writable: true","      },","      debug: {","        /**","         * Bind Prototypal Method.","         *","         * @property connection AMQP connection.","         */","        value: serviceBus.prototype.debug.bind( this ),","        enumerable: false,","        configurable: true,","        writable: true","      },","      connection: {","        /**","         * @property connection AMQP connection.","         *","         */","        value: null,","        enumerable: false,","        configurable: true,","        writable: true","      },","      exchange: {","        /**","         * @property exchange Service Request Exchange.","         *","         */","        value: null,","        enumerable: false,","        configurable: true,","        writable: true","      }","    });","","    // URL Changed.","    this.parent.on( 'set.serviceBus.url', function url_changed( error, value, path ) {","      app.debug( 'URL change detected, connecting to [%s].', app.get( 'url' ) );","      app.createConnection();","    });","","    // Format Name.","    this.set( 'name', this.get( 'name' || '' ).replace( /-/g, '.' ) );","","    // Configure Connection on next tick. This is to allow changes to options.","    if( this.get( 'url' )  ) {","      app.debug( 'Connecting to [%s].', this.get( 'url' ) );","      app.createConnection();","    }","","    // @chainable","    return this;","","  });","","}","","/**"," * serviceBus Instance Properties."," *"," */","Object.defineProperties( serviceBus.prototype, {","  webSocket: {","    /**","     * WebSocket RPC Server","     *","     */","    value: function webSocket() {","","       var ws  = require( 'ws' );","","       // WebSocket Server.","       this.ws = ws.createServer({","       server: this.server,","       clientTracking: true","       //path: '/stream'","       });","","       this.ws.on( 'connection', function( ws ) {});","","    },","    enumerable: true,","    configurable: true","  },","  debug: {","    value: require( 'debug' )( 'connect:servicebus' ),","    enumerable: true,","    configurable: true,","    writable: true","  },","  createConnection: {","    /**","     * Establish Connection","     *","     * @for serviceBus","     */","    value: function createConnection() {","      // console.log( this.options );","","      var self      = this;","      var amqp      = require( 'amqp' );","      var os        = require( 'os' );","      var cluster   = require( 'cluster' );","      var target;","","      try {","        target = require( 'url' ).parse( this.get( 'url' ) );","","        if( !target.hostname ) {","          throw new Error( 'Host name could not be determined.' );","        }","","      } catch( error ) {","        console.log( 'createConnection', error, error.stack );","        return;","      }","","      this.connection = amqp.createConnection({","        host: target.hostname,","        port: target.port || 8000,","        login: target.auth ? target.auth.split( ':' )[0] : '',","        password: target.auth ? target.auth.split( ':' )[1] : '',","        clientProperties: {","          arch: process.arch,","          hostname: this.get( 'hostname' ),","          priority: this.get( 'priority' ),","          product: this.get( 'product' ),","          platform: this.get( 'platform' ),","          version: this.get( 'version' ),","          applicationName: this.get( 'application' ),","          pid: process.pid,","          worker: cluster.isWorker ? cluster.worker.id : null,","          cpus: require( 'os' ).cpus().length || 1,","          total_memory: require( 'os' ).totalmem() || 0,","          user: process.env.USER || process.env.USERNAME","        }","      });","","      // AMQP Connection Failed.","      this.connection.on( 'error', function have_error( error ) {","        self.debug( 'connection:error [%s], [message:%s]', self.get( 'name' ), error.message );","        // console.log( 'amqp.createConnection', error, error.stack );","      });","","      // AMQP Connection Established.","      this.connection.once( 'ready', function is_ready() {","        self.debug( 'Connected to AMQP [name:%s].', self.get( 'name' ) );","","        // Service Exchange.","        self.exchange = self.connection.exchange( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {","          type: 'headers',","          passive: false,","          confirm: true,","          noDeclare: false,","          durable: true,","          autoDelete: true","        });","","        // Create Queues once Exchange is Ready. Must bind to main context or will be called in amqp connection context.","        self.exchange.once( 'open', serviceBus.prototype.configureExchange.bind( self, null, self.exchange ) );","","      });","","      // Early Exit.","      process.once( 'SIGINT', function exit() {","","        if( self.connection.close ) {","          self.debug( 'Got SIGINT. Closing ServiceBus Connection.' );","          self.connection.close();","        }","","      });","","    },","    enumerable: true,","    configurable: true,","    writable: true","  },","  configureExchange: {","    /**","     * Configure Exchange once Connected.","     *","     * @param error Always null, only for consistency.","     * @param exchange Exchange object.","     * @returns {*}","     */","    value: function configureExchange( error, exchange ) {","      this.debug( 'Connected to Exchange [name:%s].', exchange.name );","","      // Service Type Work Queue.","      this.connection.queue([ exchange.name, 'rpc' ].join( '.' ), {","        passive: false,","        durable: true,","        autoDelete: true,","        closeChannelOnUnsubscribe: true,","        noDeclare: false,","        arguments: {","          'product': this.get( 'product' ),","          'platform': this.get( 'platform' ),","          'version': this.get( 'version' ),","          'x-max-length': 1000,","          'x-message-ttl': 900000,","          'x-expires': 60000","        }","      }, serviceBus.prototype.workQueue.bind( this ) );","","      // Correlation Queue for Work Request Responses.","      this.connection.queue([ exchange.name, 'cid', this.correlationId ].join( '.' ), {","        passive: false,","        durable: false,","        exclusive: true,","        autoDelete: true,","        closeChannelOnUnsubscribe: true,","        noDeclare: false,","        arguments: {","          'correlationId': this.correlationId,","          'name': this.get( 'name' ),","          'platform': this.get( 'platform' ),","          'product': this.get( 'product' ),","          'version': this.get( 'version' ),","          'x-host': require( 'os' ).hostname().toLowerCase(),","          'x-pid': process.pid,","          'x-max-length': 1000,","          'x-message-ttl': 900000,","          'x-expires': 900000","        }","      }, serviceBus.prototype.correlationQueue.bind( this ) );","","      // @chainable","      return this;","","    },","    enumerable: false,","    configurable: true,","    writable: false","  },","  workQueue: {","    /**","     * Work Request Queue Configuration","     *","     * @param queue","     */","    value: function workQueue( queue ) {","      this.debug( 'Created RPC Queue [name:%s] with [state:%s].', queue.name, queue.state );","","      var self = this;","","      // Bind to Service RPC.","      queue.bind_headers( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {","        'product': self.get( 'product' ),","        'platform': self.get( 'platform' ),","        'version': self.get( 'version' ),","        'x-match': 'all'","      });","","      // Consumer RPC Requests.","      queue.subscribe({ ack: self.get( 'acknowledge' ), prefetchCount: self.get( 'prefetch' ) }, function( message, headers, deliveryInfo ) {","        self.debug( 'Received RPC Request [%s] with [messageId:%s, correlationId:%s].', deliveryInfo.type, deliveryInfo.messageId, deliveryInfo.correlationId );","","        if( !deliveryInfo.type ) {","          return queue.shift( false );","        }","","        /**","         * Response Callback passed into RPC Handler Method.","         *","         */","        function requestCallback( error, message ) {","          self.debug( 'Publishing RPC Response [messageId:%s] typeof message [%s];', requestCallback.messageId, typeof message );","","          // Publish Response Messaage.","          self.exchange.publish([ self.exchange.name, 'cid', self.correlationId ].join( '.' ), message || error || {}, {","            messageId: requestCallback.messageId,","            correlationId: requestCallback.correlationId,","            mandatory: true,","            deliveryMode: 2,","            priority: 3,","            contentType: 'application/json',","            headers: {","              'correlationId': requestCallback.correlationId || '',","              'product': self.get( 'product' ),","              'version': self.get( 'version' ),","              'x-host': require( 'os' ).hostname().toLowerCase(),","              'x-pid': process.pid","            }","          });","","        }","","        // Response Callback Properties. (Emulated both request and response streams, for now.)","        Object.defineProperties( requestCallback, {","          type: {","            value: deliveryInfo.type,","            enumerable: true,","            configurable: true,","            writable: true","          },","          correlationId: {","            value: deliveryInfo.correlationId,","            enumerable: true,","            configurable: true,","            writable: true","          },","          message: {","            value: message || {},","            enumerable: true,","            configurable: true,","            writable: true","          },","          headers: {","            value: headers || {},","            enumerable: true,","            configurable: true,","            writable: true","          },","          replyTo: {","            value: deliveryInfo.replyTo,","            enumerable: false,","            configurable: true,","            writable: true","          },","          messageId: {","            value: deliveryInfo.messageId,","            enumerable: false,","            configurable: true,","            writable: true","          },","          deliveryInfo: {","            value: deliveryInfo,","            enumerable: false,","            configurable: true,","            writable: true","          },","          connection: {","            value: self.connection,","            enumerable: false,","            configurable: true,","            writable: true","          },","          serviceBus: {","            value: self,","            enumerable: false,","            configurable: true,","            writable: true","          },","          exchange: {","            value: self.exchange,","            enumerable: false,","            configurable: true,","            writable: true","          },","          queue: {","            value: queue,","            enumerable: false,","            configurable: true,","            writable: true","          },","          reject: {","            value: function reject() {","","              if( self.get( 'acknowledge' ) ) {","                queue.shift( true );","              }","","            },","            enumerable: false,","            configurable: true,","            writable: true","          },","          acknowledge: {","            value: function acknowledge() {","","              if( self.get( 'acknowledge' ) ) {","                queue.shift();","              }","","            },","            enumerable: false,","            configurable: true,","            writable: true","          },","          param: {","            /**","             * Emute Express param() Method","             *","             * Get a parameter.","             *","             * @param key","             * @returns {*}","             */","            value: function param( key ) {","              return key ? requestCallback.message[ key ] : requestCallback.message","            },","            enumerable: true,","            configurable: true,","            writable: true","          },","          send: {","            /**","             * Emute Express Send Method","             *","             * @param data","             * @returns {*}","             */","            value: function send( code, data ) {","              return requestCallback( code, data )","            },","            enumerable: true,","            configurable: true,","            writable: true","          }","        });","","        // Engine Handler Exists.","        if( self.engines[ requestCallback.type ] ) {","","          // Automatically Acknowledge.","          requestCallback.acknowledge();","","          // Process Handler.","          self.engines[ requestCallback.type ]( requestCallback, requestCallback, requestCallback );","","        }","","      });","","    },","    enumerable: false,","    configurable: true,","    writable: false","  },","  correlationQueue: {","    /**","     * Instance Correlation Queue.","     *","     * Messages only routed into this queue when in direct response to a message originating form this instance.","     * Receive Messages sent to this specific insance, mostly RPC Responses.","     *","     */","    value: function correlationQueue( queue ) {","      this.debug( 'Created Correlation Queue [name:%s] with [state:%s].', queue.name, queue.state );","","      var self = this;","","      // Bind to service exchange","      queue.bind_headers( [ self.get( 'platform' ), self.get( 'product' ) ].join( '.' ), {","        correlationId: self.correlationId","      });","","      // Receive Messages sent to this specific insance, mostly RPC Responses.","      queue.subscribe({ ack: self.get( 'acknowledge' ), prefetchCount: self.get( 'prefetch' ) }, function( message, headers, deliveryInfo ) {","        self.debug( 'Received RPC Response [messageId:%s].', deliveryInfo.messageId );","","        /**","         * Correlation Message Callback.","         *","         */","        function responseCallback() {}","","        // Response Callback Properties.","        Object.defineProperties( responseCallback, {","          type: {","            value: deliveryInfo.type,","            enumerable: true,","            configurable: true,","            writable: true","          },","          correlationId: {","            value: deliveryInfo.correlationId,","            enumerable: true,","            configurable: true,","            writable: true","          },","          message: {","            value: message || {},","            enumerable: true,","            configurable: true,","            writable: true","          },","          headers: {","            value: headers || {},","            enumerable: true,","            configurable: true,","            writable: true","          },","          replyTo: {","            value: deliveryInfo.replyTo,","            enumerable: false,","            configurable: true,","            writable: true","          },","          messageId: {","            value: deliveryInfo.messageId,","            enumerable: false,","            configurable: true,","            writable: true","          },","          deliveryInfo: {","            value: deliveryInfo,","            enumerable: false,","            configurable: true,","            writable: true","          },","          connection: {","            value: self.connection,","            enumerable: false,","            configurable: true,","            writable: true","          },","          serviceBus: {","            value: self,","            enumerable: false,","            configurable: true,","            writable: true","          },","          exchange: {","            value: self.exchange,","            enumerable: false,","            configurable: true,","            writable: true","          },","          queue: {","            value: queue,","            enumerable: false,","            configurable: true,","            writable: true","          },","          reject: {","            value: function reject() {","","              if( self.get( 'acknowledge' ) ) {","                queue.shift( true );","              }","","            },","            enumerable: false,","            configurable: true,","            writable: true","          },","          acknowledge: {","            value: function acknowledge() {","","              if( self.get( 'acknowledge' ) ) {","                queue.shift();","              }","","            },","            enumerable: false,","            configurable: true,","            writable: true","          }","        });","","        // Acknowledge Receipt.","        responseCallback.acknowledge();","","        // Call Message Handler.","        self.emit([ 'res', responseCallback.messageId ].join( '.' ), null, responseCallback.message, responseCallback.headers );","","      });","","    },","    enumerable: false,","    configurable: true,","    writable: false","  },","  utility: {","    value: require( './common/utility' ),","    enumerable: false,","    configurable: true,","    writable: false","  }","});","","/**"," * serviceBus Constructor Properties"," *"," */","Object.defineProperties( module.exports = serviceBus, {","  create: {","    /**","     * Create Instance","     *","     * @for serviceBus","     */","    value: function create( options ) {","      return new serviceBus( options || {} );","    },","    enumerable: true,","    configurable: true,","    writable: true","  },","  defaults: {","    value: {","      url: undefined,","      acknowledge: true,","      hostname: require( 'os' ).hostname().toLowerCase() || '',","      priority: 3,","      prefetch: 0,","      type: 'headers',","      platform: process.platform,","      product: require( '../package' ).name,","      version: require( '../package' ).version,","      application: 'node.js'","    },","    enumerable: true,","    configurable: true,","    writable: true","  }","});",""];
function serviceBus(options) {
    _$jscoverage_done("lib/connect-servicebus.js", 11);
    if (_$jscoverage_done("lib/connect-servicebus.js", 11, !(this instanceof serviceBus))) {
        _$jscoverage_done("lib/connect-servicebus.js", 12);
        return serviceBus.create(options || {});
    }
    _$jscoverage_done("lib/connect-servicebus.js", 15);
    var self = this;
    _$jscoverage_done("lib/connect-servicebus.js", 16);
    var app = require("express").call();
    _$jscoverage_done("lib/connect-servicebus.js", 17);
    var settings = require("object-settings");
    _$jscoverage_done("lib/connect-servicebus.js", 18);
    var emitter = require("object-emitter");
    _$jscoverage_done("lib/connect-servicebus.js", 19);
    var client = require("varnish-client");
    _$jscoverage_done("lib/connect-servicebus.js", 20);
    var format = require("util").format;
    _$jscoverage_done("lib/connect-servicebus.js", 23);
    return app.once("mount", function mounted(parent) {
        _$jscoverage_done("lib/connect-servicebus.js", 24);
        self.debug("serviceBusMiddleware mounted to [route:%s]", parent.route);
        _$jscoverage_done("lib/connect-servicebus.js", 27);
        Object.defineProperties(this.parent, {
            settings: {
                value: settings.inject(parent).set(parent.settings).set({
                    serviceBus: serviceBus.defaults
                }).set({
                    serviceBus: options
                }).get(),
                enumerable: true,
                configurable: true,
                writable: true
            }
        });
        _$jscoverage_done("lib/connect-servicebus.js", 49);
        Object.defineProperties(this.parent.request, {
            bus_active: {
                get: function get() {
                    _$jscoverage_done("lib/connect-servicebus.js", 57);
                    return self.exchange && self.exchange.state ? true : false;
                },
                enumerable: true,
                configurable: true
            },
            offload: {
                value: function offload(type, callback) {
                    _$jscoverage_done("lib/connect-servicebus.js", 72);
                    var req = this;
                    _$jscoverage_done("lib/connect-servicebus.js", 73);
                    var res = this.res;
                    _$jscoverage_done("lib/connect-servicebus.js", 74);
                    var app = this.app;
                    _$jscoverage_done("lib/connect-servicebus.js", 76);
                    if (_$jscoverage_done("lib/connect-servicebus.js", 76, !self.exchange)) {
                        _$jscoverage_done("lib/connect-servicebus.js", 77);
                        return callback(new Error("ServiceBus Exchange is not ready."), null);
                    }
                    _$jscoverage_done("lib/connect-servicebus.js", 80);
                    try {
                        _$jscoverage_done("lib/connect-servicebus.js", 83);
                        var messageId = self.utility.uid(20);
                        _$jscoverage_done("lib/connect-servicebus.js", 86);
                        self.exchange.publish("", {
                            params: self.utility.deep_extend(req.body, req.query, req.params),
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
                            contentType: "application/json",
                            headers: {
                                product: self.get("product"),
                                platform: self.get("platform"),
                                version: self.get("version"),
                                "x-host": require("os").hostname().toLowerCase(),
                                "x-pid": process.pid
                            }
                        });
                        _$jscoverage_done("lib/connect-servicebus.js", 109);
                        self.debug("Offloaded RPC Request [%s] with [messageId:%s].", type, messageId);
                        _$jscoverage_done("lib/connect-servicebus.js", 112);
                        self.on([ "res", messageId ].join("."), callback);
                    } catch (error) {
                        _$jscoverage_done("lib/connect-servicebus.js", 115);
                        app.debug("Offload Error. [message: %s].", error.message, error.stack);
                        _$jscoverage_done("lib/connect-servicebus.js", 116);
                        return callback(new Error("ServiceBus Exchange failed."), null);
                    }
                },
                enumerable: true,
                writable: true,
                configurable: true
            }
        });
        _$jscoverage_done("lib/connect-servicebus.js", 127);
        Object.defineProperties(this, {
            engines: {
                value: parent.engines,
                enumerable: true,
                configurable: true,
                writable: true
            },
            on: {
                value: parent.on,
                enumerable: true,
                configurable: true,
                writable: true
            },
            emit: {
                value: parent.emit,
                enumerable: true,
                configurable: true,
                writable: true
            },
            correlationId: {
                value: serviceBus.prototype.utility.uid(16).toLowerCase(),
                enumerable: false,
                configurable: true,
                writable: true
            },
            instanceId: {
                value: serviceBus.prototype.utility.uid(16).toLowerCase(),
                enumerable: false,
                configurable: true,
                writable: true
            },
            settings: {
                get: function() {
                    _$jscoverage_done("lib/connect-servicebus.js", 182);
                    return this.parent.get("serviceBus");
                },
                enumerable: true,
                configurable: true
            },
            set: {
                value: function(key, value) {
                    _$jscoverage_done("lib/connect-servicebus.js", 193);
                    this.parent.set("serviceBus." + key, value);
                },
                enumerable: false,
                configurable: true,
                writable: true
            },
            get: {
                value: function(key, defaults) {
                    _$jscoverage_done("lib/connect-servicebus.js", 205);
                    return this.parent.get("serviceBus." + key, defaults);
                },
                enumerable: false,
                configurable: true
            },
            createConnection: {
                value: serviceBus.prototype.createConnection.bind(this),
                enumerable: false,
                configurable: true,
                writable: true
            },
            configureExchange: {
                value: serviceBus.prototype.configureExchange.bind(this),
                enumerable: false,
                configurable: true,
                writable: true
            },
            webSocket: {
                value: serviceBus.prototype.webSocket.bind(this),
                enumerable: false,
                configurable: true,
                writable: true
            },
            debug: {
                value: serviceBus.prototype.debug.bind(this),
                enumerable: false,
                configurable: true,
                writable: true
            },
            connection: {
                value: null,
                enumerable: false,
                configurable: true,
                writable: true
            },
            exchange: {
                value: null,
                enumerable: false,
                configurable: true,
                writable: true
            }
        });
        _$jscoverage_done("lib/connect-servicebus.js", 277);
        this.parent.on("set.serviceBus.url", function url_changed(error, value, path) {
            _$jscoverage_done("lib/connect-servicebus.js", 278);
            app.debug("URL change detected, connecting to [%s].", app.get("url"));
            _$jscoverage_done("lib/connect-servicebus.js", 279);
            app.createConnection();
        });
        _$jscoverage_done("lib/connect-servicebus.js", 283);
        this.set("name", this.get("name" || "").replace(/-/g, "."));
        _$jscoverage_done("lib/connect-servicebus.js", 286);
        if (_$jscoverage_done("lib/connect-servicebus.js", 286, this.get("url"))) {
            _$jscoverage_done("lib/connect-servicebus.js", 287);
            app.debug("Connecting to [%s].", this.get("url"));
            _$jscoverage_done("lib/connect-servicebus.js", 288);
            app.createConnection();
        }
        _$jscoverage_done("lib/connect-servicebus.js", 292);
        return this;
    });
}

_$jscoverage_done("lib/connect-servicebus.js", 302);
Object.defineProperties(serviceBus.prototype, {
    webSocket: {
        value: function webSocket() {
            _$jscoverage_done("lib/connect-servicebus.js", 310);
            var ws = require("ws");
            _$jscoverage_done("lib/connect-servicebus.js", 313);
            this.ws = ws.createServer({
                server: this.server,
                clientTracking: true
            });
            _$jscoverage_done("lib/connect-servicebus.js", 319);
            this.ws.on("connection", function(ws) {});
        },
        enumerable: true,
        configurable: true
    },
    debug: {
        value: require("debug")("connect:servicebus"),
        enumerable: true,
        configurable: true,
        writable: true
    },
    createConnection: {
        value: function createConnection() {
            _$jscoverage_done("lib/connect-servicebus.js", 340);
            var self = this;
            _$jscoverage_done("lib/connect-servicebus.js", 341);
            var amqp = require("amqp");
            _$jscoverage_done("lib/connect-servicebus.js", 342);
            var os = require("os");
            _$jscoverage_done("lib/connect-servicebus.js", 343);
            var cluster = require("cluster");
            _$jscoverage_done("lib/connect-servicebus.js", 344);
            var target;
            _$jscoverage_done("lib/connect-servicebus.js", 346);
            try {
                _$jscoverage_done("lib/connect-servicebus.js", 347);
                target = require("url").parse(this.get("url"));
                _$jscoverage_done("lib/connect-servicebus.js", 349);
                if (_$jscoverage_done("lib/connect-servicebus.js", 349, !target.hostname)) {
                    _$jscoverage_done("lib/connect-servicebus.js", 350);
                    throw new Error("Host name could not be determined.");
                }
            } catch (error) {
                _$jscoverage_done("lib/connect-servicebus.js", 354);
                console.log("createConnection", error, error.stack);
                _$jscoverage_done("lib/connect-servicebus.js", 355);
                return;
            }
            _$jscoverage_done("lib/connect-servicebus.js", 358);
            this.connection = amqp.createConnection({
                host: target.hostname,
                port: target.port || 8e3,
                login: target.auth ? target.auth.split(":")[0] : "",
                password: target.auth ? target.auth.split(":")[1] : "",
                clientProperties: {
                    arch: process.arch,
                    hostname: this.get("hostname"),
                    priority: this.get("priority"),
                    product: this.get("product"),
                    platform: this.get("platform"),
                    version: this.get("version"),
                    applicationName: this.get("application"),
                    pid: process.pid,
                    worker: cluster.isWorker ? cluster.worker.id : null,
                    cpus: require("os").cpus().length || 1,
                    total_memory: require("os").totalmem() || 0,
                    user: process.env.USER || process.env.USERNAME
                }
            });
            _$jscoverage_done("lib/connect-servicebus.js", 380);
            this.connection.on("error", function have_error(error) {
                _$jscoverage_done("lib/connect-servicebus.js", 381);
                self.debug("connection:error [%s], [message:%s]", self.get("name"), error.message);
            });
            _$jscoverage_done("lib/connect-servicebus.js", 386);
            this.connection.once("ready", function is_ready() {
                _$jscoverage_done("lib/connect-servicebus.js", 387);
                self.debug("Connected to AMQP [name:%s].", self.get("name"));
                _$jscoverage_done("lib/connect-servicebus.js", 390);
                self.exchange = self.connection.exchange([ self.get("platform"), self.get("product") ].join("."), {
                    type: "headers",
                    passive: false,
                    confirm: true,
                    noDeclare: false,
                    durable: true,
                    autoDelete: true
                });
                _$jscoverage_done("lib/connect-servicebus.js", 400);
                self.exchange.once("open", serviceBus.prototype.configureExchange.bind(self, null, self.exchange));
            });
            _$jscoverage_done("lib/connect-servicebus.js", 405);
            process.once("SIGINT", function exit() {
                _$jscoverage_done("lib/connect-servicebus.js", 407);
                if (_$jscoverage_done("lib/connect-servicebus.js", 407, self.connection.close)) {
                    _$jscoverage_done("lib/connect-servicebus.js", 408);
                    self.debug("Got SIGINT. Closing ServiceBus Connection.");
                    _$jscoverage_done("lib/connect-servicebus.js", 409);
                    self.connection.close();
                }
            });
        },
        enumerable: true,
        configurable: true,
        writable: true
    },
    configureExchange: {
        value: function configureExchange(error, exchange) {
            _$jscoverage_done("lib/connect-servicebus.js", 428);
            this.debug("Connected to Exchange [name:%s].", exchange.name);
            _$jscoverage_done("lib/connect-servicebus.js", 431);
            this.connection.queue([ exchange.name, "rpc" ].join("."), {
                passive: false,
                durable: true,
                autoDelete: true,
                closeChannelOnUnsubscribe: true,
                noDeclare: false,
                arguments: {
                    product: this.get("product"),
                    platform: this.get("platform"),
                    version: this.get("version"),
                    "x-max-length": 1e3,
                    "x-message-ttl": 9e5,
                    "x-expires": 6e4
                }
            }, serviceBus.prototype.workQueue.bind(this));
            _$jscoverage_done("lib/connect-servicebus.js", 448);
            this.connection.queue([ exchange.name, "cid", this.correlationId ].join("."), {
                passive: false,
                durable: false,
                exclusive: true,
                autoDelete: true,
                closeChannelOnUnsubscribe: true,
                noDeclare: false,
                arguments: {
                    correlationId: this.correlationId,
                    name: this.get("name"),
                    platform: this.get("platform"),
                    product: this.get("product"),
                    version: this.get("version"),
                    "x-host": require("os").hostname().toLowerCase(),
                    "x-pid": process.pid,
                    "x-max-length": 1e3,
                    "x-message-ttl": 9e5,
                    "x-expires": 9e5
                }
            }, serviceBus.prototype.correlationQueue.bind(this));
            _$jscoverage_done("lib/connect-servicebus.js", 470);
            return this;
        },
        enumerable: false,
        configurable: true,
        writable: false
    },
    workQueue: {
        value: function workQueue(queue) {
            _$jscoverage_done("lib/connect-servicebus.js", 484);
            this.debug("Created RPC Queue [name:%s] with [state:%s].", queue.name, queue.state);
            _$jscoverage_done("lib/connect-servicebus.js", 486);
            var self = this;
            _$jscoverage_done("lib/connect-servicebus.js", 489);
            queue.bind_headers([ self.get("platform"), self.get("product") ].join("."), {
                product: self.get("product"),
                platform: self.get("platform"),
                version: self.get("version"),
                "x-match": "all"
            });
            _$jscoverage_done("lib/connect-servicebus.js", 497);
            queue.subscribe({
                ack: self.get("acknowledge"),
                prefetchCount: self.get("prefetch")
            }, function(message, headers, deliveryInfo) {
                _$jscoverage_done("lib/connect-servicebus.js", 498);
                self.debug("Received RPC Request [%s] with [messageId:%s, correlationId:%s].", deliveryInfo.type, deliveryInfo.messageId, deliveryInfo.correlationId);
                _$jscoverage_done("lib/connect-servicebus.js", 500);
                if (_$jscoverage_done("lib/connect-servicebus.js", 500, !deliveryInfo.type)) {
                    _$jscoverage_done("lib/connect-servicebus.js", 501);
                    return queue.shift(false);
                }
                function requestCallback(error, message) {
                    _$jscoverage_done("lib/connect-servicebus.js", 509);
                    self.debug("Publishing RPC Response [messageId:%s] typeof message [%s];", requestCallback.messageId, typeof message);
                    _$jscoverage_done("lib/connect-servicebus.js", 512);
                    self.exchange.publish([ self.exchange.name, "cid", self.correlationId ].join("."), message || error || {}, {
                        messageId: requestCallback.messageId,
                        correlationId: requestCallback.correlationId,
                        mandatory: true,
                        deliveryMode: 2,
                        priority: 3,
                        contentType: "application/json",
                        headers: {
                            correlationId: requestCallback.correlationId || "",
                            product: self.get("product"),
                            version: self.get("version"),
                            "x-host": require("os").hostname().toLowerCase(),
                            "x-pid": process.pid
                        }
                    });
                }
                _$jscoverage_done("lib/connect-servicebus.js", 531);
                Object.defineProperties(requestCallback, {
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
                            _$jscoverage_done("lib/connect-servicebus.js", 601);
                            if (_$jscoverage_done("lib/connect-servicebus.js", 601, self.get("acknowledge"))) {
                                _$jscoverage_done("lib/connect-servicebus.js", 602);
                                queue.shift(true);
                            }
                        },
                        enumerable: false,
                        configurable: true,
                        writable: true
                    },
                    acknowledge: {
                        value: function acknowledge() {
                            _$jscoverage_done("lib/connect-servicebus.js", 613);
                            if (_$jscoverage_done("lib/connect-servicebus.js", 613, self.get("acknowledge"))) {
                                _$jscoverage_done("lib/connect-servicebus.js", 614);
                                queue.shift();
                            }
                        },
                        enumerable: false,
                        configurable: true,
                        writable: true
                    },
                    param: {
                        value: function param(key) {
                            _$jscoverage_done("lib/connect-servicebus.js", 632);
                            return key ? requestCallback.message[key] : requestCallback.message;
                        },
                        enumerable: true,
                        configurable: true,
                        writable: true
                    },
                    send: {
                        value: function send(code, data) {
                            _$jscoverage_done("lib/connect-servicebus.js", 646);
                            return requestCallback(code, data);
                        },
                        enumerable: true,
                        configurable: true,
                        writable: true
                    }
                });
                _$jscoverage_done("lib/connect-servicebus.js", 655);
                if (_$jscoverage_done("lib/connect-servicebus.js", 655, self.engines[requestCallback.type])) {
                    _$jscoverage_done("lib/connect-servicebus.js", 658);
                    requestCallback.acknowledge();
                    _$jscoverage_done("lib/connect-servicebus.js", 661);
                    self.engines[requestCallback.type](requestCallback, requestCallback, requestCallback);
                }
            });
        },
        enumerable: false,
        configurable: true,
        writable: false
    },
    correlationQueue: {
        value: function correlationQueue(queue) {
            _$jscoverage_done("lib/connect-servicebus.js", 681);
            this.debug("Created Correlation Queue [name:%s] with [state:%s].", queue.name, queue.state);
            _$jscoverage_done("lib/connect-servicebus.js", 683);
            var self = this;
            _$jscoverage_done("lib/connect-servicebus.js", 686);
            queue.bind_headers([ self.get("platform"), self.get("product") ].join("."), {
                correlationId: self.correlationId
            });
            _$jscoverage_done("lib/connect-servicebus.js", 691);
            queue.subscribe({
                ack: self.get("acknowledge"),
                prefetchCount: self.get("prefetch")
            }, function(message, headers, deliveryInfo) {
                _$jscoverage_done("lib/connect-servicebus.js", 692);
                self.debug("Received RPC Response [messageId:%s].", deliveryInfo.messageId);
                function responseCallback() {}
                _$jscoverage_done("lib/connect-servicebus.js", 701);
                Object.defineProperties(responseCallback, {
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
                            _$jscoverage_done("lib/connect-servicebus.js", 771);
                            if (_$jscoverage_done("lib/connect-servicebus.js", 771, self.get("acknowledge"))) {
                                _$jscoverage_done("lib/connect-servicebus.js", 772);
                                queue.shift(true);
                            }
                        },
                        enumerable: false,
                        configurable: true,
                        writable: true
                    },
                    acknowledge: {
                        value: function acknowledge() {
                            _$jscoverage_done("lib/connect-servicebus.js", 783);
                            if (_$jscoverage_done("lib/connect-servicebus.js", 783, self.get("acknowledge"))) {
                                _$jscoverage_done("lib/connect-servicebus.js", 784);
                                queue.shift();
                            }
                        },
                        enumerable: false,
                        configurable: true,
                        writable: true
                    }
                });
                _$jscoverage_done("lib/connect-servicebus.js", 795);
                responseCallback.acknowledge();
                _$jscoverage_done("lib/connect-servicebus.js", 798);
                self.emit([ "res", responseCallback.messageId ].join("."), null, responseCallback.message, responseCallback.headers);
            });
        },
        enumerable: false,
        configurable: true,
        writable: false
    },
    utility: {
        value: require("./common/utility"),
        enumerable: false,
        configurable: true,
        writable: false
    }
});

_$jscoverage_done("lib/connect-servicebus.js", 819);
Object.defineProperties(module.exports = serviceBus, {
    create: {
        value: function create(options) {
            _$jscoverage_done("lib/connect-servicebus.js", 827);
            return new serviceBus(options || {});
        },
        enumerable: true,
        configurable: true,
        writable: true
    },
    defaults: {
        value: {
            url: undefined,
            acknowledge: true,
            hostname: require("os").hostname().toLowerCase() || "",
            priority: 3,
            prefetch: 0,
            type: "headers",
            platform: process.platform,
            product: require("../package").name,
            version: require("../package").version,
            application: "node.js"
        },
        enumerable: true,
        configurable: true,
        writable: true
    }
});