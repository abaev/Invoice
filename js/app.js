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


// Обработка события начала роутинга,
// чтобы показать оверлей с гифкой Загрузка
angular.module('invoiceApp')
	.run(['$rootScope', 'invRouting', function($rootScope, invRouting) {
		$rootScope.$on('$routeChangeStart', function(evt, next, previous) {
			invRouting.isRunning = true;
		});
	}]);


// Обработка события успешного
// окончания роутинга,
// чтобы скрыть оверлей с гифкой Загрузка
// Что-то решить для события с ошибкой роутинга
angular.module('invoiceApp')
	.run(['$rootScope', 'invRouting', function($rootScope, invRouting) {
		$rootScope.$on('$routeChangeSuccess', function(evt, next, previous) {
			invRouting.isRunning = false;
		});
	}]);


angular.module('invoiceApp')
	.config(['$cookiesProvider', function($cookiesProvider) {
		$cookiesProvider.path = '/';
		$cookiesProvider.domain = 'alex.enwony.net';
	}]);