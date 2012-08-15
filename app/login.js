angular.module('angular-auth-demo').controller({
  LoginController: function ($scope, $http, authService) {
    $scope.submit = function() {
      $http.post('auth/login').success(function() {
        authService.loginConfirmed();
      });
    }
  }
  
});

