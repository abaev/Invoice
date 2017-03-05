angular.module('app.controllers',
	['app.services']);

angular.module('app.controllers')
	.controller('invoiceController',
		['$scope', '$http', '$cookies', 'numFormatFilter', '$filter', '$route', '$timeout', 'changeReceiverLabel',
		'showHideInput', 'addInput', 'addItem', 'removeItem', 'resetForm',
		'send', 'calc', 'closeModal', 'saveTemplate', 

		function($scope, $http, $cookies, numFormatFilter, $filter, $route, $timeout, changeReceiverLabel,
			showHideInput, addInput, addItem, removeItem, resetForm,
			send, calc, closeModal, saveTemplate) {
			var self = this;
			$scope.self = this;
			
			var templates;
			if($route && $route.current && $route.current.locals) {
				// В докоментации Angular'а ничего нет, про проблему
				// передачи resolve из $routeProvider в контроллер,
				// если контроллер инициализируется с помощью ng-controller.
				// Так что такой вот хитрый способ ещё и потому, что $route
				// обновляется когда промисы разрешаются что-ли (черт знает)
				// в итоге становясь тем, чем нам надо (вот это точно).
				// DI просто охреневший
				templates = $route.current.locals.templates;
			}

			// Services
			self.changeReceiverLabel = changeReceiverLabel;
			self.showHideInput = showHideInput;
			self.addInput = addInput;
			self.addItem = addItem;
			self.removeItem = removeItem;
			self.resetForm = resetForm;
			self.send = send;
			self.calc = calc;
			self.closeModal = closeModal;
			self.saveTemplate = saveTemplate;
			
			self.invoicePayer = 'One';
			$timeout(function() {
				self.invoicePayer = 'Two';
			}, 5000);
			self.receiverLabel = 'Название организации';
			self.addingInput = false; // Используется в addInput();
			self.newInputLabel = ''; // Используется в addInput();
			self.invoiceCurrency = 'руб.';
			self.invoiceDiscountType = 'percent';
			self.ndsType = '1';
			self.ndsRate = '0';
			self.invoiceDiscount = 0;
			self.invoiceShipping = 0;
			self.invoiceDate = $filter('date')(new Date(), 'dd.MM.yyyy');
			self.invoiceLogoSrc = 'img/add_logo.png';
			self.email = {
				payerEmailText: 'PDF со счетом на ваше имя в приложении к письму.'
			};

			// Опциональные поля ввода
			self.optionalTextInputs = [
				{
					id: 'receiverPhone',
					text: 'Телефон',
					visible: true
				},

				{
					id: 'receiverEmail',
					text: 'E-mail',
					visible: true
				},

				{
					id: 'receiverAddress',
					text: 'Адрес',
					visible: true
				},

				{
					id: 'chiefName',
					text: 'Руководитель',
					visible: false
				},

				{
					id: 'invoiceINN',
					text: 'ИНН',
					visible: false
				},

				{
					id: 'invoiceKPP',
					text: 'КПП',
					visible: false
				},

				{
					id: 'invoiceBIK',
					text: 'БИК',
					visible: false
				},
			];

			self.itemsTable = [];

			if(templates) console.log(templates);
			if(templates && templates.current != -1) {
				// Инициализируем контроллер загруженным шаблоном
				$timeout(function() {
					
					$scope.$apply(function() {
						angular.extend(self, templates.arr[templates.current]);
						self.receiverName = 'Бла-бла';
						console.log('self = ');
						console.log(self);
					});
										
					// $scope.$digest();
				}, 1000);
				
				
			}
		
			self.addItem(self); // Первая строка таблицы
	}]);





