const { join } = require('path');
const { existsSync, rmSync, rmdirSync } = require('fs');

function rmDir(fullpath) {
    if (existsSync(fullpath)) {
        (rmSync || rmdirSync)(fullpath, { recursive: true });
    }
}

rmDir(join(__dirname, '../lib'));
rmDir(join(__dirname, '../lib-test'));
