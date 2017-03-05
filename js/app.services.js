angular.module('app.services', []);


angular.module('app.services')
	.factory('dependencies', function() {
		return {
			SERVER_URL: 'http://alex.enwony.net/server' // http://localhost:8080'
		}
	});


// Изменение по щелчку Название/Ф.И.О.
angular.module('app.services')
	.factory('changeReceiverLabel', function() {
		var receiverLabels = ['Название организации', 'Ф.И.О.'], i = 0;

		return function(ctrl) {
				ctrl.receiverLabel = receiverLabels[++i % 2];
			}
	});



// Скрывает/показывает дополнительные поля (Руководитель, ИНН, и др.)
angular.module('app.services')
	.factory('showHideInput', function() {
		return function(ctrl, id) {
				angular.forEach(ctrl.optionalTextInputs, function(value, key) {
					if(value.id == id) value.visible = !value.visible;
				});
			}
	});


// Добавляет новые поля
angular.module('app.services')
	.factory('addInput', function() {
		return function(ctrl) {
				if(ctrl.newInputLabel == '' && !ctrl.addingInput) {
					ctrl.addingInput = true; // Показать поле ввода для label
				}	else { // обработка ввода
					ctrl.optionalTextInputs.push(
						{
							id: 'addedInput' + ctrl.optionalTextInputs.length,
							text: ctrl.newInputLabel,
							visible: true
						});
					// Возвращаем в начальное состояние
					ctrl.newInputLabel = '';
					ctrl.addingInput = false;
				}
			}
	});


// Добавляет строки в таблицу
angular.module('app.services')
	.factory('addItem', function() {
		return function(ctrl) {
				ctrl.itemsTable.push(
					{
						index: ctrl.itemsTable.length,
						name: '',
						quantity: 1,
						measure: 'шт.',
						price: 0
				});
			}
	});


// Удаление строки из таблицы
angular.module('app.services')
	.factory('removeItem', function() {
		return function(ctrl, index) {
				for(var i = 0; i < ctrl.itemsTable.length; i++) {
					if(ctrl.itemsTable[i].index == index) {
						ctrl.itemsTable.splice(i, 1);
						break;
					}
				}
			}
	});

// Reset form
angular.module('app.services')
	.factory('resetForm', ['$window', function($window) {
			return function(ctrl, form) {
					// Заменяет .ng-dirty на .ng-pristine
					// form.$setPristine();

					// Может и переделать потом...
					$window.location.reload(false);
				}
		}]);


// Отправляем на сервер данные пользователя
angular.module('app.services')
	.factory('send', ['$http', 'dependencies', function($http, dependencies) {
		return function(ctrl) {
				var userData = {
					invoiceHtml: $('#pdfTemplate').html(),
					email: ctrl.email,
					sendRequired: ctrl.sendRequired,
					preview: ctrl.preview
				};

				ctrl.response = null;

				if(!ctrl.preview) ctrl.sendState = true;
				userData.email.payerEmailSubj = userData.email.payerEmailSubj ||
					'Счет № ' + ctrl.invoiceNumber + ' от ' + ctrl.receiverName;
				userData.email.payerEmailText = userData.email.payerEmailText ||
					'PDF со счетом на ваше имя в приложении к письму.';
				if(!ctrl.formData) ctrl.formData = new FormData();
				ctrl.formData.set('userData', JSON.stringify(userData));
				
				// 'Content-Type': undefined, иначе multiparty
				// отвечает Invalid request: unsupported content-type
				$http.post(dependencies.SERVER_URL, ctrl.formData, {
					headers: {'Content-Type': undefined}
				})
					.then(function successCallback(response) {
						console.log(response);
						ctrl.response = angular.copy(response);
					},
					function errorCallback(response) {
						console.log(response);
						ctrl.response = angular.copy(response);
				});

			}
	}]);


angular.module('app.services')
	.factory('saveTemplate',
		['$http', 'dependencies', function($http, dependencies) {
			return function(ctrl) {
				var template = {
					invoiceLogoSrc: ctrl.invoiceLogoSrc,
					invoiceNumber: ctrl.invoiceNumber,
					invoiceDate: ctrl.invoiceDate,
					invoiceCurrency: ctrl.invoiceCurrency,
					invoicePayer: ctrl.invoicePayer,
					invoiceBriefly: ctrl.invoiceBriefly,		
					receiverLabel: ctrl.receiverLabel,
					receiverName: ctrl.receiverName,
					// addingInput: ctrl.addingInput,
					// newInputLabel: ctrl.newInputLabel,
					ndsType: ctrl.ndsType,
					ndsRate: ctrl.ndsRate,
					invoiceDiscount: ctrl.invoiceDiscount,
					invoiceDiscountType: ctrl.invoiceDiscountType,
					invoiceShipping: ctrl.invoiceShipping,
					invoiceComment: ctrl.invoiceComment,
					
					// Objects
					email: angular.copy(ctrl.email),
					// Опциональные поля ввода
					optionalTextInputs: angular.copy(ctrl.optionalTextInputs),
					// Таблица
					itemsTable: angular.copy(ctrl.itemsTable)
				};

				$http.post(dependencies.SERVER_URL + '/templates', template)
					.then(function successCallback(response) {
						console.log(response);
					},
					function errorCallback(response) {
						console.log(response);
				});
			}
		}]);


// Функции расчета Промежуточного итога,
// НДС, Скидки, Доставки, Итого
// Пороверить их
angular.module('app.services')
	.factory('calc', function() {
		return {
			nds: nds,
			discount: discount,
			subTotal: subTotal,
			total: total
		}

		function nds(ctrl) {
			/* Включен в стоимость, не считаем, и дополнительная проверка,
			чтоб отрицательные суммы не получались, когда пользователь
			добавляет - удаляет строки */
			if(ctrl.ndsType == 0) {
				if(subTotal(ctrl) <= 0) return 0;
				 return subTotal(ctrl) / (100 + +ctrl.ndsRate) * ctrl.ndsRate;
			}
			return ( subTotal(ctrl) - discount(ctrl) )
				* ctrl.ndsRate / 100;
		}

		function discount(ctrl) {
			if(ctrl.invoiceDiscountType == 'percent') {
				return subTotal(ctrl) * ctrl.invoiceDiscount / 100;
			}
			return ctrl.invoiceDiscount;
		}

		function subTotal(ctrl) {
			var result = 0;
			angular.forEach(ctrl.itemsTable, function(el) {
				result += el.quantity * el.price
			});
			return result;
		}

		function total(ctrl) {
				if(subTotal(ctrl) <= 0) return 0;

				if(ctrl.ndsType == 0) { // НДС включен в стоимость, его не считаем
					return subTotal(ctrl) - discount(ctrl) + ctrl.invoiceShipping;
				}
				
				return subTotal(ctrl) + nds(ctrl)	- discount(ctrl) + ctrl.invoiceShipping;
			}
	});


// Убирает Bootstrap's modal
angular.module('app.services')
	.factory('closeModal', function() {
		return function(id) {
			$(id).modal('hide');
			$('body').removeClass('modal-open');
			$('.modal-backdrop').remove();
		}
	});


angular.module('app.services')
	.factory('getTemplates', ['$http', '$location', 'dependencies',
		function($http, $location, dependencies) {
			return function(templNumber) {
				return $http.get(dependencies.SERVER_URL + '/templates')
					.then(function successCallback(response) {
						// Если нет сохраненных шаблонов - 
						// редирект без сохранения в истории
						if(templNumber == -1) {
							// Если не хотим показывать шаблон, а загружаем путь '/'
							return {
								arr: response.data,
								current: templNumber
							};
						}
						if(response.data.length <= templNumber) $location.path('/').replace();
						return {
							arr: response.data,
							current: templNumber
						};
					},
					function errorCallback(response) {
						// Ошибка - тоже редирект
						$location.path('/').replace();
						return {
							arr: [],
							current: templNumber
						};;
					});
			}
		}]);



