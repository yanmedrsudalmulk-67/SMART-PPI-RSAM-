const fs = require('fs');
if (fs.existsSync('.git')) {
    console.log('git exists');
} else {
    console.log('git does not exist');
}
