angular.module('content-mocks',['ngMockE2E'])
  .run(function($httpBackend) {

    var authorized = false;
    $httpBackend.whenPOST('auth/login').respond(function(method, url, data) {
      authorized = true;
      return [200];
    });
    $httpBackend.whenPOST('auth/logout').respond(function(method, url, data) {
      authorized = false;
      return [200];
    });
    
    
    $httpBackend.whenGET('data/public').respond("Public content");
    $httpBackend.whenGET('data/protected').respond(function() {
      return authorized ? [200,'Protected content available'] : [401];
    });

    //otherwise

    $httpBackend.whenGET(/.*/).passThrough();

  });