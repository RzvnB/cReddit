angular.module('myApp', ['mainController', 'articlesService', 'usersService', 'ui.router', 'ngDialog', 'hc.marked', 'hljs', 'angular-markdown-editor'])

.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', 'markedProvider', 'hljsServiceProvider', function($locationProvider, $stateProvider, $urlRouterProvider, markedProvider, hljsServiceProvider) {
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/index.html',
            controller: 'MainController'
        });

    markedProvider.setOptions({
        gfm: true,
        tables: true,
        sanitize: true,
        highlight: function (code, lang) {
          if (lang) {
            return hljs.highlight(lang, code, true).value;
          } else {
            return hljs.highlightAuto(code).value;
          }
        }
      });

      // highlight config
    hljsServiceProvider.setOptions({
      // replace tab with 4 spaces
      tabReplace: '    '
    });

}])
