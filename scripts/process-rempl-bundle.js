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
                    /module.exports = require\('fs'\).+?(?=;)/,
                    'module.exports = "(" + __selfScript + ").call(this);"'
                )
            ) +
            '}).call(this);'
        );
    });
