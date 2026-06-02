const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiDir = path.join(__dirname, '../src/app/api');

walkDir(apiDir, function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // This regex looks for: return NextResponse.json({ error: 'Internal Server Error' } ...
    // And we want to replace 'Internal Server Error' with a dynamic error message.
    
    // We need to capture the error variable from the catch block. 
    // Typical catch block: catch (error) { or catch (error: any) {
    const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)(?:\s*:\s*any)?\s*\)\s*\{([\s\S]*?)\}/g;
    
    content = content.replace(catchRegex, (match, errVarName, catchBody) => {
      // Inside the catch body, replace the hardcoded string
      const newBody = catchBody.replace(
        /error:\s*['"`]Internal Server Error['"`]/g,
        `error: ${errVarName} instanceof Error ? ${errVarName}.message : String(${errVarName}) || 'Internal Server Error'`
      );
      return `catch (${errVarName}: any) {${newBody}}`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
