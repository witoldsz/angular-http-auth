authService = ($rootScope, httpBuffer) ->
	###
	Call this function to indicate that authentication was successfull and trigger a
	retry of all deferred requests.
	@param data an optional argument to pass on to $broadcast which may be useful for
	example if you need to pass through details of the user that was logged in
	@param configUpdater an optional transformation function that can modify the                                                                                                                                                   
	requests that are retried after having logged in.  This can be used for example
	to add an authentication token.  It must return the request.
	###
	loginConfirmed: (data, configUpdater) ->
		updater = configUpdater || (config) -> return config
		$rootScope.$broadcast('event:auth-loginConfirmed', data)
		httpBuffer.retryAll(updater)
	  
	###
	Call this function to indicate that authentication should not proceed.
	All deferred requests will be abandoned or rejected (if reason is provided).
	@param data an optional argument to pass on to $broadcast.
	@param reason if provided, the requests are rejected; abandoned otherwise.
	###
	loginCancelled: (data, reason) ->
		httpBuffer.rejectAll(reason)
		$rootScope.$broadcast('event:auth-loginCancelled', data)

###
$http interceptor.
On 401 response (without 'ignoreAuthModule' option) stores the request
and broadcasts 'event:auth-loginRequired'.
On 403 response (without 'ignoreAuthModule' option) discards the request
and broadcasts 'event:auth-forbidden'.
###
authInterceptor = ($rootScope, $q, httpBuffer) ->
	responseError: (rejection) ->
		if !rejection.config.ignoreAuthModule
			switch rejection.status
				when 401
					deferred = $q.defer()
					httpBuffer.append(rejection.config, deferred)
					$rootScope.$broadcast('event:auth-loginRequired', rejection)
					return deferred.promise
				when 403
					$rootScope.$broadcast('event:auth-forbidden', rejection)
					
		# otherwise, default behaviour
		return $q.reject(rejection)

provider = (provider) ->
    provider?.interceptors.push 'authInterceptor'
    
angular.module 'http-auth-interceptor', ['http-auth-interceptor-buffer', 'sails.io']

	.factory 'authInterceptor', ['$rootScope', '$q', 'httpBuffer', authInterceptor]
	
	.factory 'authService', ['$rootScope', 'httpBuffer', authService]

	.config ['$httpProvider', provider]

	.config ['$sailsSocketProvider', provider]
	
$injector = ($injector) ->
	buffer = []
	
	$http = null
	
	retryHttpRequest = (config, deferred) ->
		$http = $http || $injector.get('$http')
		$http(config)
			.then (response) ->
				deferred.resolve(response)
			.catch (response) ->
				deferred.reject(response)
				
		$sailsSocket = $sailsSocket || $injector.get('$sailsSocket')
		$sailsSocket(config)
			.then (response) ->
				deferred.resolve(response)
			.catch (response) ->
				deferred.reject(response)

	# Appends HTTP request configuration object with deferred response attached to buffer.
	append: (config, deferred) ->
		buffer.push
			config: config
			deferred: deferred
        
	# Abandon or reject (if reason provided) all the buffered requests.
	rejectAll: (reason) ->
		if reason
			for req in buffer 
				req.deferred.reject(reason)
		buffer = []
      
	# Retries all the buffered requests clears the buffer.
	retryAll: (updater) ->
		for req in buffer
			retryHttpRequest(updater(req.config), req.deferred)
		buffer = []
	
# Private module, a utility, required internally by 'http-auth-interceptor'.
angular.module 'http-auth-interceptor-buffer', []

	.factory 'httpBuffer', ['$injector', $injector]