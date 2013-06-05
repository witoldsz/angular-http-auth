/**
 * This module is used to simulate backend server for this demo application.
 */
angular.module('content-mocks',['ngMockE2E'])
  .run(function($httpBackend) {

    var user = null;
    $httpBackend.whenPOST('auth/login').respond(function(method, url, data) {
      if (angular.isString(data)) {
        try {
          user = angular.fromJson(data).username;
        }
        catch (err) {
          return [500];
        }
      }
      else {
        user = null;
      }
      return [200];
    });
    $httpBackend.whenPOST('auth/logout').respond(function(method, url, data) {
      user = null;
      return [200];
    });


    $httpBackend.whenPOST('data/public').respond(function(method, url, data) {
      return [200,'I have received and processed your data [' + data + '].'];
    });
    $httpBackend.whenPOST('data/protected').respond(function(method, url, data) {
      return user ? [200,'This is confidential [' + data + '].'] : [401];
    });
    $httpBackend.whenPOST('data/adminOnly').respond(function(method, url, data) {
      return user === 'admin' ? [200,'This is admin-only [' + data + '].'] : user ? [403, 'admin'] : [401];
    });

    //otherwise

    $httpBackend.whenGET(/.*/).passThrough();

  });
