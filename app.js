angular.module('invoiceApp', [])
	.controller('invoiceFormController',
		['$scope', '$http', 'numFormatFilter', '$filter',
		function($scope, $http, numFormatFilter, $filter) {
		
		var receiverLabels = ['Название организации', 'Ф.И.О.'], i = 0;
		
		$scope.receiverLabel = receiverLabels[i];
		$scope.addingInput = false; // Используется в addInput();
		$scope.newInputLabel = ''; // Используется в addInput();
		$scope.invoiceCurrency = 'руб.';
		$scope.invoiceDiscountType = 'percent';
		$scope.ndsType = '1';
		$scope.ndsRate = '0';
		$scope.invoiceDiscount = 0;
		$scope.invoiceShipping = 0;
		$scope.invoiceDate = $filter('date')(new Date(), 'dd.MM.yyyy');
		$scope.invoiceLogoSrc = 'img/add_logo.png';


		// Опциональные поля ввода
		$scope.optionalTextInputs = [
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

		$scope.itemsTable = [];

		/* Пока не используются в контроллере но есть в index.html
		$scope.receiverPhone
		$scope.receiverEmail */


		// Изменение по щелчку Название/Ф.И.О.
		$scope.changeReceiverLabel = function() {
			$scope.receiverLabel = receiverLabels[++i % 2];
		}

		
		// Скрывает/показывает дополнительные поля (Руководитель, ИНН, и др.)
		$scope.showHideInput = function(id) {
			angular.forEach($scope.optionalTextInputs, function(value, key) {
				if(value.id == id) value.visible = !value.visible;
			});
		}

		
		// Добавляет новые поля
		$scope.addInput = function() {
			if($scope.newInputLabel == '' && !$scope.addingInput) {
				$scope.addingInput = true; // Показать поле ввода для label
			}
			else { // обработка ввода
				$scope.optionalTextInputs.push(
					{
						id: 'addedInput' + $scope.optionalTextInputs.length,
						text: $scope.newInputLabel,
						visible: true
					});
				
				// Возвращаем в начальное состояние
				$scope.newInputLabel = '';
				$scope.addingInput = false;
			}
		}

		
		// Добавляет строки в таблицу
		$scope.addItem = function() {
			$scope.itemsTable.push(
				{
					index: $scope.itemsTable.length,
					name: '',
					quantity: 1,
					measure: 'шт.',
					price: 0,
					amount: function() {
						var result = this.quantity * this.price; 
						return result;
					}
			});
		}

		
		// Удаление строки из таблицы
		$scope.removeItem = function(index) {
			for(var i = 0; i < $scope.itemsTable.length; i++) {
				if($scope.itemsTable[i].index == index) {
					$scope.itemsTable.splice(i, 1);
					break;
				}
			}
		}
		
		
		$scope.resetForm = function() {
			// Заменяет .ng-dirty на .ng-pristine
			$scope.invoiceForm.$setPristine();
		}


		/* Важно!! Перепроверить перед продакшеном
		Функции, подсчитывающие Подитог, НДС, Скидку */
		$scope.ndsCalc = function() {
			/* Включен в стоимость, не считаем, и дополнительная проверка,
			чтоб отрицательные суммы не получались, когда пользователь
			добавляет - удаляет строки */
			if($scope.ndsType == 0) {
				if($scope.subTotal() <= 0) return 0;
				 return $scope.subTotal() / (100 + +$scope.ndsRate) * $scope.ndsRate;
			}

			return ( $scope.subTotal() - $scope.invoiceDiscountCalc() ) * $scope.ndsRate / 100;

		}

		
		$scope.invoiceDiscountCalc = function() {
			if($scope.invoiceDiscountType == 'percent') {
				return $scope.subTotal() * $scope.invoiceDiscount / 100;
			}
			return $scope.invoiceDiscount;
		}

		
		$scope.subTotal = function() {
			var result = 0;
			angular.forEach($scope.itemsTable, function(el) {
				result += el.amount();
			});
			return result;
		}

		
		$scope.invoiceTotal = function() {
			if($scope.subTotal() <= 0) return 0;

			if($scope.ndsType == 0) { // НДС включен в стоимость, его не считаем
				return $scope.subTotal() - $scope.invoiceDiscountCalc() + $scope.invoiceShipping;
			}
			
			return $scope.subTotal() + $scope.ndsCalc() - $scope.invoiceDiscountCalc() + $scope.invoiceShipping;
		}
		// Конец функций подсчета

		
		// Отправляем на сервер данные пользователя
		$scope.send = function() {
			var userData;
			
			userData = {
				invoiceHtml: $('#pdfTemplate').find('[class]').removeAttr('class').end().html()
			}

			$http.post('http://localhost:8080', JSON.stringify(userData))
				.then(function(response) {
					console.log(response);
				},
				function(response) {
					console.log(response);
			});

			console.log(userData.invoiceHtml);

		} 

		
		$scope.addItem(); // Первая строка таблицы

	}]);


// Форматирование - 2 цифры после запятой,
// если NaN то фильтр возвращает ноль
angular.module('invoiceApp')
	.filter('numFormat', function() {
		
		var numberFormatter = new Intl.NumberFormat('ru', {
			minimumIntegerDigits: '1',
			minimumFractionDigits: '2',
			maximumFractionDigits: '2'
		});
		
		return function(num) {
			if( isNaN(num) ) return numberFormatter.format(0);
			
			// На невероятный совершенно случай астрономических чисел -
			// экспоненциальная запись, чтоб всё было красиво и цифры
			// не лезли со всех щелей, хоть и с потерей точности
			if(num > 9999999999999999999) return num.toExponential(10);
			
			return numberFormatter.format(num);
		}

	});


// Добавляет логотип - получает путь
// к выбранному пользователем файлу с изображением
angular.module('invoiceApp')
	.directive('invAddLogo', [function() {
		return {
			link: function(scope, element, attrs) {
				element.bind('change', function(event) {
											
					var files = event.target.files;

				  // FileReader support
				  if (FileReader && files && files.length) {
				      var fr = new FileReader();
				      fr.onload = function () {
			          scope.invoiceLogoSrc = fr.result;
			          scope.$apply();

			          // Чтобы событие change возникало,
			          // даже если пользователь выберет
			          // тот же файл снова
			          element.val('');
			        }

				      fr.readAsDataURL(files[0]);
				  }
				});
			}
		}
	}]);


// Datepicker
angular.module('invoiceApp')
	.directive('invDatePicker', [function() {
		return {
			link: function(scope, element, attrs) {
				element.datepicker(
					{
						dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
						firstDay: 1, // Понедельник - первый день недели
						monthNames: ['Январь', 'Февраль', 'Март', 'Апрель',
							'Май', 'Июнь', 'Июль', 'Август',
							'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
						dateFormat: 'dd.mm.yy',
						nextText: 'Следующий',
						prevText: 'Предыдущий'
					});
			}
		}
	}]);

// Добавляет Bootstrap Tooltip
angular.module('invoiceApp')
	.directive('invTooltip', [function() {
		return {
			link: function(scope, element, attrs) {
				element.tooltip();
			}
		}
	}]);



/*$scope.$watch('itemsTable', function() {
			$scope.subTotal = 0;
			angular.forEach($scope.itemsTable, function(el) {
				$scope.subTotal += el.amount();
			});
	}, true);*/
