HTTP Auth Interceptor Module
============================
for AngularJS
-------------

This is the implementation of the concept described in
[Authentication in AngularJS (or similar) based application](http://www.espeo.pl/1-authentication-in-angularjs-application/).

There are releases for both AngularJS **1.0.x** and **1.2.x**,
see [releases](https://github.com/witoldsz/angular-http-auth/releases).

Launch demo [here](http://witoldsz.github.com/angular-http-auth/)
or switch to [gh-pages](https://github.com/witoldsz/angular-http-auth/tree/gh-pages)
branch for source code of the demo.

Usage
------

- Install via bower: `bower install --save angular-http-auth`
- ...or via npm: `npm install --save angular-http-auth`
- Include as a dependency in your app: `angular.module('myApp', ['http-auth-interceptor'])`

Manual
------

This module installs $http interceptor and provides the `authService`.

The $http interceptor does the following:
the configuration object (this is the requested URL, payload and parameters)
of every HTTP 401 response is buffered and everytime it happens, the
`event:auth-loginRequired` message is broadcasted from $rootScope.

The `authService` has only one method: `loginConfirmed()`.
You are responsible to invoke this method after user logged in. You may optionally pass in
a data argument to the loginConfirmed method which will be passed on to the loginConfirmed
$broadcast. This may be useful, for example if you need to pass through details of the user
that was logged in. The `authService` will then retry all the requests previously failed due
to HTTP 401 response.

In the event that a requested resource returns an HTTP 403 response (i.e. the user is
authenticated but not authorized to access the resource), the user's request is discarded and
the `event:auth-forbidden` message is broadcast from $rootScope.

#### Ignoring the 401 interceptor

Sometimes you might not want the interceptor to intercept a request even if one returns 401 or 403. In a case like this you can add `ignoreAuthModule: true` to the request config. A common use case for this would be, for example, a login request which returns 401 if the login credentials are invalid.

###Typical use case:

* somewhere (some service or controller) the: `$http(...).then(function(response) { do-something-with-response })` is invoked,
* the response of that requests is a **HTTP 401**,
* `http-auth-interceptor` captures the initial request and broadcasts `event:auth-loginRequired`,
* your application intercepts this to e.g. show a login dialog:
 * DO NOT REDIRECT anywhere (you can hide your forms), just show login dialog
* once your application figures out the authentication is OK, call: `authService.loginConfirmed()`,
* your initial failed request will now be retried and when proper response is finally received,
the `function(response) {do-something-with-response}` will fire,
* your application will continue as nothing had happened.

###Advanced use case:

####Sending data to listeners:
You can supply additional data to observers across your application who are listening for `event:auth-loginConfirmed`:

      $scope.$on('event:auth-loginConfirmed', function(event, data){
      	$rootScope.isLoggedin = true;
      	$log.log(data)
      });

Use the `authService.loginConfirmed([data])` method to emit data with your login event.

####Updating [$http(config)](https://docs.angularjs.org/api/ng/service/$http):
Successful login means that the previous request are ready to be fired again, however now that login has occurred certain aspects of the previous requests might need to be modified on the fly. This is particularly important in a token based authentication scheme where an authorization token should be added to the header.

The `loginConfirmed` method supports the injection of an Updater function that will apply changes to the http config object.

    authService.loginConfirmed([data], [Updater-Function])

    //application of tokens to previously fired requests:
    var token = reponse.token;

    authService.loginConfirmed('success', function(config){
      config.headers["Authorization"] = token;
      return config;
    })

The initial failed request will now be retried, all queued http requests will be recalculated using the Updater-Function.

