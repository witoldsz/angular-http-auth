angular.module('angular-auth-demo').controller({
  LoginController: function ($scope, $http, authService) {
    $scope.username = null;
    $scope.password = null;

    $scope.login = function() {
      $http.post('auth/login', {username: $scope.username, password: $scope.password}).success(function() {
        authService.confirmLogin();
      });
    };

    $scope.cancel = function() {
      authService.cancelLogin();
    };
  }

});
