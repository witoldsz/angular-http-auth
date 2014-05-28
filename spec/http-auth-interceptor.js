'use strict';

describe('http auth interceptor', function() {

  var authService, $httpBackend, $http, $scope;
  var methods = ['GET', 'POST', 'UPDATE', 'DELETE'];

  beforeEach(function() {
    // Load http-auth-interceptor module
    module('http-auth-interceptor');
  });
  
  beforeEach(function() {
    // Get services and make them available
    inject(function(_authService_, _$httpBackend_, _$http_, _$rootScope_) {
      authService = _authService_;
      $httpBackend = _$httpBackend_;
      $http = _$http_;
      $scope = _$rootScope_;
    });
    
    // Spy on $emit to detect events
    spyOn($scope, '$broadcast');  
  });

  describe('events', function() {
  
    it('should broadcast "event:auth-loginRequired" on http 401 respones and "event:auth-loginConfirmed" after calling loginConfirmed', function() {
      angular.forEach(methods, function(method) {
        // require authentication (http 401)
        $httpBackend.expect(method, '/myresource').respond(401);
        $http({method: method, url: '/myresource'});
        $httpBackend.flush();
        expect($scope.$broadcast).toHaveBeenCalledWith('event:auth-loginRequired', jasmine.any(Object));        
        $scope.$broadcast.reset();
        
        // confirm auth
        $httpBackend.expect(method, '/myresource').respond(200);
        authService.loginConfirmed();
        expect($scope.$broadcast).toHaveBeenCalledWith('event:auth-loginConfirmed', undefined);        
      });
    });

    it('should broadcast "event:auth-loginRequired" on http 401 respones and "event:auth-loginCancelled" after calling loginConfirmed', function() {
      angular.forEach(methods, function(method) {
        // require authentication (http 401)
        $httpBackend.expect(method, '/myresource').respond(401);
        $http({method: method, url: '/myresource'});
        $httpBackend.flush();
        expect($scope.$broadcast).toHaveBeenCalledWith('event:auth-loginRequired', jasmine.any(Object));        
        $scope.$broadcast.reset();
        
        // confirm auth
        authService.loginCancelled();
        expect($scope.$broadcast).toHaveBeenCalledWith('event:auth-loginCancelled', undefined);        
      });
    });
    
    it('should not broadcast any event on responses other than 401', function() {
      // most of the following tests don't make sense, but they also don't hurt
      for(status = 100; status <= 599; status++) {
        angular.forEach(methods, function(method) {
          $httpBackend.expect(method, '/myresource').respond(status);
          $http({method: method, url: '/myresource'});
          $httpBackend.flush();
          expect($scope.$broadcast).not.toHaveBeenCalled();
        });
      }
    });
  
  });

});
