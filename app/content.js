angular.module('angular-auth-demo').controller({
  ContentController: function ($scope, $http) {

    $scope.publicContent = [];
    $scope.restrictedContent = [];
    $scope.restrictedAdminContent = [];

    $scope.publicAction = function() {
      $http.post('data/public', $scope.publicData).success(function(response) {
        $scope.publicContent.push(response);
        $scope.publicData = '';
      });
    }

    $scope.restrictedAction = function() {
      $http.post('data/protected', $scope.restrictedData).success(function(response) {
        // this piece of code will not be executed until user is authenticated
        $scope.restrictedContent.push(response);
        $scope.restrictedData = '';
      });
    }

    $scope.restrictedAdminAction = function() {
      $http.post('data/adminOnly', $scope.restrictedAdminData).success(function(response) {
        // this piece of code will not be executed until user is authenticated as admin
        $scope.restrictedAdminContent.push(response);
        $scope.restrictedAdminData = '';
      });
    }

    $scope.logout = function() {
      $http.post('auth/logout').success(function() {
        $scope.restrictedContent = [];
        $scope.restrictedAdminContent = [];
      });
    }
  }

});

