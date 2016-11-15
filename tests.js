'use strict';

describe('http-auth-interceptor Module', function () {

  describe('Test that interceptor is configured', function () {

    var httpProvider;

    beforeEach(module('http-auth-interceptor', function ($httpProvider) {
      httpProvider = $httpProvider;
    }));

    it('`httpProvider.interceptors` should contain `requestService`', inject(function () {
      expect(httpProvider.interceptors).toContain('requestService');
    }));

  });

  describe('Test `authService`', function () {

    // var rootScope;

    beforeEach(module('http-auth-interceptor'));

    // Setup the mock service in an anonymous module.
    // beforeEach(module(function () {
    // }));

    /*
    beforeEach(inject(function ($injector) {
      // rootScope = $rootScope.$new();
      rootScope = $injector.get('$rootScope');
      spyOn(rootScope, '$broadcast').andCallThrough();
    }));
    */

    it('can get an instance of `authService`', inject(function(authService) {
      expect(authService).toBeDefined();
    }));

    /*
    it('it broadcasts a signal when invoking `loginConfirmed`', inject(function(authService) {
      authService.loginConfirmed();
      expect(rootScope.$broadcast).toHaveBeenCalledWith('event:auth-loginConfirmed', undefined);
    }));
    */

  });

});
