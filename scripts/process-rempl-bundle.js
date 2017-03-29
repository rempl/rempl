var buffer = [];

process.stdin
    .setEncoding('utf8')
    .on('data', function(chunk) {
        buffer.push(chunk);
    })
    .on('end', function() {
        process.stdout.write(
            '(function __selfScript(){' +
            (buffer
                .join('')
                .replace(
                    /typeof asset(.|\s)+?require\('fs'\)\.readFileSync\(__dirname \+ '\/style\.js', 'utf8'\)/,
                    JSON.stringify(require('fs').readFileSync(__dirname + '/../src/host/in-page/style.css', 'utf8'))
                )
                .replace(
                    /module.exports = require\('fs'\).+?(?=;)/,
                    'module.exports = "(" + __selfScript + ").call(this);"'
                )
            ) +
            '}).call(this);'
        );
    });
