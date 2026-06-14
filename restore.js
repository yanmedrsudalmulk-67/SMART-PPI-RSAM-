const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

execSync('git checkout src/pages/dashboard/input/*.tsx');
console.log('Restored files using git via node!');
