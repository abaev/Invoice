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
					'template': ['getTemplates', function(getTemplates) {
						// Просто количество шаблонов
						return getTemplates();
					}]
				}
			})
			.when('/template0', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'template': ['getTemplates', function(getTemplates) {
						// Получить нужный шаблон и всё остальное
						// (общее количество и номер текущего шаблона)
						return getTemplates(0);
					}]
				}
			})
			.when('/template1', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'template': ['getTemplates', function(getTemplates) {
						// Получить нужный шаблон и всё остальное
						// (общее количество и номер текущего шаблона)
						return getTemplates(1);
					}]
				}
			})
			.when('/template2', {
				templateUrl: './templates/main.tmpl.html',
				controller: 'invoiceController',
				controllerAs: 'mainCtrl',
				resolve: {
					'template': ['getTemplates', function(getTemplates) {
						// Получить нужный шаблон и всё остальное
						// (общее количество и номер текущего шаблона)
						return getTemplates(2);
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