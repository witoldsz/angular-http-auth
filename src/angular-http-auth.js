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
     * The fn function takes a response and a deferred object as arguments
     * and returns `true` if the URL has been handled or `false` if default
     * handling should occur. When `true` is returned no other expressions will
     # be tested.
     */
    this.addUrlHandler = function (fn) {
      if (angular.isFunction(fn)) { urlHandlers.push(fn); }
      return this;
    };

    /**
     * Executes each of the ignore expressions to determine whether the URL
     * should be ignored.
     *
     * By gaining access to the deferred object we can prevent the deault
     * functionality for ignored routes. For instance from a custom service we
     * can now handle an error that may occur when logging in, perhaps
     * credentials were incorrect.
     * 
     * Example:
     *
     *     angular.module('mod', ['http-auth-interceptor'])
     *       .config(function ($rootScope, authServiceProvider) {
     *         authServiceProvider.addUrlHandler(function (response, deferred) {
     *           var handled = response.config.url === "/api/auth";
     *           if (handled) {
     *             deferred.reject(response);
     *             $rootScope.$broadcast 'event:authorization-failed'
     *           }
     *           return handled;
     *         });
     *       });
     */
    this.handleUrl = function (response, deferred) {
      var fn, i, j = urlHandlers.length;

      for (i = 0; i < j; i++) {
        fn = urlHandlers[i];
        if (fn(response, deferred) === true) { return true; }
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
          if (!authServiceProvider.handleUrl(response, deferred)) {
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