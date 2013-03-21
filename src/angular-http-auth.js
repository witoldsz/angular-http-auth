/*global angular:true, browser:true */

/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 */

angular.module('http-auth-interceptor', [])

  .provider('authService', function () {
    /**
     * Holds all the requests which failed due to 401 response,
     * so they can be re-requested in future, once login is completed.
     */
    var buffer = [];

    /**
     * Holds a list of functions that define rules for custom URL handlers
     */
    var urlHandlers = [];

    /**
     * Adds functions to the `urlHandlers` array.
     * The `method` is the name of the HTTP method (GET, POST, etc.) #optional
     * The `url` can be either a string or a RegEx #optional
     * The `handler` argument is a method that receives a `response` and a
     * `deferred` as arguments and returns `true` if the URL has been handled or
     * `false` if default handling should occur. When `true` is returned no
     * other expressions will be tested.
     *
     * Example:
     *
     *     angular.module('mod', ['http-auth-interceptor'])
     *       .config(function ($rootScope, authServiceProvider) {
     *         authServiceProvider
     *           // method & url based
     *           .when('POST', '/api/auth', function (response, deferred) {
     *             deferred.reject(response);
     *             $rootScope.$broadcast 'event:authorization-failed'
     *             return true;
     *           })
     *           // url based
     *           .when('/api/auth', function (response, deferred) {
     *             deferred.reject(response);
     *             $rootScope.$broadcast 'event:authorization-failed'
     *             return true;
     *           })
     *           // handler based
     *           .when(function (response, deferred) {
     *             var handled = response.config.url === "/api/auth";
     *             if (handled) {
     *               deferred.reject(response);
     *               $rootScope.$broadcast 'event:authorization-failed'
     *             }
     *             return handled;
     *           });
     *       });
     */
    this.when = function (method, url, handler) {
      if (angular.isFunction(method)) {
        urlHandlers.push({handler: method});
      } else if (angular.isString(method) && angular.isFunction(url)) {
        urlHandlers.push({
          url: method,
          handler: url
        });
      } else if (angular.isFunction(handler)) {
        urlHandlers.push({
          method: method,
          url: url,
          handler: handler
        });
      }
      return this;
    };

    this.whenGET = function (url, handler) {
      this.when('GET', url, handler);
    };
    this.whenPOST = function (url, handler) {
      this.when('POST', url, handler);
    };
    this.whenPUT = function (url, handler) {
      this.when('PUT', url, handler);
    };
    this.whenDELETE = function (url, handler) {
      this.when('DELETE', url, handler);
    };
    this.whenHEAD = function (url, handler) {
      this.when('HEAD', url, handler);
    };
    this.whenJSONP = function (url, handler) {
      this.when('JSONP', url, handler);
    };
    this.whenPATCH = function (url, handler) {
      this.when('PATCH', url, handler);
    };

    /**
     * helps in matching http methods and URLs by utilizing both exact matching
     * and regular expression pattern matching.
     */
    var matchesPattern = function (pattern, val) {
      // If `pattern` is a regular expression
      if (pattern instanceof RegExp) { return pattern.test(val); }

      // Exact match if pattern is not a regular expression
      return val === pattern;
    };

    /**
     * Executes each of the handler methods to determine whether the URL
     * should be ignored.
     *
     * By gaining access to the deferred object we can prevent the deault
     * functionality for handled routes. For instance from a controller we
     * can now handle an error that may occur when logging in, perhaps
     * credentials were incorrect.
     */
    this.didHandleUrl = function (response, deferred) {
      var fn, handler = null, i, j = urlHandlers.length;

      for (i = 0; i < j; i++) {
        fn = urlHandlers[i];
        handler = null;

        if (fn.method && fn.url) {
          if (matchesPattern(fn.method, response.config.method) &&
              matchesPattern(fn.url, response.config.url)) {
            handler = fn.handler;
          }
        } else if (fn.url) {
          if (matchesPattern(fn.url, response.config.url)) {
            handler = fn.handler;
          }
        } else {
          handler = fn.handler;
        }

        if (handler && handler(response, deferred) === true) { return true; }
      }

      return false;
    };

    /**
     * Required by HTTP interceptor.
     * Function is attached to provider to be invisible for regular users of this service.
     */
    this.pushToBuffer = function (config, deferred) {
      buffer.push({
        config: config,
        deferred: deferred
      });
    };

    this.$get = ['$rootScope', '$injector', function ($rootScope, $injector) {
      var $http; //initialized later because of circular dependency problem
      function retry(config, deferred) {
        $http = $http || $injector.get('$http');
        $http(config).then(function (response) {
          deferred.resolve(response);
        });
      }
      function retryAll() {
        var i;

        for (i = 0; i < buffer.length; ++i) {
          retry(buffer[i].config, buffer[i].deferred);
        }
        buffer = [];
      }

      return {
        loginConfirmed: function () {
          $rootScope.$broadcast('event:auth-loginConfirmed');
          retryAll();
        }
      };
    }];
  })

  /**
   * $http interceptor.
   * On 401 response - it stores the request and broadcasts 'event:angular-auth-loginRequired'.
   */
  .config(['$httpProvider', 'authServiceProvider', function ($httpProvider, authServiceProvider) {

    var interceptor = ['$rootScope', '$q', function ($rootScope, $q) {
      function success(response) {
        return response;
      }

      function error(response) {
        if (response.status === 401) {
          var deferred = $q.defer();

          // The event is now only broadcast if the URL is not ignored.
          // This helps when an ignored route effects the deferred object
          if (!authServiceProvider.didHandleUrl(response, deferred)) {
            authServiceProvider.pushToBuffer(response.config, deferred);
            $rootScope.$broadcast('event:auth-loginRequired');
          }

          return deferred.promise;
        }
        // otherwise
        return $q.reject(response);
      }

      return function (promise) {
        return promise.then(success, error);
      };

    }];
    $httpProvider.responseInterceptors.push(interceptor);
  }]);