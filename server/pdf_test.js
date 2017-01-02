var fs = require('fs');
var pdf = require('html-pdf');
// var html = fs.readFileSync('./test/businesscard.html', 'utf8');
var html = fs.readFileSync('index.html', 'utf8');
var options = { format: 'Letter' };
 
pdf.create('<h1>Hello PDF</h1>', options).toFile('index.pdf', function(err, res) {
  if (err) return console.log(err);
  console.log(res); // { filename: '/app/businesscard.pdf' } 
});

