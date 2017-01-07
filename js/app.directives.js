angular.module('app.directives', []);


// Добавляет логотип - получает путь
// к выбранному пользователем файлу с изображением
angular.module('app.directives')
	.directive('invAddLogo', function() {
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
