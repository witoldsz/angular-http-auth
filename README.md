# HTTP Auth Interceptor Module

##for AngularJS

This is the implementation of the concept described in
[Authentication in AngularJS (or similar) based application](http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application).

There are releases for both AngularJS **1.0.x** and **1.2.x**,
see [releases](https://github.com/witoldsz/angular-http-auth/releases).

Launch demo [here](http://witoldsz.github.com/angular-http-auth/)
or switch to [gh-pages](https://github.com/witoldsz/angular-http-auth/tree/gh-pages)
branch for source code of the demo.

## Manual

This module installs an $http interceptor.

The $http interceptor does the following:
the configuration object (this is the requested URL, payload and parameters)
of every HTTP 401 response is buffered and everytime it happens, the
`event:auth-loginRequired` message is broadcasted from $rootScope. The argument of that message contains three fields:

* `rejection`: The original argument from AngularJS
* `confirmLogin`: The function to call to retry all previously failed requests due to HTTP 401
* `cancelLogin`: Empties the requests buffer

You are responsible to invoke the `confirmLogin` method after the user logged in; then all requests previously failed due to a HTTP 401 response will be retried.

You can also call the `cancelLogin` method to clear the requests buffer, as an example if the user decides to cancel the login.

Here are the events that can be broadcasted by angular-http-auth:

* `event:auth-loginRequired`: Fired whenever an HTTP 401 response occurs. The argument contains the methods required to confirm or cancel the login (`confirmLogin` and `cancelLogin`)
* `event:auth-loginConfirmed`: Fired after `confirmLogin` has been called.
* `event:auth-loginCancelled`: Fired after `cancelLogin` has been called.

### Example:

Here is a simple example where myLoginService.promptLogin() is a custom service that shows a modal window and returns a promise.

```javascript
$scope.$on('event:auth-loginRequired', function(e, args) {
	myLoginService.promptLogin().then(
		function() {
			args.confirmLogin();
		},
		function() {
			args.cancelLogin();
		});
});
```

### Typical use case:

* somewhere (some service or controller) the: `$http(...).then(function(response) { do-something-with-response })` is invoked,
* the response of that requests is a **HTTP 401**,
* `http-auth-interceptor` captures the initial request and broadcasts `event:auth-loginRequired`,
* your application intercepts this to e.g. show a login dialog:
 * DO NOT REDIRECT anywhere (you can hide your forms), just show login dialog
* once your application figures out the authentication is OK, call: `args.confirmLogin()`,
* your initial failed request will now be retried and when proper response is finally received,
the `function(response) {do-something-with-response}` will fire,
* your application will continue as nothing had happened.

### Advanced use case:

Same beginning as before but;

* once your application figures out the authentication is OK, call: `args.confirmLogin([data], [updateConfigFunc])`,
* your initial failed request will now be retried but you can supply additional data to observers who are listening for `event:auth-loginConfirmed`, and all your queued http requests will be recalculated by your `updateConfigFunc(httpConfig)` function. This is very useful if you need to update the headers with new credentials and/or tokens from your successful login.
