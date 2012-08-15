angular.module('angular-auth-demo').controller({
  ContentController: function ($scope, $http) {

    $scope.publicContent = [];
    $scope.restrictedContent = [];

    $scope.publicAction = function() {
      $http.get('data/public').success(function(response) {
        $scope.publicContent.push(response);
      });
    }

    $scope.restrictedAction = function() {
      $http.get('data/protected').success(function(response) {
        // this piece of code will not be executed until user is authenticated
        $scope.restrictedContent.push(response);
      });
    }

    $scope.logout = function() {
      $http.post('auth/logout').success(function() {
        $scope.restrictedContent = [];
      });
    }
  }
  
});

