var http = require('http');
var pdf = require('html-pdf');

// Удалить, если станут ненужны
var fs = require('fs');
var phantom = require('phantom');

var pdfOptions = {
  format: 'A4',
  orientation: 'portrait'
};
var invoice, html, userData;
var statusCode = 200;
var pdfStyle = '<style>' + fs.readFileSync('pdf.css', 'utf8').toString() + '</style>';
var fontLink = '<link href="https://fonts.googleapis.com/css?family=Roboto:300,400&subset=cyrillic,cyrillic-ext" rel="stylesheet">'


//Удалить
console.log('Сервер запущен');

http.createServer(function(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
      body.push(chunk);
  }).on('end', function() {
      userData = Buffer.concat(body).toString();
      
      response.on('error', function(err) {
        console.error(err);
    });

    if(userData.length > 0) {
      // Проверка, не preflight ли это
      // Сделать нормальную проверку??
            
      try {
        userData = JSON.parse(userData);
        html = fontLink + pdfStyle + userData.invoiceHtml;
        console.log(userData.invoiceHtml);

        pdf.create(html, pdfOptions).toFile('invoice.pdf', function(err, res) {
          if (err) {
            statusCode = 500;
            console.log(err);
          } else {
            console.log(res); // { filename: 'invoice.pdf' } Удалить потом
            statusCode = 200;
          }
        });

      } catch(err) {
        // Нормальную обработку ошибок запилить
        console.log(err);
        statusCode = 500;
      }

    }
    

    response.statusCode = statusCode;
    
    // Здесь поправить заголовки потом
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // For POST request
    // Note: the 2 lines above could be replaced with this next one:
    // response.writeHead(200, {'Content-Type': 'application/json'})

    var responseBody = {
      headers: headers,
      method: method,
      url: url,
      body: body
    };

    response.write(JSON.stringify(responseBody));
    response.end();
    // Note: the 2 lines above could be replaced with this next one:
    // response.end(JSON.stringify(responseBody))

  });
}).listen(8080);