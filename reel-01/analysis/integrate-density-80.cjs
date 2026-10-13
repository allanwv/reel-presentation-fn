// Change atlas references only; native source atlases remain untouched.
const fs=require('fs');const file='index.html',source=fs.readFileSync(file,'utf8');
const previous='assets/ui/client-completion/serpentinas-';
const count=source.split(previous).length-1;if(count!==11)throw Error('Expected eleven native atlas references, got '+count);
fs.writeFileSync(file,source.replaceAll(previous,'assets/ui/client-completion/density-80/serpentinas-'));
console.log('Integrated eleven reduced-density native atlases.');
