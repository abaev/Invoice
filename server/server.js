var http = require('http');
var fs = require('fs');
var stream = require('stream');
var parse = require('url').parse;
var join = require('path').join;

// Установленные модули
var pdf = require('html-pdf');
var phantom = require('phantom');
var multiparty = require('multiparty');
var nodemailer = require('nodemailer');
var shortid = require('shortid');
var Cookies = require('cookies');
var jsonFormat = require('json-format');

var CSS_FILE = 'pdf.css';
var PDF_LIST = join(__dirname, '/data/pdf.list.json');
var SERVER_PATH = 'http://alex.enwony.net/';
var ALLOW_ORIGIN_HEADER = 'http://alex.enwony.net/server'; // '*' 'alex.enwony.net/server'
var FONT_LINK = '';
var EMAIL_SIGN = '<br><br>Создано с помощью <a href="http://alex.enwony.net/">Сервис создания счетов</a>';
var PORT = 3000; //8080;
var PDF_OPTIONS = {
  format: 'A4',
  orientation: 'portrait',
  base: 'file:///home/alex1/www/server/' // Именно file:/// и / в конце
};

var transporter, mailOptions;
var pdfStyle = '';

// Настройка nodemailer'а
fs.readFile(join(__dirname, '/data/config.json'), 'utf8', function(err, data) {
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


// Читаем CSS для нашего документа в pdfStyle
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
  
  switch(method) {
    case 'OPTIONS':
      sendData(request, response, 'OK');
      break;
    case 'POST':
      servePost(request, response);
      break;
    case 'GET':
      serveGet(request, response);
      break;
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
    uploadDir: join(__dirname, '/tmp')
  });
  var responseData, uploadedFile, pdfFile = shortid.generate();
  var pdfUrl = '';
  var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');

  if(!userId) userId = shortid.generate();
  cookies.set('invUserId', userId);

  form.on('error', function(err){
    console.error(err);
    send500(request, response, '<p class="text-danger">Ошибка</p>');
  });

  form.on('file', function(name, file) {
    uploadedFile = file;
  });

  form.parse(request, function(err, fields, files) {
    var html = '', userData;
    
    if(err) {
      console.error(err);
      send500(request, response, '<p class="text-danger">Ошибка</p>');
      return;
    }

    try {
      userData = JSON.parse(fields.userData);
      
      if(uploadedFile) { 
        html = FONT_LINK + pdfStyle.replace(/replaceThis/g, uploadedFile.path) +
          userData.invoiceHtml;
      } else html = FONT_LINK + pdfStyle + userData.invoiceHtml;

      pdf.create(html, PDF_OPTIONS).
        toFile(join(__dirname, '/pdf/', pdfFile + '.pdf'), function(err, pdfBuffer) {
          if (err) {
            console.error(err);
            // Даже PDF не удалось
            responseData = '<p class="text-danger">Ошибка: не удалось создать PDF</p>'
            send500(request, response, responseData);
          } else {
            // Теперь записывем имя файла и куки отправителя
            // в pdf.list.json, чтобы потом отдавать PDF только автору,
            fs.readFile(PDF_LIST, function(err, data) {
              var arr = [];

              if(err) return console.error(err);

              try {
                arr = JSON.parse(data);
                arr.push({
                  name: pdfFile + '.pdf',
                  userId: userId,
                  date: new Date()
                });
                
                fs.writeFile(PDF_LIST, jsonFormat(arr), function(err) {
                  if(err) return console.error(err);
                });
              }

              catch(err) {
                console.error(err);
              }
            });

            // Удаляем загруженную картинку логотипа
            // и отправляем (если нужно) e-mail
            if(uploadedFile) fs.unlink(uploadedFile.path, function(err) {
                if(err) console.error(err);
              });

            if(!userData.sendRequired) {
              // Всё норм
              pdfUrl = 'http://alex.enwony.net/server/pdf/' + pdfFile + '.pdf';
              responseData =
                '<p>PDF будет доступен вам в течение суток по адресу: <a href="' +
                pdfUrl + '" target="_blank">' + pdfUrl + '</a></p>';
              sendData(request, response, responseData);
              return;
            }

            mailOptions.to = userData.email.payerEmail;
            mailOptions.subject = userData.email.payerEmailSubj;
            mailOptions.html = userData.email.payerEmailText + EMAIL_SIGN;
            mailOptions.attachments = [{
              filename: 'invoice.pdf',
              path: join(__dirname, '/pdf/', pdfFile + '.pdf'),
              contentType: 'application/pdf'
            }];
            transporter.sendMail(mailOptions, function(error, info){
                          
              if(error) {
                console.error(error);
                // Не удалось отправить, но PDF OK
                pdfUrl = 'http://alex.enwony.net/server/pdf/' + pdfFile + '.pdf';
                responseData = '<p class="text-danger">Ошибка: не удалось отправить e-mail</p>' +
                  '<p>PDF будет доступен вам в течение суток по адресу: <a href="' +
                  pdfUrl + '" target="_blank">' + pdfUrl + '</a></p>';
                send500(request, response, responseData);
                return;
              }
              
              // Всё норм
              pdfUrl = 'http://alex.enwony.net/server/pdf/' + pdfFile + '.pdf';
              responseData = '<p>Письмо со счетом отправлено</p>' +
                '<p>PDF будет доступен вам в течение суток по адресу: <a href="' +
                pdfUrl+ '" target="_blank">' + pdfUrl + '</a></p>';
              sendData(request, response, responseData);
            });

        }
      });

    } catch(err) {
      console.error(err);
      console.log(fields.userData);
      send500(request, response, '<p class="text-danger">Ошибка</p>');
    }

  });
  
}


function serveGet(request, response) {
  // Отдавать только PDF из /server/pdf,
  // пока всем подряд, но в итоге только тем,
  // кто этот PDF создал
  var pdfUrl = parse(request.url);
  var path = join(__dirname, pdfUrl.pathname);
  var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');
  var files = [], status = 'Not found';
  var stream;

  fs.readFile(PDF_LIST, function(err, data) {
    
    if(err) {
      console.error(err);
      send500(request, response, '<h1>Ошибка сервера</h1>');
      return;
    }

    try {
      files = JSON.parse(data);

      files.forEach(function(item) {
        if(pdfUrl.pathname.replace('/pdf/', '') == item.name) {
        	status = 'Denied';
        	if(userId == item.userId) {
        		status = 'OK';
        		stream = fs.createReadStream(path);
        		stream.on('error', function(err) {
        			console.error(err);
        			send500(request, response, '<h1>Ошибка сервера</h1>');
        		});
        		stream.pipe(response);
        		return;
        	}
        }
      });
      
      switch(status) {
      	case 'Denied':
      		send403(request, response, '<h1>Доступ запрещен</h1>');
      		break;
      	case 'Not found':
      		sendError(request, response, {
      			number: 404,
      			message: '<h1>Запрашиваемый документ не найден</h1>'
      		});
      		break;
      }
    }

    catch(err) {
      console.error(err);
      send500(request, response, '<h1>Ошибка сервера</h1>');
      return;
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


function send500(request, response, data) {
  if(response.finished) return;
  sendError(request, response, {
      number: 500,
      message: data || 'Internal Server Error'
    });
}


function send403(request, response, data) {
  if(response.finished) return;
  sendError(request, response, {
      number: 403,
      message: data || 'Forbidden'
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