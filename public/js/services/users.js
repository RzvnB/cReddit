angular.module('usersService', [])
    .factory('User', ['$http', function($http) {
        return {
            register : function(userData) {
                return $http.post('/api/register', userData);
            },
            login : function(userData) {
                return $http.post('/api/login', userData);
            },
            logout : function() {
                return $http.get('/api/logout');
            },
            checkStatus : function() {
                return $http.get('/api/status');
            }
        }
    }])
