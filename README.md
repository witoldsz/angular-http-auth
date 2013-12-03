HTTP Auth Interceptor Module
============================
for AngularJS
-------------

This is the implementation of the concept described in
[Authentication in AngularJS (or similar) based application](http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application).

There are releases for both AngularJS **1.0.x** and **1.2.x**,
see [releases](https://github.com/witoldsz/angular-http-auth/releases).

Launch demo [here](http://witoldsz.github.com/angular-http-auth/)
or switch to [gh-pages](https://github.com/witoldsz/angular-http-auth/tree/gh-pages)
branch for source code of the demo.

Manual
------

This module installs $http interceptor and provides the `authService`.

The $http interceptor does the following:
the configuration object (this is the requested URL, payload and parameters)
of every HTTP 401 response is buffered and everytime it happens, the
`event:auth-loginRequired` message is broadcasted from $rootScope.

The `authService` has only one method: #loginConfirmed().
You are responsible to invoke this method after user logged in. You may optionally pass in
a data argument to the loginConfirmed method which will be passed on to the loginConfirmed
$broadcast. This may be useful, for example if you need to pass through details of the user
that was logged in. The `authService` will then retry all the requests previously failed due
to HTTP 401 response.

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
