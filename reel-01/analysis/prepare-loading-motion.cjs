const fs=require('fs'),cp=require('child_process');
const sharp=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json')('sharp');
(async()=>{
 const dir='completion-proof/loading-source';fs.mkdirSync(dir,{recursive:true});
 cp.execFileSync('C:/Users/aweis/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe',['-v','error','-ss','53.30','-i','../source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4','-t','0.60','-vf','fps=30,scale=360:780','-y',dir+'/frame-%03d.png'],{windowsHide:true});
 const frames=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
 await sharp({create:{width:1800,height:3120,channels:4,background:'#fff'}}).composite(frames.map((f,i)=>({input:dir+'/'+f,left:(i%5)*360,top:Math.floor(i/5)*780}))).png().toFile('assets/ui/client-completion/loading-motion.png');
 console.log(JSON.stringify({frames:frames.length,sourceStart:53.30,sourceEnd:53.90}));
})();
