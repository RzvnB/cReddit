angular.module('articlesService', [])
	.factory('Article', ['$http', function($http) {
		return {
			get : function() {
				return $http.get('/api/articles');
			},
			create : function(articleData) {
				return $http.post('/api/articles', articleData);
			},
			delete : function(id) {
				return $http.delete('/api/articles/' + id);
			},
			update : function(articleData) {
				return $http.post('/api/update', articleData);
			},
			registerVote : function(voteData) {
				return $http.post('/api/vote', voteData);
			},
			getComments : function(articleId) {
				return $http.get('/api/comment/' + articleId);
			},
			postComment : function(commentData) {
				return $http.post('/api/comment', commentData);
			}
		}
	}])
