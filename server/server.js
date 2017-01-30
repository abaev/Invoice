var http = require('http');
var fs = require('fs');

// Установленные модули
var pdf = require('html-pdf');
var phantom = require('phantom');
var multiparty = require('multiparty');
var nodemailer = require('nodemailer');

var CSS_FILE = 'pdf.serv.ver.css'; //'pdf.css';
var SERVER_PATH = 'http://alex.enwony.net/';
var ALLOW_ORIGIN_HEADER = 'http://alex.enwony.net/server'; // '*' 'alex.enwony.net/server'
var FONT_LINK = '<link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">';
var EMAIL_SIGN = '<br><br>Создано с помощью <a href="http://alex.enwony.net/">Сервис создания счетов</a>';
var PORT = 3000; //8080;
var PDF_OPTIONS = {
  format: 'A4',
  orientation: 'portrait',
  base: '/home/alex1/www/server'
};

var transporter, mailOptions;
var pdfStyle = '';

// Настройка nodemailer'а
fs.readFile(__dirname + '/data/config.json', 'utf8', function(err, data) {
  var config = {};
  
  if(err) return console.error(err);
  
  try {
    config = JSON.parse(data);
    // create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport(config.transporter);
    // setup e-mail data with unicode symbols
    mailOptions = config.mailOptions;
  } catch(e) {
    return console.error(e);
  }
});


//Читаем CSS для нашего документа в pdfStyle
fs.readFile(CSS_FILE, 'utf8', function(err, data) {
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

  response.on('error', function(err) {
    console.error(err);
  });
  
  if(method === 'OPTIONS') {
    sendData(request, response, 'OK');
  }

  if(method === 'POST') {
    servePost(request, response);
  }
 
}).listen(PORT, function() {
  console.log('Server listening on port ' + PORT);
  console.log('process.cwd() ' + process.cwd())
  console.log('__dirname ' + __dirname);
});


function servePost(request, response) {
  var form = new multiparty.Form({
    maxFilesSize: 3145728, // Лого не больше 3 Мб
    autoFiles: true,
    uploadDir: __dirname + '/../tmp'
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
        html = FONT_LINK + pdfStyle.replace(/replaceThis/g, SERVER_PATH
          + uploadedFile.path.replace(/\\/g, '/').replace('/home/alex1/www/','')) +  userData.invoiceHtml;
      } else html = FONT_LINK + pdfStyle + userData.invoiceHtml;

      pdf.create(html, PDF_OPTIONS).toBuffer(function(err, pdfBuffer) {
        if (err) {
          console.error(err);
          send500(request, response);
        } else {
          // Теперь отправляем e-mail
          // и удаляем загруженную картинку логотипа
          mailOptions.to = userData.email.payerEmail;
          mailOptions.subject = userData.email.payerEmailSubj;
          mailOptions.html = userData.email.payerEmailText + EMAIL_SIGN;
          mailOptions.attachments = [{
            filename: 'invoice.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }];
          transporter.sendMail(mailOptions, function(error, info){
            if(uploadedFile) fs.unlink(uploadedFile.path, function(err) {
              if(err) console.error(err);
            });
            
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


// function send403(request, response) {
//   if(response.finished) return;
//   sendError(request, response, {
//       number: 403,
//       message: 'Forbidden',
//       headers: {
//         'WWW-Authenticate': 'Basic realm="Server access denied"'
//       }
//     });
// }


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