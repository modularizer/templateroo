// import nodes
const http = require('http');
const fs = require('fs');
const path = require('path');

// grab pages
var pages = {
  './': './pages/template.html',
  getPath: (filePath)=>{
    if (pages[filePath]){
      filePath = pages[filePath]
    }
    return filePath
  }
}
fileObjs = fs.readdirSync('./pages', { withFileTypes: true });
fileObjs.forEach(file => {
  let fn = file.name;
  pages['./' + fn.split('.')[0]] = './pages/' + fn
});


const server = http.createServer(function (request, response) {
    var filePath = pages.getPath('.' + request.url);
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.yml': 'text/yaml',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/icon',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm',
    };
    var contentType = mimeTypes[extname] || 'application/octet-stream';

    // console.log(filePath)
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
})


// parameters
let hostname = '127.0.0.1'
let port = 3000
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
