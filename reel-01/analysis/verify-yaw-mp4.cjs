// Reuse the existing delivery checks against this turn's MP4 and source-pixel proof.
const fs=require('fs'),Module=require('module'),path=require('path');
const source=fs.readFileSync('analysis/verify-coach-client-mp4.cjs','utf8')
 .replace("output/FITNODE_REEL_COACH_ASESORADO_18s.mp4","output/FITNODE_REEL_GIRO_Y_CORREGIDO_18s.mp4")
 .replace("output/coach-client-review","output/yaw-final-review")
 .replace("narrative-proof/verification.json","analysis/yaw-audit/validation/verification.json")
 .replace("[.8,1.85,2.2,2.8,4.35,5.5,6.95,7.86,8.24,8.26,8.5,9,9.6,10.05,10.85,11.6,12.7,12.96,13.7,14.45,15.4,16.2,17,17.96]","[.8,1.55,1.9,2.22,2.8,4.35,6.95,7.86,7.95,8.26,8.325,9.02,9.6,10.05,10.85,11.6,12.7,12.96,13.7,14.45,15.4,16.2,17,17.96]");
const compiled=new Module(path.resolve('analysis/verify-yaw-mp4.cjs'));compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(source,__filename);
