angular.module('app.filters', []);


// Форматирование - 2 цифры после запятой,
// если NaN то фильтр возвращает ноль
angular.module('app.filters')
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