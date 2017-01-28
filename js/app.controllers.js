angular.module('app.controllers',
	['app.services']);

angular.module('app.controllers')
	.controller('invoiceController',
		['$scope', '$http', 'numFormatFilter', '$filter', 'changeReceiverLabel',
		'showHideInput', 'addInput', 'addItem', 'removeItem', 'resetForm',
		'send', 'calc',

		function($scope, $http, numFormatFilter, $filter, changeReceiverLabel,
			showHideInput, addInput, addItem, removeItem, resetForm,
			send, calc) {
			
			var self = this;

			// Services
			self.changeReceiverLabel = changeReceiverLabel;
			self.showHideInput = showHideInput;
			self.addInput = addInput;
			self.addItem = addItem;
			self.removeItem = removeItem;
			self.resetForm = resetForm;
			self.send = send;
			self.calc = calc;
			
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
			self.payerEmailText = 'PDF со счетом на ваше имя в приложении к письму.';

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
		
			self.addItem(self); // Первая строка таблицы
	}]);





