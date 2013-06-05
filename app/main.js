angular.module('angular-auth-demo', ['http-auth-interceptor','content-mocks'])
  /**
   * This directive will find itself inside HTML as a class,
   * and will remove that class, so CSS will remove loading image and show app content.
   * It is also responsible for showing/hiding login form.
   */
  .directive('authDemoApplication', function() {
    return {
      restrict: 'C',
      link: function(scope, elem, attrs) {
        //once Angular is started, remove class:
        elem.removeClass('waiting-for-angular');
        scope.requiredPermission = null;

        var login = elem.find('#login-holder');
        var main = elem.find('#content');

        login.hide();

        scope.$on('event:auth-loginRequired', function() {
          scope.requiredPermission = null;
          login.slideDown('slow', function() {
            main.hide();
          });
        });
        scope.$on('event:auth-forbidden', function(evt, arg1) {
          scope.requiredPermission = null;
          if (arg1) {
            scope.requiredPermission = arg1;
          }
          login.slideDown('slow', function() {
            main.hide();
          });
        });
        scope.$on('event:auth-loginConfirmed', function() {
          scope.requiredPermission = null;
          main.show();
          login.slideUp();
        });
        scope.$on('event:auth-loginCancelled', function() {
          scope.requiredPermission = null;
          main.show();
          login.slideUp();
        });
      }
    };
  });
