angular.module('invoiceApp',
[
	'app.directives',
	'app.controllers',
	'app.services',
	'app.filters',

	'ngRoute',
	'ngSanitize',
	'ngCookies'
]);


angular.module('invoiceApp')
	.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			// .when('/showpdf', {
			// 	templateUrl: './templates/showpdf.tmpl.html'
			// })
			.when('/', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'templates': ['getTemplates', function(getTemplates) {
						return getTemplates(-1);
					}]
				}
			})
			.when('/template0', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'templates': ['getTemplates', function(getTemplates) {
						return getTemplates(0);
					}]
				}
			})
			.when('/template1', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'templates': ['getTemplates', function(getTemplates) {
						return getTemplates(1);
					}]
				}
			})
			.when('/template2', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'templates': ['getTemplates', function(getTemplates) {
						return getTemplates(2);
					}]
				}
			})
			.when('/template3', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'templates': ['getTemplates', function(getTemplates) {
						return getTemplates(3);
					}]
				}
			})
			.otherwise({redirectTo: '/'});
	}]);


angular.module('invoiceApp')
	.config(['$cookiesProvider', function($cookiesProvider) {
		$cookiesProvider.path = '/';
		$cookiesProvider.domain = 'alex.enwony.net';
	}]);