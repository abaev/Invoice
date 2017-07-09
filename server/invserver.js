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
var shortid = require('shortid'); // ниже переписываем функцию shortid.generate()
var Cookies = require('cookies');
var jsonFormat = require('json-format');

var CSS_FILE = 'pdf.css';
var PDF_LIST = join(__dirname, '/data/pdf.list.json');
var TEMPLATES = join(__dirname, '/data/templates/'); // '/data/templates.json'
var SERVER_PATH = 'http://alex.enwony.net/';
var ALLOW_ORIGIN_HEADER = 'http://alex.enwony.net/server'; // '*' 'alex.enwony.net/server'
var FONT_LINK = '';
var EMAIL_SIGN = '<br><br><p>Создано с помощью <a href="http://alex.enwony.net/">Сервис создания счетов</a></p>';
var PORT = 3000; //8080;
var COOKIE_INTERVAL = 315360000000 // 10 лет
var PDF_OPTIONS = {
  format: 'A4',
  orientation: 'portrait',
  base: 'file:///home/alex1/www/server/' // Именно file:/// и / в конце
};
var PDF_OPTIONS_PNG = {
  format: 'A4',
  orientation: 'portrait',
  base: 'file:///home/alex1/www/server/', // Именно file:/// и / в конце
  type: 'png',
  quality: 50
};

var transporter, mailOptions;
var pdfStyle = '';

// Переписываем shortid.generate(), чтобы возвращал id,
// которые не начинаются с "-", потому как используем
// эту функцию для создания имен файлов,
// а они не могут начинаться с "-"
shortid.generate = generateId();


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

  var templNumber;
      
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
    	if(request.url.match(/\/templates/)) {
    		saveTemplate(request, response);
    	} else servePost(request, response);
      break;
    
    case 'GET':
    	if(request.url.match(/\/templates/)) {
    		templNumber = request.url.match(/\d/);
    		
    		if(templNumber != null) {
    			templNumber = parseInt(templNumber[0], 10);
    		}
    		sendTemplates(request, response, templNumber);
    	} else serveGet(request, response);
      break;

    case 'DELETE':
    	if(request.url.match(/\/templates/)) {
    		// Удалить шаблон
    		templNumber = request.url.match(/\d/);
    		
    		if(templNumber != null) {
    			templNumber = parseInt(templNumber[0], 10);
    		}
    		delTemplate(request, response, templNumber);
    	} else sendError(request, response,
    			{ number: 404, message: 'Not Found' });
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
  var bufferStream = new stream.PassThrough();
  var responseData, uploadedFile, pdfFile = shortid.generate();
  var pdfUrl = '';
  var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');
  
  if(!userId) userId = shortid.generate();
  cookies.set('invUserId', userId, { expires: new Date(Date.now() + COOKIE_INTERVAL) });

  form.on('error', function(err) {
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

      if(userData.preview) {
	      // Предпросмотр
      	// Гененрируем PNG (JPEG генерируется с ошибками) и отсылаем его
      	pdf.create(html, PDF_OPTIONS_PNG).toBuffer(function(err, pdfBuffer) {
	        if (err) {
	          console.error(err);
	          send500(request, response, '<p class="text-danger">Ошибка: предварительный просмотр невозможен</p>');
	        } else {
	          sendData(request, response, 'data:image/png;base64,' + pdfBuffer.toString('base64'));
	         }
        });
        return;
      }

      pdf.create(html, PDF_OPTIONS).
        toFile(join(__dirname, '/pdf/', pdfFile + '.pdf'), function(err) {
          if (err) {
            console.error(err);
            // Даже PDF не удалось
            responseData = '<p class="text-danger">Ошибка: не удалось создать PDF</p>'
            send500(request, response, responseData);
          } else {
            // Теперь записывем имя файла и куки отправителя
            // в pdf.list.json, чтобы потом отдавать PDF только автору,
            fs.readFile(PDF_LIST, function(err, data) {
              var files = {};

              if(err) return console.error(err);

              try {
                files = JSON.parse(data);
                
                files[pdfFile + '.pdf'] = {
                	userId: userId,
                  date: new Date()
                };
                
                fs.writeFile(PDF_LIST, jsonFormat(files), function(err) {
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
                '<p>PDF будет доступен вам в течение суток по адресу:<br> <a href="' +
                pdfUrl + '" target="_blank">' + pdfUrl + '</a></p>';
              sendData(request, response, responseData);
              return;
            }

            mailOptions.to = userData.email.payerEmail;
            mailOptions.subject = userData.email.payerEmailSubj;
            mailOptions.html = userData.email.payerEmailText.replace(/(\r\n|\r|\n)/g, '<br>') + EMAIL_SIGN;
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
  // только тем, кто этот PDF создал (cookie)
  var pdfUrl = parse(request.url);
  var path = join(__dirname, pdfUrl.pathname);
  var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');
  var files = {}, status = 'Not found';
  var stream;
  var fileName = pdfUrl.pathname.replace('/pdf/', '');

  fs.readFile(PDF_LIST, function(err, data) {
    
    if(err) {
      console.error(err);
      send500(request, response, '<h1>Ошибка сервера</h1>');
      return;
    }

    try {
      files = JSON.parse(data);

      if(files[fileName]) {
      	status = 'Denied';
      	if(userId == files[fileName].userId) {
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


function saveTemplate(request, response) {
	var templates = {}, body = [], userData;
	var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');
  
  request.on('data', function(chunk) {
      body.push(chunk);
  })
  
  request.on('end', function() {
    userData = Buffer.concat(body).toString();

    if(!userId) userId = shortid.generate();
	  cookies.set('invUserId', userId, { expires: new Date(Date.now() + COOKIE_INTERVAL) });

    try {
    	userData = JSON.parse(userData);
    }
    catch(err) {
    	console.error(err);
      send500(request, response);
      return;
    }

    if( !fs.existsSync(TEMPLATES + userId + '.json') ) {
    	fs.openSync(TEMPLATES + userId + '.json', 'w');
    	fs.writeFileSync(TEMPLATES + userId + '.json', jsonFormat([]));
    }
	  
	  fs.readFile(TEMPLATES + userId + '.json', function(err, data) {
	    
	    if(err) {
	      console.error(err);
	      send500(request, response);
	      return;
	    }

	    try {
	      templates = JSON.parse(data);
	      
	      if(templates.length >= 3) return send500(request, response);
	      
	      templates.push(userData);
	   		
	   		fs.writeFile(TEMPLATES + userId + '.json', jsonFormat(templates), function(err) {
	   			if(err) return send500(request, response);
	   			sendData(request, response, 'OK');
	   		});
	    }

	    catch(err) {
	      console.error(err);
	      send500(request, response);
	      return;
	    }
	  });
  });
};


// Отсылает (если находит) шаблон номер templNumber,
// и количество сохраненых шаблонов
function sendTemplates(request, response, templNumber) {
	var templates = {};
	var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');

  if(!userId) {
  	// Если в запросе не установлены наши куки,
  	// значит пользователь не может / не должен получать шаблоны,
  	// в любом случае, мы не сможем найти шаблоны пользователя,
  	// поэтому - Not Found
  	userId = shortid.generate();
  	cookies.set('invUserId', userId, { expires: new Date(Date.now() + COOKIE_INTERVAL) }); // 5 лет
  	sendError(request, response, { number: 404, message: 'Not Found' });
  	return;
  }
  
  fs.readFile(TEMPLATES + userId + '.json', function(err, data) {
    
    if(err) {
      console.error(err);
      send500(request, response);
      return;
    }

    try {
      templates = JSON.parse(data);

      if(templates.length > 0) {
      	
      	// Отправляем запрошенный шаблон
      	// и количество сохраненых шаблонов
      	if(templNumber != null) {
      		if(templNumber < templates.length) {
      			sendData(request, response,
		      		JSON.stringify({
		      			template: templates[templNumber],
		      			quantity: templates.length
		      		})
		      	);
      		} else sendError(request, response,
				      		{ number: 404, message: 'Not Found' });
	      	
	      	return;
		    }

		    // Если templNumber == null - просто количество шаблонов
	     	sendData(request, response,
      		JSON.stringify({
      			template: [],
      			quantity: templates.length
      		})
      	);
      	return;
		 	      
      } else sendError(request, response,
      		{ number: 404, message: 'Not Found' });
    }

    catch(err) {
      console.error(err);
      send500(request, response);
      return;
    }
  });
}


// Удаляет (если находит) шаблон номер templNumber
function delTemplate(request, response, templNumber) {
	var templates = {};
	var cookies = new Cookies(request, response);
  var userId = cookies.get('invUserId');

  if(!userId) {
  	// Если в запросе не установлены наши куки,
  	sendError(request, response, { number: 403, message: 'Forbidden' });
  	return;
  }
  
  fs.readFile(TEMPLATES, function(err, data) {
    
    if(err) {
      console.error(err);
      send500(request, response);
      return;
    }

    try {
      templates = JSON.parse(data);

      if(templates[userId]) {
      	if(templNumber < templates[userId].length) {
      		// Удаляем
    			templates[userId].splice(templNumber, 1);

    			fs.writeFile(TEMPLATES, jsonFormat(templates), function(err) {
		   			if(err) return send500(request, response);
		   			sendData(request, response, 'OK');
		   		});
    		} else sendError(request, response,
			      		{ number: 404, message: 'Not Found' });
      		 		 	      
      } else sendError(request, response,
      		{ number: 404, message: 'Not Found' });
    }

    catch(err) {
      console.error(err);
      send500(request, response);
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


// Переписываем shortid.generate(), чтобы возвращал id,
// которые не начинаются с "-", потому как используем
// эту функцию для создания имен файлов,
// а они не могут начинаться с "-"
function generateId() {
	var g = shortid.generate;
	
	return function() {
		var id = g();
	
		while(id.indexOf('-') === 0) {
			id = g();
		}

		return id;
	}
}
