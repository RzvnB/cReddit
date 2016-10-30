	angular.module('mainController', [])
		.controller('MainController',['$rootScope', '$scope', '$http',  'Article', 'User', '$window','ngDialog', 'marked', function($rootScope, $scope, $http, Article, User, $window, ngDialog, marked) {

			$scope.formData = {};
			$scope.loginData = {};
			$scope.registerData = {};
			$scope.commentData = {};
			// console.log("WTFFFFF")

			$rootScope.isAuthenticated = false;
			$rootScope.loggedInUsername = null;
			$scope.canEdit = false;
			$scope.votes = $scope.votes || []
			$scope.image = ""
			$scope.tab = 1;

			$scope.markdown = "*This* **is** [markdown](https://daringfireball.net/projects/markdown/)\n and `{{ 1 + 2 }}` = {{ 1 + 2 }}";
      $scope.markdownService = marked('#TEST');

      // --
      // normal flow, function call
      $scope.convertMarkdown = function() {
        vm.convertedMarkdown = marked(vm.markdown);
      }

			$scope.data = { page: 'hot',
							commentPage: null,
							edit_article: null,
							setTab: function(tabId) {
					        	$scope.tab = tabId;
					    	},
					    	isSet: function(tabId) {
						        return $scope.tab === tabId;
						    }};


			User.checkStatus()
				.success(function(data) {
					if(data.status) {
						$rootScope.isAuthenticated = true;
						$rootScope.loggedInUsername = data.username
					}
				})

			Article.get()
	            .success(function(data) {
	            	// console.log($rootScope.loggedInUsername)
	            	// console.log(data)
	            	// console.log($rootScope.loggedInUsername)
	                $scope.articles = data;
	            });

	        $scope.createArticle = function() {
	        	if(!$.isEmptyObject($scope.formData)) {
	        		$scope.formData.username = $rootScope.loggedInUsername
	        		Article.create($scope.formData)
	        				.success(function(data) {
	        					$scope.formData = {};
	        					$scope.articles = data;
	        				});
	        	}
	        };

	        $scope.deleteArticle = function(id) {
	        	Article.delete(id)
	        			.success(function(data) {
	        				$scope.articles = data;
	        			});
	        }

	        $scope.isUriImage = function(uri) {
				    //make sure we remove any nasty GET params
				    uri = uri.split('?')[0];
				    //moving on, split the uri into parts that had dots before them
				    var parts = uri.split('.');
				    //get the last part ( should be the extension )
				    var extension = parts[parts.length-1];
				    //define some image types to test against
				    var imageTypes = ['jpg','jpeg','tiff','png','gif','bmp'];
				    //check if the extension matches anything in the list.
				    if(imageTypes.indexOf(extension) !== -1) {
				        return true;
    				}
					}

	        $scope.handleLink = function(link) {
	       		if($scope.isUriImage(link)) {
	       			$scope.image = link;
	       			$scope.openImage();
	       		} else {
	       			$scope.openLink(link);
	       		}
	        }

	        $scope.openLink = function(link) {
	        	$window.open(link, '_blank');
	        }

	     //    $scope.setTab = function(tabId) {
		     //    	this.tab = tabId;
	    	// }

		    // $scope.isSet = function(tabId) {
		    //     return this.tab === tabId;
		    // }

		    $scope.clickToOpenLogin = function () {
		            ngDialog.open({
					    template: 'loginForm',
					    className: 'ngdialog-theme-default',
					    controller: 'MainController'
					});
		    }

		    $scope.clickToOpenRegister = function () {
		            ngDialog.open({
					    template: 'registerForm',
					    className: 'ngdialog-theme-default',
					    controller: 'MainController'
					});
		    }

		    $scope.openImage = function () {
		            ngDialog.open({
					    template: 'imageModal',
					    className: 'ngdialog-theme-default',
					    scope: $scope
					});
		    }



		    $scope.clickToOpenComments = function (art_id) {
		    		$scope.data.commentPage = art_id;
		    		// console.log("HELLLLOOOOOOOOUUUU")
		    		// console.log("AICI SUNT "+$scope.data.commentPage);
		    		Article.getComments(art_id)
		    			   .success(function(data) {
		    			   		$scope.comments = data;
		    			   		console.log(data)
		    			   })
		            ngDialog.open({
					    template: 'commentForm',
					    className: 'ngdialog-theme-default custom-width-900s',
					    scope: $scope
					});
		    }

		    $scope.createComment = function() {
		    		console.log("aici aici " + $scope.data.commentPage)
		    		if(!$.isEmptyObject($scope.commentData)) {
				    	$scope.commentData.article_id = $scope.data.commentPage;
				    	Article.postComment($scope.commentData)
				    		   .success(function(data) {
				    		   		$scope.commentData = {};
				    		   		$scope.comments = data;
				    		   })
				    }
		    }

		    $scope.clickToOpenEdit = function(article) {
		    		// console.log("aici " + $rootScope.loggedInUsername)
		    		// console.log("aici " + article.username)
			   		// console.log("aici " + (article.username !== $rootScope.loggedInUsername))
		    		$scope.data.edit_article = JSON.parse(JSON.stringify(article));
		    		// console.log($scope.edit_article)
		    		ngDialog.open({
		    			template: 'editForm',
		    			className: 'ngdialog-theme-default custom-width-900',
		    			scope: $scope
		    		})
		    }

		    $scope.updateArticle = function() {
		    	Article.update($scope.data.edit_article)
		    		   .success(function(data) {
	        					$scope.articles = data;
	        				})
		    }

		   	$scope.registerUser = function() {
		   		if(!$.isEmptyObject($scope.registerData)) {
		   			User.register($scope.registerData)
		   					.success(function() {
		   						$rootScope.loggedInUsername = $scope.registerData.username
		   						$scope.registerData = {};
		   						$rootScope.isAuthenticated = true;
		   					});
		   		}
		   	}

		   	$scope.loginUser = function() {
		   		console.log("helo")
		   		console.log($rootScope.isAuthenticated)
		   		if(!$.isEmptyObject($scope.loginData)) {
		   			User.login($scope.loginData)
		   					.success(function() {
		   						// $rootScope.loggedInUsername = $scope.loginData.username
		   						// console.log("de aicisa " + $rootScope.loggedInUsername)
		   						// console.log("hellooo")
		   						// console.log($scope.loginData)
		   						$rootScope.loggedInUsername = $scope.loginData.username
		   						$scope.loginData = {};
		   						$rootScope.isAuthenticated = true;
		   						// console.log($rootScope.isAuthenticated)
		   					});
		   		}
		   	}


		   	$scope.logoutUser = function() {
		   		User.logout()
		   			.success(function() {
		   				$rootScope.isAuthenticated = false;
		   				$rootScope.loggedInUsername = null
		   			})
		   	}

		   	$scope.checkOP = function(username) {
		   		// console.log("aici " +username !== $rootScope.loggedInUsername)
		   		return username === $rootScope.loggedInUsername
		   	}

		   	$scope.changeVote = function(vote, flag, index, idx){
			    // $scope.vote = vote==flag?'None':flag;
			    var toSend = {};
			    $scope.votes[index] = $scope.votes[index] || 'None'
			    if(flag === 'up') {
			    	// if(flag === 'None')
			    	//
			  		if($scope.votes[index] === 'None')
			    		$scope.articles[idx].votes = $scope.articles[idx].votes + 1;
			    	if($scope.votes[index] === 'down')
			    		$scope.articles[idx].votes = $scope.articles[idx].votes + 2;
			    	// if(flag === 'down')
			    	// 	$scope.articles[idx].votes = $scope.articles[idx].votes + 2;
			    	toSend.vote = $scope.articles[idx].votes;
			    }
			    if($scope.votes[index] === 'None') {
			    	if(flag === 'up')
			    		$scope.articles[idx].votes = $scope.articles[idx].votes - 1;
			    	if(flag === 'down')
			    		$scope.articles[idx].votes = $scope.articles[idx].votes +1;
			    	toSend.vote = $scope.articles[idx].votes;
			    }
			    if($scope.votes[index] === 'down') {
			    	// if(flag === 'None')
			    		$scope.articles[idx].votes = $scope.articles[idx].votes - 1;
			    	// if(flag === 'down')
			    	// 	$scope.articles[idx].votes = $scope.articles[idx].votes - 2;
			    	toSend.vote = $scope.articles[idx].votes;
			    }
			    $scope.votes[index] = $scope.votes[index]==flag?'None':flag;
			    // console.log($scope.votes)
			    // $scope.crtIndex = index;
		  	};


		}])
