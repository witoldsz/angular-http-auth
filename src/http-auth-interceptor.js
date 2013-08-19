/*global angular:true, browser:true */

/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 */
(function () {
  'use strict';

  angular.module('http-auth-interceptor', ['http-auth-interceptor-buffer'])

  .factory('authService', ['$rootScope','httpBuffer', function($rootScope, httpBuffer) {
    return {
      /**
       * call this function to indicate that authentication was successfull and trigger a
       * retry of all deferred requests.
       * @param data an optional argument to pass on to $broadcast which may be useful for
       * example if you need to pass through details of the user that was logged in
       */
      loginConfirmed: function(data) {
        $rootScope.$broadcast('event:auth-loginConfirmed', data);
        httpBuffer.retryAll();
      },

      /**
       * call this function to indicate that authentication should not proceed.
       * All deferred requests will be cancelled.
       * @param data an optional argument to pass on to $broadcast.
       */
      loginCancelled: function(data) {
        httpBuffer.rejectAll();
        $rootScope.$broadcast('event:auth-loginCancelled', data);
      }
    };
  }])

  /**
   * $http interceptor.
   * On 401 response (without 'ignoreAuthModule' option) stores the request
   * and broadcasts 'event:angular-auth-loginRequired'.
   * On 403 response (without 'ignoreAuthModule' option) stores the request
   * and broadcasts 'event:angular-auth-forbidden'.
   */
  .config(['$httpProvider', function($httpProvider) {

    var interceptor = ['$rootScope', '$q', 'httpBuffer', function($rootScope, $q, httpBuffer) {
      function success(response) {
        return response;
      }

      function error(response) {
        var authNeeded = null;
        if (!response.config.ignoreAuthModule) {
          if (response.status === 401) {
            authNeeded = 'event:auth-loginRequired';
          }
          else {
            if (response.status === 403) {
              authNeeded = 'event:auth-forbidden';
            }
          }
        }
        if (authNeeded) {
          var deferred = $q.defer();
          httpBuffer.append(response.config, deferred);
          //pass the response data which may have information on the reason for 401 or 403
          $rootScope.$broadcast(authNeeded, response.data);
          return deferred.promise;
        }
        else {
          // otherwise, default behaviour
          return $q.reject(response);
        }
      }

      return function(promise) {
        return promise.then(success, error);
      };

    }];
    $httpProvider.responseInterceptors.push(interceptor);
  }]);

  /**
   * Private module, a utility, required internally by 'http-auth-interceptor'.
   */
  angular.module('http-auth-interceptor-buffer', [])

  .factory('httpBuffer', ['$injector', function($injector) {
    /** Holds all the requests, so they can be re-requested in future. */
    var buffer = [];

    /** Service initialized later because of circular dependency problem. */
    var $http;

    function retryHttpRequest(config, deferred) {
      function successCallback(response) {
        deferred.resolve(response);
      }
      function errorCallback(response) {
        deferred.reject(response);
      }
      $http = $http || $injector.get('$http');
      $http(config).then(successCallback, errorCallback);
    }

    return {
      /**
       * Appends HTTP request configuration object with deferred response attached to buffer.
       */
      append: function(config, deferred) {
        buffer.push({
          config: config,
          deferred: deferred
        });
      },

      /**
       * anything deferred shouldn't happen, so reject it
       * and clear the buffer
       */
      rejectAll: function() {
        for (var i =0; i < buffer.length; i++) {
          try {
            buffer[i].deferred.reject('[http-auth-cancelled]');
          }
          catch (err) {
          }
        }
        buffer = [];
      },

      /**
       * Retries all the buffered requests clears the buffer.
       */
      retryAll: function() {
        for (var i = 0; i < buffer.length; ++i) {
          retryHttpRequest(buffer[i].config, buffer[i].deferred);
        }
        buffer = [];
      }
    };
  }]);
})();
