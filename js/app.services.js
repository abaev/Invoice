angular.module('app.services', []);


angular.module('app.services')
	.factory('dependencies', function() {
		return {
			SERVER_URL: 'http://localhost:8080'
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
						price: 0,
						amount: function() {
							var result = this.quantity * this.price; 
							return result;
						}
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
	.factory('resetForm', function() {
		return function(ctrl, form) {
				// Заменяет .ng-dirty на .ng-pristine
				form.$setPristine();
			}
	});


// Отправляем на сервер данные пользователя
angular.module('app.services')
	.factory('send', ['$http', 'dependencies', function($http, dependencies) {
			return function(ctrl) {
					var userData = {
						invoiceHtml: $('#pdfTemplate').find('[class]').removeAttr('class')
							.end().html()
					}
	
					$http.post(dependencies.SERVER_URL, JSON.stringify(userData))
						.then(function(response) {
							console.log(response);
						},
						function(response) {
							console.log(response);
					});
	
					console.log(userData.invoiceHtml);
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
				result += el.amount();
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
