angular.module('invoiceApp',
[
	'app.directives',
	'app.controllers',
	'app.services',
	'app.filters',

	'ngRoute',
	'ngSanitize'
]);


angular.module('invoiceApp')
	.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/showpdf', {
				templateUrl: './templates/showpdf.tmpl.html'
			})
			.when('/', {
				templateUrl: './templates/main.tmpl.html'
			})
			.otherwise({redirectTo: '/'});
	}]);