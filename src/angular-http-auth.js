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
     * Holds a list of functions that define rules for ignoring
     * the addition of requests to the buffer.
     */
    var ignoreUrlExpressions = [];

    /**
     * Adds functions to the `ignoreUrlExpressions` array.
     * The fn function takes a URL as a response as an argument and returns
     * `true` (to ignore the URL) or `false` (to allow the URL). When `true` is
     * returned no other expressions will be tested.
     */
    this.addIgnoreUrlExpression = function (fn) {
      if (angular.isFunction(fn)) { ignoreUrlExpressions.push(fn); }
      return this;
    };

    /**
     * Executes each of the ignore expressions to determine whether the URL
     * should be ignored.
     * 
     * Example:
     *
     *     angular.module('mod', ['http-auth-interceptor'])
     *       .config(function (authServiceProvider) {
     *         authServiceProvider.addIgnoreUrlExpression(function (response) {
     *           return response.config.url === "/api/auth";
     *         });
     *       });
     */
    this.shouldIgnoreUrl = function (response) {
      var fn, i, j = ignoreUrlExpressions.length;

      for (i = 0; i < j; i++) {
        fn = ignoreUrlExpressions[i];
        if (fn(response) === true) { return true; }
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
        /**
        * call this function to indicate that authentication was successfull and trigger a 
        * retry of all deferred requests.
        * Function accepts a data argument to pass on to $broadcast which may be useful for
        * example if you need to pass through details of the user that was logged in
        */
        loginConfirmed: function (data) {
          $rootScope.$broadcast('event:auth-loginConfirmed', data);
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

          if (!authServiceProvider.shouldIgnoreUrl(response)) {
            authServiceProvider.pushToBuffer(response.config, deferred);
          }

          $rootScope.$broadcast('event:auth-loginRequired');
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
