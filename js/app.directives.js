angular.module('app.directives', []);


// Добавляет логотип - получает путь
// к выбранному пользователем файлу с изображением
angular.module('app.directives')
	.directive('invAddLogo', function() {
		return {
			// Две строки ниже -  чтобы получить
			// именно контроллер, а не его копию
			controller: 'invoiceController', 
			controllerAs: 'mainCtrl',
			link: function(scope, element, attrs, ctrl) {
				element.bind('change', function(event) {
											
					var files = event.target.files;

				  // FileReader support
				  if (FileReader && files && files.length) {
				      var fr = new FileReader();
				      fr.onload = function () {
				      	ctrl.invoiceLogoSrc = fr.result;
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
	});


// Datepicker
angular.module('app.directives')
	.directive('invDatePicker', function() {
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
	});


// Добавляет Bootstrap Tooltip
angular.module('app.directives')
	.directive('invTooltip', function() {
		return {
			link: function(scope, element, attrs) {
				element.tooltip();
			}
		}
	});


angular.module('app.directives')
	.directive('invSummary', function() {
		return {
			templateUrl: './templates/summary.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invPayerBriefly', function() {
		return {
			templateUrl: './templates/payer.briefly.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invReceiver', function() {
		return {
			templateUrl: './templates/receiver.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invReceiverOptional', function() {
		return {
			templateUrl: './templates/receiver.optional.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invTable', function() {
		return {
			templateUrl: './templates/table.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invTotal', function() {
		return {
			templateUrl: './templates/total.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invSidebar', function() {
		return {
			templateUrl: './templates/sidebar.tmpl.html'
		}
	});


angular.module('app.directives')
	.directive('invResultHtml', function() {
		return {
			templateUrl: './templates/result.html.tmpl.html'
		}
	});







