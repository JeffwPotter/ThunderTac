(()=>{var Zh=Object.defineProperty;var Kh=(i,t,e)=>t in i?Zh(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var j=(i,t,e)=>Kh(i,typeof t!="symbol"?t+"":t,e);var Jh=/[␀-➿-]/g;function $h(i){return(i||"").replace(Jh,"").trim()}var Js;function Bl(i,t,e,n){if(!i||!n)return null;let s=i.byAircraft[t.toLowerCase()]||[],r=[n,n.replace(/^radar/,"").replace(/^./,a=>a.toLowerCase())],o=null;for(let a of s){let l=i.sensors[a];if(l){for(let c of r){let h=l.patterns[c];if(h&&(!o||l.name===e)){o=h;break}}if(o&&l.name===e)break}}return o}async function vs(i){let t=await fetch(i);if(!t.ok)throw new Error(i+" \u2192 "+t.status);return t.json()}async function zl(i,t){let e="/api/session/"+encodeURIComponent(i)+"/";t("Reading match\u2026");let[n,s,r,o,a,l]=await Promise.all([vs(e+"manifest.json"),vs(e+"players.json"),vs(e+"units.json"),vs(e+"events.json"),vs(e+"states.json"),fetch(e+"tracks.bin").then(_=>{if(!_.ok)throw new Error("tracks.bin \u2192 "+_.status);return _.arrayBuffer()})]);t("Building tracks\u2026");let c=r.map(_=>{let w=P=>{let E=_.columns.find(v=>v.name===P);if(E)return E.type==="u32"?new Uint32Array(l,E.offset,E.count):E.type==="f32"?new Float32Array(l,E.offset,E.count):new Uint8Array(l,E.offset,E.count)};return{id:_.id,kind:_.kind,name:$h(_.name).replace(" (estimated)",""),cls:_.class||"",player:_.player===void 0?-1:_.player,ai:!!_.ai,team:_.team||0,parent:_.parent===void 0?-1:_.parent,tStart:_.tStart,tEnd:_.tEnd,destroyed:!!_.destroyed,estimated:!!_.estimated,isStatic:!!_.static,n:_.samples,t:w("t"),x:w("x"),y:w("y"),z:w("z"),heading:w("heading"),pitch:w("pitch"),roll:w("roll"),gunBearing:w("gunBearing"),gunElev:w("gunElev"),seekerMode:w("seekerMode"),seekerKind:w("seekerKind"),seekerRange:w("seekerRange"),tex:w("targetEstX"),tey:w("targetEstY"),tez:w("targetEstZ"),missile:_.missile,cmType:_.countermeasure?_.countermeasure.type:void 0,speed:w("speed"),g:w("g"),mach:w("mach"),agl:w("agl"),climb:w("climb"),owner:-1}});for(let _ of c)_.kind==="aircraft"?(_.owner=_.player,_.speed||Fl(_)):_.kind==="ground"&&_.player>=0&&(_.owner=_.player,_.speed||Fl(_,6));for(let _ of c)_.kind!=="aircraft"&&_.parent>=0&&c[_.parent]&&(_.owner=c[_.parent].owner,_.team||(_.team=c[_.parent].team));let h=s.map(_=>({slot:_.slot,name:_.name,clan:_.clan||"",team:_.team,units:[..._.units||[],..._.vehicles||[]].sort((w,C)=>c[w].tStart-c[C].tStart),vehicles:_.vehicles||[],results:_.results||{},hidden:!1,highlight:!1})),u=new Map;for(let _ of h)u.set(_.slot,_);jh(c,a);let f=String(n.match.level||"").split("/").pop().replace(/\.bin$/,"");t("Reading terrain\u2026");let d=await ua(f),y=o.filter(_=>_.type==="kill"),m=[];try{let _=await fetch(e+"launches.json");_.ok&&(m=await _.json())}catch{}m.sort((_,w)=>_.t-w.t);let g=null;try{let _=await fetch(e+"map.json");_.ok&&(g=await _.json())}catch{}let p=new Map;try{let _=await fetch(e+"stats.json");if(_.ok)for(let w of await _.json())p.set(w.slot,w)}catch{}if(Js===void 0){Js=null;try{let _=await fetch("/api/catalog/radars.json");_.ok&&(Js=await _.json())}catch{}}let M=new Map;for(let _ of m)M.set(_.missile,_);let b=null;try{let _=await fetch(e+"shots.json");_.ok&&(b=Qh(await _.json(),l))}catch{}let x=c.some(_=>_.kind==="ground"&&_.player>=0);return{id:i,manifest:n,players:h,playerBySlot:u,units:c,events:o,kills:y,launches:m,launchByMissile:M,map:g,stats:p,radars:Js,t0:n.match.tFirstMs,t1:n.match.tLastMs,terrain:d,levelName:f,shots:b,ground:x}}async function ua(i){try{let t="/api/terrain/"+encodeURIComponent(i)+"/",e=await fetch(t+"terrain.json");if(!e.ok)return null;let n=await e.json(),s=await(await fetch(t+"height.u16")).arrayBuffer(),r=new Uint16Array(s),o=n.gridSize,a=new Float32Array(o*o),l=(n.hMax-n.hMin)/65535;for(let u=0;u<o*o;u++)a[u]=n.hMin+r[u]*l;let c=null,h=n.detail;if(h&&h.w>1&&h.h>1)try{let u=await fetch(t+"detail.u16");if(u.ok){let f=new Uint16Array(await u.arrayBuffer());if(f.length===h.w*h.h){let d=new Float32Array(f.length),y=(h.hMax-h.hMin)/65535;for(let m=0;m<f.length;m++)d[m]=h.hMin+f[m]*y;c={w:h.w,h:h.h,x0:h.x0,z0:h.z0,cell:h.cellM,hMin:h.hMin,hMax:h.hMax,v:d}}}}catch{}return{n:o,x0:n.x0,z0:n.z0,x1:n.x1,z1:n.z1,cell:n.cellM,hMin:n.hMin,hMax:n.hMax,water:n.waterLevel,h:a,detail:c}}catch{return null}}function bn(i,t,e){if(!i)return 0;let n=i.detail;if(n){let b=(t-n.x0)/n.cell,x=(e-n.z0)/n.cell;if(b>=0&&x>=0&&b<n.w-1&&x<n.h-1){let _=Math.floor(b),w=Math.floor(x),C=b-_,P=x-w,E=n.w,v=n.v,A=v[w*E+_],L=v[w*E+_+1],I=v[(w+1)*E+_],D=v[(w+1)*E+_+1];return Math.max((A*(1-C)+L*C)*(1-P)+(I*(1-C)+D*C)*P,i.water)}}let s=(t-i.x0)/i.cell-.5,r=(e-i.z0)/i.cell-.5,o=i.n,a=Math.max(0,Math.min(o-1.001,s)),l=Math.max(0,Math.min(o-1.001,r)),c=Math.floor(a),h=Math.floor(l),u=a-c,f=l-h,d=i.h,y=d[h*o+c],m=d[h*o+c+1],g=d[(h+1)*o+c],p=d[(h+1)*o+c+1],M=(y*(1-u)+m*u)*(1-f)+(g*(1-u)+p*u)*f;return Math.max(M,i.water)}function Fl(i,t=1){let e=i.n,n=new Float32Array(e),s=new Float32Array(e),r=new Float32Array(e),o=new Float32Array(e),a=new Float32Array(e);for(let l=0;l<e;l++){let c=Math.max(0,l-t),h=Math.min(e-1,l+t),u=(i.t[h]-i.t[c])/1e3;u<=0||(r[l]=(i.x[h]-i.x[c])/u,o[l]=(i.y[h]-i.y[c])/u,a[l]=(i.z[h]-i.z[c])/u,n[l]=Math.hypot(r[l],o[l],a[l]))}for(let l=0;l<e;l++){let c=Math.max(0,l-2),h=Math.min(e-1,l+2),u=(i.t[h]-i.t[c])/1e3;if(u<=0){s[l]=1;continue}let f=(r[h]-r[c])/u,d=(o[h]-o[c])/u+9.81,y=(a[h]-a[c])/u;s[l]=Math.hypot(f,d,y)/9.81}i.speed=n,i.g=s}function jh(i,t){let e=new Map;for(let n of t){let s=i[n.unit];if(!s)continue;let r=e.get(n.unit);r||(r={},e.set(n.unit,r)),Object.assign(r,n.set);let o=[];for(let c=1;c<=8;c++){let h=r["target"+c];if(h!==void 0&&h!==""){let u=parseInt(h,10);isNaN(u)||o.push(u)}}let a={t:n.t,on:r.radarOn==="1",state:r.radarState||"off",pattern:r.radarPattern||"",label:r.radarLabel||"",sensor:r.radarSensor||"",az:parseFloat(r.antennaAzimuth)||0,el:parseFloat(r.antennaElevation)||0,targets:o,targetRange:parseFloat(r.targetRange)||0};s.radar||(s.radar=[]);let l=s.radar[s.radar.length-1];l&&l.t===n.t?s.radar[s.radar.length-1]=a:s.radar.push(a)}}function Ii(i,t){let e=i.radar;if(!e||!e.length||t<e[0].t)return null;let n=0,s=e.length-1;for(;n<s;){let r=n+s+1>>1;e[r].t<=t?n=r:s=r-1}return e[n]}function De(i,t){let e=i.t,n=0,s=i.n-1;if(t<=e[0])return 0;if(t>=e[s])return s;for(;n<s;){let r=n+s+1>>1;e[r]<=t?n=r:s=r-1}return n}function Ol(i,t,e){let n=(t-i+540)%360-180;return i+n*e}function Xe(i,t,e){let n=De(i,t),s=Math.min(i.n-1,n+1),r=i.t[n],o=i.t[s],a=o>r?(t-r)/(o-r):0;a<0?a=0:a>1&&(a=1),e.i=n,e.f=a;let l=o-r;if(i.kind==="aircraft"&&l>0&&l<2e3&&n>0&&s<i.n-1){let c=n-1,h=s+1,u=i.t[s]-i.t[c],f=i.t[h]-i.t[n],d=a*a,y=d*a,m=2*y-3*d+1,g=y-2*d+a,p=-2*y+3*d,M=y-d,b=x=>{let _=u>0?(x[s]-x[c])/u*l:0,w=f>0?(x[h]-x[n])/f*l:0;return m*x[n]+g*_+p*x[s]+M*w};e.x=b(i.x),e.y=b(i.y),e.z=b(i.z)}else e.x=i.x[n]+(i.x[s]-i.x[n])*a,e.y=i.y[n]+(i.y[s]-i.y[n])*a,e.z=i.z[n]+(i.z[s]-i.z[n])*a;if(i.heading)e.heading=Ol(i.heading[n],i.heading[s],a),e.pitch=i.pitch[n]+(i.pitch[s]-i.pitch[n])*a,e.roll=Ol(i.roll[n],i.roll[s],a);else{let c=Math.max(0,n-1),h=Math.min(i.n-1,n+1),u=i.x[h]-i.x[c],f=i.y[h]-i.y[c],d=i.z[h]-i.z[c],y=Math.hypot(u,d);e.heading=y>.01?Math.atan2(u,d)*180/Math.PI:0,e.pitch=Math.atan2(f,y)*180/Math.PI,e.roll=0}return e}function Rn(i,t,e){if(!i)return NaN;let n=Math.min(e-1,t.i+1);return i[t.i]+(i[n]-i[t.i])*t.f}function en(i){let t=Math.max(0,Math.floor(i/1e3));return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")}var kl={target_down:"target was already destroyed",decoyed:"decoyed by flares or chaff",out_of_energy:"ran out of energy",no_lock:"seeker never locked the target",lost_lock:"seeker lost the target"};function da(i){return i?i.outcome==="kill"?"Kill":i.outcome==="close"?"Passed within "+i.missDistanceM+" m, no kill recorded":i.outcome==="miss"?"Missed"+(kl[i.reason]?": "+kl[i.reason]:"")+(i.missDistanceM!==void 0?" (closest "+(i.missDistanceM>=1e3?(i.missDistanceM/1e3).toFixed(1)+" km":i.missDistanceM+" m")+")":""):"Target not identified":""}function Qh(i,t){if(!i||!i.columns||!i.columns.x)return null;let e=r=>new Float32Array(t,r.offset,r.count),n=(i.shots||[]).map(r=>({t:r.t,unit:r.unit,weapon:r.weapon,cls:r.class||"unknown",caliberMm:r.caliberMm||0,weaponName:r.weaponName||"",shell:r.shell||"",shellType:r.shellType||"",shellSource:r.shellSource||"",ammoSlot:r.ammoSlot,ammoLeft:r.ammoLeft,reloadS:r.reloadS||0,speedMs:r.speedMs||0,bearing:r.bearingDeg,elev:r.elevDeg,elevAdj:r.elevAdjDeg||0,p0:r.p0,n:r.n,tEnd:r.tEnd||r.t,end:r.end||"none",hit:r.hit===void 0?-1:r.hit,kill:!!r.kill,missM:r.missM===void 0?-1:r.missM}));n.sort((r,o)=>r.t-o.t);let s=new Map;for(let r of n){let o=s.get(r.unit);o||(o=[],s.set(r.unit,o)),o.push(r)}return{dt:i.pathDtMs||40,x:e(i.columns.x),y:e(i.columns.y),z:e(i.columns.z),list:n,byUnit:s}}function fa(i){if(!i)return"";let t=i.replace(/^\d+(\.\d+)?mm_/i,"");return t=t.replace(/_ball/i,"").replace(/^(ap|i|t|he|apcr)_(?=[a-z])/i,e=>e.toUpperCase()),t.replace(/_/g," ").toUpperCase()}var Ei={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},wi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},tu=0,Hl=1,eu=2;var Zc=1,nu=2,Nn=3,ei=0,Ye=1,Pe=2,Qn=0,Zi=1,Vl=2,Gl=3,Wl=4,iu=5,di=100,su=101,ru=102,au=103,ou=104,lu=200,cu=201,hu=202,uu=203,Ga=204,Wa=205,du=206,fu=207,pu=208,mu=209,gu=210,yu=211,_u=212,xu=213,vu=214,Xa=0,Ya=1,qa=2,ji=3,Za=4,Ka=5,Ja=6,$a=7,al=0,Mu=1,bu=2,ti=0,Su=1,Eu=2,wu=3,Tu=4,Au=5,Cu=6,Ru=7;var Kc=300,Qi=301,ts=302,ja=303,Qa=304,qr=306,to=1e3,mi=1001,eo=1002,pn=1003,Pu=1004;var $s=1005;var En=1006,pa=1007;var gi=1008;var Bn=1009,Jc=1010,$c=1011,Ps=1012,ol=1013,yi=1014,Fn=1015,Bs=1016,ll=1017,cl=1018,es=1020,jc=35902,Qc=1021,th=1022,fn=1023,eh=1024,nh=1025,Ki=1026,ns=1027,ih=1028,hl=1029,sh=1030,ul=1031;var dl=1033,Mr=33776,br=33777,Sr=33778,Er=33779,no=35840,io=35841,so=35842,ro=35843,ao=36196,oo=37492,lo=37496,co=37808,ho=37809,uo=37810,fo=37811,po=37812,mo=37813,go=37814,yo=37815,_o=37816,xo=37817,vo=37818,Mo=37819,bo=37820,So=37821,wr=36492,Eo=36494,wo=36495,rh=36283,To=36284,Ao=36285,Co=36286;var Tr=2300,Ro=2301,ma=2302,Xl=2400,Yl=2401,ql=2402;var Iu=3200,Lu=3201;var ah=0,Du=1,$n="",He="srgb",ls="srgb-linear",Zr="linear",le="srgb";var Li=7680;var Zl=519,Uu=512,Nu=513,Fu=514,oh=515,Ou=516,ku=517,Bu=518,zu=519,Kl=35044,cs=35048;var Jl="300 es",On=2e3,Ar=2001,zn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Ue=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],$l=1234567,As=Math.PI/180,Is=180/Math.PI;function hs(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ue[i&255]+Ue[i>>8&255]+Ue[i>>16&255]+Ue[i>>24&255]+"-"+Ue[t&255]+Ue[t>>8&255]+"-"+Ue[t>>16&15|64]+Ue[t>>24&255]+"-"+Ue[e&63|128]+Ue[e>>8&255]+"-"+Ue[e>>16&255]+Ue[e>>24&255]+Ue[n&255]+Ue[n>>8&255]+Ue[n>>16&255]+Ue[n>>24&255]).toLowerCase()}function Fe(i,t,e){return Math.max(t,Math.min(e,i))}function fl(i,t){return(i%t+t)%t}function Hu(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Vu(i,t,e){return i!==t?(e-i)/(t-i):0}function Cs(i,t,e){return(1-e)*i+e*t}function Gu(i,t,e,n){return Cs(i,t,1-Math.exp(-e*n))}function Wu(i,t=1){return t-Math.abs(fl(i,t*2)-t)}function Xu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Yu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function qu(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Zu(i,t){return i+Math.random()*(t-i)}function Ku(i){return i*(.5-Math.random())}function Ju(i){i!==void 0&&($l=i);let t=$l+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function $u(i){return i*As}function ju(i){return i*Is}function Qu(i){return(i&i-1)===0&&i!==0}function td(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function ed(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function nd(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+n)/2),h=o((t+n)/2),u=r((t-n)/2),f=o((t-n)/2),d=r((n-t)/2),y=o((n-t)/2);switch(s){case"XYX":i.set(a*h,l*u,l*f,a*c);break;case"YZY":i.set(l*f,a*h,l*u,a*c);break;case"ZXZ":i.set(l*u,l*f,a*h,a*c);break;case"XZX":i.set(a*h,l*y,l*d,a*c);break;case"YXY":i.set(l*d,a*h,l*y,a*c);break;case"ZYZ":i.set(l*y,l*d,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Yi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Be(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var lh={DEG2RAD:As,RAD2DEG:Is,generateUUID:hs,clamp:Fe,euclideanModulo:fl,mapLinear:Hu,inverseLerp:Vu,lerp:Cs,damp:Gu,pingpong:Wu,smoothstep:Xu,smootherstep:Yu,randInt:qu,randFloat:Zu,randFloatSpread:Ku,seededRandom:Ju,degToRad:$u,radToDeg:ju,isPowerOfTwo:Qu,ceilPowerOfTwo:td,floorPowerOfTwo:ed,setQuaternionFromProperEuler:nd,normalize:Be,denormalize:Yi},Dt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Fe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Wt=class i{constructor(t,e,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],y=n[8],m=s[0],g=s[3],p=s[6],M=s[1],b=s[4],x=s[7],_=s[2],w=s[5],C=s[8];return r[0]=o*m+a*M+l*_,r[3]=o*g+a*b+l*w,r[6]=o*p+a*x+l*C,r[1]=c*m+h*M+u*_,r[4]=c*g+h*b+u*w,r[7]=c*p+h*x+u*C,r[2]=f*m+d*M+y*_,r[5]=f*g+d*b+y*w,r[8]=f*p+d*x+y*C,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,f=a*l-h*r,d=c*r-o*l,y=e*u+n*f+s*d;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/y;return t[0]=u*m,t[1]=(s*c-h*n)*m,t[2]=(a*n-s*o)*m,t[3]=f*m,t[4]=(h*e-s*l)*m,t[5]=(s*r-a*e)*m,t[6]=d*m,t[7]=(n*l-c*e)*m,t[8]=(o*e-n*r)*m,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(ga.makeScale(t,e)),this}rotate(t){return this.premultiply(ga.makeRotation(-t)),this}translate(t,e){return this.premultiply(ga.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},ga=new Wt;function ch(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Cr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function id(){let i=Cr("canvas");return i.style.display="block",i}var jl={};function ws(i){i in jl||(jl[i]=!0,console.warn(i))}function sd(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function rd(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function ad(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Qt={enabled:!0,workingColorSpace:ls,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===le&&(i.r=kn(i.r),i.g=kn(i.g),i.b=kn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===le&&(i.r=Ji(i.r),i.g=Ji(i.g),i.b=Ji(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===$n?Zr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function kn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ji(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Ql=[.64,.33,.3,.6,.15,.06],tc=[.2126,.7152,.0722],ec=[.3127,.329],nc=new Wt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ic=new Wt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Qt.define({[ls]:{primaries:Ql,whitePoint:ec,transfer:Zr,toXYZ:nc,fromXYZ:ic,luminanceCoefficients:tc,workingColorSpaceConfig:{unpackColorSpace:He},outputColorSpaceConfig:{drawingBufferColorSpace:He}},[He]:{primaries:Ql,whitePoint:ec,transfer:le,toXYZ:nc,fromXYZ:ic,luminanceCoefficients:tc,outputColorSpaceConfig:{drawingBufferColorSpace:He}}});var Di,Po=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Di===void 0&&(Di=Cr("canvas")),Di.width=t.width,Di.height=t.height;let n=Di.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Di}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Cr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=kn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(kn(e[n]/255)*255):e[n]=kn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},od=0,Rr=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:od++}),this.uuid=hs(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ya(s[o].image)):r.push(ya(s[o]))}else r=ya(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function ya(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Po.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var ld=0,$e=class i extends zn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=mi,s=mi,r=En,o=gi,a=fn,l=Bn,c=i.DEFAULT_ANISOTROPY,h=$n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ld++}),this.uuid=hs(),this.name="",this.source=new Rr(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Dt(0,0),this.repeat=new Dt(1,1),this.center=new Dt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Wt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Kc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case to:t.x=t.x-Math.floor(t.x);break;case mi:t.x=t.x<0?0:1;break;case eo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case to:t.y=t.y-Math.floor(t.y);break;case mi:t.y=t.y<0?0:1;break;case eo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};$e.DEFAULT_IMAGE=null;$e.DEFAULT_MAPPING=Kc;$e.DEFAULT_ANISOTROPY=1;var Me=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],y=l[9],m=l[2],g=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-m)<.01&&Math.abs(y-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+m)<.1&&Math.abs(y+g)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let b=(c+1)/2,x=(d+1)/2,_=(p+1)/2,w=(h+f)/4,C=(u+m)/4,P=(y+g)/4;return b>x&&b>_?b<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(b),s=w/n,r=C/n):x>_?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=w/s,r=P/s):_<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(_),n=C/r,s=P/r),this.set(n,s,r,e),this}let M=Math.sqrt((g-y)*(g-y)+(u-m)*(u-m)+(f-h)*(f-h));return Math.abs(M)<.001&&(M=1),this.x=(g-y)/M,this.y=(u-m)/M,this.z=(f-h)/M,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Io=class extends zn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Me(0,0,t,e),this.scissorTest=!1,this.viewport=new Me(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:En,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new $e(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Rr(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Hn=class extends Io{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Pr=class extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=mi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Lo=class extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=mi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var mn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[o+0],d=r[o+1],y=r[o+2],m=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=f,t[e+1]=d,t[e+2]=y,t[e+3]=m;return}if(u!==m||l!==f||c!==d||h!==y){let g=1-a,p=l*f+c*d+h*y+u*m,M=p>=0?1:-1,b=1-p*p;if(b>Number.EPSILON){let _=Math.sqrt(b),w=Math.atan2(_,p*M);g=Math.sin(g*w)/_,a=Math.sin(a*w)/_}let x=a*M;if(l=l*g+f*x,c=c*g+d*x,h=h*g+y*x,u=u*g+m*x,g===1-a){let _=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=_,c*=_,h*=_,u*=_}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],y=r[o+3];return t[e]=a*y+h*u+l*d-c*f,t[e+1]=l*y+h*f+c*u-a*d,t[e+2]=c*y+h*d+a*f-l*u,t[e+3]=h*y-a*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),f=l(n/2),d=l(s/2),y=l(r/2);switch(o){case"XYZ":this._x=f*h*u+c*d*y,this._y=c*d*u-f*h*y,this._z=c*h*y+f*d*u,this._w=c*h*u-f*d*y;break;case"YXZ":this._x=f*h*u+c*d*y,this._y=c*d*u-f*h*y,this._z=c*h*y-f*d*u,this._w=c*h*u+f*d*y;break;case"ZXY":this._x=f*h*u-c*d*y,this._y=c*d*u+f*h*y,this._z=c*h*y+f*d*u,this._w=c*h*u-f*d*y;break;case"ZYX":this._x=f*h*u-c*d*y,this._y=c*d*u+f*h*y,this._z=c*h*y-f*d*u,this._w=c*h*u+f*d*y;break;case"YZX":this._x=f*h*u+c*d*y,this._y=c*d*u+f*h*y,this._z=c*h*y-f*d*u,this._w=c*h*u-f*d*y;break;case"XZY":this._x=f*h*u-c*d*y,this._y=c*d*u-f*h*y,this._z=c*h*y+f*d*u,this._w=c*h*u+f*d*y;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Fe(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(sc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(sc.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return _a.copy(this).projectOnVector(t),this.sub(_a)}reflect(t){return this.sub(_a.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Fe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},_a=new z,sc=new mn,_i=class{constructor(t=new z(1/0,1/0,1/0),e=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(cn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(cn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=cn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,cn):cn.fromBufferAttribute(r,o),cn.applyMatrix4(t.matrixWorld),this.expandByPoint(cn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),js.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),js.copy(n.boundingBox)),js.applyMatrix4(t.matrixWorld),this.union(js)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,cn),cn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ms),Qs.subVectors(this.max,Ms),Ui.subVectors(t.a,Ms),Ni.subVectors(t.b,Ms),Fi.subVectors(t.c,Ms),Xn.subVectors(Ni,Ui),Yn.subVectors(Fi,Ni),ri.subVectors(Ui,Fi);let e=[0,-Xn.z,Xn.y,0,-Yn.z,Yn.y,0,-ri.z,ri.y,Xn.z,0,-Xn.x,Yn.z,0,-Yn.x,ri.z,0,-ri.x,-Xn.y,Xn.x,0,-Yn.y,Yn.x,0,-ri.y,ri.x,0];return!xa(e,Ui,Ni,Fi,Qs)||(e=[1,0,0,0,1,0,0,0,1],!xa(e,Ui,Ni,Fi,Qs))?!1:(tr.crossVectors(Xn,Yn),e=[tr.x,tr.y,tr.z],xa(e,Ui,Ni,Fi,Qs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,cn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(cn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Pn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},Pn=[new z,new z,new z,new z,new z,new z,new z,new z],cn=new z,js=new _i,Ui=new z,Ni=new z,Fi=new z,Xn=new z,Yn=new z,ri=new z,Ms=new z,Qs=new z,tr=new z,ai=new z;function xa(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ai.fromArray(i,r);let a=s.x*Math.abs(ai.x)+s.y*Math.abs(ai.y)+s.z*Math.abs(ai.z),l=t.dot(ai),c=e.dot(ai),h=n.dot(ai);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var cd=new _i,bs=new z,va=new z,is=class{constructor(t=new z,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):cd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;bs.subVectors(t,this.center);let e=bs.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(bs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(va.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(bs.copy(t.center).add(va)),this.expandByPoint(bs.copy(t.center).sub(va))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},In=new z,Ma=new z,er=new z,qn=new z,ba=new z,nr=new z,Sa=new z,xi=class{constructor(t=new z,e=new z(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,In)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=In.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(In.copy(this.origin).addScaledVector(this.direction,e),In.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Ma.copy(t).add(e).multiplyScalar(.5),er.copy(e).sub(t).normalize(),qn.copy(this.origin).sub(Ma);let r=t.distanceTo(e)*.5,o=-this.direction.dot(er),a=qn.dot(this.direction),l=-qn.dot(er),c=qn.lengthSq(),h=Math.abs(1-o*o),u,f,d,y;if(h>0)if(u=o*l-a,f=o*a-l,y=r*h,u>=0)if(f>=-y)if(f<=y){let m=1/h;u*=m,f*=m,d=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f<=-y?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=y?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ma).addScaledVector(er,f),d}intersectSphere(t,e){In.subVectors(t.center,this.origin);let n=In.dot(this.direction),s=In.dot(In)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,o=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,o=(t.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(a=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,In)!==null}intersectTriangle(t,e,n,s,r){ba.subVectors(e,t),nr.subVectors(n,t),Sa.crossVectors(ba,nr);let o=this.direction.dot(Sa),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;qn.subVectors(this.origin,t);let l=a*this.direction.dot(nr.crossVectors(qn,nr));if(l<0)return null;let c=a*this.direction.dot(ba.cross(qn));if(c<0||l+c>o)return null;let h=-a*qn.dot(Sa);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},me=class i{constructor(t,e,n,s,r,o,a,l,c,h,u,f,d,y,m,g){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,u,f,d,y,m,g)}set(t,e,n,s,r,o,a,l,c,h,u,f,d,y,m,g){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=y,p[11]=m,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Oi.setFromMatrixColumn(t,0).length(),r=1/Oi.setFromMatrixColumn(t,1).length(),o=1/Oi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=o*h,d=o*u,y=a*h,m=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+y*c,e[5]=f-m*c,e[9]=-a*l,e[2]=m-f*c,e[6]=y+d*c,e[10]=o*l}else if(t.order==="YXZ"){let f=l*h,d=l*u,y=c*h,m=c*u;e[0]=f+m*a,e[4]=y*a-d,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=d*a-y,e[6]=m+f*a,e[10]=o*l}else if(t.order==="ZXY"){let f=l*h,d=l*u,y=c*h,m=c*u;e[0]=f-m*a,e[4]=-o*u,e[8]=y+d*a,e[1]=d+y*a,e[5]=o*h,e[9]=m-f*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let f=o*h,d=o*u,y=a*h,m=a*u;e[0]=l*h,e[4]=y*c-d,e[8]=f*c+m,e[1]=l*u,e[5]=m*c+f,e[9]=d*c-y,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let f=o*l,d=o*c,y=a*l,m=a*c;e[0]=l*h,e[4]=m-f*u,e[8]=y*u+d,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=d*u+y,e[10]=f-m*u}else if(t.order==="XZY"){let f=o*l,d=o*c,y=a*l,m=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+m,e[5]=o*h,e[9]=d*u-y,e[2]=y*u-d,e[6]=a*h,e[10]=m*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(hd,t,ud)}lookAt(t,e,n){let s=this.elements;return Ke.subVectors(t,e),Ke.lengthSq()===0&&(Ke.z=1),Ke.normalize(),Zn.crossVectors(n,Ke),Zn.lengthSq()===0&&(Math.abs(n.z)===1?Ke.x+=1e-4:Ke.z+=1e-4,Ke.normalize(),Zn.crossVectors(n,Ke)),Zn.normalize(),ir.crossVectors(Ke,Zn),s[0]=Zn.x,s[4]=ir.x,s[8]=Ke.x,s[1]=Zn.y,s[5]=ir.y,s[9]=Ke.y,s[2]=Zn.z,s[6]=ir.z,s[10]=Ke.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],y=n[2],m=n[6],g=n[10],p=n[14],M=n[3],b=n[7],x=n[11],_=n[15],w=s[0],C=s[4],P=s[8],E=s[12],v=s[1],A=s[5],L=s[9],I=s[13],D=s[2],H=s[6],k=s[10],Y=s[14],B=s[3],nt=s[7],rt=s[11],at=s[15];return r[0]=o*w+a*v+l*D+c*B,r[4]=o*C+a*A+l*H+c*nt,r[8]=o*P+a*L+l*k+c*rt,r[12]=o*E+a*I+l*Y+c*at,r[1]=h*w+u*v+f*D+d*B,r[5]=h*C+u*A+f*H+d*nt,r[9]=h*P+u*L+f*k+d*rt,r[13]=h*E+u*I+f*Y+d*at,r[2]=y*w+m*v+g*D+p*B,r[6]=y*C+m*A+g*H+p*nt,r[10]=y*P+m*L+g*k+p*rt,r[14]=y*E+m*I+g*Y+p*at,r[3]=M*w+b*v+x*D+_*B,r[7]=M*C+b*A+x*H+_*nt,r[11]=M*P+b*L+x*k+_*rt,r[15]=M*E+b*I+x*Y+_*at,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],y=t[3],m=t[7],g=t[11],p=t[15];return y*(+r*l*u-s*c*u-r*a*f+n*c*f+s*a*d-n*l*d)+m*(+e*l*d-e*c*f+r*o*f-s*o*d+s*c*h-r*l*h)+g*(+e*c*u-e*a*d-r*o*u+n*o*d+r*a*h-n*c*h)+p*(-s*a*h-e*l*u+e*a*f+s*o*u-n*o*f+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],y=t[12],m=t[13],g=t[14],p=t[15],M=u*g*c-m*f*c+m*l*d-a*g*d-u*l*p+a*f*p,b=y*f*c-h*g*c-y*l*d+o*g*d+h*l*p-o*f*p,x=h*m*c-y*u*c+y*a*d-o*m*d-h*a*p+o*u*p,_=y*u*l-h*m*l-y*a*f+o*m*f+h*a*g-o*u*g,w=e*M+n*b+s*x+r*_;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/w;return t[0]=M*C,t[1]=(m*f*r-u*g*r-m*s*d+n*g*d+u*s*p-n*f*p)*C,t[2]=(a*g*r-m*l*r+m*s*c-n*g*c-a*s*p+n*l*p)*C,t[3]=(u*l*r-a*f*r-u*s*c+n*f*c+a*s*d-n*l*d)*C,t[4]=b*C,t[5]=(h*g*r-y*f*r+y*s*d-e*g*d-h*s*p+e*f*p)*C,t[6]=(y*l*r-o*g*r-y*s*c+e*g*c+o*s*p-e*l*p)*C,t[7]=(o*f*r-h*l*r+h*s*c-e*f*c-o*s*d+e*l*d)*C,t[8]=x*C,t[9]=(y*u*r-h*m*r-y*n*d+e*m*d+h*n*p-e*u*p)*C,t[10]=(o*m*r-y*a*r+y*n*c-e*m*c-o*n*p+e*a*p)*C,t[11]=(h*a*r-o*u*r-h*n*c+e*u*c+o*n*d-e*a*d)*C,t[12]=_*C,t[13]=(h*m*s-y*u*s+y*n*f-e*m*f-h*n*g+e*u*g)*C,t[14]=(y*a*s-o*m*s-y*n*l+e*m*l+o*n*g-e*a*g)*C,t[15]=(o*u*s-h*a*s+h*n*l-e*u*l-o*n*f+e*a*f)*C,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,f=r*c,d=r*h,y=r*u,m=o*h,g=o*u,p=a*u,M=l*c,b=l*h,x=l*u,_=n.x,w=n.y,C=n.z;return s[0]=(1-(m+p))*_,s[1]=(d+x)*_,s[2]=(y-b)*_,s[3]=0,s[4]=(d-x)*w,s[5]=(1-(f+p))*w,s[6]=(g+M)*w,s[7]=0,s[8]=(y+b)*C,s[9]=(g-M)*C,s[10]=(1-(f+m))*C,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Oi.set(s[0],s[1],s[2]).length(),o=Oi.set(s[4],s[5],s[6]).length(),a=Oi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],hn.copy(this);let c=1/r,h=1/o,u=1/a;return hn.elements[0]*=c,hn.elements[1]*=c,hn.elements[2]*=c,hn.elements[4]*=h,hn.elements[5]*=h,hn.elements[6]*=h,hn.elements[8]*=u,hn.elements[9]*=u,hn.elements[10]*=u,e.setFromRotationMatrix(hn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=On){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),d,y;if(a===On)d=-(o+r)/(o-r),y=-2*o*r/(o-r);else if(a===Ar)d=-o/(o-r),y=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=On){let l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(o-r),f=(e+t)*c,d=(n+s)*h,y,m;if(a===On)y=(o+r)*u,m=-2*u;else if(a===Ar)y=r*u,m=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=m,l[14]=-y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Oi=new z,hn=new me,hd=new z(0,0,0),ud=new z(1,1,1),Zn=new z,ir=new z,Ke=new z,rc=new me,ac=new mn,wn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(Fe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Fe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Fe(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Fe(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Fe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-Fe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return rc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(rc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ac.setFromEuler(this),this.setFromQuaternion(ac,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};wn.DEFAULT_ORDER="XYZ";var Ls=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},dd=0,oc=new z,ki=new mn,Ln=new me,sr=new z,Ss=new z,fd=new z,pd=new mn,lc=new z(1,0,0),cc=new z(0,1,0),hc=new z(0,0,1),uc={type:"added"},md={type:"removed"},Bi={type:"childadded",child:null},Ea={type:"childremoved",child:null},Ge=class i extends zn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dd++}),this.uuid=hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new z,e=new wn,n=new mn,s=new z(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new me},normalMatrix:{value:new Wt}}),this.matrix=new me,this.matrixWorld=new me,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ls,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.multiply(ki),this}rotateOnWorldAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.premultiply(ki),this}rotateX(t){return this.rotateOnAxis(lc,t)}rotateY(t){return this.rotateOnAxis(cc,t)}rotateZ(t){return this.rotateOnAxis(hc,t)}translateOnAxis(t,e){return oc.copy(t).applyQuaternion(this.quaternion),this.position.add(oc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(lc,t)}translateY(t){return this.translateOnAxis(cc,t)}translateZ(t){return this.translateOnAxis(hc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ln.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?sr.copy(t):sr.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ss.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ln.lookAt(Ss,sr,this.up):Ln.lookAt(sr,Ss,this.up),this.quaternion.setFromRotationMatrix(Ln),s&&(Ln.extractRotation(s.matrixWorld),ki.setFromRotationMatrix(Ln),this.quaternion.premultiply(ki.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(uc),Bi.child=t,this.dispatchEvent(Bi),Bi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(md),Ea.child=t,this.dispatchEvent(Ea),Ea.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ln.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ln.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ln),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(uc),Bi.child=t,this.dispatchEvent(Bi),Bi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ss,t,fd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ss,pd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),f=o(t.skeletons),d=o(t.animations),y=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),y.length>0&&(n.nodes=y)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Ge.DEFAULT_UP=new z(0,1,0);Ge.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ge.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var un=new z,Dn=new z,wa=new z,Un=new z,zi=new z,Hi=new z,dc=new z,Ta=new z,Aa=new z,Ca=new z,Ra=new Me,Pa=new Me,Ia=new Me,fi=class i{constructor(t=new z,e=new z,n=new z){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),un.subVectors(t,e),s.cross(un);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){un.subVectors(s,e),Dn.subVectors(n,e),wa.subVectors(t,e);let o=un.dot(un),a=un.dot(Dn),l=un.dot(wa),c=Dn.dot(Dn),h=Dn.dot(wa),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-a*h)*f,y=(o*h-a*l)*f;return r.set(1-d-y,y,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Un)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Un.x),l.addScaledVector(o,Un.y),l.addScaledVector(a,Un.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return Ra.setScalar(0),Pa.setScalar(0),Ia.setScalar(0),Ra.fromBufferAttribute(t,e),Pa.fromBufferAttribute(t,n),Ia.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Ra,r.x),o.addScaledVector(Pa,r.y),o.addScaledVector(Ia,r.z),o}static isFrontFacing(t,e,n,s){return un.subVectors(n,e),Dn.subVectors(t,e),un.cross(Dn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return un.subVectors(this.c,this.b),Dn.subVectors(this.a,this.b),un.cross(Dn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;zi.subVectors(s,n),Hi.subVectors(r,n),Ta.subVectors(t,n);let l=zi.dot(Ta),c=Hi.dot(Ta);if(l<=0&&c<=0)return e.copy(n);Aa.subVectors(t,s);let h=zi.dot(Aa),u=Hi.dot(Aa);if(h>=0&&u<=h)return e.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(zi,o);Ca.subVectors(t,r);let d=zi.dot(Ca),y=Hi.dot(Ca);if(y>=0&&d<=y)return e.copy(r);let m=d*c-l*y;if(m<=0&&c>=0&&y<=0)return a=c/(c-y),e.copy(n).addScaledVector(Hi,a);let g=h*y-d*u;if(g<=0&&u-h>=0&&d-y>=0)return dc.subVectors(r,s),a=(u-h)/(u-h+(d-y)),e.copy(s).addScaledVector(dc,a);let p=1/(g+m+f);return o=m*p,a=f*p,e.copy(n).addScaledVector(zi,o).addScaledVector(Hi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},hh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},rr={h:0,s:0,l:0};function La(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var At=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=He){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Qt.workingColorSpace){if(t=fl(t,1),e=Fe(e,0,1),n=Fe(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=La(o,r,t+1/3),this.g=La(o,r,t),this.b=La(o,r,t-1/3)}return Qt.toWorkingColorSpace(this,s),this}setStyle(t,e=He){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=He){let n=hh[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=kn(t.r),this.g=kn(t.g),this.b=kn(t.b),this}copyLinearToSRGB(t){return this.r=Ji(t.r),this.g=Ji(t.g),this.b=Ji(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=He){return Qt.fromWorkingColorSpace(Ne.copy(this),t),Math.round(Fe(Ne.r*255,0,255))*65536+Math.round(Fe(Ne.g*255,0,255))*256+Math.round(Fe(Ne.b*255,0,255))}getHexString(t=He){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.fromWorkingColorSpace(Ne.copy(this),e);let n=Ne.r,s=Ne.g,r=Ne.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Qt.workingColorSpace){return Qt.fromWorkingColorSpace(Ne.copy(this),e),t.r=Ne.r,t.g=Ne.g,t.b=Ne.b,t}getStyle(t=He){Qt.fromWorkingColorSpace(Ne.copy(this),t);let e=Ne.r,n=Ne.g,s=Ne.b;return t!==He?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Kn),this.setHSL(Kn.h+t,Kn.s+e,Kn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Kn),t.getHSL(rr);let n=Cs(Kn.h,rr.h,e),s=Cs(Kn.s,rr.s,e),r=Cs(Kn.l,rr.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ne=new At;At.NAMES=hh;var gd=0,ni=class extends zn{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:gd++}),this.uuid=hs(),this.name="",this.blending=Zi,this.side=ei,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ga,this.blendDst=Wa,this.blendEquation=di,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new At(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Zl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Li,this.stencilZFail=Li,this.stencilZPass=Li,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Zi&&(n.blending=this.blending),this.side!==ei&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ga&&(n.blendSrc=this.blendSrc),this.blendDst!==Wa&&(n.blendDst=this.blendDst),this.blendEquation!==di&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ji&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Zl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Li&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Li&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Li&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},gn=class extends ni{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new At(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.combine=al,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var Se=new z,ar=new Dt,re=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Kl,this.updateRanges=[],this.gpuType=Fn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ar.fromBufferAttribute(this,e),ar.applyMatrix3(t),this.setXY(e,ar.x,ar.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix3(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix4(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyNormalMatrix(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.transformDirection(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Yi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Be(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Yi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Yi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Yi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Yi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Be(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array),s=Be(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Be(e,this.array),n=Be(n,this.array),s=Be(s,this.array),r=Be(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Kl&&(t.usage=this.usage),t}};var Ir=class extends re{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Lr=class extends re{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var we=class extends re{constructor(t,e,n){super(new Float32Array(t),e,n)}},yd=0,nn=new me,Da=new Ge,Vi=new z,Je=new _i,Es=new _i,Re=new z,be=class i extends zn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:yd++}),this.uuid=hs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(ch(t)?Lr:Ir)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Wt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return Da.lookAt(t),Da.updateMatrix(),this.applyMatrix4(Da.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Vi).negate(),this.translate(Vi.x,Vi.y,Vi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new we(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _i);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Je.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,Je.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,Je.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint(Je.min),this.boundingBox.expandByPoint(Je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new is);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let n=this.boundingSphere.center;if(Je.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];Es.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors(Je.min,Es.min),Je.expandByPoint(Re),Re.addVectors(Je.max,Es.max),Je.expandByPoint(Re)):(Je.expandByPoint(Es.min),Je.expandByPoint(Es.max))}Je.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Re.fromBufferAttribute(a,c),l&&(Vi.fromBufferAttribute(t,c),Re.add(Vi)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new re(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new z,l[P]=new z;let c=new z,h=new z,u=new z,f=new Dt,d=new Dt,y=new Dt,m=new z,g=new z;function p(P,E,v){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,E),u.fromBufferAttribute(n,v),f.fromBufferAttribute(r,P),d.fromBufferAttribute(r,E),y.fromBufferAttribute(r,v),h.sub(c),u.sub(c),d.sub(f),y.sub(f);let A=1/(d.x*y.y-y.x*d.y);isFinite(A)&&(m.copy(h).multiplyScalar(y.y).addScaledVector(u,-d.y).multiplyScalar(A),g.copy(u).multiplyScalar(d.x).addScaledVector(h,-y.x).multiplyScalar(A),a[P].add(m),a[E].add(m),a[v].add(m),l[P].add(g),l[E].add(g),l[v].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let P=0,E=M.length;P<E;++P){let v=M[P],A=v.start,L=v.count;for(let I=A,D=A+L;I<D;I+=3)p(t.getX(I+0),t.getX(I+1),t.getX(I+2))}let b=new z,x=new z,_=new z,w=new z;function C(P){_.fromBufferAttribute(s,P),w.copy(_);let E=a[P];b.copy(E),b.sub(_.multiplyScalar(_.dot(E))).normalize(),x.crossVectors(w,E);let A=x.dot(l[P])<0?-1:1;o.setXYZW(P,b.x,b.y,b.z,A)}for(let P=0,E=M.length;P<E;++P){let v=M[P],A=v.start,L=v.count;for(let I=A,D=A+L;I<D;I+=3)C(t.getX(I+0)),C(t.getX(I+1)),C(t.getX(I+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new re(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new z,r=new z,o=new z,a=new z,l=new z,c=new z,h=new z,u=new z;if(t)for(let f=0,d=t.count;f<d;f+=3){let y=t.getX(f+0),m=t.getX(f+1),g=t.getX(f+2);s.fromBufferAttribute(e,y),r.fromBufferAttribute(e,m),o.fromBufferAttribute(e,g),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,y),l.fromBufferAttribute(n,m),c.fromBufferAttribute(n,g),a.add(h),l.add(h),c.add(h),n.setXYZ(y,a.x,a.y,a.z),n.setXYZ(m,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,f=new c.constructor(l.length*h),d=0,y=0;for(let m=0,g=l.length;m<g;m++){a.isInterleavedBufferAttribute?d=l[m]*a.data.stride+a.offset:d=l[m]*h;for(let p=0;p<h;p++)f[y++]=c[d++]}return new re(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},fc=new me,oi=new xi,or=new is,pc=new z,lr=new z,cr=new z,hr=new z,Ua=new z,ur=new z,mc=new z,dr=new z,ye=class extends Ge{constructor(t=new be,e=new gn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){ur.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Ua.fromBufferAttribute(u,t),o?ur.addScaledVector(Ua,h):ur.addScaledVector(Ua.sub(e),h))}e.add(ur)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),or.copy(n.boundingSphere),or.applyMatrix4(r),oi.copy(t.ray).recast(t.near),!(or.containsPoint(oi.origin)===!1&&(oi.intersectSphere(or,pc)===null||oi.origin.distanceToSquared(pc)>(t.far-t.near)**2))&&(fc.copy(r).invert(),oi.copy(t.ray).applyMatrix4(fc),!(n.boundingBox!==null&&oi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,oi)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let y=0,m=f.length;y<m;y++){let g=f[y],p=o[g.materialIndex],M=Math.max(g.start,d.start),b=Math.min(a.count,Math.min(g.start+g.count,d.start+d.count));for(let x=M,_=b;x<_;x+=3){let w=a.getX(x),C=a.getX(x+1),P=a.getX(x+2);s=fr(this,p,t,n,c,h,u,w,C,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let y=Math.max(0,d.start),m=Math.min(a.count,d.start+d.count);for(let g=y,p=m;g<p;g+=3){let M=a.getX(g),b=a.getX(g+1),x=a.getX(g+2);s=fr(this,o,t,n,c,h,u,M,b,x),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let y=0,m=f.length;y<m;y++){let g=f[y],p=o[g.materialIndex],M=Math.max(g.start,d.start),b=Math.min(l.count,Math.min(g.start+g.count,d.start+d.count));for(let x=M,_=b;x<_;x+=3){let w=x,C=x+1,P=x+2;s=fr(this,p,t,n,c,h,u,w,C,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let y=Math.max(0,d.start),m=Math.min(l.count,d.start+d.count);for(let g=y,p=m;g<p;g+=3){let M=g,b=g+1,x=g+2;s=fr(this,o,t,n,c,h,u,M,b,x),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function _d(i,t,e,n,s,r,o,a){let l;if(t.side===Ye?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===ei,a),l===null)return null;dr.copy(a),dr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(dr);return c<e.near||c>e.far?null:{distance:c,point:dr.clone(),object:i}}function fr(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,lr),i.getVertexPosition(l,cr),i.getVertexPosition(c,hr);let h=_d(i,t,e,n,lr,cr,hr,mc);if(h){let u=new z;fi.getBarycoord(mc,lr,cr,hr,u),s&&(h.uv=fi.getInterpolatedAttribute(s,a,l,c,u,new Dt)),r&&(h.uv1=fi.getInterpolatedAttribute(r,a,l,c,u,new Dt)),o&&(h.normal=fi.getInterpolatedAttribute(o,a,l,c,u,new z),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:l,c,normal:new z,materialIndex:0};fi.getNormal(lr,cr,hr,f.normal),h.face=f,h.barycoord=u}return h}var vi=class i extends be{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],f=0,d=0;y("z","y","x",-1,-1,n,e,t,o,r,0),y("z","y","x",1,-1,n,e,-t,o,r,1),y("x","z","y",1,1,t,n,e,s,o,2),y("x","z","y",1,-1,t,n,-e,s,o,3),y("x","y","z",1,-1,t,e,n,s,r,4),y("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(h,3)),this.setAttribute("uv",new we(u,2));function y(m,g,p,M,b,x,_,w,C,P,E){let v=x/C,A=_/P,L=x/2,I=_/2,D=w/2,H=C+1,k=P+1,Y=0,B=0,nt=new z;for(let rt=0;rt<k;rt++){let at=rt*A-I;for(let Pt=0;Pt<H;Pt++){let Yt=Pt*v-L;nt[m]=Yt*M,nt[g]=at*b,nt[p]=D,c.push(nt.x,nt.y,nt.z),nt[m]=0,nt[g]=0,nt[p]=w>0?1:-1,h.push(nt.x,nt.y,nt.z),u.push(Pt/C),u.push(1-rt/P),Y+=1}}for(let rt=0;rt<P;rt++)for(let at=0;at<C;at++){let Pt=f+at+H*rt,Yt=f+at+H*(rt+1),J=f+(at+1)+H*(rt+1),Q=f+(at+1)+H*rt;l.push(Pt,Yt,Q),l.push(Yt,J,Q),B+=6}a.addGroup(d,B,E),d+=B,f+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function ss(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function ze(i){let t={};for(let e=0;e<i.length;e++){let n=ss(i[e]);for(let s in n)t[s]=n[s]}return t}function xd(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function uh(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}var vd={clone:ss,merge:ze},Md=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,bd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,je=class extends ni{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Md,this.fragmentShader=bd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ss(t.uniforms),this.uniformsGroups=xd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Dr=class extends Ge{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new me,this.projectionMatrix=new me,this.projectionMatrixInverse=new me,this.coordinateSystem=On}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Jn=new z,gc=new Dt,yc=new Dt,Ve=class extends Dr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Is*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(As*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Is*2*Math.atan(Math.tan(As*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Jn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Jn.x,Jn.y).multiplyScalar(-t/Jn.z),Jn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Jn.x,Jn.y).multiplyScalar(-t/Jn.z)}getViewSize(t,e){return this.getViewBounds(t,gc,yc),e.subVectors(yc,gc)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(As*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Gi=-90,Wi=1,Do=class extends Ge{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ve(Gi,Wi,t,e);s.layers=this.layers,this.add(s);let r=new Ve(Gi,Wi,t,e);r.layers=this.layers,this.add(r);let o=new Ve(Gi,Wi,t,e);o.layers=this.layers,this.add(o);let a=new Ve(Gi,Wi,t,e);a.layers=this.layers,this.add(a);let l=new Ve(Gi,Wi,t,e);l.layers=this.layers,this.add(l);let c=new Ve(Gi,Wi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===On)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ar)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),y=t.xr.enabled;t.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=m,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=y,n.texture.needsPMREMUpdate=!0}},Ur=class extends $e{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Qi,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Uo=class extends Hn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Ur(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:En}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new vi(5,5,5),r=new je({name:"CubemapFromEquirect",uniforms:ss(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ye,blending:Qn});r.uniforms.tEquirect.value=e;let o=new ye(s,r),a=e.minFilter;return e.minFilter===gi&&(e.minFilter=En),new Do(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},Na=new z,Sd=new z,Ed=new Wt,dn=class{constructor(t=new z(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Na.subVectors(n,e).cross(Sd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Na),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Ed.getNormalMatrix(t),s=this.coplanarPoint(Na).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},li=new is,pr=new z,Ds=class{constructor(t=new dn,e=new dn,n=new dn,s=new dn,r=new dn,o=new dn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=On){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],f=s[7],d=s[8],y=s[9],m=s[10],g=s[11],p=s[12],M=s[13],b=s[14],x=s[15];if(n[0].setComponents(l-r,f-c,g-d,x-p).normalize(),n[1].setComponents(l+r,f+c,g+d,x+p).normalize(),n[2].setComponents(l+o,f+h,g+y,x+M).normalize(),n[3].setComponents(l-o,f-h,g-y,x-M).normalize(),n[4].setComponents(l-a,f-u,g-m,x-b).normalize(),e===On)n[5].setComponents(l+a,f+u,g+m,x+b).normalize();else if(e===Ar)n[5].setComponents(a,u,m,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),li.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),li.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(li)}intersectsSprite(t){return li.center.set(0,0,0),li.radius=.7071067811865476,li.applyMatrix4(t.matrixWorld),this.intersectsSphere(li)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(pr.x=s.normal.x>0?t.max.x:t.min.x,pr.y=s.normal.y>0?t.max.y:t.min.y,pr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(pr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function dh(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function wd(i){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,u=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((d,y)=>d.start-y.start);let f=0;for(let d=1;d<u.length;d++){let y=u[f],m=u[d];m.start<=y.start+y.count+1?y.count=Math.max(y.count,m.start+m.count-y.start):(++f,u[f]=m)}u.length=f+1;for(let d=0,y=u.length;d<y;d++){let m=u[d];i.bufferSubData(c,m.start*h.BYTES_PER_ELEMENT,h,m.start,m.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var rs=class i extends be{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=t/a,f=e/l,d=[],y=[],m=[],g=[];for(let p=0;p<h;p++){let M=p*f-o;for(let b=0;b<c;b++){let x=b*u-r;y.push(x,-M,0),m.push(0,0,1),g.push(b/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<a;M++){let b=M+c*p,x=M+c*(p+1),_=M+1+c*(p+1),w=M+1+c*p;d.push(b,x,w),d.push(x,_,w)}this.setIndex(d),this.setAttribute("position",new we(y,3)),this.setAttribute("normal",new we(m,3)),this.setAttribute("uv",new we(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},Td=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ad=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Cd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Id=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ld=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Dd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ud=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Nd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Fd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Od=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,kd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Bd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,zd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Hd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Vd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Wd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Xd=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Yd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,qd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Zd=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Kd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Jd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,$d=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,jd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Qd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,tf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ef=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,nf="gl_FragColor = linearToOutputTexel( gl_FragColor );",sf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,rf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,af=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,of=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,lf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,cf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,hf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,uf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,df=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ff=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,pf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,mf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,gf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,yf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,_f=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,xf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,vf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Mf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Sf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ef=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Tf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Af=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Cf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Rf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Pf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,If=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Lf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Df=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Uf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Nf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ff=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Of=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,kf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Bf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,zf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Hf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Gf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Xf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Yf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,qf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Zf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Kf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Jf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,$f=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,jf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Qf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,tp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ep=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,np=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ip=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,sp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,rp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ap=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,op=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,lp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,cp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,hp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,up=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,dp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,fp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,pp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,mp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,gp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,yp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,_p=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,xp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,vp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Mp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,bp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Tp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ap=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ip=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Dp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Up=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Np=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Fp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Op=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,kp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Bp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,zp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Hp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Xp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,qp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Zp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,$p=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,em=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,nm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,im=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Zt={alphahash_fragment:Td,alphahash_pars_fragment:Ad,alphamap_fragment:Cd,alphamap_pars_fragment:Rd,alphatest_fragment:Pd,alphatest_pars_fragment:Id,aomap_fragment:Ld,aomap_pars_fragment:Dd,batching_pars_vertex:Ud,batching_vertex:Nd,begin_vertex:Fd,beginnormal_vertex:Od,bsdfs:kd,iridescence_fragment:Bd,bumpmap_pars_fragment:zd,clipping_planes_fragment:Hd,clipping_planes_pars_fragment:Vd,clipping_planes_pars_vertex:Gd,clipping_planes_vertex:Wd,color_fragment:Xd,color_pars_fragment:Yd,color_pars_vertex:qd,color_vertex:Zd,common:Kd,cube_uv_reflection_fragment:Jd,defaultnormal_vertex:$d,displacementmap_pars_vertex:jd,displacementmap_vertex:Qd,emissivemap_fragment:tf,emissivemap_pars_fragment:ef,colorspace_fragment:nf,colorspace_pars_fragment:sf,envmap_fragment:rf,envmap_common_pars_fragment:af,envmap_pars_fragment:of,envmap_pars_vertex:lf,envmap_physical_pars_fragment:xf,envmap_vertex:cf,fog_vertex:hf,fog_pars_vertex:uf,fog_fragment:df,fog_pars_fragment:ff,gradientmap_pars_fragment:pf,lightmap_pars_fragment:mf,lights_lambert_fragment:gf,lights_lambert_pars_fragment:yf,lights_pars_begin:_f,lights_toon_fragment:vf,lights_toon_pars_fragment:Mf,lights_phong_fragment:bf,lights_phong_pars_fragment:Sf,lights_physical_fragment:Ef,lights_physical_pars_fragment:wf,lights_fragment_begin:Tf,lights_fragment_maps:Af,lights_fragment_end:Cf,logdepthbuf_fragment:Rf,logdepthbuf_pars_fragment:Pf,logdepthbuf_pars_vertex:If,logdepthbuf_vertex:Lf,map_fragment:Df,map_pars_fragment:Uf,map_particle_fragment:Nf,map_particle_pars_fragment:Ff,metalnessmap_fragment:Of,metalnessmap_pars_fragment:kf,morphinstance_vertex:Bf,morphcolor_vertex:zf,morphnormal_vertex:Hf,morphtarget_pars_vertex:Vf,morphtarget_vertex:Gf,normal_fragment_begin:Wf,normal_fragment_maps:Xf,normal_pars_fragment:Yf,normal_pars_vertex:qf,normal_vertex:Zf,normalmap_pars_fragment:Kf,clearcoat_normal_fragment_begin:Jf,clearcoat_normal_fragment_maps:$f,clearcoat_pars_fragment:jf,iridescence_pars_fragment:Qf,opaque_fragment:tp,packing:ep,premultiplied_alpha_fragment:np,project_vertex:ip,dithering_fragment:sp,dithering_pars_fragment:rp,roughnessmap_fragment:ap,roughnessmap_pars_fragment:op,shadowmap_pars_fragment:lp,shadowmap_pars_vertex:cp,shadowmap_vertex:hp,shadowmask_pars_fragment:up,skinbase_vertex:dp,skinning_pars_vertex:fp,skinning_vertex:pp,skinnormal_vertex:mp,specularmap_fragment:gp,specularmap_pars_fragment:yp,tonemapping_fragment:_p,tonemapping_pars_fragment:xp,transmission_fragment:vp,transmission_pars_fragment:Mp,uv_pars_fragment:bp,uv_pars_vertex:Sp,uv_vertex:Ep,worldpos_vertex:wp,background_vert:Tp,background_frag:Ap,backgroundCube_vert:Cp,backgroundCube_frag:Rp,cube_vert:Pp,cube_frag:Ip,depth_vert:Lp,depth_frag:Dp,distanceRGBA_vert:Up,distanceRGBA_frag:Np,equirect_vert:Fp,equirect_frag:Op,linedashed_vert:kp,linedashed_frag:Bp,meshbasic_vert:zp,meshbasic_frag:Hp,meshlambert_vert:Vp,meshlambert_frag:Gp,meshmatcap_vert:Wp,meshmatcap_frag:Xp,meshnormal_vert:Yp,meshnormal_frag:qp,meshphong_vert:Zp,meshphong_frag:Kp,meshphysical_vert:Jp,meshphysical_frag:$p,meshtoon_vert:jp,meshtoon_frag:Qp,points_vert:tm,points_frag:em,shadow_vert:nm,shadow_frag:im,sprite_vert:sm,sprite_frag:rm},ht={common:{diffuse:{value:new At(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Wt}},envmap:{envMap:{value:null},envMapRotation:{value:new Wt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Wt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Wt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Wt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Wt},normalScale:{value:new Dt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Wt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Wt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Wt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Wt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new At(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new At(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0},uvTransform:{value:new Wt}},sprite:{diffuse:{value:new At(16777215)},opacity:{value:1},center:{value:new Dt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}}},Sn={basic:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.fog]),vertexShader:Zt.meshbasic_vert,fragmentShader:Zt.meshbasic_frag},lambert:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new At(0)}}]),vertexShader:Zt.meshlambert_vert,fragmentShader:Zt.meshlambert_frag},phong:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new At(0)},specular:{value:new At(1118481)},shininess:{value:30}}]),vertexShader:Zt.meshphong_vert,fragmentShader:Zt.meshphong_frag},standard:{uniforms:ze([ht.common,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.roughnessmap,ht.metalnessmap,ht.fog,ht.lights,{emissive:{value:new At(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Zt.meshphysical_vert,fragmentShader:Zt.meshphysical_frag},toon:{uniforms:ze([ht.common,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.gradientmap,ht.fog,ht.lights,{emissive:{value:new At(0)}}]),vertexShader:Zt.meshtoon_vert,fragmentShader:Zt.meshtoon_frag},matcap:{uniforms:ze([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,{matcap:{value:null}}]),vertexShader:Zt.meshmatcap_vert,fragmentShader:Zt.meshmatcap_frag},points:{uniforms:ze([ht.points,ht.fog]),vertexShader:Zt.points_vert,fragmentShader:Zt.points_frag},dashed:{uniforms:ze([ht.common,ht.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Zt.linedashed_vert,fragmentShader:Zt.linedashed_frag},depth:{uniforms:ze([ht.common,ht.displacementmap]),vertexShader:Zt.depth_vert,fragmentShader:Zt.depth_frag},normal:{uniforms:ze([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,{opacity:{value:1}}]),vertexShader:Zt.meshnormal_vert,fragmentShader:Zt.meshnormal_frag},sprite:{uniforms:ze([ht.sprite,ht.fog]),vertexShader:Zt.sprite_vert,fragmentShader:Zt.sprite_frag},background:{uniforms:{uvTransform:{value:new Wt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Zt.background_vert,fragmentShader:Zt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Wt}},vertexShader:Zt.backgroundCube_vert,fragmentShader:Zt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Zt.cube_vert,fragmentShader:Zt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Zt.equirect_vert,fragmentShader:Zt.equirect_frag},distanceRGBA:{uniforms:ze([ht.common,ht.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Zt.distanceRGBA_vert,fragmentShader:Zt.distanceRGBA_frag},shadow:{uniforms:ze([ht.lights,ht.fog,{color:{value:new At(0)},opacity:{value:1}}]),vertexShader:Zt.shadow_vert,fragmentShader:Zt.shadow_frag}};Sn.physical={uniforms:ze([Sn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Wt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Wt},clearcoatNormalScale:{value:new Dt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Wt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Wt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Wt},sheen:{value:0},sheenColor:{value:new At(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Wt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Wt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Wt},transmissionSamplerSize:{value:new Dt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Wt},attenuationDistance:{value:0},attenuationColor:{value:new At(0)},specularColor:{value:new At(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Wt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Wt},anisotropyVector:{value:new Dt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Wt}}]),vertexShader:Zt.meshphysical_vert,fragmentShader:Zt.meshphysical_frag};var mr={r:0,b:0,g:0},ci=new wn,am=new me;function om(i,t,e,n,s,r,o){let a=new At(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function y(M){let b=M.isScene===!0?M.background:null;return b&&b.isTexture&&(b=(M.backgroundBlurriness>0?e:t).get(b)),b}function m(M){let b=!1,x=y(M);x===null?p(a,l):x&&x.isColor&&(p(x,1),b=!0);let _=i.xr.getEnvironmentBlendMode();_==="additive"?n.buffers.color.setClear(0,0,0,1,o):_==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||b)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(M,b){let x=y(b);x&&(x.isCubeTexture||x.mapping===qr)?(h===void 0&&(h=new ye(new vi(1,1,1),new je({name:"BackgroundCubeMaterial",uniforms:ss(Sn.backgroundCube.uniforms),vertexShader:Sn.backgroundCube.vertexShader,fragmentShader:Sn.backgroundCube.fragmentShader,side:Ye,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(_,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),ci.copy(b.backgroundRotation),ci.x*=-1,ci.y*=-1,ci.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(ci.y*=-1,ci.z*=-1),h.material.uniforms.envMap.value=x,h.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(am.makeRotationFromEuler(ci)),h.material.toneMapped=Qt.getTransfer(x.colorSpace)!==le,(u!==x||f!==x.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=x,f=x.version,d=i.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new ye(new rs(2,2),new je({name:"BackgroundMaterial",uniforms:ss(Sn.background.uniforms),vertexShader:Sn.background.vertexShader,fragmentShader:Sn.background.fragmentShader,side:ei,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.toneMapped=Qt.getTransfer(x.colorSpace)!==le,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||f!==x.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=x,f=x.version,d=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function p(M,b){M.getRGB(mr,uh(i)),n.buffers.color.setClear(mr.r,mr.g,mr.b,b,o)}return{getClearColor:function(){return a},setClearColor:function(M,b=1){a.set(M),l=b,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,p(a,l)},render:m,addToRenderList:g}}function lm(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(v,A,L,I,D){let H=!1,k=u(I,L,A);r!==k&&(r=k,c(r.object)),H=d(v,I,L,D),H&&y(v,I,L,D),D!==null&&t.update(D,i.ELEMENT_ARRAY_BUFFER),(H||o)&&(o=!1,x(v,A,L,I),D!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(D).buffer))}function l(){return i.createVertexArray()}function c(v){return i.bindVertexArray(v)}function h(v){return i.deleteVertexArray(v)}function u(v,A,L){let I=L.wireframe===!0,D=n[v.id];D===void 0&&(D={},n[v.id]=D);let H=D[A.id];H===void 0&&(H={},D[A.id]=H);let k=H[I];return k===void 0&&(k=f(l()),H[I]=k),k}function f(v){let A=[],L=[],I=[];for(let D=0;D<e;D++)A[D]=0,L[D]=0,I[D]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:A,enabledAttributes:L,attributeDivisors:I,object:v,attributes:{},index:null}}function d(v,A,L,I){let D=r.attributes,H=A.attributes,k=0,Y=L.getAttributes();for(let B in Y)if(Y[B].location>=0){let rt=D[B],at=H[B];if(at===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(at=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(at=v.instanceColor)),rt===void 0||rt.attribute!==at||at&&rt.data!==at.data)return!0;k++}return r.attributesNum!==k||r.index!==I}function y(v,A,L,I){let D={},H=A.attributes,k=0,Y=L.getAttributes();for(let B in Y)if(Y[B].location>=0){let rt=H[B];rt===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(rt=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(rt=v.instanceColor));let at={};at.attribute=rt,rt&&rt.data&&(at.data=rt.data),D[B]=at,k++}r.attributes=D,r.attributesNum=k,r.index=I}function m(){let v=r.newAttributes;for(let A=0,L=v.length;A<L;A++)v[A]=0}function g(v){p(v,0)}function p(v,A){let L=r.newAttributes,I=r.enabledAttributes,D=r.attributeDivisors;L[v]=1,I[v]===0&&(i.enableVertexAttribArray(v),I[v]=1),D[v]!==A&&(i.vertexAttribDivisor(v,A),D[v]=A)}function M(){let v=r.newAttributes,A=r.enabledAttributes;for(let L=0,I=A.length;L<I;L++)A[L]!==v[L]&&(i.disableVertexAttribArray(L),A[L]=0)}function b(v,A,L,I,D,H,k){k===!0?i.vertexAttribIPointer(v,A,L,D,H):i.vertexAttribPointer(v,A,L,I,D,H)}function x(v,A,L,I){m();let D=I.attributes,H=L.getAttributes(),k=A.defaultAttributeValues;for(let Y in H){let B=H[Y];if(B.location>=0){let nt=D[Y];if(nt===void 0&&(Y==="instanceMatrix"&&v.instanceMatrix&&(nt=v.instanceMatrix),Y==="instanceColor"&&v.instanceColor&&(nt=v.instanceColor)),nt!==void 0){let rt=nt.normalized,at=nt.itemSize,Pt=t.get(nt);if(Pt===void 0)continue;let Yt=Pt.buffer,J=Pt.type,Q=Pt.bytesPerElement,vt=J===i.INT||J===i.UNSIGNED_INT||nt.gpuType===ol;if(nt.isInterleavedBufferAttribute){let ct=nt.data,It=ct.stride,Ut=nt.offset;if(ct.isInstancedInterleavedBuffer){for(let kt=0;kt<B.locationSize;kt++)p(B.location+kt,ct.meshPerAttribute);v.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=ct.meshPerAttribute*ct.count)}else for(let kt=0;kt<B.locationSize;kt++)g(B.location+kt);i.bindBuffer(i.ARRAY_BUFFER,Yt);for(let kt=0;kt<B.locationSize;kt++)b(B.location+kt,at/B.locationSize,J,rt,It*Q,(Ut+at/B.locationSize*kt)*Q,vt)}else{if(nt.isInstancedBufferAttribute){for(let ct=0;ct<B.locationSize;ct++)p(B.location+ct,nt.meshPerAttribute);v.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let ct=0;ct<B.locationSize;ct++)g(B.location+ct);i.bindBuffer(i.ARRAY_BUFFER,Yt);for(let ct=0;ct<B.locationSize;ct++)b(B.location+ct,at/B.locationSize,J,rt,at*Q,at/B.locationSize*ct*Q,vt)}}else if(k!==void 0){let rt=k[Y];if(rt!==void 0)switch(rt.length){case 2:i.vertexAttrib2fv(B.location,rt);break;case 3:i.vertexAttrib3fv(B.location,rt);break;case 4:i.vertexAttrib4fv(B.location,rt);break;default:i.vertexAttrib1fv(B.location,rt)}}}}M()}function _(){P();for(let v in n){let A=n[v];for(let L in A){let I=A[L];for(let D in I)h(I[D].object),delete I[D];delete A[L]}delete n[v]}}function w(v){if(n[v.id]===void 0)return;let A=n[v.id];for(let L in A){let I=A[L];for(let D in I)h(I[D].object),delete I[D];delete A[L]}delete n[v.id]}function C(v){for(let A in n){let L=n[A];if(L[v.id]===void 0)continue;let I=L[v.id];for(let D in I)h(I[D].object),delete I[D];delete L[v.id]}}function P(){E(),o=!0,r!==s&&(r=s,c(r.object))}function E(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:E,dispose:_,releaseStatesOfGeometry:w,releaseStatesOfProgram:C,initAttributes:m,enableAttribute:g,disableUnusedAttributes:M}}function cm(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let d=0;for(let y=0;y<u;y++)d+=h[y];e.update(d,n,1)}function l(c,h,u,f){if(u===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let y=0;y<c.length;y++)o(c[y],h[y],f[y]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,u);let y=0;for(let m=0;m<u;m++)y+=h[m]*f[m];e.update(y,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function hm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let C=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==fn&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let P=C===Bs&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==Bn&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Fn&&!P)}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),b=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),_=y>0,w=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:d,maxVertexTextures:y,maxTextureSize:m,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:M,maxVaryings:b,maxFragmentUniforms:x,vertexTextures:_,maxSamples:w}}function um(i){let t=this,e=null,n=0,s=!1,r=!1,o=new dn,a=new Wt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){let y=u.clippingPlanes,m=u.clipIntersection,g=u.clipShadows,p=i.get(u);if(!s||y===null||y.length===0||r&&!g)r?h(null):c();else{let M=r?0:n,b=M*4,x=p.clippingState||null;l.value=x,x=h(y,f,b,d);for(let _=0;_!==b;++_)x[_]=e[_];p.clippingState=x,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,y){let m=u!==null?u.length:0,g=null;if(m!==0){if(g=l.value,y!==!0||g===null){let p=d+m*4,M=f.matrixWorldInverse;a.getNormalMatrix(M),(g===null||g.length<p)&&(g=new Float32Array(p));for(let b=0,x=d;b!==m;++b,x+=4)o.copy(u[b]).applyMatrix4(M,a),o.normal.toArray(g,x),g[x+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=m,t.numIntersection=0,g}}function dm(i){let t=new WeakMap;function e(o,a){return a===ja?o.mapping=Qi:a===Qa&&(o.mapping=ts),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===ja||a===Qa)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Uo(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var as=class extends Dr{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},qi=4,_c=[.125,.215,.35,.446,.526,.582],pi=20,Fa=new as,xc=new At,Oa=null,ka=0,Ba=0,za=!1,ui=(1+Math.sqrt(5))/2,Xi=1/ui,vc=[new z(-ui,Xi,0),new z(ui,Xi,0),new z(-Xi,0,ui),new z(Xi,0,ui),new z(0,ui,-Xi),new z(0,ui,Xi),new z(-1,1,-1),new z(1,1,-1),new z(-1,1,1),new z(1,1,1)],Nr=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Oa=this._renderer.getRenderTarget(),ka=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),za=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Sc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=bc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Oa,ka,Ba),this._renderer.xr.enabled=za,t.scissorTest=!1,gr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Qi||t.mapping===ts?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Oa=this._renderer.getRenderTarget(),ka=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),za=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:En,minFilter:En,generateMipmaps:!1,type:Bs,format:fn,colorSpace:ls,depthBuffer:!1},s=Mc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Mc(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=fm(r)),this._blurMaterial=pm(r,t,e)}return s}_compileMaterial(t){let e=new ye(this._lodPlanes[0],t);this._renderer.compile(e,Fa)}_sceneToCubeUV(t,e,n,s){let a=new Ve(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(xc),h.toneMapping=ti,h.autoClear=!1;let d=new gn({name:"PMREM.Background",side:Ye,depthWrite:!1,depthTest:!1}),y=new ye(new vi,d),m=!1,g=t.background;g?g.isColor&&(d.color.copy(g),t.background=null,m=!0):(d.color.copy(xc),m=!0);for(let p=0;p<6;p++){let M=p%3;M===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):M===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));let b=this._cubeSize;gr(s,M*b,p>2?b:0,b,b),h.setRenderTarget(s),m&&h.render(y,a),h.render(t,a)}y.geometry.dispose(),y.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=g}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Qi||t.mapping===ts;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Sc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=bc());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new ye(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;gr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Fa)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=vc[(s-r-1)%vc.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new ye(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,y=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*pi-1),m=r/y,g=isFinite(r)?1+Math.floor(h*m):pi;g>pi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${pi}`);let p=[],M=0;for(let C=0;C<pi;++C){let P=C/m,E=Math.exp(-P*P/2);p.push(E),C===0?M+=E:C<g&&(M+=2*E)}for(let C=0;C<p.length;C++)p[C]=p[C]/M;f.envMap.value=t.texture,f.samples.value=g,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:b}=this;f.dTheta.value=y,f.mipInt.value=b-n;let x=this._sizeLods[s],_=3*x*(s>b-qi?s-b+qi:0),w=4*(this._cubeSize-x);gr(e,_,w,3*x,2*x),l.setRenderTarget(e),l.render(u,Fa)}};function fm(i){let t=[],e=[],n=[],s=i,r=i-qi+1+_c.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>i-qi?l=_c[o-i+qi-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,y=6,m=3,g=2,p=1,M=new Float32Array(m*y*d),b=new Float32Array(g*y*d),x=new Float32Array(p*y*d);for(let w=0;w<d;w++){let C=w%3*2/3-1,P=w>2?0:-1,E=[C,P,0,C+2/3,P,0,C+2/3,P+1,0,C,P,0,C+2/3,P+1,0,C,P+1,0];M.set(E,m*y*w),b.set(f,g*y*w);let v=[w,w,w,w,w,w];x.set(v,p*y*w)}let _=new be;_.setAttribute("position",new re(M,m)),_.setAttribute("uv",new re(b,g)),_.setAttribute("faceIndex",new re(x,p)),t.push(_),s>qi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Mc(i,t,e){let n=new Hn(i,t,e);return n.texture.mapping=qr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function gr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function pm(i,t,e){let n=new Float32Array(pi),s=new z(0,1,0);return new je({name:"SphericalGaussianBlur",defines:{n:pi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:pl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function bc(){return new je({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:pl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function Sc(){return new je({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:pl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function pl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function mm(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===ja||l===Qa,h=l===Qi||l===ts;if(c||h){let u=t.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return e===null&&(e=new Nr(i)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let d=a.image;return c&&d&&d.height>0||h&&d&&s(d)?(e===null&&(e=new Nr(i)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function gm(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&ws("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function ym(i,t,e,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&t.remove(f.index);for(let y in f.attributes)t.remove(f.attributes[y]);for(let y in f.morphAttributes){let m=f.morphAttributes[y];for(let g=0,p=m.length;g<p;g++)t.remove(m[g])}f.removeEventListener("dispose",o),delete s[f.id];let d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function l(u){let f=u.attributes;for(let y in f)t.update(f[y],i.ARRAY_BUFFER);let d=u.morphAttributes;for(let y in d){let m=d[y];for(let g=0,p=m.length;g<p;g++)t.update(m[g],i.ARRAY_BUFFER)}}function c(u){let f=[],d=u.index,y=u.attributes.position,m=0;if(d!==null){let M=d.array;m=d.version;for(let b=0,x=M.length;b<x;b+=3){let _=M[b+0],w=M[b+1],C=M[b+2];f.push(_,w,w,C,C,_)}}else if(y!==void 0){let M=y.array;m=y.version;for(let b=0,x=M.length/3-1;b<x;b+=3){let _=b+0,w=b+1,C=b+2;f.push(_,w,w,C,C,_)}}else return;let g=new(ch(f)?Lr:Ir)(f,1);g.version=m;let p=r.get(u);p&&t.remove(p),r.set(u,g)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function _m(i,t,e){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*o),e.update(d,n,1)}function c(f,d,y){y!==0&&(i.drawElementsInstanced(n,d,r,f*o,y),e.update(d,n,y))}function h(f,d,y){if(y===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,y);let g=0;for(let p=0;p<y;p++)g+=d[p];e.update(g,n,1)}function u(f,d,y,m){if(y===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<f.length;p++)c(f[p]/o,d[p],m[p]);else{g.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,m,0,y);let p=0;for(let M=0;M<y;M++)p+=d[M]*m[M];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function xm(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function vm(i,t,e){let n=new WeakMap,s=new Me;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(a);if(f===void 0||f.count!==u){let E=function(){C.dispose(),n.delete(a),a.removeEventListener("dispose",E)};f!==void 0&&f.texture.dispose();let d=a.morphAttributes.position!==void 0,y=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],b=0;d===!0&&(b=1),y===!0&&(b=2),m===!0&&(b=3);let x=a.attributes.position.count*b,_=1;x>t.maxTextureSize&&(_=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let w=new Float32Array(x*_*4*u),C=new Pr(w,x,_,u);C.type=Fn,C.needsUpdate=!0;let P=b*4;for(let v=0;v<u;v++){let A=g[v],L=p[v],I=M[v],D=x*_*4*v;for(let H=0;H<A.count;H++){let k=H*P;d===!0&&(s.fromBufferAttribute(A,H),w[D+k+0]=s.x,w[D+k+1]=s.y,w[D+k+2]=s.z,w[D+k+3]=0),y===!0&&(s.fromBufferAttribute(L,H),w[D+k+4]=s.x,w[D+k+5]=s.y,w[D+k+6]=s.z,w[D+k+7]=0),m===!0&&(s.fromBufferAttribute(I,H),w[D+k+8]=s.x,w[D+k+9]=s.y,w[D+k+10]=s.z,w[D+k+11]=I.itemSize===4?s.w:1)}}f={count:u,texture:C,size:new Dt(x,_)},n.set(a,f),a.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let d=0;for(let m=0;m<c.length;m++)d+=c[m];let y=a.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",y),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Mm(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var Fr=class extends $e{constructor(t,e,n,s,r,o,a,l,c,h=Ki){if(h!==Ki&&h!==ns)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Ki&&(n=yi),n===void 0&&h===ns&&(n=es),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:pn,this.minFilter=l!==void 0?l:pn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},fh=new $e,Ec=new Fr(1,1),ph=new Pr,mh=new Lo,gh=new Ur,wc=[],Tc=[],Ac=new Float32Array(16),Cc=new Float32Array(9),Rc=new Float32Array(4);function us(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=wc[s];if(r===void 0&&(r=new Float32Array(s),wc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Te(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Kr(i,t){let e=Tc[t];e===void 0&&(e=new Int32Array(t),Tc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function bm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Sm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2fv(this.addr,t),Ae(e,t)}}function Em(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Te(e,t))return;i.uniform3fv(this.addr,t),Ae(e,t)}}function wm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4fv(this.addr,t),Ae(e,t)}}function Tm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Rc.set(n),i.uniformMatrix2fv(this.addr,!1,Rc),Ae(e,n)}}function Am(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Cc.set(n),i.uniformMatrix3fv(this.addr,!1,Cc),Ae(e,n)}}function Cm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Te(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ae(e,t)}else{if(Te(e,n))return;Ac.set(n),i.uniformMatrix4fv(this.addr,!1,Ac),Ae(e,n)}}function Rm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Pm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2iv(this.addr,t),Ae(e,t)}}function Im(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3iv(this.addr,t),Ae(e,t)}}function Lm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4iv(this.addr,t),Ae(e,t)}}function Dm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Um(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Te(e,t))return;i.uniform2uiv(this.addr,t),Ae(e,t)}}function Nm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Te(e,t))return;i.uniform3uiv(this.addr,t),Ae(e,t)}}function Fm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Te(e,t))return;i.uniform4uiv(this.addr,t),Ae(e,t)}}function Om(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ec.compareFunction=oh,r=Ec):r=fh,e.setTexture2D(t||r,s)}function km(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||mh,s)}function Bm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||gh,s)}function zm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||ph,s)}function Hm(i){switch(i){case 5126:return bm;case 35664:return Sm;case 35665:return Em;case 35666:return wm;case 35674:return Tm;case 35675:return Am;case 35676:return Cm;case 5124:case 35670:return Rm;case 35667:case 35671:return Pm;case 35668:case 35672:return Im;case 35669:case 35673:return Lm;case 5125:return Dm;case 36294:return Um;case 36295:return Nm;case 36296:return Fm;case 35678:case 36198:case 36298:case 36306:case 35682:return Om;case 35679:case 36299:case 36307:return km;case 35680:case 36300:case 36308:case 36293:return Bm;case 36289:case 36303:case 36311:case 36292:return zm}}function Vm(i,t){i.uniform1fv(this.addr,t)}function Gm(i,t){let e=us(t,this.size,2);i.uniform2fv(this.addr,e)}function Wm(i,t){let e=us(t,this.size,3);i.uniform3fv(this.addr,e)}function Xm(i,t){let e=us(t,this.size,4);i.uniform4fv(this.addr,e)}function Ym(i,t){let e=us(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function qm(i,t){let e=us(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Zm(i,t){let e=us(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Km(i,t){i.uniform1iv(this.addr,t)}function Jm(i,t){i.uniform2iv(this.addr,t)}function $m(i,t){i.uniform3iv(this.addr,t)}function jm(i,t){i.uniform4iv(this.addr,t)}function Qm(i,t){i.uniform1uiv(this.addr,t)}function tg(i,t){i.uniform2uiv(this.addr,t)}function eg(i,t){i.uniform3uiv(this.addr,t)}function ng(i,t){i.uniform4uiv(this.addr,t)}function ig(i,t,e){let n=this.cache,s=t.length,r=Kr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||fh,r[o])}function sg(i,t,e){let n=this.cache,s=t.length,r=Kr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||mh,r[o])}function rg(i,t,e){let n=this.cache,s=t.length,r=Kr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||gh,r[o])}function ag(i,t,e){let n=this.cache,s=t.length,r=Kr(e,s);Te(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||ph,r[o])}function og(i){switch(i){case 5126:return Vm;case 35664:return Gm;case 35665:return Wm;case 35666:return Xm;case 35674:return Ym;case 35675:return qm;case 35676:return Zm;case 5124:case 35670:return Km;case 35667:case 35671:return Jm;case 35668:case 35672:return $m;case 35669:case 35673:return jm;case 5125:return Qm;case 36294:return tg;case 36295:return eg;case 36296:return ng;case 35678:case 36198:case 36298:case 36306:case 35682:return ig;case 35679:case 36299:case 36307:return sg;case 35680:case 36300:case 36308:case 36293:return rg;case 36289:case 36303:case 36311:case 36292:return ag}}var No=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Hm(e.type)}},Fo=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=og(e.type)}},Oo=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},Ha=/(\w+)(\])?(\[|\.)?/g;function Pc(i,t){i.seq.push(t),i.map[t.id]=t}function lg(i,t,e){let n=i.name,s=n.length;for(Ha.lastIndex=0;;){let r=Ha.exec(n),o=Ha.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Pc(e,c===void 0?new No(a,i,t):new Fo(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new Oo(a),Pc(e,u)),e=u}}}var $i=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);lg(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function Ic(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var cg=37297,hg=0;function ug(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}var Lc=new Wt;function dg(i){Qt._getMatrix(Lc,Qt.workingColorSpace,i);let t=`mat3( ${Lc.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(i)){case Zr:return[t,"LinearTransferOETF"];case le:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Dc(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+ug(i.getShaderSource(t),o)}else return s}function fg(i,t){let e=dg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function pg(i,t){let e;switch(t){case Su:e="Linear";break;case Eu:e="Reinhard";break;case wu:e="Cineon";break;case Tu:e="ACESFilmic";break;case Cu:e="AgX";break;case Ru:e="Neutral";break;case Au:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var yr=new z;function mg(){Qt.getLuminanceCoefficients(yr);let i=yr.x.toFixed(4),t=yr.y.toFixed(4),e=yr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function gg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ts).join(`
`)}function yg(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function _g(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ts(i){return i!==""}function Uc(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Nc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var xg=/^[ \t]*#include +<([\w\d./]+)>/gm;function ko(i){return i.replace(xg,Mg)}var vg=new Map;function Mg(i,t){let e=Zt[t];if(e===void 0){let n=vg.get(t);if(n!==void 0)e=Zt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ko(e)}var bg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fc(i){return i.replace(bg,Sg)}function Sg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Oc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Eg(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Zc?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===nu?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Nn&&(t="SHADOWMAP_TYPE_VSM"),t}function wg(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Qi:case ts:t="ENVMAP_TYPE_CUBE";break;case qr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Tg(i){let t="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===ts&&(t="ENVMAP_MODE_REFRACTION"),t}function Ag(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case al:t="ENVMAP_BLENDING_MULTIPLY";break;case Mu:t="ENVMAP_BLENDING_MIX";break;case bu:t="ENVMAP_BLENDING_ADD";break}return t}function Cg(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Rg(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=Eg(e),c=wg(e),h=Tg(e),u=Ag(e),f=Cg(e),d=gg(e),y=yg(r),m=s.createProgram(),g,p,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y].filter(Ts).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y].filter(Ts).join(`
`),p.length>0&&(p+=`
`)):(g=[Oc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ts).join(`
`),p=[Oc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ti?"#define TONE_MAPPING":"",e.toneMapping!==ti?Zt.tonemapping_pars_fragment:"",e.toneMapping!==ti?pg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Zt.colorspace_pars_fragment,fg("linearToOutputTexel",e.outputColorSpace),mg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ts).join(`
`)),o=ko(o),o=Uc(o,e),o=Nc(o,e),a=ko(a),a=Uc(a,e),a=Nc(a,e),o=Fc(o),a=Fc(a),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===Jl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Jl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let b=M+g+o,x=M+p+a,_=Ic(s,s.VERTEX_SHADER,b),w=Ic(s,s.FRAGMENT_SHADER,x);s.attachShader(m,_),s.attachShader(m,w),e.index0AttributeName!==void 0?s.bindAttribLocation(m,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function C(A){if(i.debug.checkShaderErrors){let L=s.getProgramInfoLog(m).trim(),I=s.getShaderInfoLog(_).trim(),D=s.getShaderInfoLog(w).trim(),H=!0,k=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,m,_,w);else{let Y=Dc(s,_,"vertex"),B=Dc(s,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Material Name: `+A.name+`
Material Type: `+A.type+`

Program Info Log: `+L+`
`+Y+`
`+B)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(I===""||D==="")&&(k=!1);k&&(A.diagnostics={runnable:H,programLog:L,vertexShader:{log:I,prefix:g},fragmentShader:{log:D,prefix:p}})}s.deleteShader(_),s.deleteShader(w),P=new $i(s,m),E=_g(s,m)}let P;this.getUniforms=function(){return P===void 0&&C(this),P};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(m,cg)),v},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=hg++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=_,this.fragmentShader=w,this}var Pg=0,Bo=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new zo(t),e.set(t,n)),n}},zo=class{constructor(t){this.id=Pg++,this.code=t,this.usedTimes=0}};function Ig(i,t,e,n,s,r,o){let a=new Ls,l=new Bo,c=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,d=s.precision,y={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(E){return c.add(E),E===0?"uv":`uv${E}`}function g(E,v,A,L,I){let D=L.fog,H=I.geometry,k=E.isMeshStandardMaterial?L.environment:null,Y=(E.isMeshStandardMaterial?e:t).get(E.envMap||k),B=Y&&Y.mapping===qr?Y.image.height:null,nt=y[E.type];E.precision!==null&&(d=s.getMaxPrecision(E.precision),d!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",d,"instead."));let rt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,at=rt!==void 0?rt.length:0,Pt=0;H.morphAttributes.position!==void 0&&(Pt=1),H.morphAttributes.normal!==void 0&&(Pt=2),H.morphAttributes.color!==void 0&&(Pt=3);let Yt,J,Q,vt;if(nt){let oe=Sn[nt];Yt=oe.vertexShader,J=oe.fragmentShader}else Yt=E.vertexShader,J=E.fragmentShader,l.update(E),Q=l.getVertexShaderID(E),vt=l.getFragmentShaderID(E);let ct=i.getRenderTarget(),It=i.state.buffers.depth.getReversed(),Ut=I.isInstancedMesh===!0,kt=I.isBatchedMesh===!0,Jt=!!E.map,qt=!!E.matcap,he=!!Y,N=!!E.aoMap,Ee=!!E.lightMap,Bt=!!E.bumpMap,zt=!!E.normalMap,Ct=!!E.displacementMap,$t=!!E.emissiveMap,St=!!E.metalnessMap,R=!!E.roughnessMap,S=E.anisotropy>0,V=E.clearcoat>0,$=E.dispersion>0,et=E.iridescence>0,X=E.sheen>0,dt=E.transmission>0,it=S&&!!E.anisotropyMap,ft=V&&!!E.clearcoatMap,Ht=V&&!!E.clearcoatNormalMap,st=V&&!!E.clearcoatRoughnessMap,xt=et&&!!E.iridescenceMap,Lt=et&&!!E.iridescenceThicknessMap,bt=X&&!!E.sheenColorMap,Mt=X&&!!E.sheenRoughnessMap,Kt=!!E.specularMap,Ot=!!E.specularColorMap,jt=!!E.specularIntensityMap,U=dt&&!!E.transmissionMap,pt=dt&&!!E.thicknessMap,Z=!!E.gradientMap,tt=!!E.alphaMap,_t=E.alphaTest>0,mt=!!E.alphaHash,Vt=!!E.extensions,ve=ti;E.toneMapped&&(ct===null||ct.isXRRenderTarget===!0)&&(ve=i.toneMapping);let Le={shaderID:nt,shaderType:E.type,shaderName:E.name,vertexShader:Yt,fragmentShader:J,defines:E.defines,customVertexShaderID:Q,customFragmentShaderID:vt,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:d,batching:kt,batchingColor:kt&&I._colorsTexture!==null,instancing:Ut,instancingColor:Ut&&I.instanceColor!==null,instancingMorph:Ut&&I.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:ct===null?i.outputColorSpace:ct.isXRRenderTarget===!0?ct.texture.colorSpace:ls,alphaToCoverage:!!E.alphaToCoverage,map:Jt,matcap:qt,envMap:he,envMapMode:he&&Y.mapping,envMapCubeUVHeight:B,aoMap:N,lightMap:Ee,bumpMap:Bt,normalMap:zt,displacementMap:f&&Ct,emissiveMap:$t,normalMapObjectSpace:zt&&E.normalMapType===Du,normalMapTangentSpace:zt&&E.normalMapType===ah,metalnessMap:St,roughnessMap:R,anisotropy:S,anisotropyMap:it,clearcoat:V,clearcoatMap:ft,clearcoatNormalMap:Ht,clearcoatRoughnessMap:st,dispersion:$,iridescence:et,iridescenceMap:xt,iridescenceThicknessMap:Lt,sheen:X,sheenColorMap:bt,sheenRoughnessMap:Mt,specularMap:Kt,specularColorMap:Ot,specularIntensityMap:jt,transmission:dt,transmissionMap:U,thicknessMap:pt,gradientMap:Z,opaque:E.transparent===!1&&E.blending===Zi&&E.alphaToCoverage===!1,alphaMap:tt,alphaTest:_t,alphaHash:mt,combine:E.combine,mapUv:Jt&&m(E.map.channel),aoMapUv:N&&m(E.aoMap.channel),lightMapUv:Ee&&m(E.lightMap.channel),bumpMapUv:Bt&&m(E.bumpMap.channel),normalMapUv:zt&&m(E.normalMap.channel),displacementMapUv:Ct&&m(E.displacementMap.channel),emissiveMapUv:$t&&m(E.emissiveMap.channel),metalnessMapUv:St&&m(E.metalnessMap.channel),roughnessMapUv:R&&m(E.roughnessMap.channel),anisotropyMapUv:it&&m(E.anisotropyMap.channel),clearcoatMapUv:ft&&m(E.clearcoatMap.channel),clearcoatNormalMapUv:Ht&&m(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:st&&m(E.clearcoatRoughnessMap.channel),iridescenceMapUv:xt&&m(E.iridescenceMap.channel),iridescenceThicknessMapUv:Lt&&m(E.iridescenceThicknessMap.channel),sheenColorMapUv:bt&&m(E.sheenColorMap.channel),sheenRoughnessMapUv:Mt&&m(E.sheenRoughnessMap.channel),specularMapUv:Kt&&m(E.specularMap.channel),specularColorMapUv:Ot&&m(E.specularColorMap.channel),specularIntensityMapUv:jt&&m(E.specularIntensityMap.channel),transmissionMapUv:U&&m(E.transmissionMap.channel),thicknessMapUv:pt&&m(E.thicknessMap.channel),alphaMapUv:tt&&m(E.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(zt||S),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!H.attributes.uv&&(Jt||tt),fog:!!D,useFog:E.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:E.flatShading===!0,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:It,skinning:I.isSkinnedMesh===!0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:at,morphTextureStride:Pt,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:i.shadowMap.enabled&&A.length>0,shadowMapType:i.shadowMap.type,toneMapping:ve,decodeVideoTexture:Jt&&E.map.isVideoTexture===!0&&Qt.getTransfer(E.map.colorSpace)===le,decodeVideoTextureEmissive:$t&&E.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(E.emissiveMap.colorSpace)===le,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Pe,flipSided:E.side===Ye,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Vt&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Vt&&E.extensions.multiDraw===!0||kt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Le.vertexUv1s=c.has(1),Le.vertexUv2s=c.has(2),Le.vertexUv3s=c.has(3),c.clear(),Le}function p(E){let v=[];if(E.shaderID?v.push(E.shaderID):(v.push(E.customVertexShaderID),v.push(E.customFragmentShaderID)),E.defines!==void 0)for(let A in E.defines)v.push(A),v.push(E.defines[A]);return E.isRawShaderMaterial===!1&&(M(v,E),b(v,E),v.push(i.outputColorSpace)),v.push(E.customProgramCacheKey),v.join()}function M(E,v){E.push(v.precision),E.push(v.outputColorSpace),E.push(v.envMapMode),E.push(v.envMapCubeUVHeight),E.push(v.mapUv),E.push(v.alphaMapUv),E.push(v.lightMapUv),E.push(v.aoMapUv),E.push(v.bumpMapUv),E.push(v.normalMapUv),E.push(v.displacementMapUv),E.push(v.emissiveMapUv),E.push(v.metalnessMapUv),E.push(v.roughnessMapUv),E.push(v.anisotropyMapUv),E.push(v.clearcoatMapUv),E.push(v.clearcoatNormalMapUv),E.push(v.clearcoatRoughnessMapUv),E.push(v.iridescenceMapUv),E.push(v.iridescenceThicknessMapUv),E.push(v.sheenColorMapUv),E.push(v.sheenRoughnessMapUv),E.push(v.specularMapUv),E.push(v.specularColorMapUv),E.push(v.specularIntensityMapUv),E.push(v.transmissionMapUv),E.push(v.thicknessMapUv),E.push(v.combine),E.push(v.fogExp2),E.push(v.sizeAttenuation),E.push(v.morphTargetsCount),E.push(v.morphAttributeCount),E.push(v.numDirLights),E.push(v.numPointLights),E.push(v.numSpotLights),E.push(v.numSpotLightMaps),E.push(v.numHemiLights),E.push(v.numRectAreaLights),E.push(v.numDirLightShadows),E.push(v.numPointLightShadows),E.push(v.numSpotLightShadows),E.push(v.numSpotLightShadowsWithMaps),E.push(v.numLightProbes),E.push(v.shadowMapType),E.push(v.toneMapping),E.push(v.numClippingPlanes),E.push(v.numClipIntersection),E.push(v.depthPacking)}function b(E,v){a.disableAll(),v.supportsVertexTextures&&a.enable(0),v.instancing&&a.enable(1),v.instancingColor&&a.enable(2),v.instancingMorph&&a.enable(3),v.matcap&&a.enable(4),v.envMap&&a.enable(5),v.normalMapObjectSpace&&a.enable(6),v.normalMapTangentSpace&&a.enable(7),v.clearcoat&&a.enable(8),v.iridescence&&a.enable(9),v.alphaTest&&a.enable(10),v.vertexColors&&a.enable(11),v.vertexAlphas&&a.enable(12),v.vertexUv1s&&a.enable(13),v.vertexUv2s&&a.enable(14),v.vertexUv3s&&a.enable(15),v.vertexTangents&&a.enable(16),v.anisotropy&&a.enable(17),v.alphaHash&&a.enable(18),v.batching&&a.enable(19),v.dispersion&&a.enable(20),v.batchingColor&&a.enable(21),E.push(a.mask),a.disableAll(),v.fog&&a.enable(0),v.useFog&&a.enable(1),v.flatShading&&a.enable(2),v.logarithmicDepthBuffer&&a.enable(3),v.reverseDepthBuffer&&a.enable(4),v.skinning&&a.enable(5),v.morphTargets&&a.enable(6),v.morphNormals&&a.enable(7),v.morphColors&&a.enable(8),v.premultipliedAlpha&&a.enable(9),v.shadowMapEnabled&&a.enable(10),v.doubleSided&&a.enable(11),v.flipSided&&a.enable(12),v.useDepthPacking&&a.enable(13),v.dithering&&a.enable(14),v.transmission&&a.enable(15),v.sheen&&a.enable(16),v.opaque&&a.enable(17),v.pointsUvs&&a.enable(18),v.decodeVideoTexture&&a.enable(19),v.decodeVideoTextureEmissive&&a.enable(20),v.alphaToCoverage&&a.enable(21),E.push(a.mask)}function x(E){let v=y[E.type],A;if(v){let L=Sn[v];A=vd.clone(L.uniforms)}else A=E.uniforms;return A}function _(E,v){let A;for(let L=0,I=h.length;L<I;L++){let D=h[L];if(D.cacheKey===v){A=D,++A.usedTimes;break}}return A===void 0&&(A=new Rg(i,v,E,r),h.push(A)),A}function w(E){if(--E.usedTimes===0){let v=h.indexOf(E);h[v]=h[h.length-1],h.pop(),E.destroy()}}function C(E){l.remove(E)}function P(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:x,acquireProgram:_,releaseProgram:w,releaseShaderCache:C,programs:h,dispose:P}}function Lg(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Dg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function kc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Bc(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,f,d,y,m,g){let p=i[t];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:y,renderOrder:u.renderOrder,z:m,group:g},i[t]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=y,p.renderOrder=u.renderOrder,p.z=m,p.group=g),t++,p}function a(u,f,d,y,m,g){let p=o(u,f,d,y,m,g);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):e.push(p)}function l(u,f,d,y,m,g){let p=o(u,f,d,y,m,g);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):e.unshift(p)}function c(u,f){e.length>1&&e.sort(u||Dg),n.length>1&&n.sort(f||kc),s.length>1&&s.sort(f||kc)}function h(){for(let u=t,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function Ug(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new Bc,i.set(n,[o])):s>=r.length?(o=new Bc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Ng(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new z,color:new At};break;case"SpotLight":e={position:new z,direction:new z,color:new At,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new z,color:new At,distance:0,decay:0};break;case"HemisphereLight":e={direction:new z,skyColor:new At,groundColor:new At};break;case"RectAreaLight":e={color:new At,position:new z,halfWidth:new z,halfHeight:new z};break}return i[t.id]=e,e}}}function Fg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Dt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Dt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Dt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Og=0;function kg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Bg(i){let t=new Ng,e=Fg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);let s=new z,r=new me,o=new me;function a(c){let h=0,u=0,f=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let d=0,y=0,m=0,g=0,p=0,M=0,b=0,x=0,_=0,w=0,C=0;c.sort(kg);for(let E=0,v=c.length;E<v;E++){let A=c[E],L=A.color,I=A.intensity,D=A.distance,H=A.shadow&&A.shadow.map?A.shadow.map.texture:null;if(A.isAmbientLight)h+=L.r*I,u+=L.g*I,f+=L.b*I;else if(A.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(A.sh.coefficients[k],I);C++}else if(A.isDirectionalLight){let k=t.get(A);if(k.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){let Y=A.shadow,B=e.get(A);B.shadowIntensity=Y.intensity,B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,n.directionalShadow[d]=B,n.directionalShadowMap[d]=H,n.directionalShadowMatrix[d]=A.shadow.matrix,M++}n.directional[d]=k,d++}else if(A.isSpotLight){let k=t.get(A);k.position.setFromMatrixPosition(A.matrixWorld),k.color.copy(L).multiplyScalar(I),k.distance=D,k.coneCos=Math.cos(A.angle),k.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),k.decay=A.decay,n.spot[m]=k;let Y=A.shadow;if(A.map&&(n.spotLightMap[_]=A.map,_++,Y.updateMatrices(A),A.castShadow&&w++),n.spotLightMatrix[m]=Y.matrix,A.castShadow){let B=e.get(A);B.shadowIntensity=Y.intensity,B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,n.spotShadow[m]=B,n.spotShadowMap[m]=H,x++}m++}else if(A.isRectAreaLight){let k=t.get(A);k.color.copy(L).multiplyScalar(I),k.halfWidth.set(A.width*.5,0,0),k.halfHeight.set(0,A.height*.5,0),n.rectArea[g]=k,g++}else if(A.isPointLight){let k=t.get(A);if(k.color.copy(A.color).multiplyScalar(A.intensity),k.distance=A.distance,k.decay=A.decay,A.castShadow){let Y=A.shadow,B=e.get(A);B.shadowIntensity=Y.intensity,B.shadowBias=Y.bias,B.shadowNormalBias=Y.normalBias,B.shadowRadius=Y.radius,B.shadowMapSize=Y.mapSize,B.shadowCameraNear=Y.camera.near,B.shadowCameraFar=Y.camera.far,n.pointShadow[y]=B,n.pointShadowMap[y]=H,n.pointShadowMatrix[y]=A.shadow.matrix,b++}n.point[y]=k,y++}else if(A.isHemisphereLight){let k=t.get(A);k.skyColor.copy(A.color).multiplyScalar(I),k.groundColor.copy(A.groundColor).multiplyScalar(I),n.hemi[p]=k,p++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ht.LTC_FLOAT_1,n.rectAreaLTC2=ht.LTC_FLOAT_2):(n.rectAreaLTC1=ht.LTC_HALF_1,n.rectAreaLTC2=ht.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let P=n.hash;(P.directionalLength!==d||P.pointLength!==y||P.spotLength!==m||P.rectAreaLength!==g||P.hemiLength!==p||P.numDirectionalShadows!==M||P.numPointShadows!==b||P.numSpotShadows!==x||P.numSpotMaps!==_||P.numLightProbes!==C)&&(n.directional.length=d,n.spot.length=m,n.rectArea.length=g,n.point.length=y,n.hemi.length=p,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=b,n.pointShadowMap.length=b,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=b,n.spotLightMatrix.length=x+_-w,n.spotLightMap.length=_,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=C,P.directionalLength=d,P.pointLength=y,P.spotLength=m,P.rectAreaLength=g,P.hemiLength=p,P.numDirectionalShadows=M,P.numPointShadows=b,P.numSpotShadows=x,P.numSpotMaps=_,P.numLightProbes=C,n.version=Og++)}function l(c,h){let u=0,f=0,d=0,y=0,m=0,g=h.matrixWorldInverse;for(let p=0,M=c.length;p<M;p++){let b=c[p];if(b.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),u++}else if(b.isSpotLight){let x=n.spot[d];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),d++}else if(b.isRectAreaLight){let x=n.rectArea[y];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(g),o.identity(),r.copy(b.matrixWorld),r.premultiply(g),o.extractRotation(r),x.halfWidth.set(b.width*.5,0,0),x.halfHeight.set(0,b.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),y++}else if(b.isPointLight){let x=n.point[f];x.position.setFromMatrixPosition(b.matrixWorld),x.position.applyMatrix4(g),f++}else if(b.isHemisphereLight){let x=n.hemi[m];x.direction.setFromMatrixPosition(b.matrixWorld),x.direction.transformDirection(g),m++}}}return{setup:a,setupView:l,state:n}}function zc(i){let t=new Bg(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function zg(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new zc(i),t.set(s,[a])):r>=o.length?(a=new zc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var Ho=class extends ni{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Iu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Vo=class extends ni{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Hg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Vg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Gg(i,t,e){let n=new Ds,s=new Dt,r=new Dt,o=new Me,a=new Ho({depthPacking:Lu}),l=new Vo,c={},h=e.maxTextureSize,u={[ei]:Ye,[Ye]:ei,[Pe]:Pe},f=new je({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Dt},radius:{value:4}},vertexShader:Hg,fragmentShader:Vg}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let y=new be;y.setAttribute("position",new re(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let m=new ye(y,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Zc;let p=this.type;this.render=function(w,C,P){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;let E=i.getRenderTarget(),v=i.getActiveCubeFace(),A=i.getActiveMipmapLevel(),L=i.state;L.setBlending(Qn),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let I=p!==Nn&&this.type===Nn,D=p===Nn&&this.type!==Nn;for(let H=0,k=w.length;H<k;H++){let Y=w[H],B=Y.shadow;if(B===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(B.autoUpdate===!1&&B.needsUpdate===!1)continue;s.copy(B.mapSize);let nt=B.getFrameExtents();if(s.multiply(nt),r.copy(B.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/nt.x),s.x=r.x*nt.x,B.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/nt.y),s.y=r.y*nt.y,B.mapSize.y=r.y)),B.map===null||I===!0||D===!0){let at=this.type!==Nn?{minFilter:pn,magFilter:pn}:{};B.map!==null&&B.map.dispose(),B.map=new Hn(s.x,s.y,at),B.map.texture.name=Y.name+".shadowMap",B.camera.updateProjectionMatrix()}i.setRenderTarget(B.map),i.clear();let rt=B.getViewportCount();for(let at=0;at<rt;at++){let Pt=B.getViewport(at);o.set(r.x*Pt.x,r.y*Pt.y,r.x*Pt.z,r.y*Pt.w),L.viewport(o),B.updateMatrices(Y,at),n=B.getFrustum(),x(C,P,B.camera,Y,this.type)}B.isPointLightShadow!==!0&&this.type===Nn&&M(B,P),B.needsUpdate=!1}p=this.type,g.needsUpdate=!1,i.setRenderTarget(E,v,A)};function M(w,C){let P=t.update(m);f.defines.VSM_SAMPLES!==w.blurSamples&&(f.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Hn(s.x,s.y)),f.uniforms.shadow_pass.value=w.map.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(C,null,P,f,m,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(C,null,P,d,m,null)}function b(w,C,P,E){let v=null,A=P.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(A!==void 0)v=A;else if(v=P.isPointLight===!0?l:a,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let L=v.uuid,I=C.uuid,D=c[L];D===void 0&&(D={},c[L]=D);let H=D[I];H===void 0&&(H=v.clone(),D[I]=H,C.addEventListener("dispose",_)),v=H}if(v.visible=C.visible,v.wireframe=C.wireframe,E===Nn?v.side=C.shadowSide!==null?C.shadowSide:C.side:v.side=C.shadowSide!==null?C.shadowSide:u[C.side],v.alphaMap=C.alphaMap,v.alphaTest=C.alphaTest,v.map=C.map,v.clipShadows=C.clipShadows,v.clippingPlanes=C.clippingPlanes,v.clipIntersection=C.clipIntersection,v.displacementMap=C.displacementMap,v.displacementScale=C.displacementScale,v.displacementBias=C.displacementBias,v.wireframeLinewidth=C.wireframeLinewidth,v.linewidth=C.linewidth,P.isPointLight===!0&&v.isMeshDistanceMaterial===!0){let L=i.properties.get(v);L.light=P}return v}function x(w,C,P,E,v){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&v===Nn)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,w.matrixWorld);let I=t.update(w),D=w.material;if(Array.isArray(D)){let H=I.groups;for(let k=0,Y=H.length;k<Y;k++){let B=H[k],nt=D[B.materialIndex];if(nt&&nt.visible){let rt=b(w,nt,E,v);w.onBeforeShadow(i,w,C,P,I,rt,B),i.renderBufferDirect(P,null,I,rt,w,B),w.onAfterShadow(i,w,C,P,I,rt,B)}}}else if(D.visible){let H=b(w,D,E,v);w.onBeforeShadow(i,w,C,P,I,H,null),i.renderBufferDirect(P,null,I,H,w,null),w.onAfterShadow(i,w,C,P,I,H,null)}}let L=w.children;for(let I=0,D=L.length;I<D;I++)x(L[I],C,P,E,v)}function _(w){w.target.removeEventListener("dispose",_);for(let P in c){let E=c[P],v=w.target.uuid;v in E&&(E[v].dispose(),delete E[v])}}}var Wg={[Xa]:Ya,[qa]:Ja,[Za]:$a,[ji]:Ka,[Ya]:Xa,[Ja]:qa,[$a]:Za,[Ka]:ji};function Xg(i,t){function e(){let U=!1,pt=new Me,Z=null,tt=new Me(0,0,0,0);return{setMask:function(_t){Z!==_t&&!U&&(i.colorMask(_t,_t,_t,_t),Z=_t)},setLocked:function(_t){U=_t},setClear:function(_t,mt,Vt,ve,Le){Le===!0&&(_t*=ve,mt*=ve,Vt*=ve),pt.set(_t,mt,Vt,ve),tt.equals(pt)===!1&&(i.clearColor(_t,mt,Vt,ve),tt.copy(pt))},reset:function(){U=!1,Z=null,tt.set(-1,0,0,0)}}}function n(){let U=!1,pt=!1,Z=null,tt=null,_t=null;return{setReversed:function(mt){if(pt!==mt){let Vt=t.get("EXT_clip_control");pt?Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.ZERO_TO_ONE_EXT):Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.NEGATIVE_ONE_TO_ONE_EXT);let ve=_t;_t=null,this.setClear(ve)}pt=mt},getReversed:function(){return pt},setTest:function(mt){mt?ct(i.DEPTH_TEST):It(i.DEPTH_TEST)},setMask:function(mt){Z!==mt&&!U&&(i.depthMask(mt),Z=mt)},setFunc:function(mt){if(pt&&(mt=Wg[mt]),tt!==mt){switch(mt){case Xa:i.depthFunc(i.NEVER);break;case Ya:i.depthFunc(i.ALWAYS);break;case qa:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case Za:i.depthFunc(i.EQUAL);break;case Ka:i.depthFunc(i.GEQUAL);break;case Ja:i.depthFunc(i.GREATER);break;case $a:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}tt=mt}},setLocked:function(mt){U=mt},setClear:function(mt){_t!==mt&&(pt&&(mt=1-mt),i.clearDepth(mt),_t=mt)},reset:function(){U=!1,Z=null,tt=null,_t=null,pt=!1}}}function s(){let U=!1,pt=null,Z=null,tt=null,_t=null,mt=null,Vt=null,ve=null,Le=null;return{setTest:function(oe){U||(oe?ct(i.STENCIL_TEST):It(i.STENCIL_TEST))},setMask:function(oe){pt!==oe&&!U&&(i.stencilMask(oe),pt=oe)},setFunc:function(oe,on,An){(Z!==oe||tt!==on||_t!==An)&&(i.stencilFunc(oe,on,An),Z=oe,tt=on,_t=An)},setOp:function(oe,on,An){(mt!==oe||Vt!==on||ve!==An)&&(i.stencilOp(oe,on,An),mt=oe,Vt=on,ve=An)},setLocked:function(oe){U=oe},setClear:function(oe){Le!==oe&&(i.clearStencil(oe),Le=oe)},reset:function(){U=!1,pt=null,Z=null,tt=null,_t=null,mt=null,Vt=null,ve=null,Le=null}}}let r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},f=new WeakMap,d=[],y=null,m=!1,g=null,p=null,M=null,b=null,x=null,_=null,w=null,C=new At(0,0,0),P=0,E=!1,v=null,A=null,L=null,I=null,D=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),k=!1,Y=0,B=i.getParameter(i.VERSION);B.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(B)[1]),k=Y>=1):B.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(B)[1]),k=Y>=2);let nt=null,rt={},at=i.getParameter(i.SCISSOR_BOX),Pt=i.getParameter(i.VIEWPORT),Yt=new Me().fromArray(at),J=new Me().fromArray(Pt);function Q(U,pt,Z,tt){let _t=new Uint8Array(4),mt=i.createTexture();i.bindTexture(U,mt),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Vt=0;Vt<Z;Vt++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(pt,0,i.RGBA,1,1,tt,0,i.RGBA,i.UNSIGNED_BYTE,_t):i.texImage2D(pt+Vt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,_t);return mt}let vt={};vt[i.TEXTURE_2D]=Q(i.TEXTURE_2D,i.TEXTURE_2D,1),vt[i.TEXTURE_CUBE_MAP]=Q(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),vt[i.TEXTURE_2D_ARRAY]=Q(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),vt[i.TEXTURE_3D]=Q(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ct(i.DEPTH_TEST),o.setFunc(ji),Bt(!1),zt(Hl),ct(i.CULL_FACE),N(Qn);function ct(U){h[U]!==!0&&(i.enable(U),h[U]=!0)}function It(U){h[U]!==!1&&(i.disable(U),h[U]=!1)}function Ut(U,pt){return u[U]!==pt?(i.bindFramebuffer(U,pt),u[U]=pt,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=pt),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=pt),!0):!1}function kt(U,pt){let Z=d,tt=!1;if(U){Z=f.get(pt),Z===void 0&&(Z=[],f.set(pt,Z));let _t=U.textures;if(Z.length!==_t.length||Z[0]!==i.COLOR_ATTACHMENT0){for(let mt=0,Vt=_t.length;mt<Vt;mt++)Z[mt]=i.COLOR_ATTACHMENT0+mt;Z.length=_t.length,tt=!0}}else Z[0]!==i.BACK&&(Z[0]=i.BACK,tt=!0);tt&&i.drawBuffers(Z)}function Jt(U){return y!==U?(i.useProgram(U),y=U,!0):!1}let qt={[di]:i.FUNC_ADD,[su]:i.FUNC_SUBTRACT,[ru]:i.FUNC_REVERSE_SUBTRACT};qt[au]=i.MIN,qt[ou]=i.MAX;let he={[lu]:i.ZERO,[cu]:i.ONE,[hu]:i.SRC_COLOR,[Ga]:i.SRC_ALPHA,[gu]:i.SRC_ALPHA_SATURATE,[pu]:i.DST_COLOR,[du]:i.DST_ALPHA,[uu]:i.ONE_MINUS_SRC_COLOR,[Wa]:i.ONE_MINUS_SRC_ALPHA,[mu]:i.ONE_MINUS_DST_COLOR,[fu]:i.ONE_MINUS_DST_ALPHA,[yu]:i.CONSTANT_COLOR,[_u]:i.ONE_MINUS_CONSTANT_COLOR,[xu]:i.CONSTANT_ALPHA,[vu]:i.ONE_MINUS_CONSTANT_ALPHA};function N(U,pt,Z,tt,_t,mt,Vt,ve,Le,oe){if(U===Qn){m===!0&&(It(i.BLEND),m=!1);return}if(m===!1&&(ct(i.BLEND),m=!0),U!==iu){if(U!==g||oe!==E){if((p!==di||x!==di)&&(i.blendEquation(i.FUNC_ADD),p=di,x=di),oe)switch(U){case Zi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Vl:i.blendFunc(i.ONE,i.ONE);break;case Gl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Wl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case Zi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Vl:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Gl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Wl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}M=null,b=null,_=null,w=null,C.set(0,0,0),P=0,g=U,E=oe}return}_t=_t||pt,mt=mt||Z,Vt=Vt||tt,(pt!==p||_t!==x)&&(i.blendEquationSeparate(qt[pt],qt[_t]),p=pt,x=_t),(Z!==M||tt!==b||mt!==_||Vt!==w)&&(i.blendFuncSeparate(he[Z],he[tt],he[mt],he[Vt]),M=Z,b=tt,_=mt,w=Vt),(ve.equals(C)===!1||Le!==P)&&(i.blendColor(ve.r,ve.g,ve.b,Le),C.copy(ve),P=Le),g=U,E=!1}function Ee(U,pt){U.side===Pe?It(i.CULL_FACE):ct(i.CULL_FACE);let Z=U.side===Ye;pt&&(Z=!Z),Bt(Z),U.blending===Zi&&U.transparent===!1?N(Qn):N(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let tt=U.stencilWrite;a.setTest(tt),tt&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),$t(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?ct(i.SAMPLE_ALPHA_TO_COVERAGE):It(i.SAMPLE_ALPHA_TO_COVERAGE)}function Bt(U){v!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),v=U)}function zt(U){U!==tu?(ct(i.CULL_FACE),U!==A&&(U===Hl?i.cullFace(i.BACK):U===eu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):It(i.CULL_FACE),A=U}function Ct(U){U!==L&&(k&&i.lineWidth(U),L=U)}function $t(U,pt,Z){U?(ct(i.POLYGON_OFFSET_FILL),(I!==pt||D!==Z)&&(i.polygonOffset(pt,Z),I=pt,D=Z)):It(i.POLYGON_OFFSET_FILL)}function St(U){U?ct(i.SCISSOR_TEST):It(i.SCISSOR_TEST)}function R(U){U===void 0&&(U=i.TEXTURE0+H-1),nt!==U&&(i.activeTexture(U),nt=U)}function S(U,pt,Z){Z===void 0&&(nt===null?Z=i.TEXTURE0+H-1:Z=nt);let tt=rt[Z];tt===void 0&&(tt={type:void 0,texture:void 0},rt[Z]=tt),(tt.type!==U||tt.texture!==pt)&&(nt!==Z&&(i.activeTexture(Z),nt=Z),i.bindTexture(U,pt||vt[U]),tt.type=U,tt.texture=pt)}function V(){let U=rt[nt];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function $(){try{i.compressedTexImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function et(){try{i.compressedTexImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function X(){try{i.texSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function dt(){try{i.texSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function it(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ft(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ht(){try{i.texStorage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function st(){try{i.texStorage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function xt(){try{i.texImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Lt(){try{i.texImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function bt(U){Yt.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),Yt.copy(U))}function Mt(U){J.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),J.copy(U))}function Kt(U,pt){let Z=c.get(pt);Z===void 0&&(Z=new WeakMap,c.set(pt,Z));let tt=Z.get(U);tt===void 0&&(tt=i.getUniformBlockIndex(pt,U.name),Z.set(U,tt))}function Ot(U,pt){let tt=c.get(pt).get(U);l.get(pt)!==tt&&(i.uniformBlockBinding(pt,tt,U.__bindingPointIndex),l.set(pt,tt))}function jt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},nt=null,rt={},u={},f=new WeakMap,d=[],y=null,m=!1,g=null,p=null,M=null,b=null,x=null,_=null,w=null,C=new At(0,0,0),P=0,E=!1,v=null,A=null,L=null,I=null,D=null,Yt.set(0,0,i.canvas.width,i.canvas.height),J.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ct,disable:It,bindFramebuffer:Ut,drawBuffers:kt,useProgram:Jt,setBlending:N,setMaterial:Ee,setFlipSided:Bt,setCullFace:zt,setLineWidth:Ct,setPolygonOffset:$t,setScissorTest:St,activeTexture:R,bindTexture:S,unbindTexture:V,compressedTexImage2D:$,compressedTexImage3D:et,texImage2D:xt,texImage3D:Lt,updateUBOMapping:Kt,uniformBlockBinding:Ot,texStorage2D:Ht,texStorage3D:st,texSubImage2D:X,texSubImage3D:dt,compressedTexSubImage2D:it,compressedTexSubImage3D:ft,scissor:bt,viewport:Mt,reset:jt}}function Hc(i,t,e,n){let s=Yg(n);switch(e){case Qc:return i*t;case eh:return i*t;case nh:return i*t*2;case ih:return i*t/s.components*s.byteLength;case hl:return i*t/s.components*s.byteLength;case sh:return i*t*2/s.components*s.byteLength;case ul:return i*t*2/s.components*s.byteLength;case th:return i*t*3/s.components*s.byteLength;case fn:return i*t*4/s.components*s.byteLength;case dl:return i*t*4/s.components*s.byteLength;case Mr:case br:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Sr:case Er:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case io:case ro:return Math.max(i,16)*Math.max(t,8)/4;case no:case so:return Math.max(i,8)*Math.max(t,8)/2;case ao:case oo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case lo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case co:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ho:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case uo:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case fo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case po:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case mo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case go:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case yo:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case _o:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case xo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case vo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Mo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case bo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case So:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case wr:case Eo:case wo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case rh:case To:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ao:case Co:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Yg(i){switch(i){case Bn:case Jc:return{byteLength:1,components:1};case Ps:case $c:case Bs:return{byteLength:2,components:1};case ll:case cl:return{byteLength:2,components:4};case yi:case ol:case Fn:return{byteLength:4,components:1};case jc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function qg(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Dt,h=new WeakMap,u,f=new WeakMap,d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(R,S){return d?new OffscreenCanvas(R,S):Cr("canvas")}function m(R,S,V){let $=1,et=St(R);if((et.width>V||et.height>V)&&($=V/Math.max(et.width,et.height)),$<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let X=Math.floor($*et.width),dt=Math.floor($*et.height);u===void 0&&(u=y(X,dt));let it=S?y(X,dt):u;return it.width=X,it.height=dt,it.getContext("2d").drawImage(R,0,0,X,dt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+X+"x"+dt+")."),it}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),R;return R}function g(R){return R.generateMipmaps}function p(R){i.generateMipmap(R)}function M(R){return R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?i.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function b(R,S,V,$,et=!1){if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let X=S;if(S===i.RED&&(V===i.FLOAT&&(X=i.R32F),V===i.HALF_FLOAT&&(X=i.R16F),V===i.UNSIGNED_BYTE&&(X=i.R8)),S===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(X=i.R8UI),V===i.UNSIGNED_SHORT&&(X=i.R16UI),V===i.UNSIGNED_INT&&(X=i.R32UI),V===i.BYTE&&(X=i.R8I),V===i.SHORT&&(X=i.R16I),V===i.INT&&(X=i.R32I)),S===i.RG&&(V===i.FLOAT&&(X=i.RG32F),V===i.HALF_FLOAT&&(X=i.RG16F),V===i.UNSIGNED_BYTE&&(X=i.RG8)),S===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(X=i.RG8UI),V===i.UNSIGNED_SHORT&&(X=i.RG16UI),V===i.UNSIGNED_INT&&(X=i.RG32UI),V===i.BYTE&&(X=i.RG8I),V===i.SHORT&&(X=i.RG16I),V===i.INT&&(X=i.RG32I)),S===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(X=i.RGB8UI),V===i.UNSIGNED_SHORT&&(X=i.RGB16UI),V===i.UNSIGNED_INT&&(X=i.RGB32UI),V===i.BYTE&&(X=i.RGB8I),V===i.SHORT&&(X=i.RGB16I),V===i.INT&&(X=i.RGB32I)),S===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),V===i.UNSIGNED_INT&&(X=i.RGBA32UI),V===i.BYTE&&(X=i.RGBA8I),V===i.SHORT&&(X=i.RGBA16I),V===i.INT&&(X=i.RGBA32I)),S===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),S===i.RGBA){let dt=et?Zr:Qt.getTransfer($);V===i.FLOAT&&(X=i.RGBA32F),V===i.HALF_FLOAT&&(X=i.RGBA16F),V===i.UNSIGNED_BYTE&&(X=dt===le?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&t.get("EXT_color_buffer_float"),X}function x(R,S){let V;return R?S===null||S===yi||S===es?V=i.DEPTH24_STENCIL8:S===Fn?V=i.DEPTH32F_STENCIL8:S===Ps&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===yi||S===es?V=i.DEPTH_COMPONENT24:S===Fn?V=i.DEPTH_COMPONENT32F:S===Ps&&(V=i.DEPTH_COMPONENT16),V}function _(R,S){return g(R)===!0||R.isFramebufferTexture&&R.minFilter!==pn&&R.minFilter!==En?Math.log2(Math.max(S.width,S.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?S.mipmaps.length:1}function w(R){let S=R.target;S.removeEventListener("dispose",w),P(S),S.isVideoTexture&&h.delete(S)}function C(R){let S=R.target;S.removeEventListener("dispose",C),v(S)}function P(R){let S=n.get(R);if(S.__webglInit===void 0)return;let V=R.source,$=f.get(V);if($){let et=$[S.__cacheKey];et.usedTimes--,et.usedTimes===0&&E(R),Object.keys($).length===0&&f.delete(V)}n.remove(R)}function E(R){let S=n.get(R);i.deleteTexture(S.__webglTexture);let V=R.source,$=f.get(V);delete $[S.__cacheKey],o.memory.textures--}function v(R){let S=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(S.__webglFramebuffer[$]))for(let et=0;et<S.__webglFramebuffer[$].length;et++)i.deleteFramebuffer(S.__webglFramebuffer[$][et]);else i.deleteFramebuffer(S.__webglFramebuffer[$]);S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer[$])}else{if(Array.isArray(S.__webglFramebuffer))for(let $=0;$<S.__webglFramebuffer.length;$++)i.deleteFramebuffer(S.__webglFramebuffer[$]);else i.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&i.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let $=0;$<S.__webglColorRenderbuffer.length;$++)S.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(S.__webglColorRenderbuffer[$]);S.__webglDepthRenderbuffer&&i.deleteRenderbuffer(S.__webglDepthRenderbuffer)}let V=R.textures;for(let $=0,et=V.length;$<et;$++){let X=n.get(V[$]);X.__webglTexture&&(i.deleteTexture(X.__webglTexture),o.memory.textures--),n.remove(V[$])}n.remove(R)}let A=0;function L(){A=0}function I(){let R=A;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),A+=1,R}function D(R){let S=[];return S.push(R.wrapS),S.push(R.wrapT),S.push(R.wrapR||0),S.push(R.magFilter),S.push(R.minFilter),S.push(R.anisotropy),S.push(R.internalFormat),S.push(R.format),S.push(R.type),S.push(R.generateMipmaps),S.push(R.premultiplyAlpha),S.push(R.flipY),S.push(R.unpackAlignment),S.push(R.colorSpace),S.join()}function H(R,S){let V=n.get(R);if(R.isVideoTexture&&Ct(R),R.isRenderTargetTexture===!1&&R.version>0&&V.__version!==R.version){let $=R.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{J(V,R,S);return}}e.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+S)}function k(R,S){let V=n.get(R);if(R.version>0&&V.__version!==R.version){J(V,R,S);return}e.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+S)}function Y(R,S){let V=n.get(R);if(R.version>0&&V.__version!==R.version){J(V,R,S);return}e.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+S)}function B(R,S){let V=n.get(R);if(R.version>0&&V.__version!==R.version){Q(V,R,S);return}e.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+S)}let nt={[to]:i.REPEAT,[mi]:i.CLAMP_TO_EDGE,[eo]:i.MIRRORED_REPEAT},rt={[pn]:i.NEAREST,[Pu]:i.NEAREST_MIPMAP_NEAREST,[$s]:i.NEAREST_MIPMAP_LINEAR,[En]:i.LINEAR,[pa]:i.LINEAR_MIPMAP_NEAREST,[gi]:i.LINEAR_MIPMAP_LINEAR},at={[Uu]:i.NEVER,[zu]:i.ALWAYS,[Nu]:i.LESS,[oh]:i.LEQUAL,[Fu]:i.EQUAL,[Bu]:i.GEQUAL,[Ou]:i.GREATER,[ku]:i.NOTEQUAL};function Pt(R,S){if(S.type===Fn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===En||S.magFilter===pa||S.magFilter===$s||S.magFilter===gi||S.minFilter===En||S.minFilter===pa||S.minFilter===$s||S.minFilter===gi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,nt[S.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,nt[S.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,nt[S.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,rt[S.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,rt[S.minFilter]),S.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,at[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===pn||S.minFilter!==$s&&S.minFilter!==gi||S.type===Fn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){let V=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function Yt(R,S){let V=!1;R.__webglInit===void 0&&(R.__webglInit=!0,S.addEventListener("dispose",w));let $=S.source,et=f.get($);et===void 0&&(et={},f.set($,et));let X=D(S);if(X!==R.__cacheKey){et[X]===void 0&&(et[X]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,V=!0),et[X].usedTimes++;let dt=et[R.__cacheKey];dt!==void 0&&(et[R.__cacheKey].usedTimes--,dt.usedTimes===0&&E(S)),R.__cacheKey=X,R.__webglTexture=et[X].texture}return V}function J(R,S,V){let $=i.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&($=i.TEXTURE_2D_ARRAY),S.isData3DTexture&&($=i.TEXTURE_3D);let et=Yt(R,S),X=S.source;e.bindTexture($,R.__webglTexture,i.TEXTURE0+V);let dt=n.get(X);if(X.version!==dt.__version||et===!0){e.activeTexture(i.TEXTURE0+V);let it=Qt.getPrimaries(Qt.workingColorSpace),ft=S.colorSpace===$n?null:Qt.getPrimaries(S.colorSpace),Ht=S.colorSpace===$n||it===ft?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ht);let st=m(S.image,!1,s.maxTextureSize);st=$t(S,st);let xt=r.convert(S.format,S.colorSpace),Lt=r.convert(S.type),bt=b(S.internalFormat,xt,Lt,S.colorSpace,S.isVideoTexture);Pt($,S);let Mt,Kt=S.mipmaps,Ot=S.isVideoTexture!==!0,jt=dt.__version===void 0||et===!0,U=X.dataReady,pt=_(S,st);if(S.isDepthTexture)bt=x(S.format===ns,S.type),jt&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,bt,st.width,st.height):e.texImage2D(i.TEXTURE_2D,0,bt,st.width,st.height,0,xt,Lt,null));else if(S.isDataTexture)if(Kt.length>0){Ot&&jt&&e.texStorage2D(i.TEXTURE_2D,pt,bt,Kt[0].width,Kt[0].height);for(let Z=0,tt=Kt.length;Z<tt;Z++)Mt=Kt[Z],Ot?U&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,Mt.width,Mt.height,xt,Lt,Mt.data):e.texImage2D(i.TEXTURE_2D,Z,bt,Mt.width,Mt.height,0,xt,Lt,Mt.data);S.generateMipmaps=!1}else Ot?(jt&&e.texStorage2D(i.TEXTURE_2D,pt,bt,st.width,st.height),U&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,st.width,st.height,xt,Lt,st.data)):e.texImage2D(i.TEXTURE_2D,0,bt,st.width,st.height,0,xt,Lt,st.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Ot&&jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,bt,Kt[0].width,Kt[0].height,st.depth);for(let Z=0,tt=Kt.length;Z<tt;Z++)if(Mt=Kt[Z],S.format!==fn)if(xt!==null)if(Ot){if(U)if(S.layerUpdates.size>0){let _t=Hc(Mt.width,Mt.height,S.format,S.type);for(let mt of S.layerUpdates){let Vt=Mt.data.subarray(mt*_t/Mt.data.BYTES_PER_ELEMENT,(mt+1)*_t/Mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,mt,Mt.width,Mt.height,1,xt,Vt)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,0,Mt.width,Mt.height,st.depth,xt,Mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Z,bt,Mt.width,Mt.height,st.depth,0,Mt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?U&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,0,Mt.width,Mt.height,st.depth,xt,Lt,Mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Z,bt,Mt.width,Mt.height,st.depth,0,xt,Lt,Mt.data)}else{Ot&&jt&&e.texStorage2D(i.TEXTURE_2D,pt,bt,Kt[0].width,Kt[0].height);for(let Z=0,tt=Kt.length;Z<tt;Z++)Mt=Kt[Z],S.format!==fn?xt!==null?Ot?U&&e.compressedTexSubImage2D(i.TEXTURE_2D,Z,0,0,Mt.width,Mt.height,xt,Mt.data):e.compressedTexImage2D(i.TEXTURE_2D,Z,bt,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?U&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,Mt.width,Mt.height,xt,Lt,Mt.data):e.texImage2D(i.TEXTURE_2D,Z,bt,Mt.width,Mt.height,0,xt,Lt,Mt.data)}else if(S.isDataArrayTexture)if(Ot){if(jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,bt,st.width,st.height,st.depth),U)if(S.layerUpdates.size>0){let Z=Hc(st.width,st.height,S.format,S.type);for(let tt of S.layerUpdates){let _t=st.data.subarray(tt*Z/st.data.BYTES_PER_ELEMENT,(tt+1)*Z/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,tt,st.width,st.height,1,xt,Lt,_t)}S.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,xt,Lt,st.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,bt,st.width,st.height,st.depth,0,xt,Lt,st.data);else if(S.isData3DTexture)Ot?(jt&&e.texStorage3D(i.TEXTURE_3D,pt,bt,st.width,st.height,st.depth),U&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,xt,Lt,st.data)):e.texImage3D(i.TEXTURE_3D,0,bt,st.width,st.height,st.depth,0,xt,Lt,st.data);else if(S.isFramebufferTexture){if(jt)if(Ot)e.texStorage2D(i.TEXTURE_2D,pt,bt,st.width,st.height);else{let Z=st.width,tt=st.height;for(let _t=0;_t<pt;_t++)e.texImage2D(i.TEXTURE_2D,_t,bt,Z,tt,0,xt,Lt,null),Z>>=1,tt>>=1}}else if(Kt.length>0){if(Ot&&jt){let Z=St(Kt[0]);e.texStorage2D(i.TEXTURE_2D,pt,bt,Z.width,Z.height)}for(let Z=0,tt=Kt.length;Z<tt;Z++)Mt=Kt[Z],Ot?U&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,xt,Lt,Mt):e.texImage2D(i.TEXTURE_2D,Z,bt,xt,Lt,Mt);S.generateMipmaps=!1}else if(Ot){if(jt){let Z=St(st);e.texStorage2D(i.TEXTURE_2D,pt,bt,Z.width,Z.height)}U&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,xt,Lt,st)}else e.texImage2D(i.TEXTURE_2D,0,bt,xt,Lt,st);g(S)&&p($),dt.__version=X.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function Q(R,S,V){if(S.image.length!==6)return;let $=Yt(R,S),et=S.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+V);let X=n.get(et);if(et.version!==X.__version||$===!0){e.activeTexture(i.TEXTURE0+V);let dt=Qt.getPrimaries(Qt.workingColorSpace),it=S.colorSpace===$n?null:Qt.getPrimaries(S.colorSpace),ft=S.colorSpace===$n||dt===it?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ft);let Ht=S.isCompressedTexture||S.image[0].isCompressedTexture,st=S.image[0]&&S.image[0].isDataTexture,xt=[];for(let tt=0;tt<6;tt++)!Ht&&!st?xt[tt]=m(S.image[tt],!0,s.maxCubemapSize):xt[tt]=st?S.image[tt].image:S.image[tt],xt[tt]=$t(S,xt[tt]);let Lt=xt[0],bt=r.convert(S.format,S.colorSpace),Mt=r.convert(S.type),Kt=b(S.internalFormat,bt,Mt,S.colorSpace),Ot=S.isVideoTexture!==!0,jt=X.__version===void 0||$===!0,U=et.dataReady,pt=_(S,Lt);Pt(i.TEXTURE_CUBE_MAP,S);let Z;if(Ht){Ot&&jt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Kt,Lt.width,Lt.height);for(let tt=0;tt<6;tt++){Z=xt[tt].mipmaps;for(let _t=0;_t<Z.length;_t++){let mt=Z[_t];S.format!==fn?bt!==null?Ot?U&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t,0,0,mt.width,mt.height,bt,mt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t,Kt,mt.width,mt.height,0,mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?U&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t,0,0,mt.width,mt.height,bt,Mt,mt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t,Kt,mt.width,mt.height,0,bt,Mt,mt.data)}}}else{if(Z=S.mipmaps,Ot&&jt){Z.length>0&&pt++;let tt=St(xt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Kt,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(st){Ot?U&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,xt[tt].width,xt[tt].height,bt,Mt,xt[tt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Kt,xt[tt].width,xt[tt].height,0,bt,Mt,xt[tt].data);for(let _t=0;_t<Z.length;_t++){let Vt=Z[_t].image[tt].image;Ot?U&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t+1,0,0,Vt.width,Vt.height,bt,Mt,Vt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t+1,Kt,Vt.width,Vt.height,0,bt,Mt,Vt.data)}}else{Ot?U&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,bt,Mt,xt[tt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,Kt,bt,Mt,xt[tt]);for(let _t=0;_t<Z.length;_t++){let mt=Z[_t];Ot?U&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t+1,0,0,bt,Mt,mt.image[tt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,_t+1,Kt,bt,Mt,mt.image[tt])}}}g(S)&&p(i.TEXTURE_CUBE_MAP),X.__version=et.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function vt(R,S,V,$,et,X){let dt=r.convert(V.format,V.colorSpace),it=r.convert(V.type),ft=b(V.internalFormat,dt,it,V.colorSpace),Ht=n.get(S),st=n.get(V);if(st.__renderTarget=S,!Ht.__hasExternalTextures){let xt=Math.max(1,S.width>>X),Lt=Math.max(1,S.height>>X);et===i.TEXTURE_3D||et===i.TEXTURE_2D_ARRAY?e.texImage3D(et,X,ft,xt,Lt,S.depth,0,dt,it,null):e.texImage2D(et,X,ft,xt,Lt,0,dt,it,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),zt(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,$,et,st.__webglTexture,0,Bt(S)):(et===i.TEXTURE_2D||et>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,$,et,st.__webglTexture,X),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ct(R,S,V){if(i.bindRenderbuffer(i.RENDERBUFFER,R),S.depthBuffer){let $=S.depthTexture,et=$&&$.isDepthTexture?$.type:null,X=x(S.stencilBuffer,et),dt=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,it=Bt(S);zt(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,X,S.width,S.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,it,X,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,X,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,dt,i.RENDERBUFFER,R)}else{let $=S.textures;for(let et=0;et<$.length;et++){let X=$[et],dt=r.convert(X.format,X.colorSpace),it=r.convert(X.type),ft=b(X.internalFormat,dt,it,X.colorSpace),Ht=Bt(S);V&&zt(S)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ht,ft,S.width,S.height):zt(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ht,ft,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,ft,S.width,S.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function It(R,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let $=n.get(S.depthTexture);$.__renderTarget=S,(!$.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),H(S.depthTexture,0);let et=$.__webglTexture,X=Bt(S);if(S.depthTexture.format===Ki)zt(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,et,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,et,0);else if(S.depthTexture.format===ns)zt(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,et,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,et,0);else throw new Error("Unknown depthTexture format")}function Ut(R){let S=n.get(R),V=R.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==R.depthTexture){let $=R.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),$){let et=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,$.removeEventListener("dispose",et)};$.addEventListener("dispose",et),S.__depthDisposeCallback=et}S.__boundDepthTexture=$}if(R.depthTexture&&!S.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");It(S.__webglFramebuffer,R)}else if(V){S.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer[$]),S.__webglDepthbuffer[$]===void 0)S.__webglDepthbuffer[$]=i.createRenderbuffer(),ct(S.__webglDepthbuffer[$],R,!1);else{let et=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=S.__webglDepthbuffer[$];i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,et,i.RENDERBUFFER,X)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=i.createRenderbuffer(),ct(S.__webglDepthbuffer,R,!1);else{let $=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=S.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,et)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function kt(R,S,V){let $=n.get(R);S!==void 0&&vt($.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Ut(R)}function Jt(R){let S=R.texture,V=n.get(R),$=n.get(S);R.addEventListener("dispose",C);let et=R.textures,X=R.isWebGLCubeRenderTarget===!0,dt=et.length>1;if(dt||($.__webglTexture===void 0&&($.__webglTexture=i.createTexture()),$.__version=S.version,o.memory.textures++),X){V.__webglFramebuffer=[];for(let it=0;it<6;it++)if(S.mipmaps&&S.mipmaps.length>0){V.__webglFramebuffer[it]=[];for(let ft=0;ft<S.mipmaps.length;ft++)V.__webglFramebuffer[it][ft]=i.createFramebuffer()}else V.__webglFramebuffer[it]=i.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){V.__webglFramebuffer=[];for(let it=0;it<S.mipmaps.length;it++)V.__webglFramebuffer[it]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(dt)for(let it=0,ft=et.length;it<ft;it++){let Ht=n.get(et[it]);Ht.__webglTexture===void 0&&(Ht.__webglTexture=i.createTexture(),o.memory.textures++)}if(R.samples>0&&zt(R)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let it=0;it<et.length;it++){let ft=et[it];V.__webglColorRenderbuffer[it]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[it]);let Ht=r.convert(ft.format,ft.colorSpace),st=r.convert(ft.type),xt=b(ft.internalFormat,Ht,st,ft.colorSpace,R.isXRRenderTarget===!0),Lt=Bt(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,Lt,xt,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+it,i.RENDERBUFFER,V.__webglColorRenderbuffer[it])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),ct(V.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(X){e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),Pt(i.TEXTURE_CUBE_MAP,S);for(let it=0;it<6;it++)if(S.mipmaps&&S.mipmaps.length>0)for(let ft=0;ft<S.mipmaps.length;ft++)vt(V.__webglFramebuffer[it][ft],R,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,ft);else vt(V.__webglFramebuffer[it],R,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,0);g(S)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(dt){for(let it=0,ft=et.length;it<ft;it++){let Ht=et[it],st=n.get(Ht);e.bindTexture(i.TEXTURE_2D,st.__webglTexture),Pt(i.TEXTURE_2D,Ht),vt(V.__webglFramebuffer,R,Ht,i.COLOR_ATTACHMENT0+it,i.TEXTURE_2D,0),g(Ht)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let it=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(it=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(it,$.__webglTexture),Pt(it,S),S.mipmaps&&S.mipmaps.length>0)for(let ft=0;ft<S.mipmaps.length;ft++)vt(V.__webglFramebuffer[ft],R,S,i.COLOR_ATTACHMENT0,it,ft);else vt(V.__webglFramebuffer,R,S,i.COLOR_ATTACHMENT0,it,0);g(S)&&p(it),e.unbindTexture()}R.depthBuffer&&Ut(R)}function qt(R){let S=R.textures;for(let V=0,$=S.length;V<$;V++){let et=S[V];if(g(et)){let X=M(R),dt=n.get(et).__webglTexture;e.bindTexture(X,dt),p(X),e.unbindTexture()}}}let he=[],N=[];function Ee(R){if(R.samples>0){if(zt(R)===!1){let S=R.textures,V=R.width,$=R.height,et=i.COLOR_BUFFER_BIT,X=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,dt=n.get(R),it=S.length>1;if(it)for(let ft=0;ft<S.length;ft++)e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,dt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglFramebuffer);for(let ft=0;ft<S.length;ft++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(et|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(et|=i.STENCIL_BUFFER_BIT)),it){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,dt.__webglColorRenderbuffer[ft]);let Ht=n.get(S[ft]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ht,0)}i.blitFramebuffer(0,0,V,$,0,0,V,$,et,i.NEAREST),l===!0&&(he.length=0,N.length=0,he.push(i.COLOR_ATTACHMENT0+ft),R.depthBuffer&&R.resolveDepthBuffer===!1&&(he.push(X),N.push(X),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,N)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,he))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),it)for(let ft=0;ft<S.length;ft++){e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,dt.__webglColorRenderbuffer[ft]);let Ht=n.get(S[ft]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,Ht,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){let S=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[S])}}}function Bt(R){return Math.min(s.maxSamples,R.samples)}function zt(R){let S=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Ct(R){let S=o.render.frame;h.get(R)!==S&&(h.set(R,S),R.update())}function $t(R,S){let V=R.colorSpace,$=R.format,et=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||V!==ls&&V!==$n&&(Qt.getTransfer(V)===le?($!==fn||et!==Bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),S}function St(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=I,this.resetTextureUnits=L,this.setTexture2D=H,this.setTexture2DArray=k,this.setTexture3D=Y,this.setTextureCube=B,this.rebindTextures=kt,this.setupRenderTarget=Jt,this.updateRenderTargetMipmap=qt,this.updateMultisampleRenderTarget=Ee,this.setupDepthRenderbuffer=Ut,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=zt}function Zg(i,t){function e(n,s=$n){let r,o=Qt.getTransfer(s);if(n===Bn)return i.UNSIGNED_BYTE;if(n===ll)return i.UNSIGNED_SHORT_4_4_4_4;if(n===cl)return i.UNSIGNED_SHORT_5_5_5_1;if(n===jc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Jc)return i.BYTE;if(n===$c)return i.SHORT;if(n===Ps)return i.UNSIGNED_SHORT;if(n===ol)return i.INT;if(n===yi)return i.UNSIGNED_INT;if(n===Fn)return i.FLOAT;if(n===Bs)return i.HALF_FLOAT;if(n===Qc)return i.ALPHA;if(n===th)return i.RGB;if(n===fn)return i.RGBA;if(n===eh)return i.LUMINANCE;if(n===nh)return i.LUMINANCE_ALPHA;if(n===Ki)return i.DEPTH_COMPONENT;if(n===ns)return i.DEPTH_STENCIL;if(n===ih)return i.RED;if(n===hl)return i.RED_INTEGER;if(n===sh)return i.RG;if(n===ul)return i.RG_INTEGER;if(n===dl)return i.RGBA_INTEGER;if(n===Mr||n===br||n===Sr||n===Er)if(o===le)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Mr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Sr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Mr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Sr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===no||n===io||n===so||n===ro)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===no)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===io)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===so)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ro)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ao||n===oo||n===lo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ao||n===oo)return o===le?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===lo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===co||n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===yo||n===_o||n===xo||n===vo||n===Mo||n===bo||n===So)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===co)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ho)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===uo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===fo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===po)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===mo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===go)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===yo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===_o)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===xo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===vo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Mo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===bo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===So)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===wr||n===Eo||n===wo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===wr)return o===le?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Eo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===wo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===rh||n===To||n===Ao||n===Co)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===wr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===To)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ao)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Co)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===es?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Go=class extends Ve{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},jn=class extends Ge{constructor(){super(),this.isGroup=!0,this.type="Group"}},Kg={type:"move"},Rs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let m of t.hand.values()){let g=e.getJointPose(m,n),p=this._getHandJoint(c,m);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,y=.005;c.inputState.pinching&&f>d+y?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-y&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Kg)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new jn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Jg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$g=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Wo=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new $e,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new je({vertexShader:Jg,fragmentShader:$g,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ye(new rs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Xo=class extends zn{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,y=null,m=new Wo,g=e.getContextAttributes(),p=null,M=null,b=[],x=[],_=new Dt,w=null,C=new Ve;C.viewport=new Me;let P=new Ve;P.viewport=new Me;let E=[C,P],v=new Go,A=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let Q=b[J];return Q===void 0&&(Q=new Rs,b[J]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(J){let Q=b[J];return Q===void 0&&(Q=new Rs,b[J]=Q),Q.getGripSpace()},this.getHand=function(J){let Q=b[J];return Q===void 0&&(Q=new Rs,b[J]=Q),Q.getHandSpace()};function I(J){let Q=x.indexOf(J.inputSource);if(Q===-1)return;let vt=b[Q];vt!==void 0&&(vt.update(J.inputSource,J.frame,c||o),vt.dispatchEvent({type:J.type,data:J.inputSource}))}function D(){s.removeEventListener("select",I),s.removeEventListener("selectstart",I),s.removeEventListener("selectend",I),s.removeEventListener("squeeze",I),s.removeEventListener("squeezestart",I),s.removeEventListener("squeezeend",I),s.removeEventListener("end",D),s.removeEventListener("inputsourceschange",H);for(let J=0;J<b.length;J++){let Q=x[J];Q!==null&&(x[J]=null,b[J].disconnect(Q))}A=null,L=null,m.reset(),t.setRenderTarget(p),d=null,f=null,u=null,s=null,M=null,Yt.stop(),n.isPresenting=!1,t.setPixelRatio(w),t.setSize(_.width,_.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){a=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return y},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",I),s.addEventListener("selectstart",I),s.addEventListener("selectend",I),s.addEventListener("squeeze",I),s.addEventListener("squeezestart",I),s.addEventListener("squeezeend",I),s.addEventListener("end",D),s.addEventListener("inputsourceschange",H),g.xrCompatible!==!0&&await e.makeXRCompatible(),w=t.getPixelRatio(),t.getSize(_),s.renderState.layers===void 0){let Q={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,Q),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),M=new Hn(d.framebufferWidth,d.framebufferHeight,{format:fn,type:Bn,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let Q=null,vt=null,ct=null;g.depth&&(ct=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Q=g.stencil?ns:Ki,vt=g.stencil?es:yi);let It={colorFormat:e.RGBA8,depthFormat:ct,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(It),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),M=new Hn(f.textureWidth,f.textureHeight,{format:fn,type:Bn,depthTexture:new Fr(f.textureWidth,f.textureHeight,vt,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Yt.setContext(s),Yt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function H(J){for(let Q=0;Q<J.removed.length;Q++){let vt=J.removed[Q],ct=x.indexOf(vt);ct>=0&&(x[ct]=null,b[ct].disconnect(vt))}for(let Q=0;Q<J.added.length;Q++){let vt=J.added[Q],ct=x.indexOf(vt);if(ct===-1){for(let Ut=0;Ut<b.length;Ut++)if(Ut>=x.length){x.push(vt),ct=Ut;break}else if(x[Ut]===null){x[Ut]=vt,ct=Ut;break}if(ct===-1)break}let It=b[ct];It&&It.connect(vt)}}let k=new z,Y=new z;function B(J,Q,vt){k.setFromMatrixPosition(Q.matrixWorld),Y.setFromMatrixPosition(vt.matrixWorld);let ct=k.distanceTo(Y),It=Q.projectionMatrix.elements,Ut=vt.projectionMatrix.elements,kt=It[14]/(It[10]-1),Jt=It[14]/(It[10]+1),qt=(It[9]+1)/It[5],he=(It[9]-1)/It[5],N=(It[8]-1)/It[0],Ee=(Ut[8]+1)/Ut[0],Bt=kt*N,zt=kt*Ee,Ct=ct/(-N+Ee),$t=Ct*-N;if(Q.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX($t),J.translateZ(Ct),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),It[10]===-1)J.projectionMatrix.copy(Q.projectionMatrix),J.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let St=kt+Ct,R=Jt+Ct,S=Bt-$t,V=zt+(ct-$t),$=qt*Jt/R*St,et=he*Jt/R*St;J.projectionMatrix.makePerspective(S,V,$,et,St,R),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function nt(J,Q){Q===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(Q.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let Q=J.near,vt=J.far;m.texture!==null&&(m.depthNear>0&&(Q=m.depthNear),m.depthFar>0&&(vt=m.depthFar)),v.near=P.near=C.near=Q,v.far=P.far=C.far=vt,(A!==v.near||L!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),A=v.near,L=v.far),C.layers.mask=J.layers.mask|2,P.layers.mask=J.layers.mask|4,v.layers.mask=C.layers.mask|P.layers.mask;let ct=J.parent,It=v.cameras;nt(v,ct);for(let Ut=0;Ut<It.length;Ut++)nt(It[Ut],ct);It.length===2?B(v,C,P):v.projectionMatrix.copy(C.projectionMatrix),rt(J,v,ct)};function rt(J,Q,vt){vt===null?J.matrix.copy(Q.matrixWorld):(J.matrix.copy(vt.matrixWorld),J.matrix.invert(),J.matrix.multiply(Q.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(Q.projectionMatrix),J.projectionMatrixInverse.copy(Q.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=Is*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(J){l=J,f!==null&&(f.fixedFoveation=J),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=J)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(v)};let at=null;function Pt(J,Q){if(h=Q.getViewerPose(c||o),y=Q,h!==null){let vt=h.views;d!==null&&(t.setRenderTargetFramebuffer(M,d.framebuffer),t.setRenderTarget(M));let ct=!1;vt.length!==v.cameras.length&&(v.cameras.length=0,ct=!0);for(let Ut=0;Ut<vt.length;Ut++){let kt=vt[Ut],Jt=null;if(d!==null)Jt=d.getViewport(kt);else{let he=u.getViewSubImage(f,kt);Jt=he.viewport,Ut===0&&(t.setRenderTargetTextures(M,he.colorTexture,f.ignoreDepthValues?void 0:he.depthStencilTexture),t.setRenderTarget(M))}let qt=E[Ut];qt===void 0&&(qt=new Ve,qt.layers.enable(Ut),qt.viewport=new Me,E[Ut]=qt),qt.matrix.fromArray(kt.transform.matrix),qt.matrix.decompose(qt.position,qt.quaternion,qt.scale),qt.projectionMatrix.fromArray(kt.projectionMatrix),qt.projectionMatrixInverse.copy(qt.projectionMatrix).invert(),qt.viewport.set(Jt.x,Jt.y,Jt.width,Jt.height),Ut===0&&(v.matrix.copy(qt.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),ct===!0&&v.cameras.push(qt)}let It=s.enabledFeatures;if(It&&It.includes("depth-sensing")){let Ut=u.getDepthInformation(vt[0]);Ut&&Ut.isValid&&Ut.texture&&m.init(t,Ut,s.renderState)}}for(let vt=0;vt<b.length;vt++){let ct=x[vt],It=b[vt];ct!==null&&It!==void 0&&It.update(ct,Q,c||o)}at&&at(J,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),y=null}let Yt=new dh;Yt.setAnimationLoop(Pt),this.setAnimationLoop=function(J){at=J},this.dispose=function(){}}},hi=new wn,jg=new me;function Qg(i,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,uh(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,M,b,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),u(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),f(g,p),p.isMeshPhysicalMaterial&&d(g,p,x)):p.isMeshMatcapMaterial?(r(g,p),y(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),m(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,M,b):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Ye&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Ye&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let M=t.get(p),b=M.envMap,x=M.envMapRotation;b&&(g.envMap.value=b,hi.copy(x),hi.x*=-1,hi.y*=-1,hi.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(hi.y*=-1,hi.z*=-1),g.envMapRotation.value.setFromMatrix4(jg.makeRotationFromEuler(hi)),g.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,M,b){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*M,g.scale.value=b*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function f(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function d(g,p,M){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ye&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=M.texture,g.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function y(g,p){p.matcap&&(g.matcap.value=p.matcap)}function m(g,p){let M=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(M.matrixWorld),g.nearDistance.value=M.shadow.camera.near,g.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function t0(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,b){let x=b.program;n.uniformBlockBinding(M,x)}function c(M,b){let x=s[M.id];x===void 0&&(y(M),x=h(M),s[M.id]=x,M.addEventListener("dispose",g));let _=b.program;n.updateUBOMapping(M,_);let w=t.render.frame;r[M.id]!==w&&(f(M),r[M.id]=w)}function h(M){let b=u();M.__bindingPointIndex=b;let x=i.createBuffer(),_=M.__size,w=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,_,w),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,x),x}function u(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(M){let b=s[M.id],x=M.uniforms,_=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let w=0,C=x.length;w<C;w++){let P=Array.isArray(x[w])?x[w]:[x[w]];for(let E=0,v=P.length;E<v;E++){let A=P[E];if(d(A,w,E,_)===!0){let L=A.__offset,I=Array.isArray(A.value)?A.value:[A.value],D=0;for(let H=0;H<I.length;H++){let k=I[H],Y=m(k);typeof k=="number"||typeof k=="boolean"?(A.__data[0]=k,i.bufferSubData(i.UNIFORM_BUFFER,L+D,A.__data)):k.isMatrix3?(A.__data[0]=k.elements[0],A.__data[1]=k.elements[1],A.__data[2]=k.elements[2],A.__data[3]=0,A.__data[4]=k.elements[3],A.__data[5]=k.elements[4],A.__data[6]=k.elements[5],A.__data[7]=0,A.__data[8]=k.elements[6],A.__data[9]=k.elements[7],A.__data[10]=k.elements[8],A.__data[11]=0):(k.toArray(A.__data,D),D+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,L,A.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(M,b,x,_){let w=M.value,C=b+"_"+x;if(_[C]===void 0)return typeof w=="number"||typeof w=="boolean"?_[C]=w:_[C]=w.clone(),!0;{let P=_[C];if(typeof w=="number"||typeof w=="boolean"){if(P!==w)return _[C]=w,!0}else if(P.equals(w)===!1)return P.copy(w),!0}return!1}function y(M){let b=M.uniforms,x=0,_=16;for(let C=0,P=b.length;C<P;C++){let E=Array.isArray(b[C])?b[C]:[b[C]];for(let v=0,A=E.length;v<A;v++){let L=E[v],I=Array.isArray(L.value)?L.value:[L.value];for(let D=0,H=I.length;D<H;D++){let k=I[D],Y=m(k),B=x%_,nt=B%Y.boundary,rt=B+nt;x+=nt,rt!==0&&_-rt<Y.storage&&(x+=_-rt),L.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=x,x+=Y.storage}}}let w=x%_;return w>0&&(x+=_-w),M.__size=x,M.__cache={},this}function m(M){let b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=48,b.storage=48):M.isMatrix4?(b.boundary=64,b.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),b}function g(M){let b=M.target;b.removeEventListener("dispose",g);let x=o.indexOf(b.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function p(){for(let M in s)i.deleteBuffer(s[M]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var Or=class{constructor(t={}){let{canvas:e=id(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let y=new Uint32Array(4),m=new Int32Array(4),g=null,p=null,M=[],b=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=He,this.toneMapping=ti,this.toneMappingExposure=1;let x=this,_=!1,w=0,C=0,P=null,E=-1,v=null,A=new Me,L=new Me,I=null,D=new At(0),H=0,k=e.width,Y=e.height,B=1,nt=null,rt=null,at=new Me(0,0,k,Y),Pt=new Me(0,0,k,Y),Yt=!1,J=new Ds,Q=!1,vt=!1,ct=new me,It=new me,Ut=new z,kt=new Me,Jt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},qt=!1;function he(){return P===null?B:1}let N=n;function Ee(T,F){return e.getContext(T,F)}try{let T={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r170"),e.addEventListener("webglcontextlost",tt,!1),e.addEventListener("webglcontextrestored",_t,!1),e.addEventListener("webglcontextcreationerror",mt,!1),N===null){let F="webgl2";if(N=Ee(F,T),N===null)throw Ee(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let Bt,zt,Ct,$t,St,R,S,V,$,et,X,dt,it,ft,Ht,st,xt,Lt,bt,Mt,Kt,Ot,jt,U;function pt(){Bt=new gm(N),Bt.init(),Ot=new Zg(N,Bt),zt=new hm(N,Bt,t,Ot),Ct=new Xg(N,Bt),zt.reverseDepthBuffer&&f&&Ct.buffers.depth.setReversed(!0),$t=new xm(N),St=new Lg,R=new qg(N,Bt,Ct,St,zt,Ot,$t),S=new dm(x),V=new mm(x),$=new wd(N),jt=new lm(N,$),et=new ym(N,$,$t,jt),X=new Mm(N,et,$,$t),bt=new vm(N,zt,R),st=new um(St),dt=new Ig(x,S,V,Bt,zt,jt,st),it=new Qg(x,St),ft=new Ug,Ht=new zg(Bt),Lt=new om(x,S,V,Ct,X,d,l),xt=new Gg(x,X,zt),U=new t0(N,$t,zt,Ct),Mt=new cm(N,Bt,$t),Kt=new _m(N,Bt,$t),$t.programs=dt.programs,x.capabilities=zt,x.extensions=Bt,x.properties=St,x.renderLists=ft,x.shadowMap=xt,x.state=Ct,x.info=$t}pt();let Z=new Xo(x,N);this.xr=Z,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let T=Bt.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){let T=Bt.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return B},this.setPixelRatio=function(T){T!==void 0&&(B=T,this.setSize(k,Y,!1))},this.getSize=function(T){return T.set(k,Y)},this.setSize=function(T,F,G=!0){if(Z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}k=T,Y=F,e.width=Math.floor(T*B),e.height=Math.floor(F*B),G===!0&&(e.style.width=T+"px",e.style.height=F+"px"),this.setViewport(0,0,T,F)},this.getDrawingBufferSize=function(T){return T.set(k*B,Y*B).floor()},this.setDrawingBufferSize=function(T,F,G){k=T,Y=F,B=G,e.width=Math.floor(T*G),e.height=Math.floor(F*G),this.setViewport(0,0,T,F)},this.getCurrentViewport=function(T){return T.copy(A)},this.getViewport=function(T){return T.copy(at)},this.setViewport=function(T,F,G,W){T.isVector4?at.set(T.x,T.y,T.z,T.w):at.set(T,F,G,W),Ct.viewport(A.copy(at).multiplyScalar(B).round())},this.getScissor=function(T){return T.copy(Pt)},this.setScissor=function(T,F,G,W){T.isVector4?Pt.set(T.x,T.y,T.z,T.w):Pt.set(T,F,G,W),Ct.scissor(L.copy(Pt).multiplyScalar(B).round())},this.getScissorTest=function(){return Yt},this.setScissorTest=function(T){Ct.setScissorTest(Yt=T)},this.setOpaqueSort=function(T){nt=T},this.setTransparentSort=function(T){rt=T},this.getClearColor=function(T){return T.copy(Lt.getClearColor())},this.setClearColor=function(){Lt.setClearColor.apply(Lt,arguments)},this.getClearAlpha=function(){return Lt.getClearAlpha()},this.setClearAlpha=function(){Lt.setClearAlpha.apply(Lt,arguments)},this.clear=function(T=!0,F=!0,G=!0){let W=0;if(T){let O=!1;if(P!==null){let ot=P.texture.format;O=ot===dl||ot===ul||ot===hl}if(O){let ot=P.texture.type,gt=ot===Bn||ot===yi||ot===Ps||ot===es||ot===ll||ot===cl,Et=Lt.getClearColor(),wt=Lt.getClearAlpha(),Nt=Et.r,Gt=Et.g,Tt=Et.b;gt?(y[0]=Nt,y[1]=Gt,y[2]=Tt,y[3]=wt,N.clearBufferuiv(N.COLOR,0,y)):(m[0]=Nt,m[1]=Gt,m[2]=Tt,m[3]=wt,N.clearBufferiv(N.COLOR,0,m))}else W|=N.COLOR_BUFFER_BIT}F&&(W|=N.DEPTH_BUFFER_BIT),G&&(W|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",tt,!1),e.removeEventListener("webglcontextrestored",_t,!1),e.removeEventListener("webglcontextcreationerror",mt,!1),ft.dispose(),Ht.dispose(),St.dispose(),S.dispose(),V.dispose(),X.dispose(),jt.dispose(),U.dispose(),dt.dispose(),Z.dispose(),Z.removeEventListener("sessionstart",Cl),Z.removeEventListener("sessionend",Rl),si.stop()};function tt(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),_=!0}function _t(){console.log("THREE.WebGLRenderer: Context Restored."),_=!1;let T=$t.autoReset,F=xt.enabled,G=xt.autoUpdate,W=xt.needsUpdate,O=xt.type;pt(),$t.autoReset=T,xt.enabled=F,xt.autoUpdate=G,xt.needsUpdate=W,xt.type=O}function mt(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function Vt(T){let F=T.target;F.removeEventListener("dispose",Vt),ve(F)}function ve(T){Le(T),St.remove(T)}function Le(T){let F=St.get(T).programs;F!==void 0&&(F.forEach(function(G){dt.releaseProgram(G)}),T.isShaderMaterial&&dt.releaseShaderCache(T))}this.renderBufferDirect=function(T,F,G,W,O,ot){F===null&&(F=Jt);let gt=O.isMesh&&O.matrixWorld.determinant()<0,Et=Xh(T,F,G,W,O);Ct.setMaterial(W,gt);let wt=G.index,Nt=1;if(W.wireframe===!0){if(wt=et.getWireframeAttribute(G),wt===void 0)return;Nt=2}let Gt=G.drawRange,Tt=G.attributes.position,ee=Gt.start*Nt,ue=(Gt.start+Gt.count)*Nt;ot!==null&&(ee=Math.max(ee,ot.start*Nt),ue=Math.min(ue,(ot.start+ot.count)*Nt)),wt!==null?(ee=Math.max(ee,0),ue=Math.min(ue,wt.count)):Tt!=null&&(ee=Math.max(ee,0),ue=Math.min(ue,Tt.count));let fe=ue-ee;if(fe<0||fe===1/0)return;jt.setup(O,W,Et,G,wt);let We,ie=Mt;if(wt!==null&&(We=$.get(wt),ie=Kt,ie.setIndex(We)),O.isMesh)W.wireframe===!0?(Ct.setLineWidth(W.wireframeLinewidth*he()),ie.setMode(N.LINES)):ie.setMode(N.TRIANGLES);else if(O.isLine){let Rt=W.linewidth;Rt===void 0&&(Rt=1),Ct.setLineWidth(Rt*he()),O.isLineSegments?ie.setMode(N.LINES):O.isLineLoop?ie.setMode(N.LINE_LOOP):ie.setMode(N.LINE_STRIP)}else O.isPoints?ie.setMode(N.POINTS):O.isSprite&&ie.setMode(N.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)ie.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(Bt.get("WEBGL_multi_draw"))ie.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Rt=O._multiDrawStarts,Cn=O._multiDrawCounts,se=O._multiDrawCount,ln=wt?$.get(wt).bytesPerElement:1,Pi=St.get(W).currentProgram.getUniforms();for(let Ze=0;Ze<se;Ze++)Pi.setValue(N,"_gl_DrawID",Ze),ie.render(Rt[Ze]/ln,Cn[Ze])}else if(O.isInstancedMesh)ie.renderInstances(ee,fe,O.count);else if(G.isInstancedBufferGeometry){let Rt=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,Cn=Math.min(G.instanceCount,Rt);ie.renderInstances(ee,fe,Cn)}else ie.render(ee,fe)};function oe(T,F,G){T.transparent===!0&&T.side===Pe&&T.forceSinglePass===!1?(T.side=Ye,T.needsUpdate=!0,Ks(T,F,G),T.side=ei,T.needsUpdate=!0,Ks(T,F,G),T.side=Pe):Ks(T,F,G)}this.compile=function(T,F,G=null){G===null&&(G=T),p=Ht.get(G),p.init(F),b.push(p),G.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),T!==G&&T.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let W=new Set;return T.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let ot=O.material;if(ot)if(Array.isArray(ot))for(let gt=0;gt<ot.length;gt++){let Et=ot[gt];oe(Et,G,O),W.add(Et)}else oe(ot,G,O),W.add(ot)}),b.pop(),p=null,W},this.compileAsync=function(T,F,G=null){let W=this.compile(T,F,G);return new Promise(O=>{function ot(){if(W.forEach(function(gt){St.get(gt).currentProgram.isReady()&&W.delete(gt)}),W.size===0){O(T);return}setTimeout(ot,10)}Bt.get("KHR_parallel_shader_compile")!==null?ot():setTimeout(ot,10)})};let on=null;function An(T){on&&on(T)}function Cl(){si.stop()}function Rl(){si.start()}let si=new dh;si.setAnimationLoop(An),typeof self<"u"&&si.setContext(self),this.setAnimationLoop=function(T){on=T,Z.setAnimationLoop(T),T===null?si.stop():si.start()},Z.addEventListener("sessionstart",Cl),Z.addEventListener("sessionend",Rl),this.render=function(T,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(_===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),Z.enabled===!0&&Z.isPresenting===!0&&(Z.cameraAutoUpdate===!0&&Z.updateCamera(F),F=Z.getCamera()),T.isScene===!0&&T.onBeforeRender(x,T,F,P),p=Ht.get(T,b.length),p.init(F),b.push(p),It.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),J.setFromProjectionMatrix(It),vt=this.localClippingEnabled,Q=st.init(this.clippingPlanes,vt),g=ft.get(T,M.length),g.init(),M.push(g),Z.enabled===!0&&Z.isPresenting===!0){let ot=x.xr.getDepthSensingMesh();ot!==null&&ha(ot,F,-1/0,x.sortObjects)}ha(T,F,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(nt,rt),qt=Z.enabled===!1||Z.isPresenting===!1||Z.hasDepthSensing()===!1,qt&&Lt.addToRenderList(g,T),this.info.render.frame++,Q===!0&&st.beginShadows();let G=p.state.shadowsArray;xt.render(G,T,F),Q===!0&&st.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=g.opaque,O=g.transmissive;if(p.setupLights(),F.isArrayCamera){let ot=F.cameras;if(O.length>0)for(let gt=0,Et=ot.length;gt<Et;gt++){let wt=ot[gt];Il(W,O,T,wt)}qt&&Lt.render(T);for(let gt=0,Et=ot.length;gt<Et;gt++){let wt=ot[gt];Pl(g,T,wt,wt.viewport)}}else O.length>0&&Il(W,O,T,F),qt&&Lt.render(T),Pl(g,T,F);P!==null&&(R.updateMultisampleRenderTarget(P),R.updateRenderTargetMipmap(P)),T.isScene===!0&&T.onAfterRender(x,T,F),jt.resetDefaultState(),E=-1,v=null,b.pop(),b.length>0?(p=b[b.length-1],Q===!0&&st.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,M.pop(),M.length>0?g=M[M.length-1]:g=null};function ha(T,F,G,W){if(T.visible===!1)return;if(T.layers.test(F.layers)){if(T.isGroup)G=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(F);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||J.intersectsSprite(T)){W&&kt.setFromMatrixPosition(T.matrixWorld).applyMatrix4(It);let gt=X.update(T),Et=T.material;Et.visible&&g.push(T,gt,Et,G,kt.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||J.intersectsObject(T))){let gt=X.update(T),Et=T.material;if(W&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),kt.copy(T.boundingSphere.center)):(gt.boundingSphere===null&&gt.computeBoundingSphere(),kt.copy(gt.boundingSphere.center)),kt.applyMatrix4(T.matrixWorld).applyMatrix4(It)),Array.isArray(Et)){let wt=gt.groups;for(let Nt=0,Gt=wt.length;Nt<Gt;Nt++){let Tt=wt[Nt],ee=Et[Tt.materialIndex];ee&&ee.visible&&g.push(T,gt,ee,G,kt.z,Tt)}}else Et.visible&&g.push(T,gt,Et,G,kt.z,null)}}let ot=T.children;for(let gt=0,Et=ot.length;gt<Et;gt++)ha(ot[gt],F,G,W)}function Pl(T,F,G,W){let O=T.opaque,ot=T.transmissive,gt=T.transparent;p.setupLightsView(G),Q===!0&&st.setGlobalState(x.clippingPlanes,G),W&&Ct.viewport(A.copy(W)),O.length>0&&Zs(O,F,G),ot.length>0&&Zs(ot,F,G),gt.length>0&&Zs(gt,F,G),Ct.buffers.depth.setTest(!0),Ct.buffers.depth.setMask(!0),Ct.buffers.color.setMask(!0),Ct.setPolygonOffset(!1)}function Il(T,F,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new Hn(1,1,{generateMipmaps:!0,type:Bt.has("EXT_color_buffer_half_float")||Bt.has("EXT_color_buffer_float")?Bs:Bn,minFilter:gi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qt.workingColorSpace}));let ot=p.state.transmissionRenderTarget[W.id],gt=W.viewport||A;ot.setSize(gt.z,gt.w);let Et=x.getRenderTarget();x.setRenderTarget(ot),x.getClearColor(D),H=x.getClearAlpha(),H<1&&x.setClearColor(16777215,.5),x.clear(),qt&&Lt.render(G);let wt=x.toneMapping;x.toneMapping=ti;let Nt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),Q===!0&&st.setGlobalState(x.clippingPlanes,W),Zs(T,G,W),R.updateMultisampleRenderTarget(ot),R.updateRenderTargetMipmap(ot),Bt.has("WEBGL_multisampled_render_to_texture")===!1){let Gt=!1;for(let Tt=0,ee=F.length;Tt<ee;Tt++){let ue=F[Tt],fe=ue.object,We=ue.geometry,ie=ue.material,Rt=ue.group;if(ie.side===Pe&&fe.layers.test(W.layers)){let Cn=ie.side;ie.side=Ye,ie.needsUpdate=!0,Ll(fe,G,W,We,ie,Rt),ie.side=Cn,ie.needsUpdate=!0,Gt=!0}}Gt===!0&&(R.updateMultisampleRenderTarget(ot),R.updateRenderTargetMipmap(ot))}x.setRenderTarget(Et),x.setClearColor(D,H),Nt!==void 0&&(W.viewport=Nt),x.toneMapping=wt}function Zs(T,F,G){let W=F.isScene===!0?F.overrideMaterial:null;for(let O=0,ot=T.length;O<ot;O++){let gt=T[O],Et=gt.object,wt=gt.geometry,Nt=W===null?gt.material:W,Gt=gt.group;Et.layers.test(G.layers)&&Ll(Et,F,G,wt,Nt,Gt)}}function Ll(T,F,G,W,O,ot){T.onBeforeRender(x,F,G,W,O,ot),T.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),O.onBeforeRender(x,F,G,W,T,ot),O.transparent===!0&&O.side===Pe&&O.forceSinglePass===!1?(O.side=Ye,O.needsUpdate=!0,x.renderBufferDirect(G,F,W,O,T,ot),O.side=ei,O.needsUpdate=!0,x.renderBufferDirect(G,F,W,O,T,ot),O.side=Pe):x.renderBufferDirect(G,F,W,O,T,ot),T.onAfterRender(x,F,G,W,O,ot)}function Ks(T,F,G){F.isScene!==!0&&(F=Jt);let W=St.get(T),O=p.state.lights,ot=p.state.shadowsArray,gt=O.state.version,Et=dt.getParameters(T,O.state,ot,F,G),wt=dt.getProgramCacheKey(Et),Nt=W.programs;W.environment=T.isMeshStandardMaterial?F.environment:null,W.fog=F.fog,W.envMap=(T.isMeshStandardMaterial?V:S).get(T.envMap||W.environment),W.envMapRotation=W.environment!==null&&T.envMap===null?F.environmentRotation:T.envMapRotation,Nt===void 0&&(T.addEventListener("dispose",Vt),Nt=new Map,W.programs=Nt);let Gt=Nt.get(wt);if(Gt!==void 0){if(W.currentProgram===Gt&&W.lightsStateVersion===gt)return Ul(T,Et),Gt}else Et.uniforms=dt.getUniforms(T),T.onBeforeCompile(Et,x),Gt=dt.acquireProgram(Et,wt),Nt.set(wt,Gt),W.uniforms=Et.uniforms;let Tt=W.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Tt.clippingPlanes=st.uniform),Ul(T,Et),W.needsLights=qh(T),W.lightsStateVersion=gt,W.needsLights&&(Tt.ambientLightColor.value=O.state.ambient,Tt.lightProbe.value=O.state.probe,Tt.directionalLights.value=O.state.directional,Tt.directionalLightShadows.value=O.state.directionalShadow,Tt.spotLights.value=O.state.spot,Tt.spotLightShadows.value=O.state.spotShadow,Tt.rectAreaLights.value=O.state.rectArea,Tt.ltc_1.value=O.state.rectAreaLTC1,Tt.ltc_2.value=O.state.rectAreaLTC2,Tt.pointLights.value=O.state.point,Tt.pointLightShadows.value=O.state.pointShadow,Tt.hemisphereLights.value=O.state.hemi,Tt.directionalShadowMap.value=O.state.directionalShadowMap,Tt.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Tt.spotShadowMap.value=O.state.spotShadowMap,Tt.spotLightMatrix.value=O.state.spotLightMatrix,Tt.spotLightMap.value=O.state.spotLightMap,Tt.pointShadowMap.value=O.state.pointShadowMap,Tt.pointShadowMatrix.value=O.state.pointShadowMatrix),W.currentProgram=Gt,W.uniformsList=null,Gt}function Dl(T){if(T.uniformsList===null){let F=T.currentProgram.getUniforms();T.uniformsList=$i.seqWithValue(F.seq,T.uniforms)}return T.uniformsList}function Ul(T,F){let G=St.get(T);G.outputColorSpace=F.outputColorSpace,G.batching=F.batching,G.batchingColor=F.batchingColor,G.instancing=F.instancing,G.instancingColor=F.instancingColor,G.instancingMorph=F.instancingMorph,G.skinning=F.skinning,G.morphTargets=F.morphTargets,G.morphNormals=F.morphNormals,G.morphColors=F.morphColors,G.morphTargetsCount=F.morphTargetsCount,G.numClippingPlanes=F.numClippingPlanes,G.numIntersection=F.numClipIntersection,G.vertexAlphas=F.vertexAlphas,G.vertexTangents=F.vertexTangents,G.toneMapping=F.toneMapping}function Xh(T,F,G,W,O){F.isScene!==!0&&(F=Jt),R.resetTextureUnits();let ot=F.fog,gt=W.isMeshStandardMaterial?F.environment:null,Et=P===null?x.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:ls,wt=(W.isMeshStandardMaterial?V:S).get(W.envMap||gt),Nt=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Gt=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Tt=!!G.morphAttributes.position,ee=!!G.morphAttributes.normal,ue=!!G.morphAttributes.color,fe=ti;W.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(fe=x.toneMapping);let We=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,ie=We!==void 0?We.length:0,Rt=St.get(W),Cn=p.state.lights;if(Q===!0&&(vt===!0||T!==v)){let tn=T===v&&W.id===E;st.setState(W,T,tn)}let se=!1;W.version===Rt.__version?(Rt.needsLights&&Rt.lightsStateVersion!==Cn.state.version||Rt.outputColorSpace!==Et||O.isBatchedMesh&&Rt.batching===!1||!O.isBatchedMesh&&Rt.batching===!0||O.isBatchedMesh&&Rt.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Rt.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Rt.instancing===!1||!O.isInstancedMesh&&Rt.instancing===!0||O.isSkinnedMesh&&Rt.skinning===!1||!O.isSkinnedMesh&&Rt.skinning===!0||O.isInstancedMesh&&Rt.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Rt.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Rt.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Rt.instancingMorph===!1&&O.morphTexture!==null||Rt.envMap!==wt||W.fog===!0&&Rt.fog!==ot||Rt.numClippingPlanes!==void 0&&(Rt.numClippingPlanes!==st.numPlanes||Rt.numIntersection!==st.numIntersection)||Rt.vertexAlphas!==Nt||Rt.vertexTangents!==Gt||Rt.morphTargets!==Tt||Rt.morphNormals!==ee||Rt.morphColors!==ue||Rt.toneMapping!==fe||Rt.morphTargetsCount!==ie)&&(se=!0):(se=!0,Rt.__version=W.version);let ln=Rt.currentProgram;se===!0&&(ln=Ks(W,F,O));let Pi=!1,Ze=!1,_s=!1,pe=ln.getUniforms(),Mn=Rt.uniforms;if(Ct.useProgram(ln.program)&&(Pi=!0,Ze=!0,_s=!0),W.id!==E&&(E=W.id,Ze=!0),Pi||v!==T){Ct.buffers.depth.getReversed()?(ct.copy(T.projectionMatrix),rd(ct),ad(ct),pe.setValue(N,"projectionMatrix",ct)):pe.setValue(N,"projectionMatrix",T.projectionMatrix),pe.setValue(N,"viewMatrix",T.matrixWorldInverse);let Gn=pe.map.cameraPosition;Gn!==void 0&&Gn.setValue(N,Ut.setFromMatrixPosition(T.matrixWorld)),zt.logarithmicDepthBuffer&&pe.setValue(N,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&pe.setValue(N,"isOrthographic",T.isOrthographicCamera===!0),v!==T&&(v=T,Ze=!0,_s=!0)}if(O.isSkinnedMesh){pe.setOptional(N,O,"bindMatrix"),pe.setOptional(N,O,"bindMatrixInverse");let tn=O.skeleton;tn&&(tn.boneTexture===null&&tn.computeBoneTexture(),pe.setValue(N,"boneTexture",tn.boneTexture,R))}O.isBatchedMesh&&(pe.setOptional(N,O,"batchingTexture"),pe.setValue(N,"batchingTexture",O._matricesTexture,R),pe.setOptional(N,O,"batchingIdTexture"),pe.setValue(N,"batchingIdTexture",O._indirectTexture,R),pe.setOptional(N,O,"batchingColorTexture"),O._colorsTexture!==null&&pe.setValue(N,"batchingColorTexture",O._colorsTexture,R));let xs=G.morphAttributes;if((xs.position!==void 0||xs.normal!==void 0||xs.color!==void 0)&&bt.update(O,G,ln),(Ze||Rt.receiveShadow!==O.receiveShadow)&&(Rt.receiveShadow=O.receiveShadow,pe.setValue(N,"receiveShadow",O.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(Mn.envMap.value=wt,Mn.flipEnvMap.value=wt.isCubeTexture&&wt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&F.environment!==null&&(Mn.envMapIntensity.value=F.environmentIntensity),Ze&&(pe.setValue(N,"toneMappingExposure",x.toneMappingExposure),Rt.needsLights&&Yh(Mn,_s),ot&&W.fog===!0&&it.refreshFogUniforms(Mn,ot),it.refreshMaterialUniforms(Mn,W,B,Y,p.state.transmissionRenderTarget[T.id]),$i.upload(N,Dl(Rt),Mn,R)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&($i.upload(N,Dl(Rt),Mn,R),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&pe.setValue(N,"center",O.center),pe.setValue(N,"modelViewMatrix",O.modelViewMatrix),pe.setValue(N,"normalMatrix",O.normalMatrix),pe.setValue(N,"modelMatrix",O.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let tn=W.uniformsGroups;for(let Gn=0,Wn=tn.length;Gn<Wn;Gn++){let Nl=tn[Gn];U.update(Nl,ln),U.bind(Nl,ln)}}return ln}function Yh(T,F){T.ambientLightColor.needsUpdate=F,T.lightProbe.needsUpdate=F,T.directionalLights.needsUpdate=F,T.directionalLightShadows.needsUpdate=F,T.pointLights.needsUpdate=F,T.pointLightShadows.needsUpdate=F,T.spotLights.needsUpdate=F,T.spotLightShadows.needsUpdate=F,T.rectAreaLights.needsUpdate=F,T.hemisphereLights.needsUpdate=F}function qh(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(T,F,G){St.get(T.texture).__webglTexture=F,St.get(T.depthTexture).__webglTexture=G;let W=St.get(T);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=G===void 0,W.__autoAllocateDepthBuffer||Bt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,F){let G=St.get(T);G.__webglFramebuffer=F,G.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(T,F=0,G=0){P=T,w=F,C=G;let W=!0,O=null,ot=!1,gt=!1;if(T){let wt=St.get(T);if(wt.__useDefaultFramebuffer!==void 0)Ct.bindFramebuffer(N.FRAMEBUFFER,null),W=!1;else if(wt.__webglFramebuffer===void 0)R.setupRenderTarget(T);else if(wt.__hasExternalTextures)R.rebindTextures(T,St.get(T.texture).__webglTexture,St.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){let Tt=T.depthTexture;if(wt.__boundDepthTexture!==Tt){if(Tt!==null&&St.has(Tt)&&(T.width!==Tt.image.width||T.height!==Tt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(T)}}let Nt=T.texture;(Nt.isData3DTexture||Nt.isDataArrayTexture||Nt.isCompressedArrayTexture)&&(gt=!0);let Gt=St.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Gt[F])?O=Gt[F][G]:O=Gt[F],ot=!0):T.samples>0&&R.useMultisampledRTT(T)===!1?O=St.get(T).__webglMultisampledFramebuffer:Array.isArray(Gt)?O=Gt[G]:O=Gt,A.copy(T.viewport),L.copy(T.scissor),I=T.scissorTest}else A.copy(at).multiplyScalar(B).floor(),L.copy(Pt).multiplyScalar(B).floor(),I=Yt;if(Ct.bindFramebuffer(N.FRAMEBUFFER,O)&&W&&Ct.drawBuffers(T,O),Ct.viewport(A),Ct.scissor(L),Ct.setScissorTest(I),ot){let wt=St.get(T.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+F,wt.__webglTexture,G)}else if(gt){let wt=St.get(T.texture),Nt=F||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,wt.__webglTexture,G||0,Nt)}E=-1},this.readRenderTargetPixels=function(T,F,G,W,O,ot,gt){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Et=St.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&gt!==void 0&&(Et=Et[gt]),Et){Ct.bindFramebuffer(N.FRAMEBUFFER,Et);try{let wt=T.texture,Nt=wt.format,Gt=wt.type;if(!zt.textureFormatReadable(Nt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!zt.textureTypeReadable(Gt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=T.width-W&&G>=0&&G<=T.height-O&&N.readPixels(F,G,W,O,Ot.convert(Nt),Ot.convert(Gt),ot)}finally{let wt=P!==null?St.get(P).__webglFramebuffer:null;Ct.bindFramebuffer(N.FRAMEBUFFER,wt)}}},this.readRenderTargetPixelsAsync=async function(T,F,G,W,O,ot,gt){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Et=St.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&gt!==void 0&&(Et=Et[gt]),Et){let wt=T.texture,Nt=wt.format,Gt=wt.type;if(!zt.textureFormatReadable(Nt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!zt.textureTypeReadable(Gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=T.width-W&&G>=0&&G<=T.height-O){Ct.bindFramebuffer(N.FRAMEBUFFER,Et);let Tt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Tt),N.bufferData(N.PIXEL_PACK_BUFFER,ot.byteLength,N.STREAM_READ),N.readPixels(F,G,W,O,Ot.convert(Nt),Ot.convert(Gt),0);let ee=P!==null?St.get(P).__webglFramebuffer:null;Ct.bindFramebuffer(N.FRAMEBUFFER,ee);let ue=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await sd(N,ue,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Tt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,ot),N.deleteBuffer(Tt),N.deleteSync(ue),ot}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(T,F=null,G=0){T.isTexture!==!0&&(ws("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,T=arguments[1]);let W=Math.pow(2,-G),O=Math.floor(T.image.width*W),ot=Math.floor(T.image.height*W),gt=F!==null?F.x:0,Et=F!==null?F.y:0;R.setTexture2D(T,0),N.copyTexSubImage2D(N.TEXTURE_2D,G,0,0,gt,Et,O,ot),Ct.unbindTexture()},this.copyTextureToTexture=function(T,F,G=null,W=null,O=0){T.isTexture!==!0&&(ws("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,T=arguments[1],F=arguments[2],O=arguments[3]||0,G=null);let ot,gt,Et,wt,Nt,Gt,Tt,ee,ue,fe=T.isCompressedTexture?T.mipmaps[O]:T.image;G!==null?(ot=G.max.x-G.min.x,gt=G.max.y-G.min.y,Et=G.isBox3?G.max.z-G.min.z:1,wt=G.min.x,Nt=G.min.y,Gt=G.isBox3?G.min.z:0):(ot=fe.width,gt=fe.height,Et=fe.depth||1,wt=0,Nt=0,Gt=0),W!==null?(Tt=W.x,ee=W.y,ue=W.z):(Tt=0,ee=0,ue=0);let We=Ot.convert(F.format),ie=Ot.convert(F.type),Rt;F.isData3DTexture?(R.setTexture3D(F,0),Rt=N.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(R.setTexture2DArray(F,0),Rt=N.TEXTURE_2D_ARRAY):(R.setTexture2D(F,0),Rt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,F.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,F.unpackAlignment);let Cn=N.getParameter(N.UNPACK_ROW_LENGTH),se=N.getParameter(N.UNPACK_IMAGE_HEIGHT),ln=N.getParameter(N.UNPACK_SKIP_PIXELS),Pi=N.getParameter(N.UNPACK_SKIP_ROWS),Ze=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,fe.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,fe.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,wt),N.pixelStorei(N.UNPACK_SKIP_ROWS,Nt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Gt);let _s=T.isDataArrayTexture||T.isData3DTexture,pe=F.isDataArrayTexture||F.isData3DTexture;if(T.isRenderTargetTexture||T.isDepthTexture){let Mn=St.get(T),xs=St.get(F),tn=St.get(Mn.__renderTarget),Gn=St.get(xs.__renderTarget);Ct.bindFramebuffer(N.READ_FRAMEBUFFER,tn.__webglFramebuffer),Ct.bindFramebuffer(N.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let Wn=0;Wn<Et;Wn++)_s&&N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,St.get(T).__webglTexture,O,Gt+Wn),T.isDepthTexture?(pe&&N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,St.get(F).__webglTexture,O,ue+Wn),N.blitFramebuffer(wt,Nt,ot,gt,Tt,ee,ot,gt,N.DEPTH_BUFFER_BIT,N.NEAREST)):pe?N.copyTexSubImage3D(Rt,O,Tt,ee,ue+Wn,wt,Nt,ot,gt):N.copyTexSubImage2D(Rt,O,Tt,ee,ue+Wn,wt,Nt,ot,gt);Ct.bindFramebuffer(N.READ_FRAMEBUFFER,null),Ct.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else pe?T.isDataTexture||T.isData3DTexture?N.texSubImage3D(Rt,O,Tt,ee,ue,ot,gt,Et,We,ie,fe.data):F.isCompressedArrayTexture?N.compressedTexSubImage3D(Rt,O,Tt,ee,ue,ot,gt,Et,We,fe.data):N.texSubImage3D(Rt,O,Tt,ee,ue,ot,gt,Et,We,ie,fe):T.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,O,Tt,ee,ot,gt,We,ie,fe.data):T.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,O,Tt,ee,fe.width,fe.height,We,fe.data):N.texSubImage2D(N.TEXTURE_2D,O,Tt,ee,ot,gt,We,ie,fe);N.pixelStorei(N.UNPACK_ROW_LENGTH,Cn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,se),N.pixelStorei(N.UNPACK_SKIP_PIXELS,ln),N.pixelStorei(N.UNPACK_SKIP_ROWS,Pi),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ze),O===0&&F.generateMipmaps&&N.generateMipmap(Rt),Ct.unbindTexture()},this.copyTextureToTexture3D=function(T,F,G=null,W=null,O=0){return T.isTexture!==!0&&(ws("WebGLRenderer: copyTextureToTexture3D function signature has changed."),G=arguments[0]||null,W=arguments[1]||null,T=arguments[2],F=arguments[3],O=arguments[4]||0),ws('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(T,F,G,W,O)},this.initRenderTarget=function(T){St.get(T).__webglFramebuffer===void 0&&R.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?R.setTextureCube(T,0):T.isData3DTexture?R.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?R.setTexture2DArray(T,0):R.setTexture2D(T,0),Ct.unbindTexture()},this.resetState=function(){w=0,C=0,P=null,Ct.reset(),jt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return On}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}};var kr=class extends Ge{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new wn,this.environmentIntensity=1,this.environmentRotation=new wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var Us=class extends ni{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new At(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Vc=new me,Yo=new xi,_r=new is,xr=new z,Br=class extends Ge{constructor(t=new be,e=new Us){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),_r.copy(n.boundingSphere),_r.applyMatrix4(s),_r.radius+=r,t.ray.intersectsSphere(_r)===!1)return;Vc.copy(s).invert(),Yo.copy(t.ray).applyMatrix4(Vc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,o.start),d=Math.min(c.count,o.start+o.count);for(let y=f,m=d;y<m;y++){let g=c.getX(y);xr.fromBufferAttribute(u,g),Gc(xr,g,l,s,t,e,this)}}else{let f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let y=f,m=d;y<m;y++)xr.fromBufferAttribute(u,y),Gc(xr,y,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Gc(i,t,e,n,s,r,o){let a=Yo.distanceSqToPoint(i);if(a<e){let l=new z;Yo.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var Mi=class extends $e{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ns=class i extends be{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],f=[],d=[],y=0,m=[],g=n/2,p=0;M(),o===!1&&(t>0&&b(!0),e>0&&b(!1)),this.setIndex(h),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(f,3)),this.setAttribute("uv",new we(d,2));function M(){let x=new z,_=new z,w=0,C=(e-t)/n;for(let P=0;P<=r;P++){let E=[],v=P/r,A=v*(e-t)+t;for(let L=0;L<=s;L++){let I=L/s,D=I*l+a,H=Math.sin(D),k=Math.cos(D);_.x=A*H,_.y=-v*n+g,_.z=A*k,u.push(_.x,_.y,_.z),x.set(H,C,k).normalize(),f.push(x.x,x.y,x.z),d.push(I,1-v),E.push(y++)}m.push(E)}for(let P=0;P<s;P++)for(let E=0;E<r;E++){let v=m[E][P],A=m[E+1][P],L=m[E+1][P+1],I=m[E][P+1];(t>0||E!==0)&&(h.push(v,A,I),w+=3),(e>0||E!==r-1)&&(h.push(A,L,I),w+=3)}c.addGroup(p,w,0),p+=w}function b(x){let _=y,w=new Dt,C=new z,P=0,E=x===!0?t:e,v=x===!0?1:-1;for(let L=1;L<=s;L++)u.push(0,g*v,0),f.push(0,v,0),d.push(.5,.5),y++;let A=y;for(let L=0;L<=s;L++){let D=L/s*l+a,H=Math.cos(D),k=Math.sin(D);C.x=E*k,C.y=g*v,C.z=E*H,u.push(C.x,C.y,C.z),f.push(0,v,0),w.x=H*.5+.5,w.y=k*.5*v+.5,d.push(w.x,w.y),y++}for(let L=0;L<s;L++){let I=_+L,D=A+L;x===!0?h.push(D,D+1,I):h.push(D+1,D,I),P+=3}c.addGroup(p,P,x===!0?1:2),p+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Fs=class i extends Ns{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var zr=class i extends be{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=t,f=(e-t)/s,d=new z,y=new Dt;for(let m=0;m<=s;m++){for(let g=0;g<=n;g++){let p=r+g/n*o;d.x=u*Math.cos(p),d.y=u*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),y.x=(d.x/e+1)/2,y.y=(d.y/e+1)/2,h.push(y.x,y.y)}u+=f}for(let m=0;m<s;m++){let g=m*(n+1);for(let p=0;p<n;p++){let M=p+g,b=M,x=M+n+1,_=M+n+2,w=M+1;a.push(b,x,w),a.push(x,_,w)}}this.setIndex(a),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};var Os=class extends ni{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new At(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new At(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ah,this.normalScale=new Dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.combine=al,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function vr(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function e0(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var os=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},qo=class extends os{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Xl,endingEnd:Xl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Yl:r=t,a=2*e-n;break;case ql:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Yl:o=t,l=2*n-e;break;case ql:o=1,l=n+s[1]-s[0];break;default:o=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,y=(n-e)/(s-e),m=y*y,g=m*y,p=-f*g+2*f*m-f*y,M=(1+f)*g+(-1.5-2*f)*m+(-.5+f)*y+1,b=(-1-d)*g+(1.5+d)*m+.5*y,x=d*g-d*m;for(let _=0;_!==a;++_)r[_]=p*o[h+_]+M*o[c+_]+b*o[l+_]+x*o[u+_];return r}},Zo=class extends os{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(s-e),u=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*u+o[l+f]*h;return r}},Ko=class extends os{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},yn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=vr(e,this.TimeBufferType),this.values=vr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:vr(t.times,Array),values:vr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Ko(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Zo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new qo(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Tr:e=this.InterpolantFactoryMethodDiscrete;break;case Ro:e=this.InterpolantFactoryMethodLinear;break;case ma:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Tr;case this.InterpolantFactoryMethodLinear:return Ro;case this.InterpolantFactoryMethodSmooth:return ma}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&e0(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===ma,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*n,f=u-n,d=u+n;for(let y=0;y!==n;++y){let m=e[u+y];if(m!==e[f+y]||m!==e[d+y]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)e[f+d]=e[u+d]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};yn.prototype.TimeBufferType=Float32Array;yn.prototype.ValueBufferType=Float32Array;yn.prototype.DefaultInterpolation=Ro;var bi=class extends yn{constructor(t,e,n){super(t,e,n)}};bi.prototype.ValueTypeName="bool";bi.prototype.ValueBufferType=Array;bi.prototype.DefaultInterpolation=Tr;bi.prototype.InterpolantFactoryMethodLinear=void 0;bi.prototype.InterpolantFactoryMethodSmooth=void 0;var Jo=class extends yn{};Jo.prototype.ValueTypeName="color";var $o=class extends yn{};$o.prototype.ValueTypeName="number";var jo=class extends os{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)mn.slerpFlat(r,0,o,c-a,o,c,l);return r}},Hr=class extends yn{InterpolantFactoryMethodLinear(t){return new jo(this.times,this.values,this.getValueSize(),t)}};Hr.prototype.ValueTypeName="quaternion";Hr.prototype.InterpolantFactoryMethodSmooth=void 0;var Si=class extends yn{constructor(t,e,n){super(t,e,n)}};Si.prototype.ValueTypeName="string";Si.prototype.ValueBufferType=Array;Si.prototype.DefaultInterpolation=Tr;Si.prototype.InterpolantFactoryMethodLinear=void 0;Si.prototype.InterpolantFactoryMethodSmooth=void 0;var Qo=class extends yn{};Qo.prototype.ValueTypeName="vector";var tl=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],y=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return y}return null}}},n0=new tl,el=class{constructor(t){this.manager=t!==void 0?t:n0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};el.DEFAULT_MATERIAL_NAME="__DEFAULT";var Vr=class extends Ge{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new At(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}};var Va=new me,Wc=new z,Xc=new z,nl=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Dt(512,512),this.map=null,this.mapPass=null,this.matrix=new me,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ds,this._frameExtents=new Dt(1,1),this._viewportCount=1,this._viewports=[new Me(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Wc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Wc),Xc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Xc),e.updateMatrixWorld(),Va.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Va),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Va)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var il=class extends nl{constructor(){super(new as(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Gr=class extends Vr{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ge.DEFAULT_UP),this.updateMatrix(),this.target=new Ge,this.shadow=new il}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}},Wr=class extends Vr{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}};var ml="\\[\\]\\.:\\/",i0=new RegExp("["+ml+"]","g"),gl="[^"+ml+"]",s0="[^"+ml.replace("\\.","")+"]",r0=/((?:WC+[\/:])*)/.source.replace("WC",gl),a0=/(WCOD+)?/.source.replace("WCOD",s0),o0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gl),l0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gl),c0=new RegExp("^"+r0+a0+o0+l0+"$"),h0=["material","materials","bones","map"],sl=class{constructor(t,e,n){let s=n||ge.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},ge=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(i0,"")}static parseTrackName(t){let e=c0.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);h0.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ge.Composite=sl;ge.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ge.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ge.prototype.GetterByBindingType=[ge.prototype._getValue_direct,ge.prototype._getValue_array,ge.prototype._getValue_arrayElement,ge.prototype._getValue_toArray];ge.prototype.SetterByBindingTypeAndVersioning=[[ge.prototype._setValue_direct,ge.prototype._setValue_direct_setNeedsUpdate,ge.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_array,ge.prototype._setValue_array_setNeedsUpdate,ge.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_arrayElement,ge.prototype._setValue_arrayElement_setNeedsUpdate,ge.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_fromArray,ge.prototype._setValue_fromArray_setNeedsUpdate,ge.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var hy=new Float32Array(1);var Yc=new me,Xr=class{constructor(t,e,n=0,s=1/0){this.ray=new xi(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Ls,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Yc.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Yc),this}intersectObject(t,e=!0,n=[]){return rl(t,this,n,e),n.sort(qc),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)rl(t[s],this,n,e);return n.sort(qc),n}};function qc(i,t){return i.distance-t.distance}function rl(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let o=0,a=r.length;o<a;o++)rl(r[o],t,e,!0)}}var ks=class{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Fe(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Yr=class extends zn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var _h={type:"change"},_l={type:"start"},vh={type:"end"},Jr=new xi,xh=new dn,u0=Math.cos(70*lh.DEG2RAD),Ce=new z,qe=2*Math.PI,ce={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},yl=1e-6,$r=class extends Yr{constructor(t,e=null){super(t,e),this.state=ce.NONE,this.enabled=!0,this.target=new z,this.cursor=new z,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ei.ROTATE,MIDDLE:Ei.DOLLY,RIGHT:Ei.PAN},this.touches={ONE:wi.ROTATE,TWO:wi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new z,this._lastQuaternion=new mn,this._lastTargetPosition=new z,this._quat=new mn().setFromUnitVectors(t.up,new z(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ks,this._sphericalDelta=new ks,this._scale=1,this._panOffset=new z,this._rotateStart=new Dt,this._rotateEnd=new Dt,this._rotateDelta=new Dt,this._panStart=new Dt,this._panEnd=new Dt,this._panDelta=new Dt,this._dollyStart=new Dt,this._dollyEnd=new Dt,this._dollyDelta=new Dt,this._dollyDirection=new z,this._mouse=new Dt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=f0.bind(this),this._onPointerDown=d0.bind(this),this._onPointerUp=p0.bind(this),this._onContextMenu=M0.bind(this),this._onMouseWheel=y0.bind(this),this._onKeyDown=_0.bind(this),this._onTouchStart=x0.bind(this),this._onTouchMove=v0.bind(this),this._onMouseDown=m0.bind(this),this._onMouseMove=g0.bind(this),this._interceptControlDown=b0.bind(this),this._interceptControlUp=S0.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(_h),this.update(),this.state=ce.NONE}update(t=null){let e=this.object.position;Ce.copy(e).sub(this.target),Ce.applyQuaternion(this._quat),this._spherical.setFromVector3(Ce),this.autoRotate&&this.state===ce.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=qe:n>Math.PI&&(n-=qe),s<-Math.PI?s+=qe:s>Math.PI&&(s-=qe),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Ce.setFromSpherical(this._spherical),Ce.applyQuaternion(this._quatInverse),e.copy(this.target).add(Ce),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Ce.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new z(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new z(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Ce.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Jr.origin.copy(this.object.position),Jr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Jr.direction))<u0?this.object.lookAt(this.target):(xh.setFromNormalAndCoplanarPoint(this.object.up,this.target),Jr.intersectPlane(xh,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>yl||8*(1-this._lastQuaternion.dot(this.object.quaternion))>yl||this._lastTargetPosition.distanceToSquared(this.target)>yl?(this.dispatchEvent(_h),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?qe/60*this.autoRotateSpeed*t:qe/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Ce.setFromMatrixColumn(e,0),Ce.multiplyScalar(-t),this._panOffset.add(Ce)}_panUp(t,e){this.screenSpacePanning===!0?Ce.setFromMatrixColumn(e,1):(Ce.setFromMatrixColumn(e,0),Ce.crossVectors(this.object.up,Ce)),Ce.multiplyScalar(t),this._panOffset.add(Ce)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Ce.copy(s).sub(this.target);let r=Ce.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(qe*this._rotateDelta.x/e.clientHeight),this._rotateUp(qe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(qe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-qe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(qe*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-qe*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(qe*this._rotateDelta.x/e.clientHeight),this._rotateUp(qe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Dt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function d0(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function f0(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function p0(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(vh),this.state=ce.NONE;break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function m0(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Ei.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ce.DOLLY;break;case Ei.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ce.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ce.ROTATE}break;case Ei.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ce.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ce.PAN}break;default:this.state=ce.NONE}this.state!==ce.NONE&&this.dispatchEvent(_l)}function g0(i){switch(this.state){case ce.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ce.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ce.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function y0(i){this.enabled===!1||this.enableZoom===!1||this.state!==ce.NONE||(i.preventDefault(),this.dispatchEvent(_l),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(vh))}function _0(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function x0(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case wi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=ce.TOUCH_ROTATE;break;case wi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=ce.TOUCH_PAN;break;default:this.state=ce.NONE}break;case 2:switch(this.touches.TWO){case wi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ce.TOUCH_DOLLY_PAN;break;case wi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ce.TOUCH_DOLLY_ROTATE;break;default:this.state=ce.NONE}break;default:this.state=ce.NONE}this.state!==ce.NONE&&this.dispatchEvent(_l)}function v0(i){switch(this._trackPointer(i),this.state){case ce.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ce.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ce.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ce.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ce.NONE}}function M0(i){this.enabled!==!1&&i.preventDefault()}function b0(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function S0(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var E0=`
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 prev;
attribute vec3 next;
attribute float side;
attribute vec3 wing;
attribute float upy;
attribute float tsec;
uniform float uWidth;
uniform float uRibbon;
uniform float uHalf;
uniform vec2 uRes;
varying float vShade;
varying float vT;
vec2 toScreen(vec4 c) { return c.xy / max(abs(c.w), 1e-6) * sign(c.w + 1e-9) * uRes * 0.5; }
void main() {
  vShade = 1.0; vT = tsec;
  if (uRibbon > 0.5) {
    vec3 p = position + wing * side * uHalf;
    vShade = 0.55 + 0.45 * clamp(upy, -1.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  } else {
    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 c = m * vec4(position, 1.0);
    vec4 a = m * vec4(prev, 1.0);
    vec4 b = m * vec4(next, 1.0);
    vec2 sc = toScreen(c), sa = toScreen(a), sb = toScreen(b);
    vec2 d1 = sc - sa, d2 = sb - sc;
    vec2 dir = length(d1) > 0.001 ? normalize(d1) : vec2(1.0, 0.0);
    if (length(d2) > 0.001) dir = normalize(length(d1) > 0.001 ? normalize(d1) + normalize(d2) : d2);
    vec2 nrm = vec2(-dir.y, dir.x);
    c.xy += nrm * side * uWidth / uRes * 2.0 * c.w * 0.5;
    gl_Position = c;
  }
  #include <logdepthbuf_vertex>
}`,w0=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uOpacity;
uniform float uHead;
uniform float uFade;
varying float vShade;
varying float vT;
void main() {
  #include <logdepthbuf_fragment>
  float a = uOpacity;
  if (uFade > 0.0) a *= clamp(1.0 - (uHead - vT) / uFade, 0.12, 1.0);
  float s = gl_FrontFacing ? vShade : vShade * 0.8;
  gl_FragColor = vec4(uColor * s, a);
}`;function T0(){return new je({vertexShader:E0,fragmentShader:w0,transparent:!0,depthWrite:!1,side:Pe,uniforms:{uWidth:{value:2},uRibbon:{value:0},uHalf:{value:10},uRes:{value:new Dt(800,600)},uColor:{value:new At(1,1,1)},uOpacity:{value:.8},uHead:{value:0},uFade:{value:0}}})}var zs=class{constructor(t,e,n,s){j(this,"mesh");j(this,"geo");j(this,"mat");j(this,"n");j(this,"cen");j(this,"prv");j(this,"nxt");j(this,"wng");j(this,"upy");j(this,"orig");j(this,"origW");j(this,"origU");j(this,"patched",-1);let r=t.length/3;this.n=r;let o=r*2;this.cen=new Float32Array(o*3),this.prv=new Float32Array(o*3),this.nxt=new Float32Array(o*3),this.wng=new Float32Array(o*3),this.upy=new Float32Array(o);let a=new Float32Array(o),l=new Float32Array(o);this.orig=t,this.origW=e||new Float32Array(r*3),this.origU=n||new Float32Array(r).fill(1);for(let f=0;f<r;f++){for(let d=0;d<2;d++){let y=f*2+d;a[y]=d?1:-1,l[y]=s[f]}this.writeCenter(f,t[f*3],t[f*3+1],t[f*3+2]),this.writeWing(f,this.origW[f*3],this.origW[f*3+1],this.origW[f*3+2],this.origU[f])}let c=new Uint32Array(Math.max(1,r-1)*6);for(let f=0;f<r-1;f++){let d=f*2;c.set([d,d+1,d+2,d+1,d+3,d+2],f*6)}let h=new be,u=(f,d)=>new re(f,d).setUsage(cs);h.setAttribute("position",u(this.cen,3)),h.setAttribute("prev",u(this.prv,3)),h.setAttribute("next",u(this.nxt,3)),h.setAttribute("wing",u(this.wng,3)),h.setAttribute("upy",u(this.upy,1)),h.setAttribute("side",new re(a,1)),h.setAttribute("tsec",new re(l,1)),h.setIndex(new re(c,1)),this.geo=h,this.mat=T0(),this.mesh=new ye(h,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1}setV(t,e,n,s,r){if(e<0||e>=this.n)return;let o=e*6;t[o]=n,t[o+1]=s,t[o+2]=r,t[o+3]=n,t[o+4]=s,t[o+5]=r}writeCenter(t,e,n,s){this.setV(this.cen,t,e,n,s),this.setV(this.prv,t+1,e,n,s),this.setV(this.nxt,t-1,e,n,s),t===0&&this.setV(this.prv,0,e,n,s),t===this.n-1&&this.setV(this.nxt,t,e,n,s)}writeWing(t,e,n,s,r){this.setV(this.wng,t,e,n,s),this.upy[t*2]=r,this.upy[t*2+1]=r}touch(){for(let t of["position","prev","next","wing","upy"])this.geo.getAttribute(t).needsUpdate=!0}update(t,e,n,s,r){let o=n?e+1:-1,a=!1;if(this.patched!==o&&this.patched>=0&&this.patched<this.n){let c=this.patched,h=this.orig;this.writeCenter(c,h[c*3],h[c*3+1],h[c*3+2]),this.writeWing(c,this.origW[c*3],this.origW[c*3+1],this.origW[c*3+2],this.origU[c]),a=!0}this.patched=o;let l=e-t+1;if(o>=0&&o<this.n&&n&&(this.writeCenter(o,n[0],n[1],n[2]),s&&this.writeWing(o,s[0],s[1],s[2],r),l+=1,a=!0),a&&this.touch(),l<2){this.mesh.visible=!1;return}this.geo.setDrawRange(t*6,(l-1)*6),this.mesh.visible=!0}dispose(){this.geo.dispose(),this.mat.dispose()}},A0=`
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 other;
attribute float side;
attribute vec3 color;
uniform float uWidth;
uniform vec2 uRes;
varying vec3 vColor;
vec2 toScreen(vec4 c) { return c.xy / max(abs(c.w), 1e-6) * sign(c.w + 1e-9) * uRes * 0.5; }
void main() {
  vColor = color;
  mat4 m = projectionMatrix * modelViewMatrix;
  vec4 c = m * vec4(position, 1.0);
  vec4 o = m * vec4(other, 1.0);
  vec2 d = toScreen(o) - toScreen(c);
  vec2 dir = length(d) > 0.001 ? normalize(d) : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  c.xy += nrm * side * uWidth / uRes * c.w;
  gl_Position = c;
  #include <logdepthbuf_vertex>
}`,C0=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uOpacity;
varying vec3 vColor;
void main() {
  #include <logdepthbuf_fragment>
  gl_FragColor = vec4(vColor, uOpacity);
}`,Hs=class{constructor(t,e=2,n=.9){j(this,"mesh");j(this,"mat");j(this,"pos");j(this,"oth");j(this,"col");j(this,"geo");j(this,"cap");j(this,"count",0);t=Math.max(1,t),this.cap=t;let s=t*4;this.pos=new Float32Array(s*3),this.oth=new Float32Array(s*3),this.col=new Float32Array(s*3);let r=new Float32Array(s),o=new Uint32Array(t*6);for(let c=0;c<t;c++){r.set([-1,1,1,-1],c*4);let h=c*4;o.set([h,h+1,h+3,h,h+3,h+2],c*6)}let a=new be,l=c=>new re(c,3).setUsage(cs);a.setAttribute("position",l(this.pos)),a.setAttribute("other",l(this.oth)),a.setAttribute("color",l(this.col)),a.setAttribute("side",new re(r,1)),a.setIndex(new re(o,1)),a.setDrawRange(0,0),this.geo=a,this.mat=new je({vertexShader:A0,fragmentShader:C0,transparent:!0,depthWrite:!1,side:Pe,uniforms:{uWidth:{value:e},uRes:{value:new Dt(800,600)},uOpacity:{value:n}}}),this.mesh=new ye(a,this.mat),this.mesh.frustumCulled=!1}begin(){this.count=0}add(t,e,n,s,r,o,a,l=a){if(this.count>=this.cap)return;let c=this.count*4,h=this.pos,u=this.oth,f=this.col,d=(y,m,g,p,M)=>{y[m*3]=g,y[m*3+1]=p,y[m*3+2]=M};d(h,c,t,e,n),d(h,c+1,t,e,n),d(h,c+2,s,r,o),d(h,c+3,s,r,o),d(u,c,s,r,o),d(u,c+1,s,r,o),d(u,c+2,t,e,n),d(u,c+3,t,e,n),d(f,c,a.r,a.g,a.b),d(f,c+1,a.r,a.g,a.b),d(f,c+2,l.r,l.g,l.b),d(f,c+3,l.r,l.g,l.b),this.count++}end(){this.geo.setDrawRange(0,this.count*6);for(let t of["position","other","color"])this.geo.getAttribute(t).needsUpdate=!0}};var ds=[[0,.3],[.8,.32],[1,.55],[1.2,.62],[1.4,.58],[1.8,.48],[2.2,.43],[2.7,.37],[3.2,.34],[3.7,.32],[5,.29]];function R0(i){for(let t=0;t<ds.length-1;t++)if(i<=ds[t+1][0]){let e=ds[t],n=ds[t+1];return e[1]+(n[1]-e[1])*(i-e[0])/(n[0]-e[0])}return ds[ds.length-1][1]}function P0(i){i=Math.max(0,i);let t,e;return i<=11e3?(t=288.15-.0065*i,e=101325*Math.pow(t/288.15,5.2559)):(t=216.65,e=22632*Math.exp(-(i-11e3)/6341.6)),[e/(287.05*t),Math.sqrt(1.4*287.05*t)]}function I0(i,t){return i.burn<=0&&i.burn1<=0?[0,i.mass]:t<i.burn?[i.thrust,i.mass-(i.mass-i.massEnd)*t/i.burn]:i.burn1>0&&t<i.burn+i.burn1?[i.thrust1,i.massEnd-(i.massEnd-i.massEnd1)*(t-i.burn)/i.burn1]:[0,i.burn1>0?i.massEnd1:i.massEnd]}function Mh(i,t,e,n,s,r,o,a){let l=Math.PI*i.caliber*i.caliber/4,c=(e+n)/2;i.loft&&(c+=Math.min(5e3,.08*t));let[h,u]=P0(c),f=n-e,d=Math.hypot(t,f),y=d>0?f/d:0,m=Math.max(280,1.1*a),g=Math.min(i.life,i.guidanceTime);g<=0&&(g=60);let p=i.burn+i.burn1,M=Math.max(s,50),b=0,x=0,_=.1;for(;x<g;){let[w,C]=I0(i,x),P=1.4*.5*h*M*M*l*i.cxK*R0(M/u);M+=((w-P)/C-9.81*y)*_,i.machMax>0&&(M=Math.min(M,i.machMax*u)),b+=M*_,x+=_;let E=t+r*x,v=o*x;if(b>=Math.sqrt(E*E+v*v+f*f))return M>=m||x<p;if(M<m&&x>p)return!1}return!1}function bh(i,t){let e=i.multipath;if(!e||e.length!==4||t==null)return 0;let[n,s,r,o]=e;return r<=n?0:t<=n?s:t>=r?o:s+(o-s)*(t-n)/(r-n)}function jr(i,t,e,n,s,r){if(!i||i.thrust<=0||i.caliber<=0||i.mass<=0)return[0,0];let o=r*Math.PI/180,a=(l,c)=>{let h=1e3,u=25e4;if(!Mh(i,h,t,n,e,l,c,s))return 0;for(let f=0;f<22&&u-h>100;f++){let d=(h+u)/2;Mh(i,d,t,n,e,l,c,s)?h=d:u=d}return h};return[Math.round(a(-s*Math.cos(o),s*Math.sin(o))),Math.round(a(s,0))]}var sn,fs=null;async function Qr(){if(sn!==void 0)return sn;sn=null;try{let i=await fetch("/api/catalog/weapons.json");i.ok&&(sn=(await i.json()).missiles)}catch{}if(sn){fs=new Map;for(let i of Object.keys(sn).sort()){let t=String(sn[i].name||"").toLowerCase();!fs.has(t)&&sn[i].physics&&fs.set(t,i)}}return sn}function Vs(i,t){if(!sn||!fs)return null;let e=i&&sn[i]?i:fs.get(t.toLowerCase())||"";if(!e){let r=t.toLowerCase(),o="";for(let[a,l]of fs)a.length>r.length&&a.startsWith(r)&&(!o||a<o)&&(o=a,e=l)}let n=e?sn[e]:null;if(!n||!n.physics)return null;let s=n.physics;return{name:n.name,caliber:s.caliberM||0,cxK:s.cxK||1,thrust:s.thrustN||0,burn:s.burnS||0,mass:s.massKg||0,massEnd:s.massEndKg||s.massKg||0,thrust1:s.thrust1N||0,burn1:s.burn1S||0,massEnd1:s.massEnd1Kg||s.massEndKg||s.massKg||0,machMax:s.machMax||0,life:s.lifeS||60,guidanceTime:s.guidanceTimeS||60,loft:!!s.loft,multipath:s.multipath||null,guidance:n.guidance||""}}var Oe={me:16769357,friend:5088255,enemy:16738877,neutral:11055292,flare:16765514,chaff:14015974,bomb:16757575,dead:9081760},xe=Math.PI/180,Sh=18,Eh=5,Rh=9.5;function L0(){let i=new be,t=Rh/2,e=1.8,n=1.7,s=t-1.4,r=[[-e,.35,-s],[e,.35,-s],[e,.35,t],[-e,.35,t],[-e,n,-s+.9],[e,n,-s+.9],[e,n,t],[-e,n,t],[-e,.8,-t],[e,.8,-t]],o=[],a=(l,c,h,u)=>{for(let f of[l,c,h,l,h,u])o.push(...r[f])};return a(4,5,6,7),a(3,2,1,0),a(7,6,2,3),a(0,1,9,8),a(8,9,5,4),a(0,8,4,7),a(7,3,0,7),a(1,2,6,5),a(5,9,1,5),i.setAttribute("position",new we(o,3)),i.computeVertexNormals(),i}function D0(){let i=new vi(3,.9,3.6);i.translate(0,.45,.3);let t=new Ns(.16,.2,5.6,6);t.rotateX(Math.PI/2),t.translate(0,.5,-4.3);let e=new be,n=i.toNonIndexed().getAttribute("position").array,s=t.toNonIndexed().getAttribute("position").array,r=new Float32Array(n.length+s.length);return r.set(n,0),r.set(s,n.length),e.setAttribute("position",new re(r,3)),e.computeVertexNormals(),e}function U0(){let i=[],t=(c,h,u)=>i.push(...c,...h,...u),e=[0,0,-9],n=[0,.2,8.5],s=[0,1.3,.5],r=[0,-.9,.5],o=[-1.3,0,1],a=[1.3,0,1];t(e,s,a),t(e,o,s),t(e,a,r),t(e,r,o),t(n,a,s),t(n,s,o),t(n,r,a),t(n,o,r),t([1,0,-2.5],[6.5,0,4.5],[1,0,5.5]),t([-1,0,-2.5],[-1,0,5.5],[-6.5,0,4.5]),t([.8,0,6],[3.4,0,9],[.8,0,9]),t([-.8,0,6],[-.8,0,9],[-3.4,0,9]),t([0,.9,4.5],[0,4.2,8.6],[0,.6,8.6]);let l=new be;return l.setAttribute("position",new we(i,3)),l.computeVertexNormals(),l}var wh=new Map;function Th(i,t,e){let n=i+"_"+t+"_"+e,s=wh.get(n);if(s)return s;let r=Math.max(4,Math.ceil(i/6)),o=[],a=(u,f)=>[Math.sin(u*xe)*Math.cos(f*xe),Math.sin(f*xe),-Math.cos(u*xe)*Math.cos(f*xe)],l=(u,f,d)=>o.push(...u,...f,...d),c=[0,0,0];for(let u=0;u<r;u++){let f=-i+2*i*u/r,d=-i+2*i*(u+1)/r,y=a(f,e),m=a(d,e),g=a(f,t),p=a(d,t);l(c,y,m),l(c,p,g),l(y,g,p),l(y,p,m)}l(c,a(-i,t),a(-i,e)),l(c,a(i,e),a(i,t));let h=new be;return h.setAttribute("position",new we(o,3)),wh.set(n,h),h}function Ah(i,t,e){let n=i*xe,s=t*xe,r=e*xe,o=Math.sin(n),a=Math.cos(n),l=Math.sin(s),c=Math.cos(s),h=Math.sin(r),u=Math.cos(r),f=a,d=-o,y=-o*l,m=c,g=-a*l,p=f*u-y*h,M=-m*h,b=d*u-g*h;return[p,M,-b,m*u]}function N0(){let i=document.createElement("canvas");i.width=i.height=32;let t=i.getContext("2d");return t.strokeStyle="#fff",t.lineWidth=4,t.lineJoin="round",t.beginPath(),t.moveTo(16,3),t.lineTo(29,16),t.lineTo(16,29),t.lineTo(3,16),t.closePath(),t.stroke(),new Mi(i)}function F0(){let i=document.createElement("canvas");i.width=i.height=32;let t=i.getContext("2d");return t.strokeStyle="#fff",t.lineWidth=5,t.lineCap="round",t.beginPath(),t.moveTo(6,6),t.lineTo(26,26),t.moveTo(26,6),t.lineTo(6,26),t.stroke(),new Mi(i)}var ta=class{constructor(t,e,n){j(this,"renderer");j(this,"scene",new kr);j(this,"camera");j(this,"cam2d");j(this,"mode","3d");j(this,"controls");j(this,"session",null);j(this,"settings");j(this,"vis",[]);j(this,"byKind",{});j(this,"meSlot",-1);j(this,"myTeam",0);j(this,"selected",-1);j(this,"measure",-1);j(this,"follow",-1);j(this,"onSelect",()=>{});j(this,"t",0);j(this,"root",new jn);j(this,"terrainMesh",null);j(this,"terrainTex",null);j(this,"acGeo",U0());j(this,"hullGeo",L0());j(this,"turretGeo",D0());j(this,"shellSeg");j(this,"mgSeg");j(this,"gunSeg");j(this,"impactPts");j(this,"headPts");j(this,"detailMesh",null);j(this,"detailTex",null);j(this,"msGeo");j(this,"beamGeo");j(this,"cmPts");j(this,"bombPts");j(this,"groundPts");j(this,"deadPts");j(this,"activePts");j(this,"activeAt",new Map);j(this,"sticks");j(this,"desig");j(this,"seeker");j(this,"measureSeg");j(this,"vectors");j(this,"dlzSeg");j(this,"res",new Dt(800,600));j(this,"dlzInfo",null);j(this,"dlzCache",null);j(this,"onHover",()=>{});j(this,"onFollowChange",()=>{});j(this,"selRing");j(this,"labelLayer");j(this,"container");j(this,"s",{x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0});j(this,"lastLabelText",0);j(this,"followPrev",new z);j(this,"followHas",!1);j(this,"tmpM",new me);j(this,"vX",new z);j(this,"vY",new z);j(this,"vZ",new z);j(this,"vP",new z);j(this,"downAt",null);j(this,"nStaticGround",0);j(this,"airfieldLines",null);j(this,"areaLines",null);j(this,"mapLabels",[]);this.container=t,this.labelLayer=e,this.settings=n,this.renderer=new Or({antialias:!0,logarithmicDepthBuffer:!0}),this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),this.renderer.setClearColor(1448999),t.appendChild(this.renderer.domElement),this.camera=new Ve(45,1,5,9e5),this.camera.position.set(0,4e4,6e4),this.controls=new $r(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.maxPolarAngle=Math.PI*.495,this.controls.minDistance=30,this.controls.maxDistance=4e5,this.controls.zoomToCursor=!0,this.controls.screenSpacePanning=!1,this.controls.zoomSpeed=1.6,this.controls.rotateSpeed=.8,this.cam2d=new as(-1,1,1,-1,10,9e5),this.cam2d.up.set(0,0,-1),this.cam2d.position.set(0,3e5,0),this.cam2d.lookAt(0,0,0),this.cam2d.zoom=.006,this.scene.add(this.root),this.scene.add(new Wr(16777215,1.5));let s=new Gr(16777215,2);s.position.set(-.4,1,.5),this.scene.add(s),this.msGeo=new Fs(.7,Eh,6),this.msGeo.rotateX(-Math.PI/2),this.beamGeo=new Fs(1,1,20,1,!0),this.beamGeo.translate(0,-.5,0),this.beamGeo.rotateX(Math.PI/2);let r=this.renderer.domElement,o=null;r.addEventListener("pointerdown",a=>{if(this.mode!=="3d")return;(a.button===2||a.button===0&&(a.ctrlKey||a.metaKey))&&this.follow>=0&&(this.setFollow(-1),this.onFollowChange()),this.follow<0&&this.anchorPivot()},{capture:!0}),r.addEventListener("wheel",()=>{this.mode==="3d"&&this.follow<0&&this.anchorPivot()},{capture:!0,passive:!0}),r.addEventListener("pointerdown",a=>{this.downAt={x:a.clientX,y:a.clientY},this.mode==="2d"&&(o={x:a.clientX,y:a.clientY},r.setPointerCapture(a.pointerId))}),r.addEventListener("pointermove",a=>{if(!o&&!(a.buttons&7)){let c=r.getBoundingClientRect(),h=a.clientX-c.left,u=a.clientY-c.top;this.onHover(this.pick(h,u),h,u)}if(this.mode!=="2d"||!o)return;let l=1/this.cam2d.zoom;this.follow<0&&(this.cam2d.position.x-=(a.clientX-o.x)*l,this.cam2d.position.z-=(a.clientY-o.y)*l),o={x:a.clientX,y:a.clientY}}),r.addEventListener("pointercancel",()=>{o=null}),r.addEventListener("pointerleave",()=>this.onHover(-1,0,0)),r.addEventListener("wheel",a=>{if(this.mode!=="2d")return;a.preventDefault();let l=r.getBoundingClientRect(),c=this.cam2d,h=a.clientX-l.left-l.width/2,u=a.clientY-l.top-l.height/2,f=c.zoom,d=Math.min(2,Math.max(.002,f*Math.pow(1.0015,-a.deltaY)));this.follow<0&&(c.position.x+=h/f-h/d,c.position.z+=u/f-u/d),c.zoom=d,c.updateProjectionMatrix()},{passive:!1}),r.addEventListener("pointerup",a=>{if(o=null,!this.downAt)return;let l=Math.hypot(a.clientX-this.downAt.x,a.clientY-this.downAt.y);if(this.downAt=null,l<5&&a.button===0){let c=r.getBoundingClientRect(),h=this.pick(a.clientX-c.left,a.clientY-c.top);h>=0&&this.onSelect(h,a.shiftKey)}}),r.addEventListener("dblclick",a=>{let l=r.getBoundingClientRect(),c=this.pick(a.clientX-l.left,a.clientY-l.top);if(c>=0){this.onSelect(c,!1),this.setFollow(c),this.onFollowChange();return}if(this.mode!=="3d")return;let h=this.groundUnder(a.clientX-l.left,a.clientY-l.top);if(h){this.follow>=0&&(this.setFollow(-1),this.onFollowChange());let u=h.clone().sub(this.controls.target);this.controls.target.add(u),this.camera.position.add(u),this.controls.update()}}),new ResizeObserver(()=>this.resize()).observe(t),this.resize()}groundUnder(t,e){let n=this.container.clientWidth||800,s=this.container.clientHeight||600,r=new Xr;return r.setFromCamera(new Dt(t/n*2-1,-(e/s)*2+1),this.camera),this.marchGround(r.ray.origin,r.ray.direction)}marchGround(t,e){let n=this.session?this.session.terrain:null,s=l=>l.y-bn(n,l.x,-l.z),r=t.clone(),o=0,a=0;if(s(r)<=0)return null;for(let l=0;l<400&&a<4e5;l++){let c=s(r);if(c<=0){let h=o,u=a;for(let f=0;f<20;f++){let d=(h+u)/2;r.copy(t).addScaledVector(e,d),s(r)>0?h=d:u=d}return r.copy(t).addScaledVector(e,u)}o=a,a+=Math.max(20,c*.5),r.copy(t).addScaledVector(e,a)}return null}anchorPivot(){let t=new z;this.camera.getWorldDirection(t);let e=this.marchGround(this.camera.position,t);e&&e.distanceTo(this.camera.position)>this.controls.minDistance*1.5&&this.controls.target.copy(e)}resize(){let t=this.container.clientWidth||800,e=this.container.clientHeight||600;this.renderer.setSize(t,e,!1),this.renderer.domElement.style.width=t+"px",this.renderer.domElement.style.height=e+"px",this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.res.set(t,e);let n=this.cam2d;n.left=-t/2,n.right=t/2,n.top=e/2,n.bottom=-e/2,n.updateProjectionMatrix()}setSession(t){this.session=t,this.controls.minDistance=t.ground?6:30,this.root.clear(),this.labelLayer.innerHTML="",this.vis=[],this.byKind={aircraft:[],missile:[],countermeasure:[],bomb:[],ground:[]},this.selected=this.measure=this.follow=-1,this.followHas=!1,this.resolveMe(),this.buildTerrain(t.terrain);for(let a of t.units){let l={u:a,mesh:null,turret:null,trail:null,wing:null,beam:null,scan:null,scanKey:"",label:null,labelText:"",alive:!1,shown:!1,px:0,py:0,pz:0,sx:0,sy:0,onScreen:!1,color:16777215,focus:!1};if(this.vis.push(l),this.byKind[a.kind].push(l),a.kind==="aircraft"||a.kind==="missile"){let c=new Os({color:16777215,side:Pe,flatShading:!0});l.mesh=new ye(a.kind==="aircraft"?this.acGeo:this.msGeo,c),l.mesh.matrixAutoUpdate=!1,l.mesh.frustumCulled=!1,l.mesh.visible=!1,this.root.add(l.mesh);let h=a.n+1,u=new Float32Array(h*3),f=new Float32Array(h),d=a.heading?new Float32Array(h*3):null,y=a.heading?new Float32Array(h):null;for(let m=0;m<h;m++){let g=Math.min(m,a.n-1);if(u[m*3]=a.x[g],u[m*3+1]=a.y[g],u[m*3+2]=-a.z[g],f[m]=(a.t[g]-t.t0)/1e3,d&&y){let p=Ah(a.heading[g],a.pitch[g],a.roll[g]);d[m*3]=p[0],d[m*3+1]=p[1],d[m*3+2]=p[2],y[m]=p[3]}}l.trail=new zs(u,d,y,f),l.trail.mat.uniforms.uRes.value=this.res,this.root.add(l.trail.mesh)}else if(a.kind==="ground"&&!a.isStatic){let c=new Os({color:16777215,side:Pe,flatShading:!0});l.mesh=new ye(this.hullGeo,c),l.turret=new ye(this.turretGeo,c);for(let d of[l.mesh,l.turret])d.matrixAutoUpdate=!1,d.frustumCulled=!1,d.visible=!1,this.root.add(d);let h=a.n+1,u=new Float32Array(h*3),f=new Float32Array(h);for(let d=0;d<h;d++){let y=Math.min(d,a.n-1);u[d*3]=a.x[y],u[d*3+1]=a.y[y]+.6,u[d*3+2]=-a.z[y],f[d]=(a.t[y]-t.t0)/1e3}l.trail=new zs(u,null,null,f),l.trail.mat.uniforms.uRes.value=this.res,this.root.add(l.trail.mesh)}}let e=(a,l,c)=>{let h=new be;h.setAttribute("position",new re(new Float32Array(Math.max(1,a)*3),3).setUsage(cs)),h.setAttribute("color",new re(new Float32Array(Math.max(1,a)*3),3).setUsage(cs));let u=new Us({size:l,sizeAttenuation:!1,vertexColors:!0,map:c||null,alphaTest:c?.3:0,transparent:!!c}),f=new Br(h,u);return f.frustumCulled=!1,h.setDrawRange(0,0),this.root.add(f),f};this.cmPts=e(this.byKind.countermeasure.length,3.5),this.bombPts=e(this.byKind.bomb.length,4.5),this.groundPts=e(this.byKind.ground.length,5),this.deadPts=e(this.byKind.aircraft.length+this.byKind.ground.length,11,F0()),this.impactPts=e(4096,7),this.headPts=e(8192,4),this.activeAt.clear();for(let a of this.byKind.missile){let l=a.u;if(!l.seekerMode||!l.missile||l.missile.guidance!=="ARH")continue;let c=Array.from(l.seekerMode).indexOf(2);c>=0&&this.activeAt.set(l.id,c)}this.activePts=e(Math.max(1,this.activeAt.size),13,N0());let n=(a,l,c)=>{let h=new Hs(a,l,c);return h.mat.uniforms.uRes.value=this.res,this.root.add(h.mesh),h};this.sticks=n(this.byKind.aircraft.length,1,.35),this.desig=n(this.byKind.aircraft.length*8,1.6,.9),this.seeker=n(this.byKind.missile.length,1.4,.85),this.measureSeg=n(1,2,.95),this.vectors=n(this.byKind.aircraft.length,1.5,.8),this.dlzSeg=n(256,2,.85);let s=1,r=1;if(t.shots)for(let a of t.shots.list)a.cls==="mg"?r+=a.n+1:s+=a.n+1;this.shellSeg=n(Math.min(s,4e5),2.4,.95),this.mgSeg=n(Math.min(r,4e5),1,.75),this.gunSeg=n(this.byKind.ground.length,1.2,.7),this.dlzCache=null,this.dlzInfo=null;let o=new zr(.82,1,40);this.selRing=new ye(o,new gn({color:16777215,side:Pe,transparent:!0,opacity:.9,depthTest:!1})),this.selRing.visible=!1,this.selRing.renderOrder=10,this.root.add(this.selRing),this.buildMapOverlays(),this.restyle(),this.homeCamera()}resolveMe(){let t=this.session,e=(this.settings.me||"").trim().toLowerCase();if(this.meSlot=-1,this.myTeam=0,e)for(let n of t.players)n.name.toLowerCase()===e&&(this.meSlot=n.slot,this.myTeam=n.team);if(this.meSlot<0&&e){for(let n of t.players)if(n.name.toLowerCase().includes(e)){this.meSlot=n.slot,this.myTeam=n.team;break}}}colorFor(t){if(t.owner>=0&&t.owner===this.meSlot)return Oe.me;if(!t.team)return Oe.neutral;let e=this.myTeam||1;return t.team===e?Oe.friend:Oe.enemy}isFocus(t){if(t.id===this.selected||t.id===this.measure)return!0;let e=this.session;if(t.owner>=0){let n=e.playerBySlot.get(t.owner);if(n&&n.highlight)return!0;let s=this.selected>=0?e.units[this.selected]:null;if(s&&s.owner===t.owner)return!0}return!1}restyle(){if(!this.session)return;let t=new At,e=new At(16777215);for(let o of this.vis){if(o.color=this.colorFor(o.u),o.focus=this.isFocus(o.u),o.mesh){t.set(o.color),o.u.kind==="missile"&&t.lerp(e,.35),o.u.kind==="ground"&&o.u.player<0&&t.multiplyScalar(.7),o.mesh.material.color.copy(t);let a=o.trail.mat.uniforms;a.uColor.value.copy(t),a.uOpacity.value=o.focus?1:o.u.kind==="missile"?.8:.55}o.label&&o.label.classList.toggle("focus",o.focus)}let n=this.byKind.ground.filter(o=>!o.mesh),s=this.groundPts.geometry.getAttribute("position"),r=this.groundPts.geometry.getAttribute("color");for(let o=0;o<n.length;o++){let a=n[o].u;t.set(this.colorFor(a)).multiplyScalar(.75),r.setXYZ(o,t.r,t.g,t.b),s.setXYZ(o,a.x[0],Math.max(a.y[0],bn(this.session.terrain,a.x[0],a.z[0]))+(this.session.ground?3:8),-a.z[0])}this.nStaticGround=n.length,s.needsUpdate=!0,r.needsUpdate=!0}buildMapOverlays(){let t=this.session;this.mapLabels=[],this.airfieldLines=null,this.areaLines=null;let e=t.map;if(!e)return;let n=(u,f)=>bn(t.terrain,u,f),s=(u,f,d)=>{let y=u.length/6,m=new Hs(y,1.6,d);m.mat.uniforms.uRes.value=this.res;let g=new At;m.begin();for(let p=0;p<y;p++)g.setRGB(f[p*6],f[p*6+1],f[p*6+2]),m.add(u[p*6],u[p*6+1],u[p*6+2],u[p*6+3],u[p*6+4],u[p*6+5],g);return m.end(),this.root.add(m.mesh),m},r=(u,f,d,y,m)=>{let g=document.createElement("div");g.className="lbl map",g.textContent=u,g.style.display="none",this.labelLayer.appendChild(g),this.mapLabels.push({x:f,y:d,z:-y,div:g,kind:m})},o=new At,a=[],l=[],c=(u,f,d,y,m)=>{a.push(u,n(u,f)+m,-f,d,n(d,y)+m,-y),l.push(o.r,o.g,o.b,o.r,o.g,o.b)},h=this.myTeam||1;for(let u of e.airfields||[]){o.set(u.team===h?Oe.friend:u.team?Oe.enemy:Oe.neutral).lerp(new At(16777215),.35);let f=(u.lengthM||0)/2,d=Math.max(60,(u.widthM||0)/2),y=(u.headingDeg||0)*xe;if(f>0){let m=Math.sin(y),g=Math.cos(y),p=Math.cos(y),M=-Math.sin(y),b=[[-f,-d],[f,-d],[f,d],[-f,d]].map(([x,_])=>[u.x+m*x+p*_,u.z+g*x+M*_]);for(let x=0;x<4;x++)c(b[x][0],b[x][1],b[(x+1)%4][0],b[(x+1)%4][1],6);c(u.x-m*f,u.z-g*f,u.x+m*f,u.z+g*f,6)}else for(let m=0;m<16;m++){let g=m/16*6.2832,p=(m+1)/16*6.2832;c(u.x+800*Math.cos(g),u.z+800*Math.sin(g),u.x+800*Math.cos(p),u.z+800*Math.sin(p),6)}r(u.team===h?"My team airfield":"Enemy airfield",u.x,n(u.x,u.z)+6,u.z,"airfield")}a.length&&(this.airfieldLines=s(a,l,.95)),a=[],l=[];for(let u of e.areas||[])if(u.role!=="airSpawn"){if(o.set(u.role==="missionBorder"?16777215:u.role==="reloadArea"?10475176:14272511),u.type==="Sphere"||u.type==="Cylinder"){let f=u.sizeX/2,d=96;for(let y=0;y<d;y++){let m=y/d*6.2832,g=(y+1)/d*6.2832;c(u.x+f*Math.cos(m),u.z+f*Math.sin(m),u.x+f*Math.cos(g),u.z+f*Math.sin(g),40)}r(u.name.replace(/_/g," "),u.x,n(u.x,u.z+f)+40,u.z+f,"area")}else if(u.type==="Box"){let f=(u.rotationDeg||0)*xe,d=Math.sin(f),y=Math.cos(f),m=Math.cos(f),g=-Math.sin(f),p=u.sizeX/2,M=u.sizeZ/2,b=[[-p,-M],[p,-M],[p,M],[-p,M]].map(([x,_])=>[u.x+d*x+m*_,u.z+y*x+g*_]);for(let x=0;x<4;x++)for(let _=0;_<16;_++){let w=b[x],C=b[(x+1)%4];c(w[0]+(C[0]-w[0])*_/16,w[1]+(C[1]-w[1])*_/16,w[0]+(C[0]-w[0])*(_+1)/16,w[1]+(C[1]-w[1])*(_+1)/16,40)}r(u.name.replace(/_/g," "),b[2][0],n(b[2][0],b[2][1])+40,b[2][1],"area")}}a.length&&(this.areaLines=s(a,l,.6))}updateMapOverlays(t,e){let n=this.settings;this.airfieldLines&&(this.airfieldLines.mesh.visible=n.airfields),this.areaLines&&(this.areaLines.mesh.visible=n.areas);for(let s of this.mapLabels){let r=s.kind==="airfield"?n.airfields:n.areas,o=!1;r&&(this.vP.set(s.x,s.y,s.z).project(this.cam),o=this.vP.z<1&&Math.abs(this.vP.x)<1&&Math.abs(this.vP.y)<1,o&&(s.div.style.transform=`translate(${Math.round((this.vP.x*.5+.5)*t+6)}px, ${Math.round((-this.vP.y*.5+.5)*e-6)}px)`));let a=o?"":"none";s.div.style.display!==a&&(s.div.style.display=a)}}buildTerrain(t){let e=t?{x0:t.x0,z0:t.z0,x1:t.x1,z1:t.z1}:{x0:-65536,z0:-65536,x1:65536,z1:65536},n=513,s=new Float32Array(n*n*3),r=new Float32Array(n*n*2);for(let m=0;m<n;m++)for(let g=0;g<n;g++){let p=e.x0+(e.x1-e.x0)*g/(n-1),M=e.z0+(e.z1-e.z0)*m/(n-1),b=(m*n+g)*3;s[b]=p,s[b+1]=t?bn(t,p,M):0,s[b+2]=-M,r[(m*n+g)*2]=g/(n-1),r[(m*n+g)*2+1]=m/(n-1)}let o=new Uint32Array((n-1)*(n-1)*6),a=0,l=t?t.detail:null,c=m=>!!l&&s[m*3]>l.x0&&s[m*3]<l.x0+(l.w-1)*l.cell&&-s[m*3+2]>l.z0&&-s[m*3+2]<l.z0+(l.h-1)*l.cell,h=(e.x1-e.x0)/(n-1),u=m=>!!l&&s[m*3]>l.x0-h&&s[m*3]<l.x0+(l.w-1)*l.cell+h&&-s[m*3+2]>l.z0-h&&-s[m*3+2]<l.z0+(l.h-1)*l.cell+h;if(l)for(let m=0;m<n*n;m++)u(m)&&(s[m*3+1]-=40);for(let m=0;m<n-1;m++)for(let g=0;g<n-1;g++){let p=m*n+g,M=p+1,b=p+n,x=b+1;l&&c(p)&&c(M)&&c(b)&&c(x)||(o[a++]=p,o[a++]=M,o[a++]=b,o[a++]=M,o[a++]=x,o[a++]=b)}let f=new be;f.setAttribute("position",new re(s,3)),f.setAttribute("uv",new re(r,2)),f.setIndex(new re(o.subarray(0,a),1));let d=document.createElement("canvas");d.width=d.height=1024,this.terrainTex=new Mi(d),this.terrainTex.colorSpace=He,this.terrainTex.anisotropy=8,this.terrainMesh=new ye(f,new gn({map:this.terrainTex})),this.root.add(this.terrainMesh);let y=new ye(new rs(2e6,2e6),new gn({color:1053981}));y.rotation.x=-Math.PI/2,y.position.y=(t?Math.min(t.hMin,t.water):0)-30,this.root.add(y),this.detailMesh=null,this.detailTex=null,l&&this.buildDetail(t),this.paintTerrain()}buildDetail(t){let e=t.detail,n=Math.max(1,Math.round(e.w/512)),s=Math.floor((e.w-1)/n)+1,r=Math.floor((e.h-1)/n)+1,o=new Float32Array(s*r*3),a=new Float32Array(s*r*2);for(let f=0;f<r;f++)for(let d=0;d<s;d++){let y=f*s+d,m=e.x0+d*n*e.cell,g=e.z0+f*n*e.cell;o[y*3]=m,o[y*3+1]=Math.max(e.v[f*n*e.w+d*n],t.water),o[y*3+2]=-g,a[y*2]=d*n/(e.w-1),a[y*2+1]=f*n/(e.h-1)}let l=new Uint32Array((s-1)*(r-1)*6),c=0;for(let f=0;f<r-1;f++)for(let d=0;d<s-1;d++){let y=f*s+d,m=y+1,g=y+s,p=g+1;l[c++]=y,l[c++]=m,l[c++]=g,l[c++]=m,l[c++]=p,l[c++]=g}let h=new be;h.setAttribute("position",new re(o,3)),h.setAttribute("uv",new re(a,2)),h.setIndex(new re(l,1));let u=document.createElement("canvas");u.width=u.height=Math.min(2048,e.w),this.detailTex=new Mi(u),this.detailTex.colorSpace=He,this.detailTex.anisotropy=8,this.detailMesh=new ye(h,new gn({map:this.detailTex,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1})),this.root.add(this.detailMesh)}paintTerrain(){if(!this.terrainTex||!this.session)return;let t=this.session.terrain,e=this.terrainTex.image,n=e.width,s=e.getContext("2d"),r=s.createImageData(n,n),o=r.data,a=[[58,74,54],[92,104,72],[128,124,92],[150,140,118],[186,180,170],[225,224,220]];if(t){let l=t.detail?t.detail.hMin:t.hMin,c=t.detail?t.detail.hMax:t.hMax,h=t.n,u=t.h,f=Math.max(1,c-Math.max(l,t.water)),d=Math.max(l,t.water),y=-.6,m=.6,g=.55,p=Math.hypot(y,g,m);for(let M=0;M<h;M++)for(let b=0;b<h;b++){let x=u[M*h+b],_=((h-1-M)*n+b)*4;if(x<=t.water+.5){o[_]=38,o[_+1]=58,o[_+2]=82,o[_+3]=255;continue}let w=Math.min(.999,Math.max(0,(x-d)/f))*(a.length-1),C=Math.floor(w);w-=C;let P=a[C][0]+(a[C+1][0]-a[C][0])*w,E=a[C][1]+(a[C+1][1]-a[C][1])*w,v=a[C][2]+(a[C+1][2]-a[C][2])*w,A=1;if(this.settings.shade){let L=Math.max(0,b-1),I=Math.min(h-1,b+1),D=Math.max(0,M-1),H=Math.min(h-1,M+1),k=(u[M*h+I]-u[M*h+L])/((I-L)*t.cell)*1.6,Y=(u[H*h+b]-u[D*h+b])/((H-D)*t.cell)*1.6,B=Math.hypot(k,1,Y);A=.5+.62*Math.max(0,(-k*y+g-Y*m)/(B*p))/(g/p),A=Math.min(1.3,A)}o[_]=Math.min(255,P*A),o[_+1]=Math.min(255,E*A),o[_+2]=Math.min(255,v*A),o[_+3]=255}}else for(let l=0;l<o.length;l+=4)o[l]=44,o[l+1]=52,o[l+2]=60,o[l+3]=255;if(s.putImageData(r,0,0),this.settings.grid){let l=t?t.x0:-65536,c=t?t.x1:65536,h=t?t.z0:-65536,u=t?t.z1:65536;s.lineWidth=1;for(let f=Math.ceil(l/1e4)*10;f*1e3<=c;f+=10){let d=(f*1e3-l)/(c-l)*n;s.strokeStyle=f===0?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.16)",s.beginPath(),s.moveTo(d,0),s.lineTo(d,n),s.stroke()}for(let f=Math.ceil(h/1e4)*10;f*1e3<=u;f+=10){let d=n-(f*1e3-h)/(u-h)*n;s.strokeStyle=f===0?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.16)",s.beginPath(),s.moveTo(0,d),s.lineTo(n,d),s.stroke()}s.strokeStyle="rgba(255,255,255,0.5)",s.lineWidth=2,s.strokeRect(1,1,n-2,n-2)}this.terrainTex.needsUpdate=!0,this.detailTex&&t&&t.detail&&this.paintDetail(t)}paintDetail(t){let e=t.detail,n=this.detailTex.image,s=n.width,r=n.getContext("2d"),o=r.createImageData(s,s),a=o.data,l=[[58,74,54],[92,104,72],[128,124,92],[150,140,118],[186,180,170],[225,224,220]],c=Math.max(e.hMin,t.water),h=Math.max(1,e.hMax-c),u=-.6,f=.6,d=.55,y=Math.hypot(u,d,f),m=(e.w-1)/(s-1),g=e.v,p=e.w;for(let M=0;M<s;M++)for(let b=0;b<s;b++){let x=Math.min(e.w-2,Math.round(b*m)),_=Math.min(e.h-2,Math.round(M*m)),w=g[_*p+x],C=((s-1-M)*s+b)*4;if(w<=t.water+.3){a[C]=38,a[C+1]=58,a[C+2]=82,a[C+3]=255;continue}let P=Math.min(.999,Math.max(0,(w-c)/h))*(l.length-1),E=Math.floor(P);P-=E;let v=l[E][0]+(l[E+1][0]-l[E][0])*P,A=l[E][1]+(l[E+1][1]-l[E][1])*P,L=l[E][2]+(l[E+1][2]-l[E][2])*P,I=1;if(this.settings.shade){let D=Math.max(0,x-1),H=x+1,k=Math.max(0,_-1),Y=_+1,B=(g[_*p+H]-g[_*p+D])/((H-D)*e.cell)*1.6,nt=(g[Y*p+x]-g[k*p+x])/((Y-k)*e.cell)*1.6,rt=Math.hypot(B,1,nt);I=Math.min(1.3,.5+.62*Math.max(0,(-B*u+d-nt*f)/(rt*y))/(d/y))}a[C]=Math.min(255,v*I),a[C+1]=Math.min(255,A*I),a[C+2]=Math.min(255,L*I),a[C+3]=255}if(r.putImageData(o,0,0),this.settings.grid){let M=(e.w-1)*e.cell;r.lineWidth=1,r.strokeStyle="rgba(255,255,255,0.13)";for(let b=Math.ceil(e.x0/250)*250;b<=e.x0+M;b+=250){let x=(b-e.x0)/M*s;r.beginPath(),r.moveTo(x,0),r.lineTo(x,s),r.stroke()}for(let b=Math.ceil(e.z0/250)*250;b<=e.z0+M;b+=250){let x=s-(b-e.z0)/M*s;r.beginPath(),r.moveTo(0,x),r.lineTo(s,x),r.stroke()}}r.strokeStyle="rgba(255,255,255,0.45)",r.lineWidth=3,r.strokeRect(1.5,1.5,s-3,s-3),this.detailTex.needsUpdate=!0}get cam(){return this.mode==="2d"?this.cam2d:this.camera}setMode(t){if(t!==this.mode){if(t==="2d"){let e=this.controls.target;this.cam2d.position.set(e.x,3e5,e.z);let n=this.container.clientHeight||600,s=this.camera.position.distanceTo(e);this.cam2d.zoom=Math.min(.05,Math.max(.002,n/(2*s*Math.tan(this.camera.fov*xe/2)))),this.cam2d.updateProjectionMatrix()}else{let e=this.camera.position.clone().sub(this.controls.target);this.controls.target.set(this.cam2d.position.x,this.controls.target.y,this.cam2d.position.z),this.camera.position.copy(this.controls.target).add(e)}this.mode=t,this.controls.enabled=t==="3d",this.followHas=!1}}metresPerPx(){return 1/this.cam2d.zoom}homeCamera(){let t=this.session,e=0,n=0,s=0;if(t.ground){for(let f of this.byKind.ground)if(f.u.player>=0){let d=f.u.n>>1;e+=f.u.x[d],n+=f.u.z[d],s++}s&&(e/=s,n/=s);let l=t.terrain&&t.terrain.detail?t.terrain.detail:null;l&&(e=l.x0+l.w*l.cell/2,n=l.z0+l.h*l.cell/2);let c=bn(t.terrain,e,n);this.controls.target.set(e,c,-n),this.camera.position.set(e-600,c+2600,-n+2400),this.follow=-1,this.followHas=!1,this.controls.zoomToCursor=!0,this.controls.update();let h=this.container.clientWidth||800,u=this.container.clientHeight||600;this.cam2d.position.set(e,3e5,-n),this.cam2d.zoom=Math.min(h,u)/5e3,this.cam2d.updateProjectionMatrix();return}for(let l of this.byKind.aircraft)if(l.u.player>=0){let c=l.u.n>>1;e+=l.u.x[c],n+=l.u.z[c],s++}s&&(e/=s,n/=s);let r=bn(t.terrain,e,n);this.controls.target.set(e,r+2e3,-n),this.camera.position.set(e-15e3,r+55e3,-n+6e4),this.follow=-1,this.followHas=!1,this.controls.zoomToCursor=!0,this.controls.update();let o=this.container.clientWidth||800,a=this.container.clientHeight||600;this.cam2d.position.set(0,3e5,0),this.cam2d.zoom=Math.min(o,a)/14e4,this.cam2d.updateProjectionMatrix()}topView(){if(this.mode==="2d")return;let t=this.controls.target,e=Math.max(2e4,this.camera.position.distanceTo(t));this.camera.position.set(t.x,t.y+e,t.z+e*.02),this.controls.update()}setFollow(t){if(this.follow=t,this.followHas=!1,this.controls.zoomToCursor=t<0,t>=0&&this.mode==="2d"){this.unitPos(this.vis[t].u,this.t,this.vP),this.cam2d.position.x=this.vP.x,this.cam2d.position.z=this.vP.z;let e=this.vis[t].u.kind==="ground"?.3:.02;this.cam2d.zoom<e&&(this.cam2d.zoom=e,this.cam2d.updateProjectionMatrix())}else if(t>=0){let e=this.vis[t];this.unitPos(e.u,this.t,this.vP);let n=this.camera.position.clone().sub(this.controls.target),s=e.u.kind==="missile"?2500:e.u.kind==="ground"?250:6e3;n.length()>s*4&&n.setLength(s),this.controls.target.copy(this.vP),this.camera.position.copy(this.vP).add(n),this.followPrev.copy(this.vP),this.followHas=!0}}unitPos(t,e,n){let s=Math.min(Math.max(e,t.tStart),t.tEnd);return Xe(t,s,this.s),n.set(this.s.x,this.s.y,-this.s.z)}playerHidden(t){if(t.owner<0)return!1;let e=this.session.playerBySlot.get(t.owner);return!!e&&e.hidden}update(t){let e=this.session;if(!e)return;this.t=t;let n=this.settings,s=this.cam,r=this.mode==="2d",o=this.container.clientHeight||600,a=this.container.clientWidth||800,l=r?1/this.cam2d.zoom:2*Math.tan(this.camera.fov*xe/2)/o,c=this.s;if(this.follow>=0){let M=this.vis[this.follow].u;if(this.unitPos(M,t,this.vP),r)this.cam2d.position.x=this.vP.x,this.cam2d.position.z=this.vP.z;else{if(this.followHas){let b=this.vP.clone().sub(this.followPrev);s.position.add(b)}this.controls.target.copy(this.vP),this.followPrev.copy(this.vP),this.followHas=!0}}if(!r){this.controls.update();let M=bn(e.terrain,this.camera.position.x,-this.camera.position.z)+(e.ground?4:30);this.camera.position.y<M&&(this.camera.position.y=M)}s.updateMatrixWorld();let h=0;this.sticks.begin(),this.desig.begin(),this.vectors.begin();let u=new At,f=this.deadPts.geometry.getAttribute("position"),d=this.deadPts.geometry.getAttribute("color"),y=new At;for(let M of["aircraft","missile"]){let b=M==="aircraft",x=b?n.acTrail:n.msTrail;for(let _ of this.byKind[M]){let w=_.u,C=!this.playerHidden(w)&&(b?n.ai||!w.ai:n.missiles),P=t>=w.tStart&&t<=w.tEnd,E=t>w.tEnd;if(_.alive=P,_.shown=C&&P,_.onScreen=!1,!C||t<w.tStart){_.mesh.visible=!1,_.trail.mesh.visible=!1,_.beam&&(_.beam.visible=!1),_.scan&&(_.scan.visible=!1);continue}if(P){Xe(w,t,c),_.px=c.x,_.py=c.y,_.pz=-c.z;let B=c.heading*xe,nt=r?0:c.pitch*xe,rt=r?0:c.roll*xe,at=Math.sin(B),Pt=Math.cos(B),Yt=Math.sin(nt),J=Math.cos(nt),Q=Math.sin(rt),vt=Math.cos(rt),ct=at*J,It=Yt,Ut=Pt*J,kt=Pt,Jt=-at,qt=-at*Yt,he=J,N=-Pt*Yt,Ee=kt*vt-qt*Q,Bt=-he*Q,zt=Jt*vt-N*Q,Ct=qt*vt+kt*Q,$t=he*vt,St=N*vt+Jt*Q;this.vX.set(Ee,Bt,-zt),this.vY.set(Ct,$t,-St),this.vZ.set(-ct,-It,Ut);let R=r?1:Math.hypot(s.position.x-_.px,s.position.y-_.py,s.position.z-_.pz),S=(b?26:12)*(_.focus?1.3:1),V=Math.max(1,S*l*R/(b?Sh:Eh));if(this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(V,V,V)),this.tmpM.setPosition(_.px,_.py,_.pz),_.mesh.matrix.copy(this.tmpM),_.mesh.visible=!0,_.wing=b&&w.heading?Ah(c.heading,c.pitch,c.roll):null,this.vP.set(_.px,_.py,_.pz).project(s),_.onScreen=this.vP.z<1&&Math.abs(this.vP.x)<1.05&&Math.abs(this.vP.y)<1.05,_.sx=(this.vP.x*.5+.5)*a,_.sy=(-this.vP.y*.5+.5)*o,b){if(n.sticks&&!r){let X=bn(e.terrain,c.x,c.z);y.set(_.color),this.sticks.add(_.px,_.py,_.pz,_.px,X,_.pz,y)}if(n.vector){let X=Math.min(w.n-1,c.i+1),dt=Math.max(0,c.i-1),it=(w.t[X]-w.t[dt])/1e3;if(it>0){let ft=10/it;y.set(_.color),this.vectors.add(_.px,_.py,_.pz,_.px+(w.x[X]-w.x[dt])*ft,_.py+(w.y[X]-w.y[dt])*ft,_.pz-(w.z[X]-w.z[dt])*ft,y)}}let $=Ii(w,t);if($&&$.on&&(n.radar==="all"||n.radar==="focus"&&_.focus)){_.beam||(_.beam=new ye(this.beamGeo,new gn({color:_.color,transparent:!0,opacity:.14,side:Pe,depthWrite:!1})),_.beam.matrixAutoUpdate=!1,_.beam.frustumCulled=!1,this.root.add(_.beam));let X=$.az*xe,dt=$.el*xe,it=Math.cos(dt),ft=ct*it*Math.cos(X)+Ee*it*Math.sin(X)+Ct*Math.sin(dt),Ht=It*it*Math.cos(X)+Bt*it*Math.sin(X)+$t*Math.sin(dt),st=Ut*it*Math.cos(X)+zt*it*Math.sin(X)+St*Math.sin(dt),xt=$.state==="track",Lt=xt&&$.targetRange>100?$.targetRange:2e4,bt=n.scanZone&&!xt?Bl(e.radars,w.cls,$.sensor,$.pattern):null,Mt=bt&&bt.type==="pyramide"&&bt.azHalfDeg>0&&bt.elHalfDeg>0;if(Mt){let jt=bt.centerElevationDeg||0,U=bt.azHalfDeg+"_"+(jt-bt.elHalfDeg)+"_"+(jt+bt.elHalfDeg);_.scan?_.scanKey!==U&&(_.scan.geometry=Th(bt.azHalfDeg,jt-bt.elHalfDeg,jt+bt.elHalfDeg),_.scanKey=U):(_.scan=new ye(Th(bt.azHalfDeg,jt-bt.elHalfDeg,jt+bt.elHalfDeg),new gn({color:_.color,transparent:!0,opacity:.08,side:Pe,depthWrite:!1})),_.scan.matrixAutoUpdate=!1,_.scan.frustumCulled=!1,this.root.add(_.scan),_.scanKey=U),(bt.rollStabDeg||0)>=60?(this.vX.set(Pt,0,at),this.vY.set(0,1,0),this.vZ.set(-at,0,Pt)):(this.vX.set(Ee,Bt,-zt),this.vY.set(Ct,$t,-St),this.vZ.set(-ct,-It,Ut)),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(3e4,3e4,3e4)),this.tmpM.setPosition(_.px,_.py,_.pz),_.scan.matrix.copy(this.tmpM),_.scan.visible=!0,_.scan.material.color.set(_.color)}else _.scan&&(_.scan.visible=!1);let Kt=Lt*Math.tan((xt?1.5:Mt?1:3.5)*xe);this.vZ.set(-ft,-Ht,st).normalize(),this.vX.set(0,1,0).cross(this.vZ),this.vX.lengthSq()<1e-6&&this.vX.set(1,0,0),this.vX.normalize(),this.vY.crossVectors(this.vZ,this.vX),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(Kt,Kt,Lt)),this.tmpM.setPosition(_.px,_.py,_.pz),_.beam.matrix.copy(this.tmpM),_.beam.visible=!0;let Ot=_.beam.material;Ot.color.set(_.color),Ot.opacity=xt?.26:.09}else _.beam&&(_.beam.visible=!1),_.scan&&(_.scan.visible=!1);if($&&$.targets.length&&(n.desig==="all"||n.desig==="focus"&&(_.focus||$.targets.some(X=>this.vis[X]&&this.vis[X].focus))))for(let X of $.targets){let dt=this.vis[X];if(!dt)continue;let it=dt.u;t<it.tStart||t>it.tEnd||this.playerHidden(it)||(Xe(it,t,c),y.set(_.color),u.copy(y).multiplyScalar(.55),this.desig.add(_.px,_.py,_.pz,c.x,c.y,-c.z,y,u))}}}else if(_.mesh.visible=!1,_.beam&&(_.beam.visible=!1),_.scan&&(_.scan.visible=!1),b&&E&&w.destroyed&&n.dead){let B=w.n-1;f.setXYZ(h,w.x[B],w.y[B],-w.z[B]),y.set(_.color).lerp(new At(Oe.dead),.5),d.setXYZ(h,y.r,y.g,y.b),h++}let v=_.trail;if(!(x!==0&&(P||E&&(b?n.dead:n.msKeep==="all"||n.msKeep==="focus"&&_.focus||t-w.tEnd<4e3)))){v.mesh.visible=!1;continue}let L=P?De(w,t):w.n-1,I=0;x>0&&(I=De(w,Math.max(0,t-x*1e3))+(t-x*1e3>w.t[0]?1:0)),I=Math.min(I,L);let D=b&&n.trailStyle==="ribbon"&&!!w.heading,H=v.mat.uniforms;if(H.uRibbon.value=D?1:0,H.uWidth.value=(n.lineWidth||2)+(_.focus?1:0),H.uHead.value=(t-e.t0)/1e3,H.uFade.value=x>0?x:0,D){let B=r?1:Math.hypot(s.position.x-_.px,s.position.y-_.py,s.position.z-_.pz);H.uHalf.value=Math.max(4,26*(_.focus?1.3:1)*l*B/Sh*6.5*.8)}let k=null,Y=1;P&&_.wing&&(k=_.wing,Y=_.wing[3]),v.update(I,L,P?[_.px,_.py,_.pz]:null,k,Y)}}this.sticks.end(),this.sticks.mesh.visible=n.sticks&&!r,this.desig.end(),this.vectors.end();{let M=this.activePts.geometry.getAttribute("position"),b=this.activePts.geometry.getAttribute("color"),x=0;if(n.activeMark&&n.missiles)for(let _ of this.byKind.missile){let w=this.activeAt.get(_.u.id),C=_.u;w===void 0||t<C.t[w]||this.playerHidden(C)||t>C.tEnd&&!(n.msKeep==="all"||n.msKeep==="focus"&&_.focus||t-C.tEnd<4e3)||(M.setXYZ(x,C.x[w],C.y[w],-C.z[w]),b.setXYZ(x,.45,1,.55),x++)}this.activePts.geometry.setDrawRange(0,x),M.needsUpdate=!0,b.needsUpdate=!0}if(this.seeker.begin(),n.seeker&&n.missiles){let M=new At(1,1,1),b=new At(1,.9,.3);for(let x of this.byKind.missile){if(!x.shown||!x.u.seekerMode)continue;let _=x.u,w=De(_,t);if(_.seekerMode[w]!==2)continue;let C=_.tex[w],P=_.tey[w],E=_.tez[w];!isFinite(C)||P<-500||Math.hypot(C-x.px,P-x.py,-E-x.pz)>8e4||this.seeker.add(x.px,x.py,x.pz,C,P,-E,M,b)}}this.seeker.end();let m=(M,b,x,_)=>{let w=0;if(x){let C=M.geometry.getAttribute("position"),P=M.geometry.getAttribute("color");for(let E of b){let v=E.u;t<v.tStart||t>v.tEnd||this.playerHidden(v)||(Xe(v,t,c),C.setXYZ(w,c.x,c.y,-c.z),y.set(_(v)),P.setXYZ(w,y.r,y.g,y.b),w++)}C.needsUpdate=!0,P.needsUpdate=!0}M.geometry.setDrawRange(0,w)};m(this.cmPts,this.byKind.countermeasure,n.cms,M=>M.cmType==="Flare"?Oe.flare:Oe.chaff),m(this.bombPts,this.byKind.bomb,n.bombs,()=>Oe.bomb),this.groundPts.visible=n.ground,this.groundPts.geometry.setDrawRange(0,n.ground?this.nStaticGround:0),h=this.updateGround(t,h,l,f,d),this.updateShells(t),this.deadPts.geometry.setDrawRange(0,h),f.needsUpdate=!0,d.needsUpdate=!0;let g=this.selected>=0?this.vis[this.selected]:null;if(g&&g.shown){let M=r?1:s.position.distanceTo(this.vP.set(g.px,g.py,g.pz)),b=22*l*M;this.selRing.position.set(g.px,g.py,g.pz),this.selRing.quaternion.copy(s.quaternion),this.selRing.scale.setScalar(b),this.selRing.visible=!0}else this.selRing.visible=!1;let p=this.measure>=0?this.vis[this.measure]:null;this.measureSeg.begin(),g&&p&&g.shown&&p.shown&&this.measureSeg.add(g.px,g.py,g.pz,p.px,p.py,p.pz,new At(1,1,1)),this.measureSeg.end(),this.updateDlz(t,g),this.updateMapOverlays(a,o),this.updateLabels(),this.renderer.render(this.scene,s)}updateGround(t,e,n,s,r){let o=this.session,a=this.settings,l=this.cam,c=this.mode==="2d",h=this.s,u=new At;this.gunSeg.begin();for(let f of this.byKind.ground){if(!f.mesh)continue;let d=f.u,y=a.ground&&!this.playerHidden(d)&&(a.ai||d.player>=0),m=t>=d.tStart&&t<=d.tEnd,g=t>d.tEnd;if(f.alive=m,f.shown=y&&m,f.onScreen=!1,!y||!m){if(f.mesh.visible=!1,f.turret.visible=!1,y&&g&&d.destroyed&&a.dead&&d.player>=0){let C=d.n-1;s.setXYZ(e,d.x[C],d.y[C]+2,-d.z[C]),u.set(f.color).lerp(new At(Oe.dead),.5),r.setXYZ(e,u.r,u.g,u.b),e++}let w=f.trail;if(!y||!g||!a.dead||a.acTrail===0){w.mesh.visible=!1;continue}}else{Xe(d,t,h),f.px=h.x,f.py=h.y,f.pz=-h.z;let w=h.heading*xe,C=c?0:h.pitch*xe,P=c?0:h.roll*xe,E=Math.sin(w),v=Math.cos(w),A=Math.sin(C),L=Math.cos(C),I=Math.sin(P),D=Math.cos(P),H=E*L,k=A,Y=v*L,B=v,nt=-E,rt=-E*A,at=L,Pt=-v*A,Yt=B*D-rt*I,J=-at*I,Q=nt*D-Pt*I,vt=rt*D+B*I,ct=at*D,It=Pt*D+nt*I,Ut=c?1:Math.hypot(l.position.x-f.px,l.position.y-f.py,l.position.z-f.pz),kt=(d.player>=0?18:12)*(f.focus?1.3:1),Jt=Math.max(1,kt*n*Ut/Rh);this.vX.set(Yt,J,-Q),this.vY.set(vt,ct,-It),this.vZ.set(-H,-k,Y),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(Jt,Jt,Jt)),this.tmpM.setPosition(f.px,f.py,f.pz),f.mesh.matrix.copy(this.tmpM),f.mesh.visible=!0;let qt=d.gunBearing?O0(d.gunBearing,h.i,h.f,d.n):NaN,he=d.gunElev&&!c?Rn(d.gunElev,h,d.n):0,N=(isFinite(qt)?qt:h.heading)*xe,Ee=(isFinite(he)?he:0)*xe,Bt=Math.sin(N),zt=Math.cos(N),Ct=Math.sin(Ee),$t=Math.cos(Ee),St=f.px+vt*1.7*Jt,R=f.py+ct*1.7*Jt,S=f.pz-It*1.7*Jt;if(this.vX.set(zt,0,Bt),this.vZ.set(-Bt*$t,-Ct,zt*$t),this.vY.crossVectors(this.vZ,this.vX).normalize(),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(Jt,Jt,Jt)),this.tmpM.setPosition(St,R,S),f.turret.matrix.copy(this.tmpM),f.turret.visible=!0,isFinite(qt)&&(a.gunLines==="all"||a.gunLines==="focus"&&f.focus)){let et=2e3,X=Bt*$t,dt=Ct,it=zt*$t;for(let Ht=25;Ht<=2e3;Ht+=25)if(R+dt*Ht<bn(o.terrain,St+X*Ht,-S+it*Ht)){et=Ht;break}u.set(f.color);let ft=u.clone().multiplyScalar(.35);this.gunSeg.add(St,R,S,St+X*et,R+dt*et,S-it*et,u,ft)}this.vP.set(f.px,f.py,f.pz).project(l);let V=this.container.clientWidth||800,$=this.container.clientHeight||600;f.onScreen=this.vP.z<1&&Math.abs(this.vP.x)<1.05&&Math.abs(this.vP.y)<1.05,f.sx=(this.vP.x*.5+.5)*V,f.sy=(-this.vP.y*.5+.5)*$}let p=f.trail,M=a.acTrail;if(M===0){p.mesh.visible=!1;continue}let b=m?De(d,t):d.n-1,x=0;M>0&&(x=De(d,Math.max(0,t-M*1e3))+(t-M*1e3>d.t[0]?1:0)),x=Math.min(x,b);let _=p.mat.uniforms;_.uRibbon.value=0,_.uWidth.value=(a.lineWidth||2)+(f.focus?1:0),_.uHead.value=(t-o.t0)/1e3,_.uFade.value=M>0?M:0,p.update(x,b,m?[f.px,f.py+.6,f.pz]:null,null,1)}return this.gunSeg.end(),e}updateShells(t){let e=this.session,n=this.settings,s=e.shots;this.shellSeg.begin(),this.mgSeg.begin();let r=this.impactPts.geometry.getAttribute("position"),o=this.impactPts.geometry.getAttribute("color"),a=0,l=0,c=this.headPts.geometry.getAttribute("position"),h=this.headPts.geometry.getAttribute("color");if(s&&n.ground&&(n.shells||n.mgRounds)){let u=n.shellKeep<0?1/0:n.shellKeep*1e3,f=n.shellKeep<0?-1/0:t-u-8e3,d=0,y=s.list.length;if(isFinite(f))for(;d<y;){let C=d+y>>1;s.list[C].t<f?d=C+1:y=C}let m=new At,g=new At,p=new At(16777215),M=new At(16765562),b=this.shellSeg.cap,x=this.mgSeg.cap,_=0,w=0;for(let C=d;C<s.list.length;C++){let P=s.list[C];if(P.t>t)break;if(P.n<2)continue;let E=P.cls==="mg";if(E?!n.mgRounds:!n.shells||P.cls!=="cannon")continue;let v=this.vis[P.unit];if(!v||this.playerHidden(v.u)||!n.ai&&v.u.player<0)continue;let A=t>=P.tEnd;if(A&&t-P.tEnd>u)continue;let L=E?this.mgSeg:this.shellSeg,I=A?(t-P.tEnd)/Math.max(1,Math.min(u,3e4)):0,D=A?Math.max(.25,1-I*.75):1;m.set(v.color),E?m.lerp(M,.55):m.lerp(p,P.kill?.55:.25),m.multiplyScalar(D),g.copy(m).multiplyScalar(.8);let H=(t-P.t)/s.dt,k=Math.min(P.n-1,Math.floor(H)),Y=k+1;if(E?w+Y>x:_+Y>b)continue;let B=s.x,nt=s.y,rt=s.z,at=P.p0;for(let Q=0;Q<k;Q++)L.add(B[at+Q],nt[at+Q],-rt[at+Q],B[at+Q+1],nt[at+Q+1],-rt[at+Q+1],g,m);let Pt=B[at+k],Yt=nt[at+k],J=rt[at+k];if(k<P.n-1){let Q=H-k;Pt+=(B[at+k+1]-Pt)*Q,Yt+=(nt[at+k+1]-Yt)*Q,J+=(rt[at+k+1]-J)*Q,L.add(B[at+k],nt[at+k],-rt[at+k],Pt,Yt,-J,g,m),l<8192&&(c.setXYZ(l,Pt,Yt,-J),E?h.setXYZ(l,1,.82,.45):h.setXYZ(l,1,1,.92),l++)}if(E?w+=Y:_+=Y,A&&t-P.tEnd<1200&&a<4096&&(P.end==="ground"||P.end==="vehicle"||P.end==="aircraft")){let Q=at+P.n-1;r.setXYZ(a,B[Q],nt[Q]+.5,-rt[Q]),P.end==="vehicle"||P.end==="aircraft"?m.set(P.kill?16728128:16777215):m.set(16756832),o.setXYZ(a,m.r,m.g,m.b),a++}}}this.shellSeg.end(),this.mgSeg.end(),this.impactPts.geometry.setDrawRange(0,a),r.needsUpdate=!0,o.needsUpdate=!0,this.headPts.geometry.setDrawRange(0,l),c.needsUpdate=!0,h.needsUpdate=!0}missileOf(t){let e=this.session,n=new Map,s="",r=0,o="";for(let a of e.launches){if(a.shooter!==t.id&&!(t.owner>=0&&a.shooterPlayer===t.owner))continue;let l=e.units[a.missile];if(!l||l.kind!=="missile")continue;let c=(n.get(l.name)||0)+1;n.set(l.name,c),c>r&&(!l.missile||l.missile.guidance!=="IR"||!s)&&(r=c,s=l.name,o=l.missile?l.missile.internalName:"")}return s?Vs(o,s):null}updateDlz(t,e){if(this.dlzSeg.begin(),this.dlzInfo=null,this.settings.dlz&&e&&e.shown&&e.u.kind==="aircraft"){let s=this.measure>=0?this.vis[this.measure]:null;if(!s||!s.shown||s.u.kind!=="aircraft"){let o=Ii(e.u,t);if(s=null,o)for(let a of o.targets){let l=this.vis[a];if(l&&l.shown&&l.u.kind==="aircraft"){s=l;break}}}let r=s?this.missileOf(e.u):null;if(s&&r){let o=performance.now(),a=e.u.id+":"+s.u.id+":"+r.name;if(!this.dlzCache||this.dlzCache.key!==a||o-this.dlzCache.at>250){let f=Ch(e.u,t),d=Ch(s.u,t),y=e.px-s.px,m=e.py-s.py,g=e.pz-s.pz,p=Ph(s.u,t),M=Math.hypot(y,m,g),b=Math.hypot(p[0],p[1],p[2]),x=M>0&&b>0?Math.acos(Math.max(-1,Math.min(1,(p[0]*y+p[1]*m+p[2]*g)/(M*b))))*180/Math.PI:0,[_,w]=jr(r,e.py,f,s.py,d,x);this.dlzCache={key:a,at:o,rmax:_,rne:w,missile:r.name}}let l=this.dlzCache;this.dlzInfo={missile:l.missile,rmax:l.rmax,rne:l.rne,range:Math.hypot(e.px-s.px,e.py-s.py,e.pz-s.pz)};let c=new At(e.color),h=c.clone().multiplyScalar(.6),u=(f,d,y)=>{if(f<=0)return;let m=96;for(let g=0;g<m;g++){if(y&&g%2)continue;let p=g/m*Math.PI*2,M=(g+1)/m*Math.PI*2;this.dlzSeg.add(e.px+f*Math.cos(p),e.py,e.pz+f*Math.sin(p),e.px+f*Math.cos(M),e.py,e.pz+f*Math.sin(M),d)}};u(l.rmax,h,!0),u(l.rne,c,!1)}}this.dlzSeg.end()}labelFor(t){let e=this.settings,n=t.u,s=this.session;if(n.kind==="missile")return n.name;let r=[],o=n.player>=0?s.playerBySlot.get(n.player):null;e.lblName&&o&&r.push(o.name),(e.lblType||!o)&&r.push(n.name);let a=[];return Xe(n,this.t,this.s),e.lblAlt&&n.kind!=="ground"&&a.push(ae(this.s.y,e.units)),e.lblSpeed&&a.push(Ie(Rn(n.speed,this.s,n.n),e.units)),r.join(" \xB7 ")+(a.length?`
`+a.join("  "):"")}updateLabels(){let t=this.settings,e=performance.now(),n=e-this.lastLabelText>200;n&&(this.lastLabelText=e);let s=[];for(let a of["aircraft","ground","missile"])for(let l of this.byKind[a]){if(!l.mesh)continue;let c=l.shown&&l.onScreen;c&&(a==="missile"?c=t.missileLabels&&(t.labels==="all"||t.labels==="focus"&&l.focus):c=t.labels==="all"||t.labels==="focus"&&l.focus),c?s.push(l):l.label&&l.label.style.display!=="none"&&(l.label.style.display="none")}let r=a=>a.u.id===this.selected?0:a.focus?1:a.u.kind==="aircraft"||a.u.kind==="ground"&&a.u.player>=0?a.u.ai?3:2:a.u.kind==="ground"?5:4;s.sort((a,l)=>r(a)-r(l));let o=[];for(let a of s){(n||!a.labelText)&&(a.labelText=this.labelFor(a));let l=a.labelText.split(`
`),c=0;for(let g of l)c=Math.max(c,g.length);let h=a.sx+12,u=a.sy-8,f=h+c*6.6+4,d=u+l.length*14,y=!1;if(r(a)>1||a.u.kind==="missile"){for(let g=0;g<o.length;g+=4)if(h<o[g+2]&&f>o[g]&&u<o[g+3]&&d>o[g+1]){y=!0;break}}if(y){a.label&&a.label.style.display!=="none"&&(a.label.style.display="none");continue}if(o.push(h,u,f,d),!a.label){let g=document.createElement("div");g.className="lbl "+a.u.kind+(a.focus?" focus":""),g.addEventListener("click",p=>{this.onSelect(a.u.id,p.shiftKey),p.stopPropagation()}),this.labelLayer.appendChild(g),a.label=g}let m=a.label;m.style.display==="none"&&(m.style.display=""),m.style.transform=`translate(${Math.round(h)}px, ${Math.round(u)}px)`,m.style.color="#"+new At(a.color).lerp(new At(16777215),.45).getHexString(),m.textContent!==a.labelText&&(m.textContent=a.labelText)}}pick(t,e){let n=-1,s=18;for(let r of["aircraft","ground","missile"])for(let o of this.byKind[r]){if(!o.shown||!o.onScreen||!o.mesh)continue;let a=Math.hypot(o.sx-t,o.sy-e)+(r==="missile"?4:0);a<s&&(s=a,n=o.u.id)}return n}viewHeading(){if(this.mode==="2d")return 0;let t=new z;return this.camera.getWorldDirection(t),(Math.atan2(t.x,-t.z)*180/Math.PI+360)%360}};function ae(i,t){return t==="aviation"?Math.round(i*3.28084/100)*100+" ft":i>=1e3?(i/1e3).toFixed(1)+" km":Math.round(i)+" m"}function Ie(i,t){return isFinite(i)?t==="aviation"?Math.round(i*1.94384)+" kt":Math.round(i*3.6)+" km/h":""}function de(i,t){return t==="aviation"?(i/1852).toFixed(1)+" nm":(i/1e3).toFixed(1)+" km"}function Ph(i,t){let e=De(i,t),n=Math.max(0,e-1),s=Math.min(i.n-1,e+1),r=(i.t[s]-i.t[n])/1e3;return r>0?[(i.x[s]-i.x[n])/r,(i.y[s]-i.y[n])/r,-(i.z[s]-i.z[n])/r]:[0,0,0]}function Ch(i,t){let e=Ph(i,t);return Math.hypot(e[0],e[1],e[2])}function O0(i,t,e,n){let s=Math.min(n-1,t+1),r=i[t],o=i[s];if(!isFinite(r))return o;if(!isFinite(o))return r;let a=(o-r+540)%360-180;return r+a*e}var ne={blue:"#2a78d6",orange:"#eb6834",aqua:"#1baf7a",ink:"#e6eaf0",ink2:"#a9b3c2",ink3:"#7b8696",grid:"#2f3948",yellow:"#ffe14d"};function _n(i,t){let e=document.createElement("div");if(e.className="chartBox",t.legend!==!1&&t.series.length>1){let u=document.createElement("div");u.className="legendRow";for(let f of t.series){let d=document.createElement("span"),y=document.createElement("i");y.style.background=f.color,f.dashed&&(y.className="dash"),d.append(y,document.createTextNode(f.name)),u.appendChild(d)}e.appendChild(u)}let n=document.createElement("canvas");n.style.height=(t.height||120)+"px",e.appendChild(n);let s=document.createElement("div");s.className="readout",e.appendChild(s),i.appendChild(e);let r=70,o=10,a=8,l=20,c=null,h=u=>{let f=window.devicePixelRatio||1,d=n.clientWidth,y=n.clientHeight;if(!d)return;(n.width!==Math.round(d*f)||n.height!==Math.round(y*f))&&(n.width=Math.round(d*f),n.height=Math.round(y*f));let m=n.getContext("2d");m.setTransform(f,0,0,f,0,0),m.clearRect(0,0,d,y);let g=t.yMin,p=t.yMax;if(g===void 0||p===void 0){let A=1/0,L=-1/0;for(let I of t.series)for(let D of I.pts)isFinite(D[1])&&(A=Math.min(A,D[1]),L=Math.max(L,D[1]));for(let I of t.bands||[])A=Math.min(A,I.y0),L=Math.max(L,I.y1);isFinite(A)||(A=0,L=1),g===void 0&&(g=A),p===void 0&&(p=L)}p-g<1e-9&&(p=g+1);let M=(p-g)*.06,b=g-(t.yMin===void 0?M:0),x=p+(t.yMax===void 0?M:0),_=A=>r+(A-t.x0)/Math.max(1e-9,t.x1-t.x0)*(d-r-o),w=A=>a+(1-(A-b)/(x-b))*(y-a-l);c={X:_,Y:w,w:d,h:y,ix:A=>t.x0+(A-r)/(d-r-o)*(t.x1-t.x0)};for(let A of t.bands||[]){m.fillStyle=A.color;let L=w(Math.min(x,A.y1)),I=w(Math.max(b,A.y0));m.fillRect(r,L,d-r-o,I-L)}m.strokeStyle=ne.grid,m.lineWidth=1,m.fillStyle=ne.ink3,m.font="11px Segoe UI, system-ui, sans-serif";let C=t.yFmt||(A=>String(Math.round(A))),P=A=>C(Math.abs(A)<1e-9?0:A);for(let A of[b+(x-b)*.05,(b+x)/2,x-(x-b)*.05])m.beginPath(),m.moveTo(r,Math.round(w(A))+.5),m.lineTo(d-o,Math.round(w(A))+.5),m.stroke(),m.textAlign="right",m.fillText(P(A),r-5,w(A)+4);t.zeroLine&&b<0&&x>0&&(m.strokeStyle=ne.ink3,m.beginPath(),m.moveTo(r,w(0)),m.lineTo(d-o,w(0)),m.stroke());let E=t.xFmt||(A=>String(Math.round(A)));m.textAlign="left",m.fillText(E(t.x0),r,y-5),m.textAlign="right",m.fillText(E(t.x1),d-o,y-5);for(let A of t.markers||[]){let L=Math.round(_(A.x))+.5;L<r||L>d-o||(m.strokeStyle=A.color,m.setLineDash([3,3]),m.beginPath(),m.moveTo(L,a),m.lineTo(L,y-l),m.stroke(),m.setLineDash([]))}for(let A of t.series){m.strokeStyle=A.color,m.lineWidth=A.width||2,m.lineJoin="round",A.dashed&&m.setLineDash([5,4]),m.beginPath();let L=!0,I=0;for(let D of A.pts){if(!isFinite(D[1])){L=!0;continue}let H=_(D[0]),k=w(Math.max(b,Math.min(x,D[1])));L?(m.moveTo(H,k),L=!1):(A.step&&m.lineTo(H,I),m.lineTo(H,k)),I=k}m.stroke(),m.setLineDash([])}let v=u!==null?u:t.cursorX;if(v!=null&&v>=t.x0&&v<=t.x1&&(m.strokeStyle="rgba(255,255,255,.55)",m.lineWidth=1,m.beginPath(),m.moveTo(_(v)+.5,a),m.lineTo(_(v)+.5,y-l),m.stroke()),u!==null){let A=[E(u)];for(let I of t.series){let D=null;for(let H of I.pts)if(H[0]<=u)D=H;else break;D&&isFinite(D[1])&&A.push(I.name+" "+P(D[1]))}let L=(t.markers||[]).filter(I=>Math.abs(_(I.x)-_(u))<4).map(I=>I.label);s.textContent=A.concat(L).join(" \xB7 ")}else s.textContent=""};return n.addEventListener("mousemove",u=>{if(!c)return;let f=n.getBoundingClientRect(),d=c.ix(u.clientX-f.left);h(Math.max(t.x0,Math.min(t.x1,d)))}),n.addEventListener("mouseleave",()=>h(null)),t.onClick&&(n.style.cursor="pointer",n.addEventListener("click",u=>{if(!c)return;let f=n.getBoundingClientRect();t.onClick(c.ix(u.clientX-f.left))})),requestAnimationFrame(()=>h(null)),new ResizeObserver(()=>h(null)).observe(n),n}function Ih(i,t,e,n=ne.blue){let s=document.createElement("div");s.className="barList";for(let r of t){let o=document.createElement("div");o.className="barRow";let a=document.createElement("span");a.className="bl",a.textContent=r.label;let l=document.createElement("div");l.className="bt";let c=document.createElement("div");if(c.className="bf",c.style.width=Math.max(0,Math.min(100,r.value/e*100))+"%",c.style.background=n,l.appendChild(c),r.compare!==void 0){let u=document.createElement("div");u.className="bc",u.style.left=Math.max(0,Math.min(100,r.compare/e*100))+"%",l.appendChild(u)}let h=document.createElement("span");h.className="bv",h.textContent=r.text||String(r.value),o.append(a,l,h),s.appendChild(o)}i.appendChild(s)}var xl=null;function ea(i=!1){return(!xl||i)&&(xl=fetch("/api/library").then(t=>t.ok?t.json():{matches:[]}).catch(()=>({matches:[]}))),xl}function Gs(i){let t=/^([A-Za-z]+[- ]?\d+)/.exec(i||"");return t?t[1].toUpperCase().replace(" ","-"):(i||"").toUpperCase()}function na(i,t){let e=[];for(let n of i.matches||[]){if(t&&!t.has(n.id))continue;let s=new Map;for(let r of n.players||[])s.set(r.slot,String(r.name||"").toLowerCase());for(let r of n.shots||[])r.range==null||r.aspect==null||r.shooterAlt==null||r.targetAlt==null||!["kill","miss","close"].includes(r.outcome)||r.reason==="target_down"||e.push({match:n.id,t:r.t,model:r.model,guidance:r.guidance,range:r.range,aspect:r.aspect,shooterAlt:r.shooterAlt,targetAlt:r.targetAlt,shooterMach:r.shooterMach??.9,targetMach:r.targetMach??.9,targetAgl:r.targetAgl??null,rangeRatio:r.rangeRatio??null,rmax:r.rmax??null,rne:r.rne??null,multipath:r.multipath||0,notch:!!r.notch,locked:!!r.locked,outcome:r.outcome,reason:r.reason||"",grade:r.grade,shooterSlot:r.shooterSlot,targetSlot:r.targetSlot,kill:r.outcome==="kill",shooterName:s.get(r.shooterSlot)||""})}return e}function ia(i,t,e){if(i==="all")return null;let n=new Set,s=(t||"").trim().toLowerCase();if(s&&n.add(s),i==="squad")for(let r of(e||"").split(",")){let o=r.trim().toLowerCase();o&&n.add(o)}return n}function k0(i,t){if(t===0)return[0,1];let e=1.645,n=i/t,s=1+e*e/t,r=(n+e*e/(2*t))/s,o=e*Math.sqrt(n*(1-n)/t+e*e/(4*t*t))/s;return[Math.max(0,r-o),Math.min(1,r+o)]}function Ws(i,t,e,n){let s=Gs(t.model),r=p=>!(e&&p.match===e.match&&Math.abs(p.t-e.t)<1);n&&(i=i.filter(p=>n.has(p.shooterName)));let o=i.filter(p=>p.model===t.model&&r(p)),a=t.model;if(o.length<25&&(o=i.filter(p=>Gs(p.model)===s&&r(p)),a=s+" family"),o.length<25&&t.guidance&&(o=i.filter(p=>p.guidance===t.guidance&&r(p)),a="all "+t.guidance+" missiles"),o.length<8)return null;let l=(p,M)=>M??(p!=null&&p<60?1:0),c=l(t.targetAgl,t.multipath),h=p=>{let M=p.multipath!=null?p.multipath:l(p.targetAgl,void 0);return Math.hypot((p.range-t.range)/8e3,(p.aspect-t.aspect)/40,(p.shooterAlt-t.shooterAlt)/3e3,(p.targetAlt-t.targetAlt)/3e3,(p.targetMach-t.targetMach)/.3,(p.shooterMach-t.shooterMach)/.3)+(t.guidance!=="IR"?1.5*Math.abs(M-c):0)},u=o.map(p=>[h(p),p]).sort((p,M)=>p[0]-M[0]),f=Math.min(30,Math.max(8,Math.round(o.length/4))),d=u.slice(0,f).map(p=>p[1]),y=d.filter(p=>p.kill).length,[m,g]=k0(y,d.length);return{pk:y/d.length,n:d.length,lo:m,hi:g,pool:a+(n?" (your shots)":""),poolSize:o.length,neighbours:d}}function q(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var B0={good:"\u2713 Good",fair:"! Fair",poor:"\u2715 Poor",unknown:"? Unknown"};function Lh(i){return q("span","chip g-"+(i||"unknown"),B0[i]||i)}function xn(i){return i==null?"\u2014":Math.round(i*100)+"%"}function z0(i){return i==null?"none":i.toFixed(1)+" s"}var H0=[["report","Report card"],["shots","My shots"],["incoming","Shots at me"],["deaths","Deaths"],["engage","Engagements"],["position","Threats & position"]],sa=class{constructor(t,e){j(this,"host");j(this,"root");j(this,"body");j(this,"picker");j(this,"ana",null);j(this,"anaFor","");j(this,"slot",-1);j(this,"tab","report");j(this,"lib",null);this.root=t,this.host=e}async open(){let t=this.host.ses();if(t){if(this.root.hidden=!1,this.anaFor!==t.id){this.root.innerHTML="",this.root.appendChild(q("div","pageMsg","Analysing the match\u2026 (the first time takes a few seconds)"));try{let e=await fetch("/api/analysis/"+encodeURIComponent(t.id));if(!e.ok)throw new Error(await e.text());this.ana=await e.json(),this.anaFor=t.id}catch(e){this.root.innerHTML="",this.root.appendChild(q("div","pageMsg","Could not analyse this match: "+(e&&e.message||e)));return}this.slot=this.host.meSlot(),!this.ana.players.some(e=>e.slot===this.slot)&&this.ana.players.length&&(this.slot=this.ana.players[0].slot)}this.lib||ea().then(e=>{this.lib=na(e),!this.root.hidden&&this.tab==="shots"&&this.render()}),this.build()}}close(){this.root.hidden=!0}invalidate(){this.anaFor=""}player(){return this.ana.players.find(t=>t.slot===this.slot)}unit(t){let e=this.host.ses();return e&&t>=0&&e.units[t]||null}title(t){let e=this.unit(t);return e?this.host.unitTitle(e):"?"}clock(t){return en(t-this.ana.t0)}watchBtn(t,e,n,s=!0){let r=q("button","watch","\u25B6 "+t);return r.onclick=o=>{o.stopPropagation(),this.host.watch(e,n,s)},r}build(){let t=this.root;t.innerHTML="";let e=q("div","pageHead");e.appendChild(q("div","pageTitle","Debrief")),this.picker=document.createElement("select");let n=this.host.ses(),s=[...this.ana.players].sort((a,l)=>a.team-l.team||a.name.localeCompare(l.name));for(let a of s){let l=document.createElement("option");l.value=String(a.slot),l.textContent=a.name+" \u2014 "+(a.vehicles||[]).join(", ")+(a.slot===this.host.meSlot()?"  (me)":""),this.picker.appendChild(l)}this.picker.value=String(this.slot),this.picker.onchange=()=>{this.slot=Number(this.picker.value),this.render()},e.appendChild(this.picker);let r=q("div","pageTabs");for(let[a,l]of H0){let c=q("button",a===this.tab?"on":"",l);c.dataset.tab=a,c.onclick=()=>{this.tab=a;for(let h of Array.from(r.children))h.classList.toggle("on",h.dataset.tab===a);this.render()},r.appendChild(c)}e.appendChild(r);let o=q("button","back","\u2190 Back to replay");o.onclick=()=>this.host.watch(-1,-1,!1),e.appendChild(o),t.appendChild(e),this.body=q("div","pageBody"),t.appendChild(this.body),this.render()}render(){let t=this.body;t.innerHTML="",t.scrollTop=0;let e=this.player();if(!e){t.appendChild(q("div","pageMsg","No data for this player."));return}for(let n of this.ana.notes||[])t.appendChild(q("div","note",n));switch(this.tab){case"report":this.report(t,e);break;case"shots":this.shots(t,e);break;case"incoming":this.incoming(t,e);break;case"deaths":this.deaths(t,e);break;case"engage":this.engagements(t,e);break;case"position":this.position(t,e);break}}report(t,e){let n=e.summary,s=this.host.settings.units,r=q("div","tiles"),o=(l,c,h="")=>{let u=q("div","tile");u.append(q("span","",l),q("b","",c)),h&&u.appendChild(q("small","",h)),r.appendChild(u)};o("Kills / deaths",(n.kills||0)+" / "+(n.deaths||0),n.teamKills?n.teamKills+" team kill"+(n.teamKills>1?"s":""):""),o("Missiles fired",String(n.shots||0),(n.missileKills||0)+" killed"),o("Shot quality",(n.shotsGood||0)+" \u2713  "+(n.shotsFair||0)+" !  "+(n.shotsPoor||0)+" \u2715","good \xB7 fair \xB7 poor"),o("Missiles at you",String(n.missilesAtMe||0),n.missilesAtMe?xn(n.missilesSurvivedShare)+" survived":""),o("Reaction to launches",n.avgReactionS!=null?n.avgReactionS.toFixed(1)+" s":"\u2014","median"+(n.noReaction?" \xB7 "+n.noReaction+" with no reaction":"")),o("Notch held",xn(n.avgNotchShare),"of the critical time, radar missiles"),o("Engagements",String(n.engagements||0),(n.engagementsWon||0)+" won \xB7 "+(n.engagementsLost||0)+" lost \xB7 first shot "+xn(n.firstShotShare)),o("Average altitude",n.meanAltM!=null?ae(n.meanAltM,s):"\u2014"),o("Flying alone",xn(n.aloneShare),"no teammate within 20 km"),n.avgShotRangeM&&o("Average shot range",de(n.avgShotRangeM,s),n.avgRangeRatio!=null?Math.round(n.avgRangeRatio*100)+"% of estimated max range":""),t.appendChild(r),t.appendChild(q("h3","","Biggest mistakes"));let a=e.mistakes||[];a.length||t.appendChild(q("div","muted","Nothing flagged in this match."));for(let l of a.slice(0,3))t.appendChild(this.mistakeCard(l,!0));if(a.length>3){t.appendChild(q("h3","","Everything else flagged"));for(let l of a.slice(3))t.appendChild(this.mistakeCard(l,!1))}t.appendChild(q("p","fine","Shot grades use an estimated launch envelope from the game's missile data and the multipath and notch rules from the game files. Miss reasons and reactions are worked out from the recording, not recorded by the game."))}mistakeCard(t,e){let n=q("div","mistake"+(e?" big":"")+" sev"+t.severity);return n.appendChild(q("div","mt",this.clock(t.t))),n.appendChild(q("div","mx",t.text)),t.select>=0&&n.appendChild(this.watchBtn("Watch",t.t-5e3,t.select)),n}shots(t,e){let n=(e.shots||[]).map(a=>this.ana.shots[a]);if(!n.length){t.appendChild(q("div","muted",this.ana.hasShots?"No missiles fired.":"No shot records in this file."));return}t.appendChild(q("p","fine","Range bar: green = inside the estimated no-escape range, amber = the target can still outrun it, red = beyond the estimated max range. Pk from history = share of similar shots in your library that killed."));let s=q("div","tbl shots"),r=q("div","tr th");for(let a of["Time","Missile","Target","Range vs envelope","Aspect","Alt you / target","Target above ground","Pk (history)","Grade","Result"])r.appendChild(q("div","",a));s.appendChild(r);let o=this.host.settings.units;for(let a of n){let l=q("div","tr click");l.appendChild(q("div","num",this.clock(a.t))),l.appendChild(q("div","",a.model)),l.appendChild(q("div","",a.target>=0?this.title(a.target):"not identified")),l.appendChild(this.rangeBar(a)),l.appendChild(q("div","num",a.aspectDeg!=null?a.aspectDeg+"\xB0 "+(a.aspectDeg<60?"hot":a.aspectDeg>120?"cold":"beam"):"\u2014")),l.appendChild(q("div","num",a.shooterAltM!=null?ae(a.shooterAltM,o)+" / "+ae(a.targetAltM,o):"\u2014"));let c=q("div","num",a.targetAglM!=null?ae(Math.max(0,a.targetAglM),o):"\u2014");a.multipathLaunch>0&&c.appendChild(q("span","tag warn","multipath")),l.appendChild(c),l.appendChild(this.pkCell(a));let h=q("div","");h.appendChild(Lh(a.grade)),l.appendChild(h),l.appendChild(q("div","res "+(a.outcome==="kill"?"kill":""),this.outcome(a)));let u=q("div","detail");u.hidden=!0,l.onclick=()=>{u.hidden=!u.hidden,!u.hidden&&!u.childElementCount&&this.shotDetail(u,a)},s.append(l,u)}t.appendChild(s)}outcome(t){if(t.outcome==="kill")return"Kill";let e={target_down:"target already down",decoyed:"decoyed",out_of_energy:"out of energy",no_lock:"never locked",lost_lock:"lost the target"};return t.outcome==="close"?"Close pass, no kill":t.outcome==="miss"?"Miss"+(e[t.reason]?" \u2014 "+e[t.reason]:""):"Unknown"}rangeBar(t){let e=q("div","rb");if(t.rangeM==null)return e.textContent="\u2014",e;let n=this.host.settings.units;if(!t.rmaxM)return e.textContent=de(t.rangeM,n)+" (no envelope)",e;let s=Math.max(t.rangeM,t.rmaxM)*1.1,r=q("div","rbar"),o=(l,c,h)=>{let u=q("div","rs "+h);u.style.left=l/s*100+"%",u.style.width=Math.max(0,c-l)/s*100+"%",r.appendChild(u)};o(0,t.rneM||0,"ok"),o(t.rneM||0,t.rmaxM,"mid"),o(t.rmaxM,s,"bad");let a=q("div","rdot");return a.style.left=t.rangeM/s*100+"%",r.appendChild(a),e.append(r,q("span","rtxt",de(t.rangeM,n)+" \xB7 max "+de(t.rmaxM,n)+" \xB7 NEZ "+de(t.rneM||0,n))),e}pkFor(t,e="all"){if(!this.lib||t.rangeM==null||t.aspectDeg==null||t.shooterAltM==null||t.targetAltM==null)return null;let n=this.host.settings;return Ws(this.lib,{model:t.model,guidance:t.guidance,range:t.rangeM,aspect:t.aspectDeg,shooterAlt:t.shooterAltM,targetAlt:t.targetAltM,shooterMach:t.shooterMach??.9,targetMach:t.targetMach??.9,targetAgl:t.targetAglM,multipath:t.multipathLaunch??void 0},{match:this.ana.session,t:t.t},ia(e,n.me,n.wingmen))}pkCell(t){let e=q("div","num");if(!this.lib)return e.textContent="\u2026",e;let n=this.pkFor(t);return n?(e.textContent=Math.round(n.pk*100)+"%",e.title="Based on "+n.n+" similar shots ("+n.pool+"); 90% range "+Math.round(n.lo*100)+"\u2013"+Math.round(n.hi*100)+"%",n.pk<.15&&e.classList.add("bad"),e):(e.textContent="too few shots",e.className="muted",e)}factors(t,e){let n=q("ul","factors");for(let s of e||[]){let r=q("li","g-"+s.grade);r.append(q("span","fi",s.grade==="good"?"\u2713":s.grade==="fair"?"!":"\u2715"),document.createTextNode(" "+s.text)),n.appendChild(r)}t.appendChild(n)}shotDetail(t,e){let n=this.host.settings.units,s=q("div","cols"),r=q("div");r.appendChild(q("h4","","Why this grade")),this.factors(r,e.factors),e.targetGuessed&&r.appendChild(q("div","fine","The replay does not say what this missile was fired at; the target shown is a guess from its flight path (right about 9 times in 10).")),e.multipathTerminal>0&&e.targetAglMinM!=null&&r.appendChild(q("div","fine","Target's lowest height during the last 10 s of the flight: "+ae(Math.max(0,e.targetAglMinM),n)));let o=this.pkFor(e);o&&r.appendChild(q("div","fine","Pk from history: "+Math.round(o.pk*100)+"% ("+o.n+" similar shots from "+o.pool+", 90% range "+Math.round(o.lo*100)+"\u2013"+Math.round(o.hi*100)+"%)"));for(let[u,f]of[["self","your own shots"],["squad","your and your wingman's shots"]]){if(u==="squad"&&!(this.host.settings.wingmen||"").trim())continue;let d=this.pkFor(e,u);d&&r.appendChild(q("div","fine","Pk from "+f+": "+Math.round(d.pk*100)+"% ("+d.n+" similar shots"+(o?"; everyone: "+Math.round(o.pk*100)+"%":"")+")"))}let a=q("div");a.appendChild(q("h4","","After the launch"));let l=q("div","kv2"),c=(u,f)=>{l.append(q("span","",u),q("b","",f))};c("Lock held (until the missile went active)",xn(e.supportShare)),c("Most you turned away from the target (crank)",e.maxOffAngleDeg!=null?e.maxOffAngleDeg+"\xB0":"\u2014"),c("Your distance to the target when the missile went active",e.distAtActiveM!=null?de(e.distAtActiveM,n):"\u2014"),c("Your distance to the target when the missile arrived",e.distAtEndM!=null?de(e.distAtEndM,n):"\u2014"),c("You turned away (cold)",e.shooterTurnedColdT!=null?"+"+((e.shooterTurnedColdT-e.t)/1e3).toFixed(0)+" s after launch":"no"),c("Missile speed at the end",e.endSpeedMs!=null?Ie(e.endSpeedMs,n):"\u2014"),c("Closest pass",e.missDistanceM!=null?Math.round(e.missDistanceM)+" m":"\u2014"),a.appendChild(l),s.append(r,a),t.appendChild(s),t.appendChild(q("h4","","Missile energy")),this.energyChart(t,e);let h=q("div","btnRow");h.append(this.watchBtn("Watch the launch",e.t-3e3,e.missile),this.watchBtn("Watch the end",(e.tClosest||this.unit(e.missile)?.tEnd||e.t)-6e3,e.missile)),t.appendChild(h)}energyChart(t,e){if(!this.host.ses())return;let n=this.unit(e.missile),s=e.target>=0?this.unit(e.target):null;if(!n||n.n<3){t.appendChild(q("div","muted","No track for this missile."));return}let r=this.host.settings.units,o=y=>r==="aviation"?y*1.94384:y*3.6,a=[],l=[],c=[],h=NaN,u=Math.max(1,Math.floor(n.n/200)),f=(y,m)=>{let g=De(y,m);return[y.x[g],y.y[g],y.z[g]]};for(let y=0;y<n.n;y+=u){let m=n.t[y],g=(m-n.tStart)/1e3,p=Math.max(0,y-3),M=Math.min(n.n-1,y+3),b=(n.t[M]-n.t[p])/1e3,x=n.speed?n.speed[y]:b>0?Math.hypot(n.x[M]-n.x[p],n.y[M]-n.y[p],n.z[M]-n.z[p])/b:NaN;if(a.push([g,o(x)]),s&&m>=s.tStart&&m<=s.tEnd&&b>0){let _=De(s,m);l.push([g,o(s.speed?s.speed[_]:NaN)]);let w=f(s,n.t[p]),C=f(s,n.t[M]),P=Math.hypot(w[0]-n.x[p],w[1]-n.y[p],w[2]-n.z[p]),E=Math.hypot(C[0]-n.x[M],C[1]-n.y[M],C[2]-n.z[M]),v=(P-E)/b;c.push([g,o(v)]),v<0&&isNaN(h)&&g>3&&(h=g)}}let d=[];e.activeT!=null&&d.push({x:(e.activeT-n.tStart)/1e3,label:"seeker active",color:ne.ink2}),isNaN(h)||d.push({x:h,label:"stopped closing",color:ne.orange}),_n(t,{x0:0,x1:(n.tEnd-n.tStart)/1e3,height:140,zeroLine:!0,markers:d,series:[{name:"Missile speed",color:ne.blue,pts:a},{name:"Target speed",color:ne.ink3,pts:l,dashed:!0},{name:"Closing speed",color:ne.aqua,pts:c}],xFmt:y=>y.toFixed(0)+" s",yFmt:y=>Math.round(y)+(r==="aviation"?" kt":" km/h")})}incoming(t,e){let n=e.incoming||[];if(!n.length){t.appendChild(q("div","muted","No missiles were identified as fired at this player."));return}t.appendChild(q("p","fine","Reaction = first turn of more than 30\xB0, dive of more than 600 m or countermeasure after the launch. Notch = your speed toward or away from the radar inside \xB120 m/s (game radars filter a 40 m/s band of ground-clutter speeds) while the radar looks down at you."));let s=q("div","tbl inc"),r=q("div","tr th");for(let a of["Time","Missile","From","Range / aspect","Reaction","Notch held","Chaff / flares","Grade","Result"])r.appendChild(q("div","",a));s.appendChild(r);let o=this.host.settings.units;for(let a of n){let l=q("div","tr click");l.appendChild(q("div","num",this.clock(a.t))),l.appendChild(q("div","",a.model+(a.guidance?" ("+a.guidance+")":""))),l.appendChild(q("div","",a.shooter>=0?this.title(a.shooter):"?")),l.appendChild(q("div","num",(a.rangeM!=null?de(a.rangeM,o):"\u2014")+(a.aspectDeg!=null?" \xB7 "+a.aspectDeg+"\xB0":""))),l.appendChild(q("div","num",a.reactionS!=null?a.reactionS.toFixed(1)+" s ("+a.reactionKind+")":"none")),l.appendChild(q("div","num",a.notchApplies?xn(a.notchShare):"n/a (IR)"));let c=(a.cms||[]).filter(d=>d.type==="chaff").length,h=(a.cms||[]).length-c;l.appendChild(q("div","num",c+" / "+h+(a.chaffInNotch?" \xB7 "+a.chaffInNotch+" chaff in notch":"")));let u=q("div","");u.appendChild(Lh(a.grade)),l.appendChild(u),l.appendChild(q("div","res "+(a.killedMe?"dead":""),a.killedMe?"Killed you":this.outcome(a)));let f=q("div","detail");f.hidden=!0,l.onclick=()=>{f.hidden=!f.hidden,!f.hidden&&!f.childElementCount&&this.incomingDetail(f,a)},s.append(l,f)}t.appendChild(s)}incomingDetail(t,e){let n=q("div","cols"),s=q("div");s.appendChild(q("h4","","Your defence")),this.factors(s,e.factors),e.shooterLOS===!1&&s.appendChild(q("div","fine","Terrain was between you and the shooter at launch."));let r=q("div");r.appendChild(q("h4","","Timeline"));let o=q("div","kv2"),a=(c,h)=>{o.append(q("span","",c),q("b","",h))};if(a("Seeker went active",e.activeT!=null?"+"+((e.activeT-e.t)/1e3).toFixed(1)+" s":"\u2014"),a("Seeker lost you",e.lostT!=null?"+"+((e.lostT-e.t)/1e3).toFixed(1)+" s":"no"),a("Missile ended","+"+((e.tEnd-e.t)/1e3).toFixed(1)+" s"),a("Countermeasures",(e.cms||[]).map(c=>c.type+" +"+((c.t-e.t)/1e3).toFixed(1)).join(", ")||"none"),r.appendChild(o),n.append(s,r),t.appendChild(n),e.notchApplies&&e.notchSeries&&e.notchSeries.length){t.appendChild(q("h4","","Notch meter \u2014 your speed toward (\u2212) or away from (+) the radar"));let c=[],h=[];for(let d of e.notchSeries){let y=(d[0]-e.t)/1e3;c.push([y,d[2]?d[1]:NaN]),h.push([y,d[2]?NaN:d[1]])}let u=[];for(let d of e.cms||[])u.push({x:(d.t-e.t)/1e3,label:d.type,color:d.type==="chaff"?ne.aqua:ne.yellow});e.activeT!=null&&u.push({x:(e.activeT-e.t)/1e3,label:"seeker active",color:ne.ink}),e.lostT!=null&&u.push({x:(e.lostT-e.t)/1e3,label:"seeker lost you",color:ne.aqua});let f=Math.max(80,...e.notchSeries.map(d=>Math.min(400,Math.abs(d[1]))));_n(t,{x0:0,x1:(e.notchSeries[e.notchSeries.length-1][0]-e.t)/1e3,height:170,yMin:-f,yMax:f,zeroLine:!0,markers:u,bands:[{y0:-40,y1:40,color:"rgba(27,175,122,.10)"},{y0:-20,y1:20,color:"rgba(27,175,122,.22)"}],series:[{name:"Radar looking down at you (notch possible)",color:ne.blue,pts:c},{name:"Radar looking up at you (no notch)",color:ne.ink3,pts:h,dashed:!0}],xFmt:d=>"+"+d.toFixed(0)+" s",yFmt:d=>Math.round(d)+" m/s",onClick:d=>this.host.seek(e.t+d*1e3)}),t.appendChild(q("div","fine","Dark green band: inside the notch (\xB120 m/s). Light band: \xB140 m/s. Click the chart to jump there in the replay."))}let l=q("div","btnRow");l.append(this.watchBtn("Watch from the launch",e.t-3e3,e.missile),this.watchBtn("Watch the end",e.tEnd-8e3,e.missile)),t.appendChild(l)}deaths(t,e){let n=e.deaths||[];if(!n.length){t.appendChild(q("div","muted","No deaths in this match."));return}let s=this.host.settings.units;for(let r of n){let o=q("div","card"),a=q("div","cardHead");a.append(q("span","mt",this.clock(r.t)),q("b","",r.crash?"Crashed / no recorded killer":"Killed by "+(r.killerName||"?")+(r.weapon?" \u2014 "+r.weapon:""))),a.appendChild(this.watchBtn("Watch the last 30 s",r.t-3e4,r.unit)),r.missile>=0&&a.appendChild(this.watchBtn("Follow the missile",r.t-15e3,r.missile)),o.appendChild(a);let l=q("div","tags");for(let u of r.tags||[])l.appendChild(q("span","tag",u));o.appendChild(l);let c=q("div","kv2 four"),h=(u,f)=>{c.append(q("span","",u),q("b","",f))};if(h("Altitude",r.altM!=null?ae(r.altM,s)+(r.aglM!=null?" ("+ae(Math.max(0,r.aglM),s)+" above ground)":""):"\u2014"),h("Speed",r.speedMs!=null?Ie(r.speedMs,s)+" \xB7 Mach "+(r.mach??0).toFixed(2):"\u2014"),h("In the last 30 s",(r.altLost30M!=null?(r.altLost30M>=0?"lost ":"gained ")+ae(Math.abs(r.altLost30M),s):"")+(r.speedLost30Ms!=null?", "+(r.speedLost30Ms>=0?"lost ":"gained ")+Ie(Math.abs(r.speedLost30Ms),s):"")),h("Radar locks on you (last 30 s)",(r.lockedBy||[]).join(", ")||"none"),h("Missiles at you (last minute)",String(r.missilesAt60||0)),h("Reaction to the killing missile",r.missile>=0?z0(r.reactionS):"\u2014"),h("Notch held",r.missile>=0?xn(r.notchShare):"\u2014"),h("Nearest teammate",r.nearestTeammateKm!=null&&r.nearestTeammateKm>=0?de(r.nearestTeammateKm*1e3,s):"none alive"),h("Enemies within 20 km",String(r.enemiesWithin20)),o.appendChild(c),r.series&&r.series.length>2){let u=q("div","cols"),f=q("div"),d=q("div");f.appendChild(q("div","cap","Altitude, last 30 s")),d.appendChild(q("div","cap","Speed, last 30 s"));let y=(r.series[0][0]-r.t)/1e3;_n(f,{x0:y,x1:0,height:90,legend:!1,series:[{name:"Altitude",color:ne.blue,pts:r.series.map(m=>[(m[0]-r.t)/1e3,m[1]])}],xFmt:m=>m.toFixed(0)+" s",yFmt:m=>ae(m,s)}),_n(d,{x0:y,x1:0,height:90,legend:!1,series:[{name:"Speed",color:ne.blue,pts:r.series.map(m=>[(m[0]-r.t)/1e3,m[2]])}],xFmt:m=>m.toFixed(0)+" s",yFmt:m=>Ie(m,s)}),u.append(f,d),o.appendChild(u)}t.appendChild(o)}}engagements(t,e){let n=e.engagements||[];if(!n.length){t.appendChild(q("div","muted","No engagements (no shots, kills or deaths against an enemy)."));return}t.appendChild(q("p","fine","One row per enemy you exchanged shots with. Energy = altitude plus the height your speed is worth (h + v\xB2/2g): more energy means more missile range and more room to defend."));let s=this.host.settings.units,r=q("div","tbl eng"),o=q("div","tr th");for(let a of["Start","Enemy","First shot","Energy at first shot","Shots you / they","Result",""])o.appendChild(q("div","",a));r.appendChild(o);for(let a of n){let l=q("div","tr");l.appendChild(q("div","num",this.clock(a.start))),l.appendChild(q("div","",(a.opponentNames||[]).join(", "))),l.appendChild(q("div","",a.firstShotT!=null?(a.firstShotByMe?"You":"They")+" at "+(a.firstShotRangeM!=null?de(a.firstShotRangeM,s):"?"):"\u2014"));let c="\u2014";if(a.myEnergyM!=null&&a.theirEnergyM!=null){let d=a.myEnergyM-a.theirEnergyM;c=(d>=0?"+":"\u2212")+ae(Math.abs(d),s)+" "+(d>=0?"more":"less")+" than them",a.altDiffM!=null&&(c+=" (alt "+(a.altDiffM>=0?"+":"\u2212")+ae(Math.abs(a.altDiffM),s)+", speed "+(a.speedDiffMs>=0?"+":"\u2212")+Ie(Math.abs(a.speedDiffMs),s)+")")}l.appendChild(q("div","num",c)),l.appendChild(q("div","num",(a.myShots||[]).length+" / "+(a.theirShots||[]).length)),l.appendChild(q("div","res "+(a.result==="won"?"kill":a.result==="lost"?"dead":""),a.result));let h=this.host.ses()?.playerBySlot.get(this.slot),u=-1;if(h)for(let d of h.units){let y=this.unit(d);y&&a.start>=y.tStart-1e3&&a.start<=y.tEnd&&(u=d)}let f=q("div","");f.appendChild(this.watchBtn("Watch",(a.firstShotT??a.start)-8e3,u)),l.appendChild(f),r.appendChild(l)}t.appendChild(r)}position(t,e){let n=e.threat,s=this.host.settings.units;if(!n||!n.t||!n.t.length){t.appendChild(q("div","muted","No flight data."));return}let r=this.ana.t0,o=x=>(x-r)/6e4,a=[];for(let x of e.kills||[])x.teamKill||a.push({x:o(x.t),label:"kill: "+x.victimName,color:ne.aqua});for(let x of e.deaths||[])a.push({x:o(x.t),label:"death",color:ne.orange});let l=o(n.t[0]),c=o(n.t[n.t.length-1]),h=x=>n.t.map((_,w)=>[o(_),x[w]]),u=x=>{let _=Math.max(0,x*60);return Math.floor(_/60)+":"+String(Math.floor(_%60)).padStart(2,"0")};t.appendChild(q("h3","","Threat picture")),t.appendChild(q("p","fine","Enemies within 40 km, enemy radars locked on you, and missiles in the air at you. Click to jump there.")),_n(t,{x0:l,x1:c,height:170,markers:a,series:[{name:"Enemies within 40 km",color:ne.blue,pts:h(n.enemiesNear),step:!0},{name:"Radars locked on you",color:ne.orange,pts:h(n.radarsOnMe),step:!0},{name:"Missiles at you",color:ne.aqua,pts:h(n.missilesAtMe),step:!0}],xFmt:u,yFmt:x=>String(Math.round(x)),yMin:0,onClick:x=>this.host.seek(r+x*6e4)}),this.ana.terrain&&(t.appendChild(q("h3","","Terrain masking")),t.appendChild(q("p","fine","Enemies within 60 km that could see you over the terrain, against all enemies within 40 km."+(e.maskedShare!=null?" Hidden from every nearby enemy "+xn(e.maskedShare)+" of the time they were near.":""))),_n(t,{x0:l,x1:c,height:120,markers:a,series:[{name:"Enemies within 40 km",color:ne.blue,pts:h(n.enemiesNear),step:!0},{name:"Enemies with line of sight (60 km)",color:ne.orange,pts:h(n.enemiesLOS),step:!0}],xFmt:u,yMin:0,onClick:x=>this.host.seek(r+x*6e4)})),t.appendChild(q("h3","","Altitude and energy"));let f=[0,0,0,0,0],d=0;for(let x of this.ana.players)for(let _=0;_<5;_++)f[_]+=x.bands.timeS[_],d+=x.bands.timeS[_];let y=e.bands.timeS,m=y.reduce((x,_)=>x+_,0)||1,g=e.bands.edgesM,p=g.map((x,_)=>_<4?ae(x,s)+"\u2013"+ae(g[_+1],s):"above "+ae(x,s)),M=[];for(let x=4;x>=0;x--){let _=y[x]/m,w=d?f[x]/d:0;M.push({label:p[x],value:_,compare:w,text:xn(_)+" (lobby "+xn(w)+") \xB7 "+e.bands.shots[x]+" shots \xB7 "+e.bands.kills[x]+" kills \xB7 "+e.bands.deaths[x]+" deaths"})}Ih(t,M,1),t.appendChild(q("div","fine","Bar: your share of flight time at that altitude. Tick: the whole lobby's share.")),_n(t,{x0:l,x1:c,height:120,markers:a,legend:!1,series:[{name:"Altitude",color:ne.blue,pts:h(n.altM)}],xFmt:u,yFmt:x=>ae(x,s),yMin:0,onClick:x=>this.host.seek(r+x*6e4)}),t.appendChild(q("h3","","Teammates")),t.appendChild(q("p","fine","Distance to the nearest teammate and the nearest enemy. Flying alone (no teammate within 20 km): "+xn(e.aloneShare)+" of the time."+((e.kills||[]).length?" At your kills the nearest teammate was "+e.kills.filter(x=>!x.teamKill).map(x=>x.nearestTeammateKm!=null&&x.nearestTeammateKm>=0?x.nearestTeammateKm.toFixed(1)+" km":"none").join(", ")+" away.":"")+((e.deaths||[]).length?" At your deaths: "+e.deaths.map(x=>x.nearestTeammateKm!=null&&x.nearestTeammateKm>=0?x.nearestTeammateKm.toFixed(1)+" km":"none").join(", ")+".":"")));let b=x=>x.map(_=>_<0?NaN:_);_n(t,{x0:l,x1:c,height:130,markers:a,bands:[{y0:0,y1:20,color:"rgba(42,120,214,.08)"}],series:[{name:"Nearest teammate (km)",color:ne.blue,pts:h(b(n.nearestTeammateKm))},{name:"Nearest enemy (km)",color:ne.orange,pts:h(b(n.nearestEnemyKm))}],xFmt:u,yFmt:x=>x.toFixed(0)+" km",yMin:0,onClick:x=>this.host.seek(r+x*6e4)})}};function ut(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var rn=i=>i==null||!isFinite(i)?"\u2014":Math.round(i*100)+"%",an=i=>{let t=i.filter(e=>e!=null&&isFinite(e));return t.length?t.reduce((e,n)=>e+n,0)/t.length:NaN},vl=i=>(i||"").replace(/^(air|avg)_/,"").replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase()),V0=[["overview","Overview & trends"],["pk","Pk calculator"],["heat","Heatmaps"],["compare","Compare with the best"]],ra=class{constructor(t,e){j(this,"root");j(this,"host");j(this,"lib",null);j(this,"rows",[]);j(this,"selected",new Set);j(this,"tab","overview");j(this,"body");j(this,"list");j(this,"fMap","");j(this,"fAc","");j(this,"pkState",null);j(this,"heatState",{level:"",layer:"fly"});j(this,"terrains",new Map);this.root=t,this.host=e}async open(t=!1){if(this.root.hidden=!1,(!this.lib||t)&&(this.root.innerHTML="",this.root.appendChild(ut("div","pageMsg","Reading the library\u2026 (new matches are analysed the first time, a few seconds each)")),this.lib=await ea(t),await Qr(),this.index(),!this.selected.size))for(let e of this.rows)this.selected.add(e.m.id);this.build()}close(){this.root.hidden=!0}reset(){this.lib=null,this.selected.clear(),this.pkState=null}meName(){return(this.host.settings.me||"").trim().toLowerCase()}index(){let t=this.meName();this.rows=(this.lib.matches||[]).map(e=>({m:e,me:t&&(e.players||[]).find(n=>n.name.toLowerCase()===t)||null,date:new Date(e.startUTC||0)})),this.rows.sort((e,n)=>e.date.getTime()-n.date.getTime())}sel(){return this.rows.filter(t=>this.selected.has(t.m.id))}build(){let t=this.root;t.innerHTML="";let e=ut("div","pageHead");e.appendChild(ut("div","pageTitle","Library")),e.appendChild(ut("div","muted",this.rows.length+" matches \xB7 me = "+(this.host.settings.me||"(set your name in the top bar)")));let n=ut("div","pageTabs");for(let[g,p]of V0){let M=ut("button",g===this.tab?"on":"",p);M.dataset.tab=g,M.onclick=()=>{this.tab=g;for(let b of Array.from(n.children))b.classList.toggle("on",b.dataset.tab===g);this.render()},n.appendChild(M)}e.appendChild(n);let s=ut("button","","Refresh");s.onclick=()=>this.open(!0);let r=ut("button","back","\u2190 Back to replay");r.onclick=()=>this.host.close(),e.append(s,r),t.appendChild(e);let o=ut("div","libSplit"),a=ut("div","libSide"),l=[...new Set(this.rows.map(g=>g.m.level))].sort(),c=[...new Set(this.rows.flatMap(g=>g.me?g.me.vehicles||[]:[]))].sort(),h=document.createElement("select");h.appendChild(new Option("All maps",""));for(let g of l)h.appendChild(new Option(vl(g),g));h.value=this.fMap;let u=document.createElement("select");u.appendChild(new Option("All my aircraft",""));for(let g of c)u.appendChild(new Option(g,g));u.value=this.fAc;let f=()=>{this.fMap=h.value,this.fAc=u.value,this.selected.clear();for(let g of this.rows)(!this.fMap||g.m.level===this.fMap)&&(!this.fAc||g.me&&(g.me.vehicles||[]).includes(this.fAc))&&this.selected.add(g.m.id);this.renderList(),this.render()};h.onchange=f,u.onchange=f;let d=ut("div","filters");d.append(h,u);let y=ut("button","","All");y.onclick=()=>{for(let g of this.rows)this.selected.add(g.m.id);this.renderList(),this.render()};let m=ut("button","","None");m.onclick=()=>{this.selected.clear(),this.renderList(),this.render()},d.append(y,m),a.appendChild(d),this.list=ut("div","matchList"),a.appendChild(this.list),this.body=ut("div","pageBody"),o.append(a,this.body),t.appendChild(o),this.renderList(),this.render()}renderList(){let t=this.list;t.innerHTML="";for(let e of[...this.rows].reverse()){let n=ut("label","mrow"),s=document.createElement("input");s.type="checkbox",s.checked=this.selected.has(e.m.id),s.onchange=()=>{s.checked?this.selected.add(e.m.id):this.selected.delete(e.m.id),this.render()};let r=ut("div","");r.appendChild(ut("div","",vl(e.m.level)+" \xB7 "+e.date.toLocaleDateString([],{month:"short",day:"numeric"})+" "+e.date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}))),r.appendChild(ut("div","muted",e.me?(e.me.vehicles||[]).join(", ")+" \xB7 "+(e.me.summary.kills||0)+" / "+(e.me.summary.deaths||0):"you are not in this match"));let o=ut("button","mini","Open");o.onclick=a=>{a.preventDefault(),this.host.openMatch(e.m.id)},n.append(s,r,o),t.appendChild(n)}}render(){let t=this.body;if(t.innerHTML="",!this.rows.length){t.appendChild(ut("div","pageMsg","No converted matches yet."));return}if(!this.sel().length){t.appendChild(ut("div","pageMsg","Tick at least one match on the left."));return}switch(this.tab){case"overview":this.overview(t);break;case"pk":this.pk(t);break;case"heat":this.heat(t);break;case"compare":this.compare(t);break}}metrics(t){let e=t.summary||{};return{kills:e.kills||0,deaths:e.deaths||0,shots:e.shots||0,killRate:e.shots?(e.missileKills||0)/e.shots:NaN,poorShare:e.shots?(e.shotsPoor||0)/e.shots:NaN,shotRangeKm:e.avgShotRangeM?e.avgShotRangeM/1e3:NaN,rangeRatio:e.avgRangeRatio??NaN,reaction:e.avgReactionS??NaN,notch:e.avgNotchShare??NaN,survived:e.missilesSurvivedShare??NaN,alone:e.aloneShare??NaN,alt:e.meanAltM??NaN,firstShot:e.engagements?e.firstShotShare:NaN}}overview(t){let e=this.sel().filter(m=>m.me);if(!e.length){t.appendChild(ut("div","pageMsg",'You are not in the selected matches. Check your name in the top bar ("Me").'));return}let n=this.host.settings.units,s=e.map(m=>this.metrics(m.me)),r=m=>s.reduce((g,p)=>g+(p[m]||0),0),o=e.reduce((m,g)=>m+(g.me.summary.teamKills||0),0),a=e.reduce((m,g)=>m+(g.me.summary.missileKills||0),0),l=e.reduce((m,g)=>m+(g.me.summary.shotsPoor||0),0),c=ut("div","tiles"),h=(m,g,p="")=>{let M=ut("div","tile");M.append(ut("span","",m),ut("b","",g)),p&&M.appendChild(ut("small","",p)),c.appendChild(M)};h("Matches",String(e.length)),h("Kills / deaths",r("kills")+" / "+r("deaths"),"K/D "+(r("deaths")?(r("kills")/r("deaths")).toFixed(2):"\u221E")+(o?" \xB7 "+o+" team kills":"")),h("Missiles fired",String(r("shots")),(r("shots")?Math.round(a/r("shots")*100):0)+"% killed"),h("Poor shots",rn(r("shots")?l/r("shots"):NaN),"graded poor at launch"),h("Average shot range",isFinite(an(s.map(m=>m.shotRangeKm)))?de(an(s.map(m=>m.shotRangeKm))*1e3,n):"\u2014",rn(an(s.map(m=>m.rangeRatio)))+" of max range"),h("Reaction to launches",isFinite(an(s.map(m=>m.reaction)))?an(s.map(m=>m.reaction)).toFixed(1)+" s":"\u2014"),h("Notch held",rn(an(s.map(m=>m.notch)))),h("Missiles survived",rn(an(s.map(m=>m.survived)))),h("Flying alone",rn(an(s.map(m=>m.alone)))),h("Average altitude",isFinite(an(s.map(m=>m.alt)))?ae(an(s.map(m=>m.alt)),n):"\u2014"),t.appendChild(c),t.appendChild(ut("h3","","Trends, match by match")),t.appendChild(ut("p","fine","Solid: you. Dashed: the average of everyone in that match. Click a point to open the match."));let u=m=>{let g=e[Math.max(0,Math.min(e.length-1,Math.round(m)))];return g?g.date.toLocaleDateString([],{month:"short",day:"numeric"}):""},f=(m,g)=>an((m.m.players||[]).map(p=>this.metrics(p)[g])),d=ut("div","grid2"),y=(m,g,p,M=!0)=>{let b=ut("div","gbox");b.appendChild(ut("div","cap",m));let x=[{name:"You",color:ne.blue,pts:e.map((_,w)=>[w,s[w][g]])}];M&&x.push({name:"Lobby average",color:ne.ink3,pts:e.map((_,w)=>[w,f(_,g)]),dashed:!0}),_n(b,{x0:0,x1:Math.max(1,e.length-1),height:110,series:x,xFmt:u,yFmt:p,onClick:_=>this.host.openMatch(e[Math.max(0,Math.min(e.length-1,Math.round(_)))].m.id)}),d.appendChild(b)};y("Kills per match","kills",m=>m.toFixed(1)),y("Deaths per match","deaths",m=>m.toFixed(1)),y("Share of missiles that killed","killRate",m=>Math.round(m*100)+"%"),y("Share of poor shots","poorShare",m=>Math.round(m*100)+"%"),y("Reaction time to launches","reaction",m=>m.toFixed(1)+" s"),y("Notch held","notch",m=>Math.round(m*100)+"%"),y("Flying alone","alone",m=>Math.round(m*100)+"%"),y("Average altitude","alt",m=>ae(m,n)),t.appendChild(d),e.length<5&&t.appendChild(ut("p","fine","Trends become meaningful after 10 or more matches."))}pk(t){let e=new Set(this.sel().map(v=>v.m.id)),n=na(this.lib,e);if(n.length<10){t.appendChild(ut("div","pageMsg","Not enough recorded shots in the selected matches."));return}let s=this.host.settings.units,r=new Map;for(let v of n)r.set(v.model,(r.get(v.model)||0)+1);let o=[...r.entries()].sort((v,A)=>A[1]-v[1]),a=this.meName(),l=new Map;for(let v of this.sel())v.me&&l.set(v.m.id,v.me.slot);let c=v=>l.get(v.match)===v.shooterSlot;if(!this.pkState||!r.has(this.pkState.model)){let A=(o.find(([L])=>n.some(I=>I.model===L&&c(I)))||o[0])[0];this.pkState=this.defaultsFor(A,n.filter(L=>L.model===A))}let h=this.pkState;t.appendChild(ut("p","fine","Set up a shot. The estimate comes from the most similar shots recorded in the selected matches (all players), plus the fly-out estimate from the game's missile data. Shots whose target was destroyed by something else are left out."));let u=ut("div","pkForm"),f=document.createElement("select");for(let[v,A]of o)f.appendChild(new Option(v+" ("+A+" shots)",v));f.value=h.model,f.onchange=()=>{this.pkState=this.defaultsFor(f.value,n.filter(v=>v.model===f.value)),this.render()};let d=(v,A,L,I,D,H)=>{let k=ut("label","pkf");k.appendChild(ut("span","",v));let Y=document.createElement("input");Y.type="range",Y.min=String(I),Y.max=String(D),Y.step=String(L),Y.value=String(h[A]);let B=ut("b","",H(h[A]));Y.oninput=()=>{h[A]=Number(Y.value),B.textContent=H(h[A]),b()},k.append(Y,B),u.appendChild(k)},y=ut("label","pkf");y.append(ut("span","","Missile"),f),u.appendChild(y);let m=document.createElement("select");m.append(new Option("All players","all"),new Option("Only my shots","self"),new Option("Me + wingman","squad")),m.value=this.host.settings.pkScope||"all",m.onchange=()=>{this.host.settings.pkScope=m.value,this.host.saveSettings?.(),b()};let g=ut("label","pkf");g.append(ut("span","","Shots from"),m),u.appendChild(g),d("Range","range",500,1e3,9e4,v=>de(v,s)),d("Target aspect (0 = flying at you)","aspect",5,0,180,v=>v+"\xB0"),d("Your altitude","shooterAlt",250,0,14e3,v=>ae(v,s)),d("Target altitude","targetAlt",250,0,14e3,v=>ae(v,s)),d("Your Mach","shooterMach",.05,.3,2.2,v=>v.toFixed(2)),d("Target Mach","targetMach",.05,.3,2.2,v=>v.toFixed(2)),d("Target height above ground","targetAgl",10,0,3e3,v=>ae(v,s)),t.appendChild(u);let p=ut("div","pkOut");t.appendChild(p);let M=ut("div","");t.appendChild(M);let b=()=>{p.innerHTML="";let v=n,A=Vs(void 0,h.model),L={model:h.model,guidance:v.find(nt=>nt.model===h.model)?.guidance||"",range:h.range,aspect:h.aspect,shooterAlt:h.shooterAlt,targetAlt:h.targetAlt,shooterMach:h.shooterMach,targetMach:h.targetMach,targetAgl:h.targetAgl,multipath:A?bh(A,h.targetAgl):void 0},I=this.host.settings,D=I.pkScope||"all",H=Ws(v,L,void 0,ia(D,I.me,I.wingmen)),k=D!=="all"?Ws(v,L):null,Y=ut("div","pkBig");H?Y.append(ut("b","",Math.round(H.pk*100)+"%"),ut("span","","chance of a kill \xB7 "+H.n+" similar shots from "+H.pool+" \xB7 90% range "+Math.round(H.lo*100)+"\u2013"+Math.round(H.hi*100)+"%"+(k?" \xB7 everyone: "+Math.round(k.pk*100)+"%":""))):Y.append(ut("b","","\u2014"),ut("span","",D==="all"?"too few similar shots":"too few similar shots of your own (8 needed)"+(k?" \xB7 everyone: "+Math.round(k.pk*100)+"%":""))),p.appendChild(Y);let B=Vs(void 0,h.model);if(B){let[nt]=[Math.sqrt(401.87*(288.15-.0065*Math.min(h.shooterAlt,11e3)))],[rt]=[Math.sqrt(1.4*287.05*(288.15-.0065*Math.min(h.targetAlt,11e3)))],[at,Pt]=jr(B,h.shooterAlt,h.shooterMach*nt,h.targetAlt,h.targetMach*rt,h.aspect),Yt=h.range<=Pt?"inside no-escape range":h.range<=at?"inside max range, but the target can outrun it":"beyond max range";p.appendChild(ut("div","pkEnv","Fly-out estimate: max range "+de(at,s)+", no-escape range "+de(Pt,s)+" \u2014 "+Yt+".")),B.multipath&&B.multipath.length===4&&h.targetAgl<B.multipath[2]&&B.guidance!=="IR"&&p.appendChild(ut("div","pkEnv warn","Target below "+Math.round(B.multipath[2])+" m above ground: this radar missile suffers multipath."))}if(H){let nt=H.neighbours.filter(c);p.appendChild(ut("div","fine","Of these similar shots, "+nt.length+" were yours ("+nt.filter(rt=>rt.kill).length+" killed)."))}};b();let x=Gs(h.model),_=n.filter(v=>Gs(v.model)===x);M.appendChild(ut("h3","","Kill rate by range and aspect \u2014 "+x+" family ("+_.length+" shots)"));let w=[[0,1e4],[1e4,2e4],[2e4,3e4],[3e4,4e4],[4e4,1e9]],C=[["Hot (0\u201360\xB0)",0,60],["Beam (60\u2013120\xB0)",60,120],["Cold (120\u2013180\xB0)",120,181]],P=ut("div","tbl pkTbl"),E=ut("div","tr th");E.appendChild(ut("div","","Range"));for(let v of C)E.appendChild(ut("div","",v[0]));P.appendChild(E);for(let[v,A]of w){let L=ut("div","tr");L.appendChild(ut("div","",de(v,s)+(A<1e9?"\u2013"+de(A,s):"+")));for(let I of C){let D=_.filter(Y=>Y.range>=v&&Y.range<A&&Y.aspect>=I[1]&&Y.aspect<I[2]),H=D.filter(Y=>Y.kill).length,k=ut("div","num cell",D.length?Math.round(H/D.length*100)+"%":"\u2014");D.length&&(k.title=H+" kills of "+D.length+" shots",k.style.background="rgba(27,175,122,"+(.08+.5*H/D.length)+")",k.appendChild(ut("small",""," "+H+"/"+D.length))),L.appendChild(k)}P.appendChild(L)}M.appendChild(P)}defaultsFor(t,e){let n=(s,r)=>{let o=e.map(a=>a[s]).filter(a=>a!=null&&isFinite(a)).sort((a,l)=>a-l);return o.length?o[Math.floor(o.length/2)]:r};return{model:t,range:Math.round(n("range",2e4)/500)*500,aspect:Math.round(n("aspect",45)/5)*5,shooterAlt:Math.round(n("shooterAlt",6e3)/250)*250,targetAlt:Math.round(n("targetAlt",6e3)/250)*250,shooterMach:Math.round(n("shooterMach",1)*20)/20,targetMach:Math.round(n("targetMach",1)*20)/20,targetAgl:2e3}}heat(t){let e=this.sel(),n=[...new Set(e.map(d=>d.m.level))].sort(),s=this.heatState;n.includes(s.level)||(s.level=n[0]);let r=ut("div","filters"),o=document.createElement("select");for(let d of n)o.appendChild(new Option(vl(d)+" ("+e.filter(y=>y.m.level===d).length+")",d));o.value=s.level;let a=[["fly","Where I fly"],["kills","Where I get kills"],["deaths","Where I die"],["launches","Where I fire missiles"],["allDeaths","Where everyone dies"],["allKills","Where everyone gets kills"],["top","Where each match's top scorer flies"]],l=document.createElement("select");for(let[d,y]of a)l.appendChild(new Option(y,d));l.value=s.layer,o.onchange=()=>{s.level=o.value,this.render()},l.onchange=()=>{s.layer=l.value,this.render()},r.append(o,l),t.appendChild(r);let c=document.createElement("canvas");c.className="heat",c.width=c.height=720,t.appendChild(c);let h=ut("p","fine","");t.appendChild(h);let u=c.getContext("2d"),f=d=>{let y=c.width,m=d?{x0:d.x0,z0:d.z0,x1:d.x1,z1:d.z1}:{x0:-65536,z0:-65536,x1:65536,z1:65536},g=u.createImageData(y,y),p=g.data;for(let A=0;A<y;A++)for(let L=0;L<y;L++){let I=.18;if(d){let H=Math.min(d.n-2,Math.floor(L/y*d.n)),k=Math.min(d.n-2,Math.floor((1-A/y)*d.n)),Y=d.h[k*d.n+H];if(Y<=d.water+.5)I=.12;else{let B=d.h[k*d.n+H+1]-Y,nt=d.h[(k+1)*d.n+H]-Y;I=.22+.1*(Y-d.hMin)/Math.max(1,d.hMax-d.hMin)+Math.max(-.06,Math.min(.08,(-B+nt)/d.cell*.6))}}let D=(A*y+L)*4;p[D]=p[D+1]=p[D+2]=Math.round(I*255),p[D+3]=255}u.putImageData(g,0,0);let M=128,b=new Float32Array(M*M),x=(A,L=1)=>{if(A)for(let I=0;I+1<A.length;I+=2){let D=Math.floor((A[I]*1e3-m.x0)/(m.x1-m.x0)*M),H=Math.floor((A[I+1]*1e3-m.z0)/(m.z1-m.z0)*M);D>=0&&D<M&&H>=0&&H<M&&(b[H*M+D]+=L)}},_=0,w=this.meName();for(let A of e.filter(L=>L.m.level===s.level)){let L=A.m.players||[],I=L.find(D=>D.name.toLowerCase()===w);switch(s.layer){case"fly":I&&(x(I.track),_+=I.track.length/2);break;case"kills":I&&(x(I.kills,8),_+=I.kills.length/2);break;case"deaths":I&&(x(I.deaths,8),_+=I.deaths.length/2);break;case"launches":I&&(x(I.launches,8),_+=I.launches.length/2);break;case"allDeaths":for(let D of L)x(D.deaths,8),_+=D.deaths.length/2;break;case"allKills":for(let D of L)x(D.kills,8),_+=D.kills.length/2;break;case"top":{let D=L.filter(H=>H.name.toLowerCase()!==w).sort((H,k)=>((k.results||{}).score||0)-((H.results||{}).score||0))[0];D&&(x(D.track),_+=D.track.length/2);break}}}let C=A=>{let L=new Float32Array(M*M);for(let I=0;I<M;I++)for(let D=0;D<M;D++){let H=0,k=0;for(let Y=-1;Y<=1;Y++)for(let B=-1;B<=1;B++){let nt=D+B,rt=I+Y;if(nt>=0&&nt<M&&rt>=0&&rt<M){let at=B===0&&Y===0?4:B===0||Y===0?2:1;H+=A[rt*M+nt]*at,k+=at}}L[I*M+D]=H/k}return L},P=C(C(b)),E=0;for(let A of P)E=Math.max(E,A);let v=y/M;if(E>0)for(let A=0;A<M;A++)for(let L=0;L<M;L++){let I=P[A*M+L]/E;if(I<.03)continue;let D=Math.min(.9,.15+.85*Math.sqrt(I)),H=255,k=Math.round(200-140*I),Y=Math.round(80-60*I);u.fillStyle=`rgba(${H},${k},${Y},${D})`,u.fillRect(L*v,y-(A+1)*v,v+.5,v+.5)}u.strokeStyle="rgba(255,255,255,.12)",u.lineWidth=1;for(let A=Math.ceil(m.x0/1e4)*10;A*1e3<=m.x1;A+=10){let L=(A*1e3-m.x0)/(m.x1-m.x0)*y;u.beginPath(),u.moveTo(L,0),u.lineTo(L,y),u.stroke()}for(let A=Math.ceil(m.z0/1e4)*10;A*1e3<=m.z1;A+=10){let L=y-(A*1e3-m.z0)/(m.z1-m.z0)*y;u.beginPath(),u.moveTo(0,L),u.lineTo(y,L),u.stroke()}h.textContent=Math.round(_)+" points from "+e.filter(A=>A.m.level===s.level).length+" matches. North is up; grid lines every 10 km. Darker orange = more."};this.terrains.has(s.level)?f(this.terrains.get(s.level)):ua(s.level).then(d=>{this.terrains.set(s.level,d),f(d)})}compare(t){let e=this.sel().filter(d=>d.me);if(!e.length){t.appendChild(ut("div","pageMsg","You are not in the selected matches."));return}let n=this.host.settings.units,s=this.meName(),r=[],o=[],a=[],l=[];for(let d of e){let y=(d.m.players||[]).filter(p=>p.name.toLowerCase()!==s);r.push(this.metrics(d.me));let m=[...y].sort((p,M)=>((M.results||{}).score||0)-((p.results||{}).score||0))[0];m&&o.push(this.metrics(m));for(let p of y)a.push(this.metrics(p));let g=new Set(d.me.vehicles||[]);for(let p of y)(p.vehicles||[]).some(M=>g.has(M))&&l.push(this.metrics(p))}t.appendChild(ut("p","fine","Averages per match over the "+e.length+' selected matches you played. "Top scorer" = the highest-scoring other player of each match. "Same aircraft" = other players who flew one of your aircraft in that match ('+l.length+" player-matches)."));let c=(d,y)=>an(d.map(m=>m[y])),h=[["Kills","kills",d=>d.toFixed(2),!0],["Deaths","deaths",d=>d.toFixed(2),!1],["Missiles fired","shots",d=>d.toFixed(1),!0],["Share of missiles that killed","killRate",d=>rn(d),!0],["Share of poor shots","poorShare",d=>rn(d),!1],["Average shot range","shotRangeKm",d=>de(d*1e3,n),!0],["Shot range as share of max range","rangeRatio",d=>rn(d),!1],["Reaction time to launches","reaction",d=>d.toFixed(1)+" s",!1],["Notch held","notch",d=>rn(d),!0],["Missiles survived","survived",d=>rn(d),!0],["First shot in engagements","firstShot",d=>rn(d),!0],["Flying alone","alone",d=>rn(d),!1],["Average altitude","alt",d=>ae(d,n),!0]],u=ut("div","tbl cmp"),f=ut("div","tr th");for(let d of["","You","Top scorer","Same aircraft","Lobby average"])f.appendChild(ut("div","",d));u.appendChild(f);for(let[d,y,m]of h){let g=ut("div","tr");g.appendChild(ut("div","",d));for(let p of[r,o,l,a]){let M=c(p,y);g.appendChild(ut("div","num"+(p===r?" me":""),isFinite(M)?m(M):"\u2014"))}u.appendChild(g)}t.appendChild(u)}};var yt=i=>document.getElementById(i);function Ft(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var G0=i=>"#"+i.toString(16).padStart(6,"0"),W0={me:"spurzz",wingmen:"",pkScope:"all",liveRecord:!1,activeMark:!0,units:"metric",labels:"all",lblName:!0,lblType:!0,lblAlt:!0,lblSpeed:!1,missileLabels:!0,acTrail:30,msTrail:-1,missiles:!0,cms:!0,bombs:!0,ground:!0,ai:!0,dead:!1,sticks:!0,radar:"focus",desig:"focus",seeker:!0,msKeep:"focus",view:"3d",scanZone:!0,airfields:!0,areas:!1,trailStyle:"ribbon",lineWidth:2,vector:!1,dlz:!0,shade:!0,grid:!0,shells:!0,mgRounds:!0,shellKeep:3,gunLines:"focus"},Xt=Object.assign({},W0);try{Object.assign(Xt,JSON.parse(localStorage.getItem("wtrv.settings")||"{}"))}catch{}var ms=()=>{try{localStorage.setItem("wtrv.settings",JSON.stringify(Xt))}catch{}},lt=new ta(yt("canvasHost"),yt("labels"),Xt),K=null,te=0,Ti=!1,Xs=1,Dh=performance.now(),aa=[.25,.5,1,2,4,8,16,32,64],_e={x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0},Qe={x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0};function Nh(i){return K&&i.owner>=0&&K.playerBySlot.get(i.owner)||null}function ke(i){let t=i.kind==="aircraft"||i.kind==="ground"?Nh(i):null;return t?t.name:i.ai?i.name+" (AI)":i.name}function Sl(i,t){if(!K||!i.units.length)return null;let e=null,n=1/0;for(let s of i.units){let r=K.units[s];if(!r)continue;let o=t<r.tStart?r.tStart-t:t>r.tEnd?t-r.tEnd:0;o<n&&(n=o,e=r)}return e}function X0(i){if(i.missile!==void 0&&K.units[i.missile])return K.units[i.missile].name;let t=String(i.weapon||"");return t?/^\d+(\.\d+)?mm_/i.test(t)||/ball/i.test(t)?fa(t):t.replace(/^[a-z]{2,3}_/,"").replace(/_/g," ").toUpperCase():""}function Y0(){let i=yt("fetchBox"),t=yt("fetchId"),e=yt("fetchMsg"),n=yt("fetchGo"),s=!1,r=(o,a=!1)=>{e.textContent=o,e.classList.toggle("err",a)};yt("btnFetch").onclick=()=>{i.hidden=!1,s||r(""),t.focus(),t.select()},yt("fetchClose").onclick=()=>{i.hidden=!0},t.onkeydown=o=>{o.key==="Enter"&&n.click(),o.key==="Escape"&&(i.hidden=!0)},n.onclick=async()=>{if(s)return;let o=t.value.trim();if(!o){r("Paste a session ID first.",!0);return}let a;try{let c=await fetch("/api/fetch?id="+encodeURIComponent(o),{method:"POST"});if(!c.ok){r(await c.text(),!0);return}a=await c.json()}catch{r("Could not reach the viewer program.",!0);return}s=!0,n.disabled=!0;let l=a.id;for(;;){let c=(a.bytes/1e6).toFixed(1);if(a.state==="downloading")r(`Session ${l}: downloading\u2026 ${a.pieces} pieces, ${c} MB`);else if(a.state==="converting")r(`Session ${l}: ${a.pieces} pieces, ${c} MB downloaded. Converting\u2026`);else if(a.state==="done"){r(`Session ${l}: ready. Opening it\u2026`);break}else{r(`Session ${l}: failed.
${a.message||""}`,!0),s=!1,n.disabled=!1;return}await new Promise(h=>setTimeout(h,700));try{a=await(await fetch("/api/fetch/"+l)).json()}catch{}}s=!1,n.disabled=!1,location.href=location.pathname+"?s="+encodeURIComponent(l)}}async function q0(){ay(),ny(),ey(),oy(),Y0(),Qr();let i;try{i=await(await fetch("/api/sessions")).json()}catch{ps(`Could not reach the viewer program.
Is wtviewer still running?`);return}let t=yt("session");if(!i.sessions.length){ps(`No converted matches found in
`+i.sessionsFolder+`

Use \u201C+ Add match\u201D at the top to download one by session ID,
or drag a downloaded replay zip onto tools\\convert.bat.`);return}for(let n of i.sessions){let s=document.createElement("option");s.value=n.id;let r=n.startTimeUtc?new Date(n.startTimeUtc).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";s.textContent=Fh(n.level)+" \u2014 "+r+(n.terrain?"":" (no terrain)"),t.appendChild(s)}let e=new URLSearchParams(location.search).get("s");e&&i.sessions.some(n=>n.id===e)&&(t.value=e),t.onchange=()=>El(t.value),await El(t.value),requestAnimationFrame(Wh)}function Fh(i){return(i||"").replace(/^(air|avg)_/,"").replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}function ps(i){yt("loading").style.display=i===null?"none":"flex",i!==null&&(yt("loadingText").textContent=i)}async function El(i){Ti=!1,Al(),ps("Loading\u2026");try{K=await zl(i,ps)}catch(n){ps(`Could not open this match.
`+(n&&n.message||n));return}lt.setSession(K),$0(i),Ci.invalidate(),yt("debrief").hidden||Ci.open(),lt.onSelect=(n,s)=>Tn(n,s),lt.onFollowChange=()=>Vn(),lt.onHover=(n,s,r)=>{let o=yt("tip");if(n<0||!K){o.hidden=!0;return}let a=K.units[n];Xe(a,Math.min(Math.max(te,a.tStart),a.tEnd),Qe);let l=a.speed?Rn(a.speed,Qe,a.n):Hh(a,te);o.textContent=(a.kind==="aircraft"?ke(a)+" \xB7 "+a.name:a.name+(a.parent>=0&&K.units[a.parent]?" from "+ke(K.units[a.parent]):""))+`
`+ae(Qe.y,Xt.units)+" \xB7 "+Ie(l,Xt.units),o.style.transform=`translate(${Math.round(s+14)}px, ${Math.round(r+14)}px)`,o.hidden=!1};let t=lt.meSlot>=0?K.playerBySlot.get(lt.meSlot):null;t&&(t.highlight=!0),lt.restyle(),te=K.t0;let e=K.manifest.match;yt("matchInfo").textContent=Fh(K.levelName)+" \xB7 "+en(K.t1-K.t0)+" \xB7 "+K.players.length+" players"+(K.terrain?"":" \xB7 no terrain file for this map"),yt("dur").textContent=en(K.t1-K.t0),Ai(),Ys(),ys(),Ri(!0),qs(Xt.view==="2d"?"2d":"3d"),ps(null)}function Ai(){let i=yt("players");if(i.innerHTML="",!K)return;let t=[...new Set(K.players.map(e=>e.team))].sort((e,n)=>e===lt.myTeam?-1:n===lt.myTeam?1:e-n);for(let e of t){let n=K.players.filter(c=>c.team===e).sort((c,h)=>(h.results.score||0)-(c.results.score||0)),s=Ft("div","team"),r=Ft("i"),o=n[0]&&K.units[n[0].units[0]],a=o?o.team===(lt.myTeam||1)?Oe.friend:Oe.enemy:Oe.neutral;r.style.background=G0(a),s.appendChild(r),s.appendChild(Ft("span","",(lt.myTeam?e===lt.myTeam?"My team":"Enemy team":"Team "+e)+" \xB7 "+n.length));let l=Ft("button","",n.every(c=>c.hidden)?"Show":"Hide");l.onclick=()=>{let c=!n.every(h=>h.hidden);for(let h of n)h.hidden=c;lt.restyle(),Ai()},s.appendChild(l),i.appendChild(s);for(let c of n){let h=Ft("div","pl"+(c.slot===lt.meSlot?" me":"")+(c.hidden?" hidden":""));h.dataset.slot=String(c.slot);let u=Ft("button","ic"+(c.hidden?"":" on"),c.hidden?"\u25CB":"\u25CF");u.title=c.hidden?"Show this player":"Hide this player",u.onclick=p=>{p.stopPropagation(),c.hidden=!c.hidden,lt.restyle(),Ai()};let f=Ft("button","ic star"+(c.highlight?" on":""),c.highlight?"\u2605":"\u2606");f.title="Highlight this player",f.onclick=p=>{p.stopPropagation(),c.highlight=!c.highlight,lt.restyle(),Ai()};let d=Ft("div");d.appendChild(Ft("div","nm",c.name));let y=K.units[c.units[0]];d.appendChild(Ft("div","ac",y?[...new Set(c.units.map(p=>K.units[p].name))].join(", "):K.ground?"did not play":"did not fly"));let m=c.results,g=Ft("div","kd",K.ground?(m.groundKills||0)+(m.kills||0)+" / "+(m.deaths||0):(m.kills||0)+" / "+(m.deaths||0));g.title=K.ground?"Kills (ground + air) / deaths":"Air kills / deaths",h.append(u,f,d,g),h.onclick=()=>{let p=Sl(c,te);p&&Tn(p.id,!1)},h.ondblclick=()=>{let p=Sl(c,te);p&&(Tn(p.id,!1),lt.setFollow(p.id),Vn())},i.appendChild(h)}}ca()}function ca(){if(!K)return;let i=lt.selected>=0?K.units[lt.selected]:null;for(let t of Array.from(yt("players").querySelectorAll(".pl"))){let e=K.playerBySlot.get(Number(t.dataset.slot)),n=e.units.length?K.units[e.units[e.units.length-1]]:null;t.classList.toggle("down",!!n&&n.destroyed&&te>n.tEnd),t.classList.toggle("sel",!!i&&i.owner===e.slot)}}function Z0(){let i=new Set;if(!K||lt.meSlot<0)return i;let t=lt.meSlot;i.add(t);let e=new Set(K.playerBySlot.get(t).units),n=s=>{if(s===void 0)return;let r=K.units[s];r&&r.owner>=0&&i.add(r.owner)};for(let s of K.events)if(s.type==="kill"){let r=s.victim!==void 0&&K.units[s.victim]?K.units[s.victim].owner:-1;s.killerPlayer===t&&n(s.victim),r===t&&(s.killerPlayer!==void 0&&i.add(s.killerPlayer),n(s.killer))}else if(s.type==="message"&&s.units&&s.units.some(r=>e.has(r)))for(let r of s.units)n(r);for(let s of K.units){if(!s.radar)continue;let r=e.has(s.id);for(let o of s.radar)for(let a of o.targets)r?n(a):e.has(a)&&i.add(s.owner)}return i.delete(-1),i}function Tn(i,t){K&&(t&&lt.selected>=0&&i!==lt.selected?lt.measure=i:(lt.selected=i,lt.measure===i&&(lt.measure=-1)),lt.restyle(),ca(),Vh("selected"),Ri(!0),ys())}function Oh(){lt.selected=-1,lt.measure=-1,lt.setFollow(-1),lt.restyle(),ca(),Ri(!0),Vn(),ys()}function Vn(){Ri(!0),yt("btnFollow").classList.toggle("on",lt.follow>=0),yt("btnFollow").textContent=lt.follow>=0?"Following":"Follow"}var oa=-2;function Ri(i){let t=yt("selBody");if(!K||lt.selected<0){oa!==-1&&(t.className="muted",t.textContent="Click an aircraft, vehicle or missile.",oa=-1);return}let e=K.units[lt.selected];if(i||oa!==e.id){oa=e.id,t.className="",t.innerHTML="";let u=Nh(e);t.appendChild(Ft("div","selName",e.kind==="aircraft"||e.kind==="ground"?ke(e):e.name));let f="";if(e.kind==="aircraft"||e.kind==="ground"&&u)f=e.name+(u&&u.clan?" \xB7 "+u.clan:"");else if(e.kind==="missile"){let b=e.parent>=0?K.units[e.parent]:null;f=(e.missile&&e.missile.guidance?j0(e.missile.guidance)+" \xB7 ":"")+(b?"launched by "+ke(b):"")}t.appendChild(Ft("div","selSub",f));let d=Ft("div","btnRow"),y=Ft("button",lt.follow===e.id?"on":"",lt.follow===e.id?"Following":"Follow");if(y.onclick=()=>{lt.setFollow(lt.follow===e.id?-1:e.id),Vn()},d.appendChild(y),e.kind==="missile"&&e.parent>=0){let b=Ft("button","","Select launcher");b.onclick=()=>Tn(e.parent,!1),d.appendChild(b)}let m=Ft("button","","Go to start");m.onclick=()=>vn(e.tStart),d.appendChild(m);let g=Ft("button","","Clear");g.onclick=Oh,d.appendChild(g),t.appendChild(d);let p=Ft("div","kv");if(p.id="selKV",t.appendChild(p),e.kind==="missile"){let b=K.launchByMissile.get(e.id);t.appendChild(Ft("div","cap","Missile energy"));let x=e.seekerMode?Array.from(e.seekerMode).indexOf(2):-1;Ci.energyChart(t,{missile:e.id,target:b&&b.target!==void 0?b.target:-1,activeT:x>=0?e.t[x]:null})}let M=[["alt","Altitude"],["spd","Speed"]];if(gs.has(e.id)&&M.push(["oG","G (from your game)"],["oAoA","Angle of attack (from your game)"],["oIAS","Indicated airspeed (from your game)"]),e.kind==="ground"&&M.splice(0,1),e.kind==="aircraft"||e.kind==="missile"||e.kind==="ground")for(let[b,x]of M){let _=Ft("div","chart"),w=Ft("div","cap");w.append(Ft("span","",x),Ft("span","","")),w.id="cap-"+b;let C=document.createElement("canvas");C.id="chart-"+b,C.onclick=P=>{let E=C.getBoundingClientRect();vn(e.tStart+(e.tEnd-e.tStart)*(P.clientX-E.left)/E.width)},_.append(w,C),t.appendChild(_)}}let n=yt("selKV");n.innerHTML="";let s=(u,f,d=!1)=>{let y=Ft("div",d?"wide":"");y.append(Ft("span","",u),Ft("b","",f)),n.appendChild(y)};te>=e.tStart&&te<=e.tEnd||s("Status",te<e.tStart?"Not yet in the match (starts "+en(e.tStart-K.t0)+")":(e.destroyed?"Destroyed at ":"Ended at ")+en(e.tEnd-K.t0),!0);let o=Math.min(Math.max(te,e.tStart),e.tEnd);Xe(e,o,_e);let a=e.speed?Rn(e.speed,_e,e.n):Hh(e,o),l=e.mach?Rn(e.mach,_e,e.n):NaN,c=e.agl?Rn(e.agl,_e,e.n):NaN;if(e.kind==="ground"){J0(e,o,a,s),bl("spd",e,u=>wl(e,u),u=>Ie(u,Xt.units));return}if(s("Altitude",ae(_e.y,Xt.units)+(isFinite(c)?" ("+ae(Math.max(0,c),Xt.units)+" above ground)":""),isFinite(c)),s("Speed",Ie(a,Xt.units)),isFinite(l)&&s("Mach",l.toFixed(2)),e.kind==="aircraft"){s("Heading",String(Math.round((_e.heading+360)%360)).padStart(3,"0")+"\xB0"),s("G (estimated)",Rn(e.g,_e,e.n).toFixed(1)),s("Pitch",_e.pitch.toFixed(0)+"\xB0"),s("Roll",_e.roll.toFixed(0)+"\xB0");let u=Ii(e,o);u&&(s("Radar",(u.sensor||"Radar")+" \u2014 "+(u.on?u.label||u.state:"off"),!0),u.targets.length&&s("Locked on",u.targets.map(m=>K.units[m]?ke(K.units[m]):"?").join(", "),!0));let f=[];for(let m of K.units){if(m.kind!=="aircraft"||!m.radar||m.id===e.id)continue;let g=Ii(m,o);g&&g.targets.includes(e.id)&&o>=m.tStart&&o<=m.tEnd&&f.push(ke(m))}f.length&&s("Locked by",f.join(", "),!0);let d=gs.get(e.id);if(d&&o>=d.T[0]&&o<=d.T[d.T.length-1]){let m=kh(d,o);s("From your game","IAS "+Ie(d.IAS[m]/3.6,Xt.units)+" \xB7 AoA "+d.AoA[m].toFixed(1)+"\xB0 \xB7 G "+d.Ny[m].toFixed(1),!0),s("Throttle",Math.round(d.Throttle[m])+"%"),s("Fuel",Math.round(d.Fuel[m])+" kg"+(d.FuelMax[m]>0?" ("+Math.round(100*d.Fuel[m]/d.FuelMax[m])+"%)":"")),s("Matched","clock offset "+(d.offsetMs/1e3).toFixed(2)+" s \xB7 fit "+d.correlation.toFixed(2)+" \xB7 height error "+d.rmseAltM.toFixed(0)+" m",!0)}let y=e.owner>=0?K.stats.get(e.owner):null;y&&(s("Flight time (match)",en(y.flightTimeS*1e3)),s("Distance flown",de(y.distanceKm*1e3,Xt.units)),s("Highest G",y.maxG.toFixed(1)),s("Top speed","Mach "+y.maxMach.toFixed(2)),s("Missiles fired / kills",y.missilesFired+" / "+y.missileKills),s("Missiles fired at them",String(y.missilesFiredAtPlayer)))}else if(e.kind==="missile"){let u=De(e,o),f=e.seekerMode?e.seekerMode[u]:0;s("Seeker",f===2?"Tracking":f===1?"Searching":"\u2014"),s("Flight time",((o-e.tStart)/1e3).toFixed(1)+" s");let d=e.missile&&e.missile.spec;d&&d.maxG&&(s("Missile limit",d.maxG+" G"),s("Top speed (game data)","Mach "+d.machMax));let y=K.launchByMissile.get(e.id);if(y)y.target!==void 0&&K.units[y.target]&&s("Fired at",ke(K.units[y.target])+" ("+K.units[y.target].name+")",!0),y.rangeM!==void 0&&(s("Launch range",de(y.rangeM,Xt.units)),s("Target aspect",y.aspectDeg===void 0?"\u2014":y.aspectDeg+"\xB0 "+(y.aspectDeg<60?"(head-on)":y.aspectDeg>120?"(tail)":"(beam)"))),y.closureMs!==void 0&&(s("Closure at launch",Ie(y.closureMs,Xt.units)),s("Off the nose",y.offBoresightDeg+"\xB0")),s(y.outcome==="kill"?"Result":"Result (estimate, "+y.confidence+" confidence)",da(y),!0);else{let m=K.kills.find(g=>g.missile===e.id);s("Result",m?"Kill":"No kill recorded",!0)}}bl("alt",e,u=>e.y[u],u=>ae(u,Xt.units)),bl("spd",e,u=>wl(e,u),u=>Ie(u,Xt.units));let h=gs.get(e.id);h&&(Ml("oG",h,h.Ny,e,u=>u.toFixed(1)+" G"),Ml("oAoA",h,h.AoA,e,u=>u.toFixed(0)+"\xB0"),Ml("oIAS",h,h.IAS,e,u=>Ie(u/3.6,Xt.units)))}var K0={cannon:"Cannon",mg:"Machine gun",atgm:"Missile launcher",smoke:"Smoke",unknown:"Other"};function J0(i,t,e,n){if(n("Speed",Ie(e,Xt.units)),n("Hull heading",String(Math.round((_e.heading+360)%360)).padStart(3,"0")+"\xB0"),i.pitch&&isFinite(_e.pitch)&&n("Hull tilt","pitch "+_e.pitch.toFixed(0)+"\xB0 \xB7 roll "+_e.roll.toFixed(0)+"\xB0"),i.gunBearing){let c=De(i,t),h=i.gunBearing[c];if(isFinite(h)){let u=(h-_e.heading+540)%360-180;n("Gun",String(Math.round((h+360)%360)).padStart(3,"0")+"\xB0 \xB7 "+(Math.abs(u)<3?"straight ahead":Math.round(Math.abs(u))+"\xB0 "+(u>0?"right":"left"))+(i.gunElev&&isFinite(i.gunElev[c])?" \xB7 elevation "+i.gunElev[c].toFixed(1)+"\xB0":""),!0)}}let s=K.shots?K.shots.byUnit.get(i.id)||[]:[];if(!s.length)return;let r=new Map;for(let c of s){if(c.t>t)break;let h=r.get(c.weapon);h||(h=[],r.set(c.weapon,h)),h.push(c)}let o=[...r.keys()].sort((c,h)=>c-h);for(let c of o){let h=r.get(c),u=h[h.length-1],f=u.t+u.reloadS*1e3,d=K0[u.cls]+(u.caliberMm?" "+(u.caliberMm<20?u.caliberMm.toFixed(1):Math.round(u.caliberMm))+" mm":""),y=h.length+(u.cls==="mg"?" bursts":" shots");u.cls!=="mg"&&u.cls!=="smoke"&&(y+=" \xB7 last "+(u.shell?fa(u.shell)+(u.shellSource==="guess"?" (guessed)":""):"?"),u.reloadS>=1?y+=t<f?" \xB7 reloading, ready in "+((f-t)/1e3).toFixed(1)+" s":" \xB7 ready":u.reloadS>0&&(y+=" \xB7 "+Math.round(60/u.reloadS)+" rounds/min"),u.ammoLeft>=0&&(y+=" \xB7 "+u.ammoLeft+" of that round left")),n(d,y,!0)}let a=s.filter(c=>c.kill&&c.t<=t).length;a&&n("Kills by its shots (so far)",String(a));let l=s.filter(c=>c.t<=t&&c.cls==="cannon").pop();if(l){let c=l.hit>=0?K.units[l.hit]:null,h=l.kill?"killed "+(c?ke(c):"?"):l.end==="vehicle"&&c?"arc reaches "+ke(c):l.end==="ground"?"arc lands on the ground":l.end==="range"?"flew out of range":"\u2014";n("Last cannon shot",en(l.t-K.t0)+" \xB7 "+h+(l.elevAdj?" (arc fitted to the target, "+l.elevAdj.toFixed(2)+"\xB0)":""),!0)}}var gs=new Map;async function $0(i){gs=new Map;try{let e=await(await fetch("/api/ownship/"+i+"?me="+encodeURIComponent(Xt.me||""))).json();if(!K||K.id!==i)return;for(let n of e.lives||[])gs.set(n.unit,n);gs.size&&Ri(!0)}catch{}}function kh(i,t){let e=0,n=i.T.length-1;for(;e<n;){let s=e+n+1>>1;i.T[s]<=t?e=s:n=s-1}return e}function Ml(i,t,e,n,s,r="#ffb347"){let o=document.getElementById("chart-"+i);if(!o)return;let a=window.devicePixelRatio||1,l=o.clientWidth,c=o.clientHeight;if(!l)return;o.width!==Math.round(l*a)&&(o.width=Math.round(l*a),o.height=Math.round(c*a));let h=o.getContext("2d");h.setTransform(a,0,0,a,0,0),h.clearRect(0,0,l,c);let u=1/0,f=-1/0;for(let b of e)b<u&&(u=b),b>f&&(f=b);if(!isFinite(u))return;f-u<1&&(f=u+1);let d=b=>(b-n.tStart)/Math.max(1,n.tEnd-n.tStart)*l,y=b=>c-5-(b-u)/(f-u)*(c-10),m=Math.max(1,Math.floor(e.length/l));h.strokeStyle=r,h.lineWidth=1.5,h.lineJoin="round",h.beginPath();for(let b=0;b<e.length;b+=m){let x=d(t.T[b]),_=y(e[b]);b===0?h.moveTo(x,_):h.lineTo(x,_)}h.stroke();let g=Math.min(Math.max(te,n.tStart),n.tEnd),p=kh(t,g);h.strokeStyle="rgba(255,255,255,.55)",h.lineWidth=1,h.beginPath(),h.moveTo(d(g),0),h.lineTo(d(g),c),h.stroke(),h.fillStyle="#fff",h.beginPath(),h.arc(d(g),y(e[p]),3,0,7),h.fill();let M=document.getElementById("cap-"+i);M&&(M.lastChild.textContent=s(u)+" \u2013 "+s(f))}async function Bh(i){try{await fetch("/api/live?on="+(i?1:0),{method:"POST"})}catch{}zh()}async function zh(){let i=yt("liveBadge"),t=yt("liveInfo");try{let e=await(await fetch("/api/live")).json();i.hidden=!e.on,i.classList.toggle("rec",!!e.recording),i.textContent=e.recording?"\u25CF REC "+e.aircraft:e.error?"Game not found":"Waiting for the game",t.textContent=e.on?e.recording?"Recording "+e.aircraft+" ("+e.samples+" samples)."+(e.savedThisSession?" "+e.savedThisSession+" flight(s) saved.":""):(e.error?e.error+". ":"Waiting for you to spawn. ")+(e.savedThisSession?e.savedThisSession+" flight(s) saved.":""):"Off. When on, keep this viewer open while you play; each flight is saved in sessions\\live."}catch{}}setInterval(()=>{Xt.liveRecord&&zh()},3e3);function j0(i){return{ARH:"Active radar",SARH:"Semi-active radar",IR:"Infrared"}[i]||i}function wl(i,t){if(i.speed)return i.speed[t];let e=Math.max(0,t-2),n=Math.min(i.n-1,t+2),s=(i.t[n]-i.t[e])/1e3;return s>0?Math.hypot(i.x[n]-i.x[e],i.y[n]-i.y[e],i.z[n]-i.z[e])/s:0}function Hh(i,t){return wl(i,De(i,t))}function bl(i,t,e,n){let s=document.getElementById("chart-"+i);if(!s)return;let r=window.devicePixelRatio||1,o=s.clientWidth,a=s.clientHeight;if(!o)return;s.width!==Math.round(o*r)&&(s.width=Math.round(o*r),s.height=Math.round(a*r));let l=s.getContext("2d");l.setTransform(r,0,0,r,0,0),l.clearRect(0,0,o,a);let c=1/0,h=-1/0,u=Math.max(1,Math.floor(t.n/o));for(let p=0;p<t.n;p+=u){let M=e(p);M<c&&(c=M),M>h&&(h=M)}if(!isFinite(c))return;h-c<1&&(h=c+1);let f=p=>(p-t.tStart)/Math.max(1,t.tEnd-t.tStart)*o,d=p=>a-5-(p-c)/(h-c)*(a-10);l.strokeStyle="#4da3ff",l.lineWidth=2,l.lineJoin="round",l.beginPath();for(let p=0;p<t.n;p+=u){let M=f(t.t[p]),b=d(e(p));p===0?l.moveTo(M,b):l.lineTo(M,b)}l.stroke();let y=Math.min(Math.max(te,t.tStart),t.tEnd),m=De(t,y);l.strokeStyle="rgba(255,255,255,.55)",l.lineWidth=1,l.beginPath(),l.moveTo(f(y),0),l.lineTo(f(y),a),l.stroke(),l.fillStyle="#fff",l.beginPath(),l.arc(f(y),d(e(m)),3,0,7),l.fill();let g=document.getElementById("cap-"+i);g&&(g.lastChild.textContent=n(c)+" \u2013 "+n(h))}function Q0(){let i=yt("measure");if(!K||lt.selected<0||lt.measure<0){i.hidden=!0;return}let t=K.units[lt.selected],e=K.units[lt.measure];if(te<t.tStart||te>t.tEnd||te<e.tStart||te>e.tEnd){i.hidden=!0;return}let n=u=>(Xe(t,u,_e),Xe(e,u,Qe),Math.hypot(_e.x-Qe.x,_e.y-Qe.y,_e.z-Qe.z)),s=n(Math.max(t.tStart,e.tStart,te-250)),r=n(te),o=(Math.atan2(Qe.x-_e.x,Qe.z-_e.z)*180/Math.PI+360)%360,a=(s-r)/Math.max(.05,Math.min(250,te-Math.max(t.tStart,e.tStart))/1e3),l=Qe.y-_e.y;i.hidden=!1,i.innerHTML="",i.append(Ft("b","",ke(t)),document.createTextNode(" \u2192 "),Ft("b","",ke(e)),document.createTextNode("   range "+de(r,Xt.units)+" \xB7 bearing "+String(Math.round(o)).padStart(3,"0")+"\xB0 \xB7 "+(l>=0?"+":"\u2212")+ae(Math.abs(l),Xt.units)+" \xB7 closing "+Ie(a,Xt.units)));let c=lt.dlzInfo;if(c&&c.rmax>0){let u=c.range<=c.rne?"inside no-escape range":c.range<=c.rmax?"inside max range only":"out of range";i.appendChild(Ft("div","dlz",c.missile+": max "+de(c.rmax,Xt.units)+" \xB7 no-escape "+de(c.rne,Xt.units)+" \u2014 "+u+" (estimate)"))}let h=Ft("button","","\xD7");h.onclick=()=>{lt.measure=-1,lt.restyle()},i.appendChild(h)}function ty(i,t){let e=lt.meSlot,n=0;for(let s of K.launches){if(!K.units[s.missile])continue;let o=e>=0&&s.shooterPlayer===e,a=e>=0&&s.targetPlayer===e;if(t&&!o&&!a)continue;let l=Ft("div","ev"+(o?" mine":a?" lost":""));l.appendChild(Ft("div","tm",en(s.t-K.t0)));let c=Ft("div"),h=s.shooter!==void 0&&K.units[s.shooter]?ke(K.units[s.shooter]):"?",u=s.target!==void 0&&K.units[s.target]?ke(K.units[s.target]):"?";c.appendChild(Ft("div","",h+" \u2192 "+u)),c.appendChild(Ft("div","wp",s.model+(s.rangeM!==void 0?" \xB7 "+de(s.rangeM,Xt.units):"")+" \xB7 "+da(s))),l.appendChild(c),l.onclick=()=>{vn(s.t-2e3),Tn(s.missile,!1)},i.appendChild(l),n++}n||i.appendChild(Ft("div","muted",K.launches.length?"No missile shots to show.":"This match was converted before shot records existed. Convert it again to see them."))}function Ys(){let i=yt("events");if(i.innerHTML="",!K)return;let t=yt("evMine").checked,e=lt.meSlot;if(yt("evKind").value==="shots"){ty(i,t);return}let n=0;for(let s of K.kills){let r=s.victim!==void 0?K.units[s.victim]:null,o=s.killer!==void 0?K.units[s.killer]:null;if(!r||r.kind!=="aircraft"&&!(K.ground&&r.kind==="ground"&&r.player>=0))continue;let a=s.killerPlayer!==void 0?s.killerPlayer:o?o.owner:-1,l=e>=0&&a===e,c=e>=0&&r.owner===e;if(t&&!l&&!c)continue;let h=Ft("div","ev"+(l?" mine":c?" lost":""));h.appendChild(Ft("div","tm",en(s.t-K.t0)));let u=Ft("div"),f=a>=0&&K.playerBySlot.get(a)?K.playerBySlot.get(a).name:o?ke(o):"",d=Ft("div");d.textContent=(f?f+" \u2192 ":"Lost: ")+ke(r),s.teamKill&&d.appendChild(Ft("span","tk","  team kill")),u.appendChild(d);let y=X0(s),m="";o&&r.kind==="ground"&&(Xe(o,s.t,_e),Xe(r,s.t,Qe),m=" \xB7 "+Math.round(Math.hypot(_e.x-Qe.x,_e.z-Qe.z))+" m"),u.appendChild(Ft("div","wp",(o?o.name+" \xB7 ":"")+(y||"crash / unknown")+" \u2192 "+r.name+m)),h.appendChild(u),h.onclick=()=>{vn(s.t-8e3),Tn(s.missile!==void 0?s.missile:r.id,!1)},i.appendChild(h),n++}n||i.appendChild(Ft("div","muted",K.ground?"No kills to show.":"No shoot-downs to show."))}function ys(){let i=yt("strip");if(!K)return;let t=window.devicePixelRatio||1,e=i.clientWidth,n=i.clientHeight;if(!e)return;(i.width!==Math.round(e*t)||i.height!==Math.round(n*t))&&(i.width=Math.round(e*t),i.height=Math.round(n*t));let s=i.getContext("2d");s.setTransform(t,0,0,t,0,0),s.clearRect(0,0,e,n);let r=l=>6+(l-K.t0)/Math.max(1,K.t1-K.t0)*(e-12),o=24;if(s.fillStyle="#2f3948",s.fillRect(6,o-2,e-12,4),lt.selected>=0){let l=K.units[lt.selected];s.fillStyle="#5a6b8a",s.fillRect(r(l.tStart),o-2,Math.max(2,r(l.tEnd)-r(l.tStart)),4)}s.fillStyle="#ffe14d",s.fillRect(6,o-2,r(te)-6,4);let a=lt.meSlot;for(let l of K.kills){let c=l.victim!==void 0?K.units[l.victim]:null;if(!c||c.kind!=="aircraft")continue;let h=a>=0&&l.killerPlayer===a,u=a>=0&&c.owner===a;s.fillStyle=h?"#ffe14d":u?"#ff6a3d":"#7b8696";let f=h||u?14:7;s.fillRect(Math.round(r(l.t))-1,o-5-f,2,f)}if(a>=0){s.fillStyle="#e6eaf0";for(let l of K.events)l.type==="launch"&&K.units[l.unit]&&K.units[l.unit].kind==="missile"&&K.units[l.unit].owner===a&&(s.beginPath(),s.arc(r(l.t),o+8,2,0,7),s.fill())}s.fillStyle="#fff",s.beginPath(),s.arc(r(te),o,6,0,7),s.fill()}function vn(i){K&&(te=Math.min(K.t1,Math.max(K.t0,i)),Gh(!0))}window.wtrvTest={seek:i=>vn(i),select:i=>Tn(i,!1),viewer:()=>lt,ses:()=>K};function Al(){yt("play").textContent=Ti?"\u275A\u275A":"\u25B6"}function ey(){let i=yt("speed");for(let s of aa){let r=document.createElement("option");r.value=String(s),r.textContent=s+"\xD7",i.appendChild(r)}i.value="1",i.onchange=()=>{Xs=Number(i.value)},yt("play").onclick=Tl;let t=yt("strip"),e=!1,n=s=>{let r=t.getBoundingClientRect();vn(K.t0+(K.t1-K.t0)*Math.min(1,Math.max(0,(s.clientX-r.left-6)/(r.width-12))))};t.addEventListener("pointerdown",s=>{K&&(e=!0,t.setPointerCapture(s.pointerId),n(s))}),t.addEventListener("pointermove",s=>{e&&K&&n(s)}),t.addEventListener("pointerup",()=>{e=!1}),window.addEventListener("resize",ys),window.addEventListener("keydown",s=>{let r=s.target.tagName;if(!(r==="INPUT"||r==="SELECT"))if(s.code==="Space")Tl(),s.preventDefault();else if(s.code==="ArrowLeft")vn(te-(s.shiftKey?3e4:5e3));else if(s.code==="ArrowRight")vn(te+(s.shiftKey?3e4:5e3));else if(s.key===","||s.key==="."){let o=aa.indexOf(Xs)+(s.key==="."?1:-1);o>=0&&o<aa.length&&(Xs=aa[o],i.value=String(Xs))}else s.key==="f"||s.key==="F"?yt("btnFollow").click():s.key==="m"||s.key==="M"?yt("btnMe").click():s.key==="t"||s.key==="T"?lt.topView():s.key==="2"?qs("2d"):s.key==="3"?qs("3d"):s.key==="h"||s.key==="H"?(lt.homeCamera(),Vn()):s.key==="Escape"&&(!yt("debrief").hidden||!yt("library").hidden?ii(""):Oh())})}function Tl(){K&&(!Ti&&te>=K.t1&&(te=K.t0),Ti=!Ti,Al())}function ny(){yt("btnHome").onclick=()=>{lt.homeCamera(),Vn()},yt("btnTop").onclick=()=>lt.topView(),yt("btn3d").onclick=()=>qs("3d"),yt("btn2d").onclick=()=>qs("2d"),yt("btnDebrief").onclick=()=>ii(yt("debrief").hidden?"debrief":""),yt("btnLibrary").onclick=()=>ii(yt("library").hidden?"library":""),yt("btnMe").onclick=()=>{if(!K||lt.meSlot<0)return;let n=K.playerBySlot.get(lt.meSlot),s=Sl(n,te);s&&(Tn(s.id,!1),lt.setFollow(s.id),Vn())},yt("btnFollow").onclick=()=>{lt.follow>=0?lt.setFollow(-1):lt.selected>=0&&lt.setFollow(lt.selected),Vn()};let i=yt("units");i.value=Xt.units,i.onchange=()=>{Xt.units=i.value,ms(),Ri(!0),Ys()};let t=yt("me");t.value=Xt.me,t.onchange=()=>{if(Xt.me=t.value.trim(),ms(),!K)return;for(let s of K.players)s.highlight=!1;lt.resolveMe();let n=K.playerBySlot.get(lt.meSlot);n&&(n.highlight=!0),lt.restyle(),Ai(),Ys(),ys(),la.reset(),Ci.invalidate()};let e=yt("wingmen");e.value=Xt.wingmen||"",e.onchange=()=>{Xt.wingmen=e.value.trim(),ms(),la.reset(),Ci.invalidate()},yt("btnAll").onclick=()=>{if(K){for(let n of K.players)n.hidden=!1;lt.restyle(),Ai()}},yt("btnInvolved").onclick=()=>{if(!K)return;let n=Z0();if(n.size){for(let s of K.players)s.hidden=!n.has(s.slot);lt.restyle(),Ai()}},yt("evMine").onchange=Ys,yt("evKind").onchange=Ys}var iy="Drag: rotate around the screen centre \xB7 Right-drag: move \xB7 Wheel: zoom to the cursor \xB7 Click: select \xB7 Double-click: follow (or centre on the ground) \xB7 Shift-click: measure",sy="Drag: move \xB7 Wheel: zoom \xB7 Click: select \xB7 Double-click: follow \xB7 Shift-click: measure";function qs(i){lt.setMode(i),Xt.view=i,ms(),yt("btn3d").classList.toggle("on",i==="3d"),yt("btn2d").classList.toggle("on",i==="2d"),yt("btnTop").disabled=i==="2d",yt("hint").textContent=i==="2d"?sy:iy,yt("scale").hidden=i!=="2d"}function ry(){if(lt.mode!=="2d")return;let i=lt.metresPerPx(),t=Xt.units==="aviation",e=t?1852:1e3,n=[.1,.2,.5,1,2,5,10,20,50,100],s=n[0];for(let r of n)r*e/i<=160&&(s=r);yt("scaleBar").style.width=Math.round(s*e/i)+"px",yt("scaleTxt").textContent=s+(t?" nm":" km")}function ay(){for(let i of Array.from(document.querySelectorAll("[data-set]"))){let t=i.dataset.set;i instanceof HTMLInputElement?i.checked=!!Xt[t]:i.value=String(Xt[t]),i.onchange=()=>{Xt[t]=i instanceof HTMLInputElement?i.checked:i.dataset.num?Number(i.value):i.value,ms(),(t==="shade"||t==="grid")&&lt.paintTerrain(),t==="liveRecord"&&Bh(!!Xt.liveRecord)}}}function Vh(i){for(let t of Array.from(document.querySelectorAll(".tabs button")))t.classList.toggle("on",t.dataset.tab===i);for(let t of["display","selected","events"])yt("tab-"+t).hidden=t!==i}function oy(){for(let i of Array.from(document.querySelectorAll(".tabs button")))i.onclick=()=>Vh(i.dataset.tab)}function ii(i){yt("debrief").hidden=i!=="debrief",yt("library").hidden=i!=="library",yt("btnDebrief").classList.toggle("on",i==="debrief"),yt("btnLibrary").classList.toggle("on",i==="library"),i==="debrief"?Ci.open():i==="library"&&la.open()}var Ci=new sa(yt("debrief"),{ses:()=>K,settings:Xt,meSlot:()=>lt.meSlot,unitTitle:ke,seek:i=>{ii(""),vn(i)},watch:(i,t,e)=>{ii(""),!(i<0||!K)&&(vn(i),t>=0&&(Tn(t,!1),e&&(lt.setFollow(t),Vn())))}}),la=new ra(yt("library"),{settings:Xt,saveSettings:()=>ms(),close:()=>ii(""),openMatch:async i=>{ii("");let t=yt("session");t.value!==i&&(t.value=i,await El(i))}}),Uh=0;function Gh(i){let t=performance.now();!i&&t-Uh<120||(Uh=t,K&&(yt("clock").textContent=en(te-K.t0),ys(),Ri(!1),Q0(),ca(),ry(),yt("needle").style.transform="rotate("+-lt.viewHeading()+"deg)"))}function Wh(i){let t=Math.min(100,i-Dh);Dh=i,K&&(Ti&&(te+=t*Xs,te>=K.t1&&(te=K.t1,Ti=!1,Al())),lt.update(te),Gh(!1)),requestAnimationFrame(Wh)}Xt.liveRecord&&Bh(!0);window.wtrv={viewer:lt,seek:vn,select:Tn,showPage:ii,debrief:Ci,library:la,get t(){return te},get ses(){return K},play:Tl};q0();})();
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
