var http = require('http');
var fs = require('fs');

// Установленные модули
var pdf = require('html-pdf');
var phantom = require('phantom');
var multiparty = require('multiparty');
var nodemailer = require('nodemailer');

var SERVER_PATH = 'http://www.invoice/server/';
var ALLOW_ORIGIN_HEADER = '*'; // Потом alex1.enwony.net/server, например
var FONT_LINK = '<link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">';
var PDF_OPTIONS = {
  format: 'A4',
  orientation: 'portrait'
};

// Настройка nodemailer'а
var transporter = nodemailer.createTransport({
    service: 'Yandex',
    auth: {
      user: 'invoicegen@yandex.ru',
      pass: "F1XEDbug109"
    },
    tls: {rejectUnauthorized: false}
  });
var mailOptions = {
    from: "'Сервис создания счетов' <invoicegen@yandex.ru>",
    to: 'lowrydertrue@gmail.com',
    subject: 'Счет на оплату',
    text: '',
    html: ''
  }

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
    
  request.on('error', function(err) {
    console.error(err);
  });
        
  if(method === 'OPTIONS') {
    sendData(request, response, 'OK');
  }

  if(method === 'POST') {
    servePost(request, response);
  }
 
}).listen(8080, function() {
  console.log('Server listening on port 8080');
  console.log('process.cwd() ' + process.cwd())
  console.log('__dirname ' + __dirname);
});


function servePost(request, response) {
  var form = new multiparty.Form({
    maxFilesSize: 3145728, // Лого не больше 3 Мб
    autoFiles: true,
    uploadDir: 'tmp'
  });
  var uploadedFile;

  form.on('error', function(err){
    console.error(err);
    sendError(request, response, {
      number: 400,
      message: 'Invalid request: ' + err.message
    });
  });

  form.on('file', function(name, file) {
    uploadedFile = file;
  });

  form.parse(request, function(err, fields, files) {
    var html = '', userData;

    if(err) {
      console.error(err);
      sendError(request, response, {
        number: 400,
        message: 'Invalid request: ' + err.message
      });
      return;
    }

    try {
      userData = JSON.parse(fields.userData);
      if(uploadedFile) { 
        // Если есть лого - добавить его
        html = FONT_LINK + pdfStyle +
          userData.invoiceHtml.replace(/replaceThis/g, SERVER_PATH
            + uploadedFile.path.replace(/\\/g, '/'));
      } else html = FONT_LINK + pdfStyle + userData.invoiceHtml;
      
      
      pdf.create(html, PDF_OPTIONS).toFile('tmp/invoice.pdf', function(err, res) {
        if (err) {
          console.error(err);
          send500(request, response);
        } else {
          console.log(res); // { filename: 'invoice.pdf' } Удалить потом
          // Теперь отправляем e-mail и удаляем загруженную
          // картинку логотипа и сгенерированнй PDF
          mailOptions.attachments = [{
            filename: 'invoice.pdf',
            content: fs.createReadStream('tmp/invoice.pdf'),
            contentType: 'application/pdf'
          }];
          transporter.sendMail(mailOptions, function(error, info){
            if(error) {
              console.error(error);
              send500(request, response);
              return;
            }
          
            sendData(request, response, 'OK. Invoice PDF was sent');
          });

        }
      });

    } catch(err) {
      console.error(err);
      console.log(fields.userData);
      send500(request, response);
    }

  });
  
}

function sendError(request, response, err) {
  var headers = err.headers || {};
  var message = err.message || '';

  if(response.finished) return;

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
  if(response.finished) return;
  sendError(request, response, {
      number: 500,
      message: 'Internal Server Error'
    });
}


function send403(request, response) {
  if(response.finished) return;
  sendError(request, response, {
      number: 403,
      message: 'Forbidden',
      headers: {
        'WWW-Authenticate': 'Basic realm="Server access denied"'
      }
    });
}


function sendData(request, response, data) {
  if(response.finished) return;
  if(request.headers['access-control-request-headers']) {
    response.setHeader('Access-Control-Allow-Headers',
      request.headers['access-control-request-headers']);
  }
  response.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN_HEADER);
  response.setHeader('Content-Type', 'text/html');
  response.writeHead(200);
  response.end(data);
}