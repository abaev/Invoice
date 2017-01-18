var http = require('http');
var fs = require('fs');

// Установленные модули
var pdf = require('html-pdf');
var phantom = require('phantom');
var multiparty = require('multiparty');

var ALLOW_ORIGIN_HEADER = '*'; // Потом alex1.enwony.net/server, например
var FONT_LINK = '<link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">';
  //'<link href="https://fonts.googleapis.com/css?family=Roboto:300,400&subset=cyrillic,cyrillic-ext" rel="stylesheet">'
var PDF_OPTIONS = {
  format: 'A4',
  orientation: 'portrait'
};

var pdfStyle = '';

//Читаем CSS для нашего документа в pdfStyle
fs.readFile('pdf.css', 'utf8', function(err, data) {
  if(err) return console.error(err);
  pdfStyle = '<style>' + data.toString() + '</style>';
});


http.createServer(function(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  var userData;
  
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
      body.push(chunk);
  }).on('end', function() {
        response.on('error', function(err) {
          console.error(err);
        });

        userData = Buffer.concat(body).toString();
        
        if(method === 'OPTIONS') {
          sendData(request, response, 'OK');
        }

        if(method === 'POST') {
          console.log(request.data);
          servePost(request, response, userData);
        }
    });
}).listen(8080, function() {
  console.log('Server listening on port 8080');
  console.log('process.cwd() ' + process.cwd())
  console.log('__dirname ' + __dirname);
});


function servePost(request, response, userData) {
  console.log(userData);
  var form = new multiparty.Form();

  form.on('error', function(err){
    console.error(err);
    sendError(request, response, {
      number: 400,
      message: 'Invalid request: ' + err.message
    });
    return;
  });

  form.parse(request, function(err, fields, files) {
    if(err) return console.error(err);

    Object.keys(fields).forEach(function(name) {
      console.log('got field named ' + name);
    });
   
    Object.keys(files).forEach(function(name) {
      console.log('got file named ' + name);
    });
   
    console.log('Upload completed!');
  });


  // var html = '';
  
  // try {
  //   userData = JSON.parse(userData);
  //   html = FONT_LINK + pdfStyle + userData.invoiceHtml;
  //   console.log(userData.invoiceHtml);

  //   pdf.create(html, PDF_OPTIONS).toFile('invoice.pdf', function(err, res) {
  //     if (err) {
  //       console.error(err);
  //       send500(request, response);
  //     } else {
  //       console.log(res); // { filename: 'invoice.pdf' } Удалить потом
  //       sendData(request, response, 'Success. invoice.pdf was created.')
  //     }
  //   });

  // } catch(err) {
  //   console.error(err);
  //   send500(request, response);
  // }
}

function sendError(request, response, err) {
  var headers = err.headers || {};
  var message = err.message || '';

  if(request.headers['access-control-request-headers']) {
    response.setHeader('Access-Control-Allow-Headers',
      request.headers['access-control-request-headers']);
  }
  response.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN_HEADER);
  response.setHeader('Content-Type', 'text/html');
  response.writeHead(err.number, err.headers);
  response.end(message);
}


function send500(request, response) {
  sendError(request, response, {
      number: 500,
      message: 'Internal Server Error'
    });
}


function send403(request, response) {
  sendError(request, response, {
      number: 403,
      message: 'Forbidden',
      headers: {
        'WWW-Authenticate': 'Basic realm="Server access denied"'
      }
    });
}


function sendData(request, response, data) {
  if(request.headers['access-control-request-headers']) {
    response.setHeader('Access-Control-Allow-Headers',
      request.headers['access-control-request-headers']);
  }
  response.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN_HEADER);
  response.setHeader('Content-Type', 'text/html');
  response.writeHead(200);
  response.end(data);
}