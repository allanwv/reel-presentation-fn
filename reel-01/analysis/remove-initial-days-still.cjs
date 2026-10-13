// Remove only the previously baked selection; native editable circle layers remain.
const fs=require('fs'),file='index.html',source=fs.readFileSync(file,'utf8');
const pattern=/<img\b[^>]*\bclass="ui-days-initial"[^>]*>/g;
if((source.match(pattern)||[]).length!==1)throw Error('Expected exactly one initial days still');
if((source.match(/data-initial-selected="true"/g)||[]).length!==3)throw Error('Expected only the three original selected days');
fs.writeFileSync(file,source.replace(pattern,'').replaceAll('data-initial-selected="true"','data-initial-selected="false"'));
console.log('Removed baked initial selection and initialized every native circle empty.');
