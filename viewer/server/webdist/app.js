(()=>{var Uh=Object.defineProperty;var Nh=(i,t,e)=>t in i?Uh(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var j=(i,t,e)=>Nh(i,typeof t!="symbol"?t+"":t,e);var Fh=/[␀-➿-]/g;function Oh(i){return(i||"").replace(Fh,"").trim()}var Vs;function Pl(i,t,e,n){if(!i||!n)return null;let s=i.byAircraft[t.toLowerCase()]||[],r=[n,n.replace(/^radar/,"").replace(/^./,a=>a.toLowerCase())],o=null;for(let a of s){let l=i.sensors[a];if(l){for(let c of r){let h=l.patterns[c];if(h&&(!o||l.name===e)){o=h;break}}if(o&&l.name===e)break}}return o}async function gs(i){let t=await fetch(i);if(!t.ok)throw new Error(i+" \u2192 "+t.status);return t.json()}async function Il(i,t){let e="/api/session/"+encodeURIComponent(i)+"/";t("Reading match\u2026");let[n,s,r,o,a,l]=await Promise.all([gs(e+"manifest.json"),gs(e+"players.json"),gs(e+"units.json"),gs(e+"events.json"),gs(e+"states.json"),fetch(e+"tracks.bin").then(x=>{if(!x.ok)throw new Error("tracks.bin \u2192 "+x.status);return x.arrayBuffer()})]);t("Building tracks\u2026");let c=r.map(x=>{let y=T=>{let P=x.columns.find(R=>R.name===T);if(P)return P.type==="u32"?new Uint32Array(l,P.offset,P.count):P.type==="f32"?new Float32Array(l,P.offset,P.count):new Uint8Array(l,P.offset,P.count)};return{id:x.id,kind:x.kind,name:Oh(x.name).replace(" (estimated)",""),cls:x.class||"",player:x.player===void 0?-1:x.player,ai:!!x.ai,team:x.team||0,parent:x.parent===void 0?-1:x.parent,tStart:x.tStart,tEnd:x.tEnd,destroyed:!!x.destroyed,estimated:!!x.estimated,isStatic:!!x.static,n:x.samples,t:y("t"),x:y("x"),y:y("y"),z:y("z"),heading:y("heading"),pitch:y("pitch"),roll:y("roll"),seekerMode:y("seekerMode"),seekerKind:y("seekerKind"),seekerRange:y("seekerRange"),tex:y("targetEstX"),tey:y("targetEstY"),tez:y("targetEstZ"),missile:x.missile,cmType:x.countermeasure?x.countermeasure.type:void 0,speed:y("speed"),g:y("g"),mach:y("mach"),agl:y("agl"),climb:y("climb"),owner:-1}});for(let x of c)x.kind==="aircraft"&&(x.owner=x.player,x.speed||kh(x));for(let x of c)x.kind!=="aircraft"&&x.parent>=0&&c[x.parent]&&(x.owner=c[x.parent].owner,x.team||(x.team=c[x.parent].team));let h=s.map(x=>({slot:x.slot,name:x.name,clan:x.clan||"",team:x.team,units:x.units||[],results:x.results||{},hidden:!1,highlight:!1})),u=new Map;for(let x of h)u.set(x.slot,x);Bh(c,a);let f=String(n.match.level||"").split("/").pop().replace(/\.bin$/,"");t("Reading terrain\u2026");let d=await aa(f),_=o.filter(x=>x.type==="kill"),g=[];try{let x=await fetch(e+"launches.json");x.ok&&(g=await x.json())}catch{}g.sort((x,y)=>x.t-y.t);let m=null;try{let x=await fetch(e+"map.json");x.ok&&(m=await x.json())}catch{}let p=new Map;try{let x=await fetch(e+"stats.json");if(x.ok)for(let y of await x.json())p.set(y.slot,y)}catch{}if(Vs===void 0){Vs=null;try{let x=await fetch("/api/catalog/radars.json");x.ok&&(Vs=await x.json())}catch{}}let E=new Map;for(let x of g)E.set(x.missile,x);return{id:i,manifest:n,players:h,playerBySlot:u,units:c,events:o,kills:_,launches:g,launchByMissile:E,map:m,stats:p,radars:Vs,t0:n.match.tFirstMs,t1:n.match.tLastMs,terrain:d,levelName:f}}async function aa(i){try{let t="/api/terrain/"+encodeURIComponent(i)+"/",e=await fetch(t+"terrain.json");if(!e.ok)return null;let n=await e.json(),s=await(await fetch(t+"height.u16")).arrayBuffer(),r=new Uint16Array(s),o=n.gridSize,a=new Float32Array(o*o),l=(n.hMax-n.hMin)/65535;for(let c=0;c<o*o;c++)a[c]=n.hMin+r[c]*l;return{n:o,x0:n.x0,z0:n.z0,x1:n.x1,z1:n.z1,cell:n.cellM,hMin:n.hMin,hMax:n.hMax,water:n.waterLevel,h:a}}catch{return null}}function wi(i,t,e){if(!i)return 0;let n=(t-i.x0)/i.cell-.5,s=(e-i.z0)/i.cell-.5,r=i.n,o=Math.max(0,Math.min(r-1.001,n)),a=Math.max(0,Math.min(r-1.001,s)),l=Math.floor(o),c=Math.floor(a),h=o-l,u=a-c,f=i.h,d=f[c*r+l],_=f[c*r+l+1],g=f[(c+1)*r+l],m=f[(c+1)*r+l+1],p=(d*(1-h)+_*h)*(1-u)+(g*(1-h)+m*h)*u;return Math.max(p,i.water)}function kh(i){let t=i.n,e=new Float32Array(t),n=new Float32Array(t),s=new Float32Array(t),r=new Float32Array(t),o=new Float32Array(t);for(let a=0;a<t;a++){let l=Math.max(0,a-1),c=Math.min(t-1,a+1),h=(i.t[c]-i.t[l])/1e3;h<=0||(s[a]=(i.x[c]-i.x[l])/h,r[a]=(i.y[c]-i.y[l])/h,o[a]=(i.z[c]-i.z[l])/h,e[a]=Math.hypot(s[a],r[a],o[a]))}for(let a=0;a<t;a++){let l=Math.max(0,a-2),c=Math.min(t-1,a+2),h=(i.t[c]-i.t[l])/1e3;if(h<=0){n[a]=1;continue}let u=(s[c]-s[l])/h,f=(r[c]-r[l])/h+9.81,d=(o[c]-o[l])/h;n[a]=Math.hypot(u,f,d)/9.81}i.speed=e,i.g=n}function Bh(i,t){let e=new Map;for(let n of t){let s=i[n.unit];if(!s)continue;let r=e.get(n.unit);r||(r={},e.set(n.unit,r)),Object.assign(r,n.set);let o=[];for(let c=1;c<=8;c++){let h=r["target"+c];if(h!==void 0&&h!==""){let u=parseInt(h,10);isNaN(u)||o.push(u)}}let a={t:n.t,on:r.radarOn==="1",state:r.radarState||"off",pattern:r.radarPattern||"",label:r.radarLabel||"",sensor:r.radarSensor||"",az:parseFloat(r.antennaAzimuth)||0,el:parseFloat(r.antennaElevation)||0,targets:o,targetRange:parseFloat(r.targetRange)||0};s.radar||(s.radar=[]);let l=s.radar[s.radar.length-1];l&&l.t===n.t?s.radar[s.radar.length-1]=a:s.radar.push(a)}}function Ti(i,t){let e=i.radar;if(!e||!e.length||t<e[0].t)return null;let n=0,s=e.length-1;for(;n<s;){let r=n+s+1>>1;e[r].t<=t?n=r:s=r-1}return e[n]}function Ye(i,t){let e=i.t,n=0,s=i.n-1;if(t<=e[0])return 0;if(t>=e[s])return s;for(;n<s;){let r=n+s+1>>1;e[r]<=t?n=r:s=r-1}return n}function Cl(i,t,e){let n=(t-i+540)%360-180;return i+n*e}function an(i,t,e){let n=Ye(i,t),s=Math.min(i.n-1,n+1),r=i.t[n],o=i.t[s],a=o>r?(t-r)/(o-r):0;a<0?a=0:a>1&&(a=1),e.i=n,e.f=a;let l=o-r;if(i.kind==="aircraft"&&l>0&&l<2e3&&n>0&&s<i.n-1){let c=n-1,h=s+1,u=i.t[s]-i.t[c],f=i.t[h]-i.t[n],d=a*a,_=d*a,g=2*_-3*d+1,m=_-2*d+a,p=-2*_+3*d,E=_-d,x=y=>{let M=u>0?(y[s]-y[c])/u*l:0,T=f>0?(y[h]-y[n])/f*l:0;return g*y[n]+m*M+p*y[s]+E*T};e.x=x(i.x),e.y=x(i.y),e.z=x(i.z)}else e.x=i.x[n]+(i.x[s]-i.x[n])*a,e.y=i.y[n]+(i.y[s]-i.y[n])*a,e.z=i.z[n]+(i.z[s]-i.z[n])*a;if(i.heading)e.heading=Cl(i.heading[n],i.heading[s],a),e.pitch=i.pitch[n]+(i.pitch[s]-i.pitch[n])*a,e.roll=Cl(i.roll[n],i.roll[s],a);else{let c=Math.max(0,n-1),h=Math.min(i.n-1,n+1),u=i.x[h]-i.x[c],f=i.y[h]-i.y[c],d=i.z[h]-i.z[c],_=Math.hypot(u,d);e.heading=_>.01?Math.atan2(u,d)*180/Math.PI:0,e.pitch=Math.atan2(f,_)*180/Math.PI,e.roll=0}return e}function Vn(i,t,e){if(!i)return NaN;let n=Math.min(e-1,t.i+1);return i[t.i]+(i[n]-i[t.i])*t.f}function on(i){let t=Math.max(0,Math.floor(i/1e3));return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")}var Rl={target_down:"target was already destroyed",decoyed:"decoyed by flares or chaff",out_of_energy:"ran out of energy",no_lock:"seeker never locked the target",lost_lock:"seeker lost the target"};function oa(i){return i?i.outcome==="kill"?"Kill":i.outcome==="close"?"Passed within "+i.missDistanceM+" m, no kill recorded":i.outcome==="miss"?"Missed"+(Rl[i.reason]?": "+Rl[i.reason]:"")+(i.missDistanceM!==void 0?" (closest "+(i.missDistanceM>=1e3?(i.missDistanceM/1e3).toFixed(1)+" km":i.missDistanceM+" m")+")":""):"Target not identified":""}var vi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Mi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},zh=0,Ll=1,Hh=2;var Oc=1,Vh=2,Ln=3,Qn=0,Ve=1,Ce=2,Jn=0,Gi=1,Dl=2,Ul=3,Nl=4,Gh=5,ui=100,Wh=101,Xh=102,Yh=103,qh=104,Zh=200,Kh=201,$h=202,Jh=203,Oa=204,ka=205,jh=206,Qh=207,tu=208,eu=209,nu=210,iu=211,su=212,ru=213,au=214,Ba=0,za=1,Ha=2,qi=3,Va=4,Ga=5,Wa=6,Xa=7,tl=0,ou=1,lu=2,jn=0,cu=1,hu=2,uu=3,du=4,fu=5,pu=6,mu=7;var kc=300,Zi=301,Ki=302,Ya=303,qa=304,zr=306,Za=1e3,pi=1001,Ka=1002,fn=1003,gu=1004;var Gs=1005;var vn=1006,la=1007;var mi=1008;var Fn=1009,Bc=1010,zc=1011,Ts=1012,el=1013,gi=1014,Dn=1015,Us=1016,nl=1017,il=1018,$i=1020,Hc=35902,Vc=1021,Gc=1022,dn=1023,Wc=1024,Xc=1025,Wi=1026,Ji=1027,Yc=1028,sl=1029,qc=1030,rl=1031;var al=1033,fr=33776,pr=33777,mr=33778,gr=33779,$a=35840,Ja=35841,ja=35842,Qa=35843,to=36196,eo=37492,no=37496,io=37808,so=37809,ro=37810,ao=37811,oo=37812,lo=37813,co=37814,ho=37815,uo=37816,fo=37817,po=37818,mo=37819,go=37820,_o=37821,_r=36492,yo=36494,xo=36495,Zc=36283,vo=36284,Mo=36285,bo=36286;var yr=2300,So=2301,ca=2302,Fl=2400,Ol=2401,kl=2402;var _u=3200,yu=3201;var Kc=0,xu=1,Kn="",He="srgb",ss="srgb-linear",Hr="linear",ae="srgb";var Ai=7680;var Bl=519,vu=512,Mu=513,bu=514,$c=515,Su=516,Eu=517,wu=518,Tu=519,zl=35044,rs=35048;var Hl="300 es",Un=2e3,xr=2001,On=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Ie=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Vl=1234567,Ss=Math.PI/180,As=180/Math.PI;function as(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ie[i&255]+Ie[i>>8&255]+Ie[i>>16&255]+Ie[i>>24&255]+"-"+Ie[t&255]+Ie[t>>8&255]+"-"+Ie[t>>16&15|64]+Ie[t>>24&255]+"-"+Ie[e&63|128]+Ie[e>>8&255]+"-"+Ie[e>>16&255]+Ie[e>>24&255]+Ie[n&255]+Ie[n>>8&255]+Ie[n>>16&255]+Ie[n>>24&255]).toLowerCase()}function De(i,t,e){return Math.max(t,Math.min(e,i))}function ol(i,t){return(i%t+t)%t}function Au(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Cu(i,t,e){return i!==t?(e-i)/(t-i):0}function Es(i,t,e){return(1-e)*i+e*t}function Ru(i,t,e,n){return Es(i,t,1-Math.exp(-e*n))}function Pu(i,t=1){return t-Math.abs(ol(i,t*2)-t)}function Iu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Lu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Du(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Uu(i,t){return i+Math.random()*(t-i)}function Nu(i){return i*(.5-Math.random())}function Fu(i){i!==void 0&&(Vl=i);let t=Vl+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ou(i){return i*Ss}function ku(i){return i*As}function Bu(i){return(i&i-1)===0&&i!==0}function zu(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Hu(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Vu(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+n)/2),h=o((t+n)/2),u=r((t-n)/2),f=o((t-n)/2),d=r((n-t)/2),_=o((n-t)/2);switch(s){case"XYX":i.set(a*h,l*u,l*f,a*c);break;case"YZY":i.set(l*f,a*h,l*u,a*c);break;case"ZXZ":i.set(l*u,l*f,a*h,a*c);break;case"XZX":i.set(a*h,l*_,l*d,a*c);break;case"YXY":i.set(l*d,a*h,l*_,a*c);break;case"ZYZ":i.set(l*_,l*d,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Hi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ne(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Jc={DEG2RAD:Ss,RAD2DEG:As,generateUUID:as,clamp:De,euclideanModulo:ol,mapLinear:Au,inverseLerp:Cu,lerp:Es,damp:Ru,pingpong:Pu,smoothstep:Iu,smootherstep:Lu,randInt:Du,randFloat:Uu,randFloatSpread:Nu,seededRandom:Fu,degToRad:Ou,radToDeg:ku,isPowerOfTwo:Bu,ceilPowerOfTwo:zu,floorPowerOfTwo:Hu,setQuaternionFromProperEuler:Vu,normalize:Ne,denormalize:Hi},Lt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(De(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},zt=class i{constructor(t,e,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],_=n[8],g=s[0],m=s[3],p=s[6],E=s[1],x=s[4],y=s[7],M=s[2],T=s[5],P=s[8];return r[0]=o*g+a*E+l*M,r[3]=o*m+a*x+l*T,r[6]=o*p+a*y+l*P,r[1]=c*g+h*E+u*M,r[4]=c*m+h*x+u*T,r[7]=c*p+h*y+u*P,r[2]=f*g+d*E+_*M,r[5]=f*m+d*x+_*T,r[8]=f*p+d*y+_*P,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,f=a*l-h*r,d=c*r-o*l,_=e*u+n*f+s*d;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let g=1/_;return t[0]=u*g,t[1]=(s*c-h*n)*g,t[2]=(a*n-s*o)*g,t[3]=f*g,t[4]=(h*e-s*l)*g,t[5]=(s*r-a*e)*g,t[6]=d*g,t[7]=(n*l-c*e)*g,t[8]=(o*e-n*r)*g,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(ha.makeScale(t,e)),this}rotate(t){return this.premultiply(ha.makeRotation(-t)),this}translate(t,e){return this.premultiply(ha.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},ha=new zt;function jc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function vr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Gu(){let i=vr("canvas");return i.style.display="block",i}var Gl={};function Ms(i){i in Gl||(Gl[i]=!0,console.warn(i))}function Wu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Xu(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Yu(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Kt={enabled:!0,workingColorSpace:ss,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===ae&&(i.r=Nn(i.r),i.g=Nn(i.g),i.b=Nn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===ae&&(i.r=Xi(i.r),i.g=Xi(i.g),i.b=Xi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Kn?Hr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Nn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Xi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Wl=[.64,.33,.3,.6,.15,.06],Xl=[.2126,.7152,.0722],Yl=[.3127,.329],ql=new zt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zl=new zt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Kt.define({[ss]:{primaries:Wl,whitePoint:Yl,transfer:Hr,toXYZ:ql,fromXYZ:Zl,luminanceCoefficients:Xl,workingColorSpaceConfig:{unpackColorSpace:He},outputColorSpaceConfig:{drawingBufferColorSpace:He}},[He]:{primaries:Wl,whitePoint:Yl,transfer:ae,toXYZ:ql,fromXYZ:Zl,luminanceCoefficients:Xl,outputColorSpaceConfig:{drawingBufferColorSpace:He}}});var Ci,Eo=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Ci===void 0&&(Ci=vr("canvas")),Ci.width=t.width,Ci.height=t.height;let n=Ci.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Ci}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=vr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Nn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Nn(e[n]/255)*255):e[n]=Nn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},qu=0,Mr=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:qu++}),this.uuid=as(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ua(s[o].image)):r.push(ua(s[o]))}else r=ua(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function ua(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Eo.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Zu=0,Ke=class i extends On{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=pi,s=pi,r=vn,o=mi,a=dn,l=Fn,c=i.DEFAULT_ANISOTROPY,h=Kn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zu++}),this.uuid=as(),this.name="",this.source=new Mr(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Lt(0,0),this.repeat=new Lt(1,1),this.center=new Lt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new zt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==kc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Za:t.x=t.x-Math.floor(t.x);break;case pi:t.x=t.x<0?0:1;break;case Ka:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Za:t.y=t.y-Math.floor(t.y);break;case pi:t.y=t.y<0?0:1;break;case Ka:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ke.DEFAULT_IMAGE=null;Ke.DEFAULT_MAPPING=kc;Ke.DEFAULT_ANISOTROPY=1;var ye=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],_=l[9],g=l[2],m=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-g)<.01&&Math.abs(_-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+g)<.1&&Math.abs(_+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let x=(c+1)/2,y=(d+1)/2,M=(p+1)/2,T=(h+f)/4,P=(u+g)/4,R=(_+m)/4;return x>y&&x>M?x<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(x),s=T/n,r=P/n):y>M?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=T/s,r=R/s):M<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(M),n=P/r,s=R/r),this.set(n,s,r,e),this}let E=Math.sqrt((m-_)*(m-_)+(u-g)*(u-g)+(f-h)*(f-h));return Math.abs(E)<.001&&(E=1),this.x=(m-_)/E,this.y=(u-g)/E,this.z=(f-h)/E,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},wo=class extends On{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ye(0,0,t,e),this.scissorTest=!1,this.viewport=new ye(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:vn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Ke(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Mr(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},kn=class extends wo{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},br=class extends Ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=fn,this.minFilter=fn,this.wrapR=pi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var To=class extends Ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=fn,this.minFilter=fn,this.wrapR=pi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var pn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[o+0],d=r[o+1],_=r[o+2],g=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=f,t[e+1]=d,t[e+2]=_,t[e+3]=g;return}if(u!==g||l!==f||c!==d||h!==_){let m=1-a,p=l*f+c*d+h*_+u*g,E=p>=0?1:-1,x=1-p*p;if(x>Number.EPSILON){let M=Math.sqrt(x),T=Math.atan2(M,p*E);m=Math.sin(m*T)/M,a=Math.sin(a*T)/M}let y=a*E;if(l=l*m+f*y,c=c*m+d*y,h=h*m+_*y,u=u*m+g*y,m===1-a){let M=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=M,c*=M,h*=M,u*=M}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],_=r[o+3];return t[e]=a*_+h*u+l*d-c*f,t[e+1]=l*_+h*f+c*u-a*d,t[e+2]=c*_+h*d+a*f-l*u,t[e+3]=h*_-a*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),f=l(n/2),d=l(s/2),_=l(r/2);switch(o){case"XYZ":this._x=f*h*u+c*d*_,this._y=c*d*u-f*h*_,this._z=c*h*_+f*d*u,this._w=c*h*u-f*d*_;break;case"YXZ":this._x=f*h*u+c*d*_,this._y=c*d*u-f*h*_,this._z=c*h*_-f*d*u,this._w=c*h*u+f*d*_;break;case"ZXY":this._x=f*h*u-c*d*_,this._y=c*d*u+f*h*_,this._z=c*h*_+f*d*u,this._w=c*h*u-f*d*_;break;case"ZYX":this._x=f*h*u-c*d*_,this._y=c*d*u+f*h*_,this._z=c*h*_-f*d*u,this._w=c*h*u+f*d*_;break;case"YZX":this._x=f*h*u+c*d*_,this._y=c*d*u+f*h*_,this._z=c*h*_-f*d*u,this._w=c*h*u-f*d*_;break;case"XZY":this._x=f*h*u-c*d*_,this._y=c*d*u-f*h*_,this._z=c*h*_+f*d*u,this._w=c*h*u+f*d*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(De(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},k=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Kl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Kl.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return da.copy(this).projectOnVector(t),this.sub(da)}reflect(t){return this.sub(da.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(De(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},da=new k,Kl=new pn,_i=class{constructor(t=new k(1/0,1/0,1/0),e=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,ln):ln.fromBufferAttribute(r,o),ln.applyMatrix4(t.matrixWorld),this.expandByPoint(ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ws.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ws.copy(n.boundingBox)),Ws.applyMatrix4(t.matrixWorld),this.union(Ws)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ln),ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(_s),Xs.subVectors(this.max,_s),Ri.subVectors(t.a,_s),Pi.subVectors(t.b,_s),Ii.subVectors(t.c,_s),Gn.subVectors(Pi,Ri),Wn.subVectors(Ii,Pi),si.subVectors(Ri,Ii);let e=[0,-Gn.z,Gn.y,0,-Wn.z,Wn.y,0,-si.z,si.y,Gn.z,0,-Gn.x,Wn.z,0,-Wn.x,si.z,0,-si.x,-Gn.y,Gn.x,0,-Wn.y,Wn.x,0,-si.y,si.x,0];return!fa(e,Ri,Pi,Ii,Xs)||(e=[1,0,0,0,1,0,0,0,1],!fa(e,Ri,Pi,Ii,Xs))?!1:(Ys.crossVectors(Gn,Wn),e=[Ys.x,Ys.y,Ys.z],fa(e,Ri,Pi,Ii,Xs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(An[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),An[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),An[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),An[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),An[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),An[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),An[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),An[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(An),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},An=[new k,new k,new k,new k,new k,new k,new k,new k],ln=new k,Ws=new _i,Ri=new k,Pi=new k,Ii=new k,Gn=new k,Wn=new k,si=new k,_s=new k,Xs=new k,Ys=new k,ri=new k;function fa(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ri.fromArray(i,r);let a=s.x*Math.abs(ri.x)+s.y*Math.abs(ri.y)+s.z*Math.abs(ri.z),l=t.dot(ri),c=e.dot(ri),h=n.dot(ri);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Ku=new _i,ys=new k,pa=new k,ji=class{constructor(t=new k,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Ku.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ys.subVectors(t,this.center);let e=ys.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ys,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(pa.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ys.copy(t.center).add(pa)),this.expandByPoint(ys.copy(t.center).sub(pa))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},Cn=new k,ma=new k,qs=new k,Xn=new k,ga=new k,Zs=new k,_a=new k,Qi=class{constructor(t=new k,e=new k(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Cn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Cn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Cn.copy(this.origin).addScaledVector(this.direction,e),Cn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){ma.copy(t).add(e).multiplyScalar(.5),qs.copy(e).sub(t).normalize(),Xn.copy(this.origin).sub(ma);let r=t.distanceTo(e)*.5,o=-this.direction.dot(qs),a=Xn.dot(this.direction),l=-Xn.dot(qs),c=Xn.lengthSq(),h=Math.abs(1-o*o),u,f,d,_;if(h>0)if(u=o*l-a,f=o*a-l,_=r*h,u>=0)if(f>=-_)if(f<=_){let g=1/h;u*=g,f*=g,d=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f<=-_?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=_?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(ma).addScaledVector(qs,f),d}intersectSphere(t,e){Cn.subVectors(t.center,this.origin);let n=Cn.dot(this.direction),s=Cn.dot(Cn)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,o=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,o=(t.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(a=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Cn)!==null}intersectTriangle(t,e,n,s,r){ga.subVectors(e,t),Zs.subVectors(n,t),_a.crossVectors(ga,Zs);let o=this.direction.dot(_a),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Xn.subVectors(this.origin,t);let l=a*this.direction.dot(Zs.crossVectors(Xn,Zs));if(l<0)return null;let c=a*this.direction.dot(ga.cross(Xn));if(c<0||l+c>o)return null;let h=-a*Xn.dot(_a);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ge=class i{constructor(t,e,n,s,r,o,a,l,c,h,u,f,d,_,g,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,u,f,d,_,g,m)}set(t,e,n,s,r,o,a,l,c,h,u,f,d,_,g,m){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=_,p[11]=g,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Li.setFromMatrixColumn(t,0).length(),r=1/Li.setFromMatrixColumn(t,1).length(),o=1/Li.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=o*h,d=o*u,_=a*h,g=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+_*c,e[5]=f-g*c,e[9]=-a*l,e[2]=g-f*c,e[6]=_+d*c,e[10]=o*l}else if(t.order==="YXZ"){let f=l*h,d=l*u,_=c*h,g=c*u;e[0]=f+g*a,e[4]=_*a-d,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=d*a-_,e[6]=g+f*a,e[10]=o*l}else if(t.order==="ZXY"){let f=l*h,d=l*u,_=c*h,g=c*u;e[0]=f-g*a,e[4]=-o*u,e[8]=_+d*a,e[1]=d+_*a,e[5]=o*h,e[9]=g-f*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let f=o*h,d=o*u,_=a*h,g=a*u;e[0]=l*h,e[4]=_*c-d,e[8]=f*c+g,e[1]=l*u,e[5]=g*c+f,e[9]=d*c-_,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let f=o*l,d=o*c,_=a*l,g=a*c;e[0]=l*h,e[4]=g-f*u,e[8]=_*u+d,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=d*u+_,e[10]=f-g*u}else if(t.order==="XZY"){let f=o*l,d=o*c,_=a*l,g=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+g,e[5]=o*h,e[9]=d*u-_,e[2]=_*u-d,e[6]=a*h,e[10]=g*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose($u,t,Ju)}lookAt(t,e,n){let s=this.elements;return qe.subVectors(t,e),qe.lengthSq()===0&&(qe.z=1),qe.normalize(),Yn.crossVectors(n,qe),Yn.lengthSq()===0&&(Math.abs(n.z)===1?qe.x+=1e-4:qe.z+=1e-4,qe.normalize(),Yn.crossVectors(n,qe)),Yn.normalize(),Ks.crossVectors(qe,Yn),s[0]=Yn.x,s[4]=Ks.x,s[8]=qe.x,s[1]=Yn.y,s[5]=Ks.y,s[9]=qe.y,s[2]=Yn.z,s[6]=Ks.z,s[10]=qe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],_=n[2],g=n[6],m=n[10],p=n[14],E=n[3],x=n[7],y=n[11],M=n[15],T=s[0],P=s[4],R=s[8],S=s[12],v=s[1],A=s[5],L=s[9],I=s[13],U=s[2],z=s[6],H=s[10],Q=s[14],G=s[3],rt=s[7],ht=s[11],Mt=s[15];return r[0]=o*T+a*v+l*U+c*G,r[4]=o*P+a*A+l*z+c*rt,r[8]=o*R+a*L+l*H+c*ht,r[12]=o*S+a*I+l*Q+c*Mt,r[1]=h*T+u*v+f*U+d*G,r[5]=h*P+u*A+f*z+d*rt,r[9]=h*R+u*L+f*H+d*ht,r[13]=h*S+u*I+f*Q+d*Mt,r[2]=_*T+g*v+m*U+p*G,r[6]=_*P+g*A+m*z+p*rt,r[10]=_*R+g*L+m*H+p*ht,r[14]=_*S+g*I+m*Q+p*Mt,r[3]=E*T+x*v+y*U+M*G,r[7]=E*P+x*A+y*z+M*rt,r[11]=E*R+x*L+y*H+M*ht,r[15]=E*S+x*I+y*Q+M*Mt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],_=t[3],g=t[7],m=t[11],p=t[15];return _*(+r*l*u-s*c*u-r*a*f+n*c*f+s*a*d-n*l*d)+g*(+e*l*d-e*c*f+r*o*f-s*o*d+s*c*h-r*l*h)+m*(+e*c*u-e*a*d-r*o*u+n*o*d+r*a*h-n*c*h)+p*(-s*a*h-e*l*u+e*a*f+s*o*u-n*o*f+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],_=t[12],g=t[13],m=t[14],p=t[15],E=u*m*c-g*f*c+g*l*d-a*m*d-u*l*p+a*f*p,x=_*f*c-h*m*c-_*l*d+o*m*d+h*l*p-o*f*p,y=h*g*c-_*u*c+_*a*d-o*g*d-h*a*p+o*u*p,M=_*u*l-h*g*l-_*a*f+o*g*f+h*a*m-o*u*m,T=e*E+n*x+s*y+r*M;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let P=1/T;return t[0]=E*P,t[1]=(g*f*r-u*m*r-g*s*d+n*m*d+u*s*p-n*f*p)*P,t[2]=(a*m*r-g*l*r+g*s*c-n*m*c-a*s*p+n*l*p)*P,t[3]=(u*l*r-a*f*r-u*s*c+n*f*c+a*s*d-n*l*d)*P,t[4]=x*P,t[5]=(h*m*r-_*f*r+_*s*d-e*m*d-h*s*p+e*f*p)*P,t[6]=(_*l*r-o*m*r-_*s*c+e*m*c+o*s*p-e*l*p)*P,t[7]=(o*f*r-h*l*r+h*s*c-e*f*c-o*s*d+e*l*d)*P,t[8]=y*P,t[9]=(_*u*r-h*g*r-_*n*d+e*g*d+h*n*p-e*u*p)*P,t[10]=(o*g*r-_*a*r+_*n*c-e*g*c-o*n*p+e*a*p)*P,t[11]=(h*a*r-o*u*r-h*n*c+e*u*c+o*n*d-e*a*d)*P,t[12]=M*P,t[13]=(h*g*s-_*u*s+_*n*f-e*g*f-h*n*m+e*u*m)*P,t[14]=(_*a*s-o*g*s-_*n*l+e*g*l+o*n*m-e*a*m)*P,t[15]=(o*u*s-h*a*s+h*n*l-e*u*l-o*n*f+e*a*f)*P,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,f=r*c,d=r*h,_=r*u,g=o*h,m=o*u,p=a*u,E=l*c,x=l*h,y=l*u,M=n.x,T=n.y,P=n.z;return s[0]=(1-(g+p))*M,s[1]=(d+y)*M,s[2]=(_-x)*M,s[3]=0,s[4]=(d-y)*T,s[5]=(1-(f+p))*T,s[6]=(m+E)*T,s[7]=0,s[8]=(_+x)*P,s[9]=(m-E)*P,s[10]=(1-(f+g))*P,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Li.set(s[0],s[1],s[2]).length(),o=Li.set(s[4],s[5],s[6]).length(),a=Li.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],cn.copy(this);let c=1/r,h=1/o,u=1/a;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=h,cn.elements[5]*=h,cn.elements[6]*=h,cn.elements[8]*=u,cn.elements[9]*=u,cn.elements[10]*=u,e.setFromRotationMatrix(cn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=Un){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),d,_;if(a===Un)d=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===xr)d=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=Un){let l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(o-r),f=(e+t)*c,d=(n+s)*h,_,g;if(a===Un)_=(o+r)*u,g=-2*u;else if(a===xr)_=r*u,g=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=g,l[14]=-_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Li=new k,cn=new ge,$u=new k(0,0,0),Ju=new k(1,1,1),Yn=new k,Ks=new k,qe=new k,$l=new ge,Jl=new pn,Mn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(De(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-De(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(De(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-De(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(De(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-De(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return $l.makeRotationFromQuaternion(t),this.setFromRotationMatrix($l,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Jl.setFromEuler(this),this.setFromQuaternion(Jl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Mn.DEFAULT_ORDER="XYZ";var Sr=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},ju=0,jl=new k,Di=new pn,Rn=new ge,$s=new k,xs=new k,Qu=new k,td=new pn,Ql=new k(1,0,0),tc=new k(0,1,0),ec=new k(0,0,1),nc={type:"added"},ed={type:"removed"},Ui={type:"childadded",child:null},ya={type:"childremoved",child:null},ke=class i extends On{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ju++}),this.uuid=as(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new k,e=new Mn,n=new pn,s=new k(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ge},normalMatrix:{value:new zt}}),this.matrix=new ge,this.matrixWorld=new ge,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Sr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Di.setFromAxisAngle(t,e),this.quaternion.multiply(Di),this}rotateOnWorldAxis(t,e){return Di.setFromAxisAngle(t,e),this.quaternion.premultiply(Di),this}rotateX(t){return this.rotateOnAxis(Ql,t)}rotateY(t){return this.rotateOnAxis(tc,t)}rotateZ(t){return this.rotateOnAxis(ec,t)}translateOnAxis(t,e){return jl.copy(t).applyQuaternion(this.quaternion),this.position.add(jl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ql,t)}translateY(t){return this.translateOnAxis(tc,t)}translateZ(t){return this.translateOnAxis(ec,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Rn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?$s.copy(t):$s.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),xs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Rn.lookAt(xs,$s,this.up):Rn.lookAt($s,xs,this.up),this.quaternion.setFromRotationMatrix(Rn),s&&(Rn.extractRotation(s.matrixWorld),Di.setFromRotationMatrix(Rn),this.quaternion.premultiply(Di.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(nc),Ui.child=t,this.dispatchEvent(Ui),Ui.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(ed),ya.child=t,this.dispatchEvent(ya),ya.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Rn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Rn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Rn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(nc),Ui.child=t,this.dispatchEvent(Ui),Ui.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xs,t,Qu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xs,td,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),f=o(t.skeletons),d=o(t.animations),_=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),_.length>0&&(n.nodes=_)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};ke.DEFAULT_UP=new k(0,1,0);ke.DEFAULT_MATRIX_AUTO_UPDATE=!0;ke.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var hn=new k,Pn=new k,xa=new k,In=new k,Ni=new k,Fi=new k,ic=new k,va=new k,Ma=new k,ba=new k,Sa=new ye,Ea=new ye,wa=new ye,di=class i{constructor(t=new k,e=new k,n=new k){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),hn.subVectors(t,e),s.cross(hn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){hn.subVectors(s,e),Pn.subVectors(n,e),xa.subVectors(t,e);let o=hn.dot(hn),a=hn.dot(Pn),l=hn.dot(xa),c=Pn.dot(Pn),h=Pn.dot(xa),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-a*h)*f,_=(o*h-a*l)*f;return r.set(1-d-_,_,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,In)===null?!1:In.x>=0&&In.y>=0&&In.x+In.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,In)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,In.x),l.addScaledVector(o,In.y),l.addScaledVector(a,In.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return Sa.setScalar(0),Ea.setScalar(0),wa.setScalar(0),Sa.fromBufferAttribute(t,e),Ea.fromBufferAttribute(t,n),wa.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Sa,r.x),o.addScaledVector(Ea,r.y),o.addScaledVector(wa,r.z),o}static isFrontFacing(t,e,n,s){return hn.subVectors(n,e),Pn.subVectors(t,e),hn.cross(Pn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return hn.subVectors(this.c,this.b),Pn.subVectors(this.a,this.b),hn.cross(Pn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;Ni.subVectors(s,n),Fi.subVectors(r,n),va.subVectors(t,n);let l=Ni.dot(va),c=Fi.dot(va);if(l<=0&&c<=0)return e.copy(n);Ma.subVectors(t,s);let h=Ni.dot(Ma),u=Fi.dot(Ma);if(h>=0&&u<=h)return e.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(Ni,o);ba.subVectors(t,r);let d=Ni.dot(ba),_=Fi.dot(ba);if(_>=0&&d<=_)return e.copy(r);let g=d*c-l*_;if(g<=0&&c>=0&&_<=0)return a=c/(c-_),e.copy(n).addScaledVector(Fi,a);let m=h*_-d*u;if(m<=0&&u-h>=0&&d-_>=0)return ic.subVectors(r,s),a=(u-h)/(u-h+(d-_)),e.copy(s).addScaledVector(ic,a);let p=1/(m+g+f);return o=g*p,a=f*p,e.copy(n).addScaledVector(Ni,o).addScaledVector(Fi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Qc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},qn={h:0,s:0,l:0},Js={h:0,s:0,l:0};function Ta(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var It=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=He){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Kt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Kt.workingColorSpace){if(t=ol(t,1),e=De(e,0,1),n=De(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Ta(o,r,t+1/3),this.g=Ta(o,r,t),this.b=Ta(o,r,t-1/3)}return Kt.toWorkingColorSpace(this,s),this}setStyle(t,e=He){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=He){let n=Qc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Nn(t.r),this.g=Nn(t.g),this.b=Nn(t.b),this}copyLinearToSRGB(t){return this.r=Xi(t.r),this.g=Xi(t.g),this.b=Xi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=He){return Kt.fromWorkingColorSpace(Le.copy(this),t),Math.round(De(Le.r*255,0,255))*65536+Math.round(De(Le.g*255,0,255))*256+Math.round(De(Le.b*255,0,255))}getHexString(t=He){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.fromWorkingColorSpace(Le.copy(this),e);let n=Le.r,s=Le.g,r=Le.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Kt.workingColorSpace){return Kt.fromWorkingColorSpace(Le.copy(this),e),t.r=Le.r,t.g=Le.g,t.b=Le.b,t}getStyle(t=He){Kt.fromWorkingColorSpace(Le.copy(this),t);let e=Le.r,n=Le.g,s=Le.b;return t!==He?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(qn),this.setHSL(qn.h+t,qn.s+e,qn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(qn),t.getHSL(Js);let n=Es(qn.h,Js.h,e),s=Es(qn.s,Js.s,e),r=Es(qn.l,Js.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Le=new It;It.NAMES=Qc;var nd=0,ti=class extends On{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:nd++}),this.uuid=as(),this.name="",this.blending=Gi,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Oa,this.blendDst=ka,this.blendEquation=ui,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new It(0,0,0),this.blendAlpha=0,this.depthFunc=qi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ai,this.stencilZFail=Ai,this.stencilZPass=Ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Gi&&(n.blending=this.blending),this.side!==Qn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Oa&&(n.blendSrc=this.blendSrc),this.blendDst!==ka&&(n.blendDst=this.blendDst),this.blendEquation!==ui&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==qi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Bl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ai&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ai&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ai&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},bn=class extends ti{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new It(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mn,this.combine=tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var ve=new k,js=new Lt,he=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=zl,this.updateRanges=[],this.gpuType=Dn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)js.fromBufferAttribute(this,e),js.applyMatrix3(t),this.setXY(e,js.x,js.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix3(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix4(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyNormalMatrix(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.transformDirection(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Hi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ne(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Hi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Hi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Hi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Hi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array),s=Ne(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array),s=Ne(s,this.array),r=Ne(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==zl&&(t.usage=this.usage),t}};var Er=class extends he{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var wr=class extends he{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var we=class extends he{constructor(t,e,n){super(new Float32Array(t),e,n)}},id=0,Qe=new ge,Aa=new ke,Oi=new k,Ze=new _i,vs=new _i,Ee=new k,Te=class i extends On{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:id++}),this.uuid=as(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(jc(t)?wr:Er)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new zt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Qe.makeRotationFromQuaternion(t),this.applyMatrix4(Qe),this}rotateX(t){return Qe.makeRotationX(t),this.applyMatrix4(Qe),this}rotateY(t){return Qe.makeRotationY(t),this.applyMatrix4(Qe),this}rotateZ(t){return Qe.makeRotationZ(t),this.applyMatrix4(Qe),this}translate(t,e,n){return Qe.makeTranslation(t,e,n),this.applyMatrix4(Qe),this}scale(t,e,n){return Qe.makeScale(t,e,n),this.applyMatrix4(Qe),this}lookAt(t){return Aa.lookAt(t),Aa.updateMatrix(),this.applyMatrix4(Aa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Oi).negate(),this.translate(Oi.x,Oi.y,Oi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new we(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _i);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Ze.setFromBufferAttribute(r),this.morphTargetsRelative?(Ee.addVectors(this.boundingBox.min,Ze.min),this.boundingBox.expandByPoint(Ee),Ee.addVectors(this.boundingBox.max,Ze.max),this.boundingBox.expandByPoint(Ee)):(this.boundingBox.expandByPoint(Ze.min),this.boundingBox.expandByPoint(Ze.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ji);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(t){let n=this.boundingSphere.center;if(Ze.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];vs.setFromBufferAttribute(a),this.morphTargetsRelative?(Ee.addVectors(Ze.min,vs.min),Ze.expandByPoint(Ee),Ee.addVectors(Ze.max,vs.max),Ze.expandByPoint(Ee)):(Ze.expandByPoint(vs.min),Ze.expandByPoint(vs.max))}Ze.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Ee.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ee));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Ee.fromBufferAttribute(a,c),l&&(Oi.fromBufferAttribute(t,c),Ee.add(Oi)),s=Math.max(s,n.distanceToSquared(Ee))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new he(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let R=0;R<n.count;R++)a[R]=new k,l[R]=new k;let c=new k,h=new k,u=new k,f=new Lt,d=new Lt,_=new Lt,g=new k,m=new k;function p(R,S,v){c.fromBufferAttribute(n,R),h.fromBufferAttribute(n,S),u.fromBufferAttribute(n,v),f.fromBufferAttribute(r,R),d.fromBufferAttribute(r,S),_.fromBufferAttribute(r,v),h.sub(c),u.sub(c),d.sub(f),_.sub(f);let A=1/(d.x*_.y-_.x*d.y);isFinite(A)&&(g.copy(h).multiplyScalar(_.y).addScaledVector(u,-d.y).multiplyScalar(A),m.copy(u).multiplyScalar(d.x).addScaledVector(h,-_.x).multiplyScalar(A),a[R].add(g),a[S].add(g),a[v].add(g),l[R].add(m),l[S].add(m),l[v].add(m))}let E=this.groups;E.length===0&&(E=[{start:0,count:t.count}]);for(let R=0,S=E.length;R<S;++R){let v=E[R],A=v.start,L=v.count;for(let I=A,U=A+L;I<U;I+=3)p(t.getX(I+0),t.getX(I+1),t.getX(I+2))}let x=new k,y=new k,M=new k,T=new k;function P(R){M.fromBufferAttribute(s,R),T.copy(M);let S=a[R];x.copy(S),x.sub(M.multiplyScalar(M.dot(S))).normalize(),y.crossVectors(T,S);let A=y.dot(l[R])<0?-1:1;o.setXYZW(R,x.x,x.y,x.z,A)}for(let R=0,S=E.length;R<S;++R){let v=E[R],A=v.start,L=v.count;for(let I=A,U=A+L;I<U;I+=3)P(t.getX(I+0)),P(t.getX(I+1)),P(t.getX(I+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new he(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new k,r=new k,o=new k,a=new k,l=new k,c=new k,h=new k,u=new k;if(t)for(let f=0,d=t.count;f<d;f+=3){let _=t.getX(f+0),g=t.getX(f+1),m=t.getX(f+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,g),o.fromBufferAttribute(e,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,_),l.fromBufferAttribute(n,g),c.fromBufferAttribute(n,m),a.add(h),l.add(h),c.add(h),n.setXYZ(_,a.x,a.y,a.z),n.setXYZ(g,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ee.fromBufferAttribute(t,e),Ee.normalize(),t.setXYZ(e,Ee.x,Ee.y,Ee.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,f=new c.constructor(l.length*h),d=0,_=0;for(let g=0,m=l.length;g<m;g++){a.isInterleavedBufferAttribute?d=l[g]*a.data.stride+a.offset:d=l[g]*h;for(let p=0;p<h;p++)f[_++]=c[d++]}return new he(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},sc=new ge,ai=new Qi,Qs=new ji,rc=new k,tr=new k,er=new k,nr=new k,Ca=new k,ir=new k,ac=new k,sr=new k,xe=class extends ke{constructor(t=new Te,e=new bn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){ir.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Ca.fromBufferAttribute(u,t),o?ir.addScaledVector(Ca,h):ir.addScaledVector(Ca.sub(e),h))}e.add(ir)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Qs.copy(n.boundingSphere),Qs.applyMatrix4(r),ai.copy(t.ray).recast(t.near),!(Qs.containsPoint(ai.origin)===!1&&(ai.intersectSphere(Qs,rc)===null||ai.origin.distanceToSquared(rc)>(t.far-t.near)**2))&&(sc.copy(r).invert(),ai.copy(t.ray).applyMatrix4(sc),!(n.boundingBox!==null&&ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ai)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,g=f.length;_<g;_++){let m=f[_],p=o[m.materialIndex],E=Math.max(m.start,d.start),x=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let y=E,M=x;y<M;y+=3){let T=a.getX(y),P=a.getX(y+1),R=a.getX(y+2);s=rr(this,p,t,n,c,h,u,T,P,R),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let _=Math.max(0,d.start),g=Math.min(a.count,d.start+d.count);for(let m=_,p=g;m<p;m+=3){let E=a.getX(m),x=a.getX(m+1),y=a.getX(m+2);s=rr(this,o,t,n,c,h,u,E,x,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,g=f.length;_<g;_++){let m=f[_],p=o[m.materialIndex],E=Math.max(m.start,d.start),x=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let y=E,M=x;y<M;y+=3){let T=y,P=y+1,R=y+2;s=rr(this,p,t,n,c,h,u,T,P,R),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let _=Math.max(0,d.start),g=Math.min(l.count,d.start+d.count);for(let m=_,p=g;m<p;m+=3){let E=m,x=m+1,y=m+2;s=rr(this,o,t,n,c,h,u,E,x,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}};function sd(i,t,e,n,s,r,o,a){let l;if(t.side===Ve?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===Qn,a),l===null)return null;sr.copy(a),sr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(sr);return c<e.near||c>e.far?null:{distance:c,point:sr.clone(),object:i}}function rr(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,tr),i.getVertexPosition(l,er),i.getVertexPosition(c,nr);let h=sd(i,t,e,n,tr,er,nr,ac);if(h){let u=new k;di.getBarycoord(ac,tr,er,nr,u),s&&(h.uv=di.getInterpolatedAttribute(s,a,l,c,u,new Lt)),r&&(h.uv1=di.getInterpolatedAttribute(r,a,l,c,u,new Lt)),o&&(h.normal=di.getInterpolatedAttribute(o,a,l,c,u,new k),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:l,c,normal:new k,materialIndex:0};di.getNormal(tr,er,nr,f.normal),h.face=f,h.barycoord=u}return h}var Cs=class i extends Te{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],f=0,d=0;_("z","y","x",-1,-1,n,e,t,o,r,0),_("z","y","x",1,-1,n,e,-t,o,r,1),_("x","z","y",1,1,t,n,e,s,o,2),_("x","z","y",1,-1,t,n,-e,s,o,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(h,3)),this.setAttribute("uv",new we(u,2));function _(g,m,p,E,x,y,M,T,P,R,S){let v=y/P,A=M/R,L=y/2,I=M/2,U=T/2,z=P+1,H=R+1,Q=0,G=0,rt=new k;for(let ht=0;ht<H;ht++){let Mt=ht*A-I;for(let Ft=0;Ft<z;Ft++){let jt=Ft*v-L;rt[g]=jt*E,rt[m]=Mt*x,rt[p]=U,c.push(rt.x,rt.y,rt.z),rt[g]=0,rt[m]=0,rt[p]=T>0?1:-1,h.push(rt.x,rt.y,rt.z),u.push(Ft/P),u.push(1-ht/R),Q+=1}}for(let ht=0;ht<R;ht++)for(let Mt=0;Mt<P;Mt++){let Ft=f+Mt+z*ht,jt=f+Mt+z*(ht+1),K=f+(Mt+1)+z*(ht+1),et=f+(Mt+1)+z*ht;l.push(Ft,jt,et),l.push(jt,K,et),G+=6}a.addGroup(d,G,S),d+=G,f+=Q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function ts(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Fe(i){let t={};for(let e=0;e<i.length;e++){let n=ts(i[e]);for(let s in n)t[s]=n[s]}return t}function rd(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function th(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}var ad={clone:ts,merge:Fe},od=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ld=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,$e=class extends ti{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=od,this.fragmentShader=ld,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ts(t.uniforms),this.uniformsGroups=rd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Tr=class extends ke{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ge,this.projectionMatrix=new ge,this.projectionMatrixInverse=new ge,this.coordinateSystem=Un}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Zn=new k,oc=new Lt,lc=new Lt,Oe=class extends Tr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=As*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Ss*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return As*2*Math.atan(Math.tan(Ss*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Zn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Zn.x,Zn.y).multiplyScalar(-t/Zn.z),Zn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Zn.x,Zn.y).multiplyScalar(-t/Zn.z)}getViewSize(t,e){return this.getViewBounds(t,oc,lc),e.subVectors(lc,oc)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Ss*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},ki=-90,Bi=1,Ao=class extends ke{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Oe(ki,Bi,t,e);s.layers=this.layers,this.add(s);let r=new Oe(ki,Bi,t,e);r.layers=this.layers,this.add(r);let o=new Oe(ki,Bi,t,e);o.layers=this.layers,this.add(o);let a=new Oe(ki,Bi,t,e);a.layers=this.layers,this.add(a);let l=new Oe(ki,Bi,t,e);l.layers=this.layers,this.add(l);let c=new Oe(ki,Bi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===Un)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===xr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;let g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=g,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}},Ar=class extends Ke{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Zi,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Co=class extends kn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Ar(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:vn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Cs(5,5,5),r=new $e({name:"CubemapFromEquirect",uniforms:ts(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ve,blending:Jn});r.uniforms.tEquirect.value=e;let o=new xe(s,r),a=e.minFilter;return e.minFilter===mi&&(e.minFilter=vn),new Ao(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},Ra=new k,cd=new k,hd=new zt,un=class{constructor(t=new k(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Ra.subVectors(n,e).cross(cd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Ra),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||hd.getNormalMatrix(t),s=this.coplanarPoint(Ra).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},oi=new ji,ar=new k,Rs=class{constructor(t=new un,e=new un,n=new un,s=new un,r=new un,o=new un){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Un){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],f=s[7],d=s[8],_=s[9],g=s[10],m=s[11],p=s[12],E=s[13],x=s[14],y=s[15];if(n[0].setComponents(l-r,f-c,m-d,y-p).normalize(),n[1].setComponents(l+r,f+c,m+d,y+p).normalize(),n[2].setComponents(l+o,f+h,m+_,y+E).normalize(),n[3].setComponents(l-o,f-h,m-_,y-E).normalize(),n[4].setComponents(l-a,f-u,m-g,y-x).normalize(),e===Un)n[5].setComponents(l+a,f+u,m+g,y+x).normalize();else if(e===xr)n[5].setComponents(a,u,g,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),oi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),oi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(oi)}intersectsSprite(t){return oi.center.set(0,0,0),oi.radius=.7071067811865476,oi.applyMatrix4(t.matrixWorld),this.intersectsSphere(oi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(ar.x=s.normal.x>0?t.max.x:t.min.x,ar.y=s.normal.y>0?t.max.y:t.min.y,ar.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(ar)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function eh(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function ud(i){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,u=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((d,_)=>d.start-_.start);let f=0;for(let d=1;d<u.length;d++){let _=u[f],g=u[d];g.start<=_.start+_.count+1?_.count=Math.max(_.count,g.start+g.count-_.start):(++f,u[f]=g)}u.length=f+1;for(let d=0,_=u.length;d<_;d++){let g=u[d];i.bufferSubData(c,g.start*h.BYTES_PER_ELEMENT,h,g.start,g.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var es=class i extends Te{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=t/a,f=e/l,d=[],_=[],g=[],m=[];for(let p=0;p<h;p++){let E=p*f-o;for(let x=0;x<c;x++){let y=x*u-r;_.push(y,-E,0),g.push(0,0,1),m.push(x/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let E=0;E<a;E++){let x=E+c*p,y=E+c*(p+1),M=E+1+c*(p+1),T=E+1+c*p;d.push(x,y,T),d.push(y,M,T)}this.setIndex(d),this.setAttribute("position",new we(_,3)),this.setAttribute("normal",new we(g,3)),this.setAttribute("uv",new we(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},dd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,fd=`#ifdef USE_ALPHAHASH
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
#endif`,pd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,md=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,_d=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,yd=`#ifdef USE_AOMAP
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
#endif`,xd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,vd=`#ifdef USE_BATCHING
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
#endif`,Md=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,bd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Sd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ed=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,wd=`#ifdef USE_IRIDESCENCE
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
#endif`,Td=`#ifdef USE_BUMPMAP
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
#endif`,Ad=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Cd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Rd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Id=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ld=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Dd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Ud=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Nd=`#define PI 3.141592653589793
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
} // validated`,Fd=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Od=`vec3 transformedNormal = objectNormal;
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
#endif`,kd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Bd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,zd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Hd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Vd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Gd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Wd=`#ifdef USE_ENVMAP
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
#endif`,Xd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Yd=`#ifdef USE_ENVMAP
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
#endif`,qd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Zd=`#ifdef USE_ENVMAP
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
#endif`,Kd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$d=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Jd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,jd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Qd=`#ifdef USE_GRADIENTMAP
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
}`,tf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ef=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,nf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,sf=`uniform bool receiveShadow;
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
#endif`,rf=`#ifdef USE_ENVMAP
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
#endif`,af=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,of=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hf=`PhysicalMaterial material;
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
#endif`,uf=`struct PhysicalMaterial {
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
}`,df=`
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
#endif`,ff=`#if defined( RE_IndirectDiffuse )
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
#endif`,pf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_f=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,xf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Mf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,bf=`#if defined( USE_POINTS_UV )
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
#endif`,Sf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ef=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,wf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Tf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Af=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cf=`#ifdef USE_MORPHTARGETS
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
#endif`,Rf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,If=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Lf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Df=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Uf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Nf=`#ifdef USE_NORMALMAP
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
#endif`,Ff=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Of=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,kf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Bf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,zf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Hf=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Vf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Gf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Wf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Xf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Yf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,qf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Zf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Kf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,$f=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Jf=`float getShadowMask() {
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
}`,jf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Qf=`#ifdef USE_SKINNING
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
#endif`,tp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ep=`#ifdef USE_SKINNING
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
#endif`,np=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ip=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,sp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,rp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ap=`#ifdef USE_TRANSMISSION
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
#endif`,op=`#ifdef USE_TRANSMISSION
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
#endif`,lp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,cp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,up=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,dp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,fp=`uniform sampler2D t2D;
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
}`,pp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,mp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,gp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_p=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yp=`#include <common>
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
}`,xp=`#if DEPTH_PACKING == 3200
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
}`,vp=`#define DISTANCE
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
}`,Mp=`#define DISTANCE
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
}`,bp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Sp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ep=`uniform float scale;
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
}`,wp=`uniform vec3 diffuse;
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
}`,Tp=`#include <common>
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
}`,Ap=`uniform vec3 diffuse;
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
}`,Cp=`#define LAMBERT
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
}`,Rp=`#define LAMBERT
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
}`,Pp=`#define MATCAP
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
}`,Ip=`#define MATCAP
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
}`,Lp=`#define NORMAL
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
}`,Dp=`#define NORMAL
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
}`,Up=`#define PHONG
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
}`,Np=`#define PHONG
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
}`,Fp=`#define STANDARD
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
}`,Op=`#define STANDARD
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
}`,kp=`#define TOON
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
}`,Bp=`#define TOON
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
}`,zp=`uniform float size;
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
}`,Hp=`uniform vec3 diffuse;
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
}`,Vp=`#include <common>
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
}`,Gp=`uniform vec3 color;
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
}`,Wp=`uniform float rotation;
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
}`,Xp=`uniform vec3 diffuse;
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
}`,Vt={alphahash_fragment:dd,alphahash_pars_fragment:fd,alphamap_fragment:pd,alphamap_pars_fragment:md,alphatest_fragment:gd,alphatest_pars_fragment:_d,aomap_fragment:yd,aomap_pars_fragment:xd,batching_pars_vertex:vd,batching_vertex:Md,begin_vertex:bd,beginnormal_vertex:Sd,bsdfs:Ed,iridescence_fragment:wd,bumpmap_pars_fragment:Td,clipping_planes_fragment:Ad,clipping_planes_pars_fragment:Cd,clipping_planes_pars_vertex:Rd,clipping_planes_vertex:Pd,color_fragment:Id,color_pars_fragment:Ld,color_pars_vertex:Dd,color_vertex:Ud,common:Nd,cube_uv_reflection_fragment:Fd,defaultnormal_vertex:Od,displacementmap_pars_vertex:kd,displacementmap_vertex:Bd,emissivemap_fragment:zd,emissivemap_pars_fragment:Hd,colorspace_fragment:Vd,colorspace_pars_fragment:Gd,envmap_fragment:Wd,envmap_common_pars_fragment:Xd,envmap_pars_fragment:Yd,envmap_pars_vertex:qd,envmap_physical_pars_fragment:rf,envmap_vertex:Zd,fog_vertex:Kd,fog_pars_vertex:$d,fog_fragment:Jd,fog_pars_fragment:jd,gradientmap_pars_fragment:Qd,lightmap_pars_fragment:tf,lights_lambert_fragment:ef,lights_lambert_pars_fragment:nf,lights_pars_begin:sf,lights_toon_fragment:af,lights_toon_pars_fragment:of,lights_phong_fragment:lf,lights_phong_pars_fragment:cf,lights_physical_fragment:hf,lights_physical_pars_fragment:uf,lights_fragment_begin:df,lights_fragment_maps:ff,lights_fragment_end:pf,logdepthbuf_fragment:mf,logdepthbuf_pars_fragment:gf,logdepthbuf_pars_vertex:_f,logdepthbuf_vertex:yf,map_fragment:xf,map_pars_fragment:vf,map_particle_fragment:Mf,map_particle_pars_fragment:bf,metalnessmap_fragment:Sf,metalnessmap_pars_fragment:Ef,morphinstance_vertex:wf,morphcolor_vertex:Tf,morphnormal_vertex:Af,morphtarget_pars_vertex:Cf,morphtarget_vertex:Rf,normal_fragment_begin:Pf,normal_fragment_maps:If,normal_pars_fragment:Lf,normal_pars_vertex:Df,normal_vertex:Uf,normalmap_pars_fragment:Nf,clearcoat_normal_fragment_begin:Ff,clearcoat_normal_fragment_maps:Of,clearcoat_pars_fragment:kf,iridescence_pars_fragment:Bf,opaque_fragment:zf,packing:Hf,premultiplied_alpha_fragment:Vf,project_vertex:Gf,dithering_fragment:Wf,dithering_pars_fragment:Xf,roughnessmap_fragment:Yf,roughnessmap_pars_fragment:qf,shadowmap_pars_fragment:Zf,shadowmap_pars_vertex:Kf,shadowmap_vertex:$f,shadowmask_pars_fragment:Jf,skinbase_vertex:jf,skinning_pars_vertex:Qf,skinning_vertex:tp,skinnormal_vertex:ep,specularmap_fragment:np,specularmap_pars_fragment:ip,tonemapping_fragment:sp,tonemapping_pars_fragment:rp,transmission_fragment:ap,transmission_pars_fragment:op,uv_pars_fragment:lp,uv_pars_vertex:cp,uv_vertex:hp,worldpos_vertex:up,background_vert:dp,background_frag:fp,backgroundCube_vert:pp,backgroundCube_frag:mp,cube_vert:gp,cube_frag:_p,depth_vert:yp,depth_frag:xp,distanceRGBA_vert:vp,distanceRGBA_frag:Mp,equirect_vert:bp,equirect_frag:Sp,linedashed_vert:Ep,linedashed_frag:wp,meshbasic_vert:Tp,meshbasic_frag:Ap,meshlambert_vert:Cp,meshlambert_frag:Rp,meshmatcap_vert:Pp,meshmatcap_frag:Ip,meshnormal_vert:Lp,meshnormal_frag:Dp,meshphong_vert:Up,meshphong_frag:Np,meshphysical_vert:Fp,meshphysical_frag:Op,meshtoon_vert:kp,meshtoon_frag:Bp,points_vert:zp,points_frag:Hp,shadow_vert:Vp,shadow_frag:Gp,sprite_vert:Wp,sprite_frag:Xp},lt={common:{diffuse:{value:new It(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new zt}},envmap:{envMap:{value:null},envMapRotation:{value:new zt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new zt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new zt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new zt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new zt},normalScale:{value:new Lt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new zt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new zt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new zt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new zt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new It(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new It(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0},uvTransform:{value:new zt}},sprite:{diffuse:{value:new It(16777215)},opacity:{value:1},center:{value:new Lt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}}},xn={basic:{uniforms:Fe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Vt.meshbasic_vert,fragmentShader:Vt.meshbasic_frag},lambert:{uniforms:Fe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new It(0)}}]),vertexShader:Vt.meshlambert_vert,fragmentShader:Vt.meshlambert_frag},phong:{uniforms:Fe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new It(0)},specular:{value:new It(1118481)},shininess:{value:30}}]),vertexShader:Vt.meshphong_vert,fragmentShader:Vt.meshphong_frag},standard:{uniforms:Fe([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new It(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag},toon:{uniforms:Fe([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new It(0)}}]),vertexShader:Vt.meshtoon_vert,fragmentShader:Vt.meshtoon_frag},matcap:{uniforms:Fe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Vt.meshmatcap_vert,fragmentShader:Vt.meshmatcap_frag},points:{uniforms:Fe([lt.points,lt.fog]),vertexShader:Vt.points_vert,fragmentShader:Vt.points_frag},dashed:{uniforms:Fe([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Vt.linedashed_vert,fragmentShader:Vt.linedashed_frag},depth:{uniforms:Fe([lt.common,lt.displacementmap]),vertexShader:Vt.depth_vert,fragmentShader:Vt.depth_frag},normal:{uniforms:Fe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Vt.meshnormal_vert,fragmentShader:Vt.meshnormal_frag},sprite:{uniforms:Fe([lt.sprite,lt.fog]),vertexShader:Vt.sprite_vert,fragmentShader:Vt.sprite_frag},background:{uniforms:{uvTransform:{value:new zt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Vt.background_vert,fragmentShader:Vt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new zt}},vertexShader:Vt.backgroundCube_vert,fragmentShader:Vt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Vt.cube_vert,fragmentShader:Vt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Vt.equirect_vert,fragmentShader:Vt.equirect_frag},distanceRGBA:{uniforms:Fe([lt.common,lt.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Vt.distanceRGBA_vert,fragmentShader:Vt.distanceRGBA_frag},shadow:{uniforms:Fe([lt.lights,lt.fog,{color:{value:new It(0)},opacity:{value:1}}]),vertexShader:Vt.shadow_vert,fragmentShader:Vt.shadow_frag}};xn.physical={uniforms:Fe([xn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new zt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new zt},clearcoatNormalScale:{value:new Lt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new zt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new zt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new zt},sheen:{value:0},sheenColor:{value:new It(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new zt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new zt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new zt},transmissionSamplerSize:{value:new Lt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new zt},attenuationDistance:{value:0},attenuationColor:{value:new It(0)},specularColor:{value:new It(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new zt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new zt},anisotropyVector:{value:new Lt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new zt}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag};var or={r:0,b:0,g:0},li=new Mn,Yp=new ge;function qp(i,t,e,n,s,r,o){let a=new It(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function _(E){let x=E.isScene===!0?E.background:null;return x&&x.isTexture&&(x=(E.backgroundBlurriness>0?e:t).get(x)),x}function g(E){let x=!1,y=_(E);y===null?p(a,l):y&&y.isColor&&(p(y,1),x=!0);let M=i.xr.getEnvironmentBlendMode();M==="additive"?n.buffers.color.setClear(0,0,0,1,o):M==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(E,x){let y=_(x);y&&(y.isCubeTexture||y.mapping===zr)?(h===void 0&&(h=new xe(new Cs(1,1,1),new $e({name:"BackgroundCubeMaterial",uniforms:ts(xn.backgroundCube.uniforms),vertexShader:xn.backgroundCube.vertexShader,fragmentShader:xn.backgroundCube.fragmentShader,side:Ve,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(M,T,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),li.copy(x.backgroundRotation),li.x*=-1,li.y*=-1,li.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(li.y*=-1,li.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Yp.makeRotationFromEuler(li)),h.material.toneMapped=Kt.getTransfer(y.colorSpace)!==ae,(u!==y||f!==y.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),h.layers.enableAll(),E.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new xe(new es(2,2),new $e({name:"BackgroundMaterial",uniforms:ts(xn.background.uniforms),vertexShader:xn.background.vertexShader,fragmentShader:xn.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=Kt.getTransfer(y.colorSpace)!==ae,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||f!==y.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}function p(E,x){E.getRGB(or,th(i)),n.buffers.color.setClear(or.r,or.g,or.b,x,o)}return{getClearColor:function(){return a},setClearColor:function(E,x=1){a.set(E),l=x,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(E){l=E,p(a,l)},render:g,addToRenderList:m}}function Zp(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(v,A,L,I,U){let z=!1,H=u(I,L,A);r!==H&&(r=H,c(r.object)),z=d(v,I,L,U),z&&_(v,I,L,U),U!==null&&t.update(U,i.ELEMENT_ARRAY_BUFFER),(z||o)&&(o=!1,y(v,A,L,I),U!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(U).buffer))}function l(){return i.createVertexArray()}function c(v){return i.bindVertexArray(v)}function h(v){return i.deleteVertexArray(v)}function u(v,A,L){let I=L.wireframe===!0,U=n[v.id];U===void 0&&(U={},n[v.id]=U);let z=U[A.id];z===void 0&&(z={},U[A.id]=z);let H=z[I];return H===void 0&&(H=f(l()),z[I]=H),H}function f(v){let A=[],L=[],I=[];for(let U=0;U<e;U++)A[U]=0,L[U]=0,I[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:A,enabledAttributes:L,attributeDivisors:I,object:v,attributes:{},index:null}}function d(v,A,L,I){let U=r.attributes,z=A.attributes,H=0,Q=L.getAttributes();for(let G in Q)if(Q[G].location>=0){let ht=U[G],Mt=z[G];if(Mt===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(Mt=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(Mt=v.instanceColor)),ht===void 0||ht.attribute!==Mt||Mt&&ht.data!==Mt.data)return!0;H++}return r.attributesNum!==H||r.index!==I}function _(v,A,L,I){let U={},z=A.attributes,H=0,Q=L.getAttributes();for(let G in Q)if(Q[G].location>=0){let ht=z[G];ht===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(ht=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(ht=v.instanceColor));let Mt={};Mt.attribute=ht,ht&&ht.data&&(Mt.data=ht.data),U[G]=Mt,H++}r.attributes=U,r.attributesNum=H,r.index=I}function g(){let v=r.newAttributes;for(let A=0,L=v.length;A<L;A++)v[A]=0}function m(v){p(v,0)}function p(v,A){let L=r.newAttributes,I=r.enabledAttributes,U=r.attributeDivisors;L[v]=1,I[v]===0&&(i.enableVertexAttribArray(v),I[v]=1),U[v]!==A&&(i.vertexAttribDivisor(v,A),U[v]=A)}function E(){let v=r.newAttributes,A=r.enabledAttributes;for(let L=0,I=A.length;L<I;L++)A[L]!==v[L]&&(i.disableVertexAttribArray(L),A[L]=0)}function x(v,A,L,I,U,z,H){H===!0?i.vertexAttribIPointer(v,A,L,U,z):i.vertexAttribPointer(v,A,L,I,U,z)}function y(v,A,L,I){g();let U=I.attributes,z=L.getAttributes(),H=A.defaultAttributeValues;for(let Q in z){let G=z[Q];if(G.location>=0){let rt=U[Q];if(rt===void 0&&(Q==="instanceMatrix"&&v.instanceMatrix&&(rt=v.instanceMatrix),Q==="instanceColor"&&v.instanceColor&&(rt=v.instanceColor)),rt!==void 0){let ht=rt.normalized,Mt=rt.itemSize,Ft=t.get(rt);if(Ft===void 0)continue;let jt=Ft.buffer,K=Ft.type,et=Ft.bytesPerElement,vt=K===i.INT||K===i.UNSIGNED_INT||rt.gpuType===el;if(rt.isInterleavedBufferAttribute){let ot=rt.data,Rt=ot.stride,Dt=rt.offset;if(ot.isInstancedInterleavedBuffer){for(let Ht=0;Ht<G.locationSize;Ht++)p(G.location+Ht,ot.meshPerAttribute);v.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=ot.meshPerAttribute*ot.count)}else for(let Ht=0;Ht<G.locationSize;Ht++)m(G.location+Ht);i.bindBuffer(i.ARRAY_BUFFER,jt);for(let Ht=0;Ht<G.locationSize;Ht++)x(G.location+Ht,Mt/G.locationSize,K,ht,Rt*et,(Dt+Mt/G.locationSize*Ht)*et,vt)}else{if(rt.isInstancedBufferAttribute){for(let ot=0;ot<G.locationSize;ot++)p(G.location+ot,rt.meshPerAttribute);v.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let ot=0;ot<G.locationSize;ot++)m(G.location+ot);i.bindBuffer(i.ARRAY_BUFFER,jt);for(let ot=0;ot<G.locationSize;ot++)x(G.location+ot,Mt/G.locationSize,K,ht,Mt*et,Mt/G.locationSize*ot*et,vt)}}else if(H!==void 0){let ht=H[Q];if(ht!==void 0)switch(ht.length){case 2:i.vertexAttrib2fv(G.location,ht);break;case 3:i.vertexAttrib3fv(G.location,ht);break;case 4:i.vertexAttrib4fv(G.location,ht);break;default:i.vertexAttrib1fv(G.location,ht)}}}}E()}function M(){R();for(let v in n){let A=n[v];for(let L in A){let I=A[L];for(let U in I)h(I[U].object),delete I[U];delete A[L]}delete n[v]}}function T(v){if(n[v.id]===void 0)return;let A=n[v.id];for(let L in A){let I=A[L];for(let U in I)h(I[U].object),delete I[U];delete A[L]}delete n[v.id]}function P(v){for(let A in n){let L=n[A];if(L[v.id]===void 0)continue;let I=L[v.id];for(let U in I)h(I[U].object),delete I[U];delete L[v.id]}}function R(){S(),o=!0,r!==s&&(r=s,c(r.object))}function S(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:R,resetDefaultState:S,dispose:M,releaseStatesOfGeometry:T,releaseStatesOfProgram:P,initAttributes:g,enableAttribute:m,disableUnusedAttributes:E}}function Kp(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let d=0;for(let _=0;_<u;_++)d+=h[_];e.update(d,n,1)}function l(c,h,u,f){if(u===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let _=0;_<c.length;_++)o(c[_],h[_],f[_]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,u);let _=0;for(let g=0;g<u;g++)_+=h[g]*f[g];e.update(_,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function $p(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let P=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(P){return!(P!==dn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(P){let R=P===Us&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==Fn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Dn&&!R)}function l(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),x=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),M=_>0,T=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:d,maxVertexTextures:_,maxTextureSize:g,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:E,maxVaryings:x,maxFragmentUniforms:y,vertexTextures:M,maxSamples:T}}function Jp(i){let t=this,e=null,n=0,s=!1,r=!1,o=new un,a=new zt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){let _=u.clippingPlanes,g=u.clipIntersection,m=u.clipShadows,p=i.get(u);if(!s||_===null||_.length===0||r&&!m)r?h(null):c();else{let E=r?0:n,x=E*4,y=p.clippingState||null;l.value=y,y=h(_,f,x,d);for(let M=0;M!==x;++M)y[M]=e[M];p.clippingState=y,this.numIntersection=g?this.numPlanes:0,this.numPlanes+=E}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,_){let g=u!==null?u.length:0,m=null;if(g!==0){if(m=l.value,_!==!0||m===null){let p=d+g*4,E=f.matrixWorldInverse;a.getNormalMatrix(E),(m===null||m.length<p)&&(m=new Float32Array(p));for(let x=0,y=d;x!==g;++x,y+=4)o.copy(u[x]).applyMatrix4(E,a),o.normal.toArray(m,y),m[y+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=g,t.numIntersection=0,m}}function jp(i){let t=new WeakMap;function e(o,a){return a===Ya?o.mapping=Zi:a===qa&&(o.mapping=Ki),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ya||a===qa)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Co(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var ns=class extends Tr{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Vi=4,cc=[.125,.215,.35,.446,.526,.582],fi=20,Pa=new ns,hc=new It,Ia=null,La=0,Da=0,Ua=!1,hi=(1+Math.sqrt(5))/2,zi=1/hi,uc=[new k(-hi,zi,0),new k(hi,zi,0),new k(-zi,0,hi),new k(zi,0,hi),new k(0,hi,-zi),new k(0,hi,zi),new k(-1,1,-1),new k(1,1,-1),new k(-1,1,1),new k(1,1,1)],Cr=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Ia=this._renderer.getRenderTarget(),La=this._renderer.getActiveCubeFace(),Da=this._renderer.getActiveMipmapLevel(),Ua=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=pc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=fc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Ia,La,Da),this._renderer.xr.enabled=Ua,t.scissorTest=!1,lr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Zi||t.mapping===Ki?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Ia=this._renderer.getRenderTarget(),La=this._renderer.getActiveCubeFace(),Da=this._renderer.getActiveMipmapLevel(),Ua=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:vn,minFilter:vn,generateMipmaps:!1,type:Us,format:dn,colorSpace:ss,depthBuffer:!1},s=dc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=dc(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Qp(r)),this._blurMaterial=tm(r,t,e)}return s}_compileMaterial(t){let e=new xe(this._lodPlanes[0],t);this._renderer.compile(e,Pa)}_sceneToCubeUV(t,e,n,s){let a=new Oe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(hc),h.toneMapping=jn,h.autoClear=!1;let d=new bn({name:"PMREM.Background",side:Ve,depthWrite:!1,depthTest:!1}),_=new xe(new Cs,d),g=!1,m=t.background;m?m.isColor&&(d.color.copy(m),t.background=null,g=!0):(d.color.copy(hc),g=!0);for(let p=0;p<6;p++){let E=p%3;E===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):E===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));let x=this._cubeSize;lr(s,E*x,p>2?x:0,x,x),h.setRenderTarget(s),g&&h.render(_,a),h.render(t,a)}_.geometry.dispose(),_.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Zi||t.mapping===Ki;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=pc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=fc());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new xe(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;lr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Pa)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=uc[(s-r-1)%uc.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new xe(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*fi-1),g=r/_,m=isFinite(r)?1+Math.floor(h*g):fi;m>fi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${fi}`);let p=[],E=0;for(let P=0;P<fi;++P){let R=P/g,S=Math.exp(-R*R/2);p.push(S),P===0?E+=S:P<m&&(E+=2*S)}for(let P=0;P<p.length;P++)p[P]=p[P]/E;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:x}=this;f.dTheta.value=_,f.mipInt.value=x-n;let y=this._sizeLods[s],M=3*y*(s>x-Vi?s-x+Vi:0),T=4*(this._cubeSize-y);lr(e,M,T,3*y,2*y),l.setRenderTarget(e),l.render(u,Pa)}};function Qp(i){let t=[],e=[],n=[],s=i,r=i-Vi+1+cc.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Vi?l=cc[o-i+Vi-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,_=6,g=3,m=2,p=1,E=new Float32Array(g*_*d),x=new Float32Array(m*_*d),y=new Float32Array(p*_*d);for(let T=0;T<d;T++){let P=T%3*2/3-1,R=T>2?0:-1,S=[P,R,0,P+2/3,R,0,P+2/3,R+1,0,P,R,0,P+2/3,R+1,0,P,R+1,0];E.set(S,g*_*T),x.set(f,m*_*T);let v=[T,T,T,T,T,T];y.set(v,p*_*T)}let M=new Te;M.setAttribute("position",new he(E,g)),M.setAttribute("uv",new he(x,m)),M.setAttribute("faceIndex",new he(y,p)),t.push(M),s>Vi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function dc(i,t,e){let n=new kn(i,t,e);return n.texture.mapping=zr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function lr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function tm(i,t,e){let n=new Float32Array(fi),s=new k(0,1,0);return new $e({name:"SphericalGaussianBlur",defines:{n:fi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ll(),fragmentShader:`

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
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function fc(){return new $e({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ll(),fragmentShader:`

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
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function pc(){return new $e({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ll(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function ll(){return`

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
	`}function em(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Ya||l===qa,h=l===Zi||l===Ki;if(c||h){let u=t.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return e===null&&(e=new Cr(i)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let d=a.image;return c&&d&&d.height>0||h&&d&&s(d)?(e===null&&(e=new Cr(i)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function nm(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Ms("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function im(i,t,e,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&t.remove(f.index);for(let _ in f.attributes)t.remove(f.attributes[_]);for(let _ in f.morphAttributes){let g=f.morphAttributes[_];for(let m=0,p=g.length;m<p;m++)t.remove(g[m])}f.removeEventListener("dispose",o),delete s[f.id];let d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function l(u){let f=u.attributes;for(let _ in f)t.update(f[_],i.ARRAY_BUFFER);let d=u.morphAttributes;for(let _ in d){let g=d[_];for(let m=0,p=g.length;m<p;m++)t.update(g[m],i.ARRAY_BUFFER)}}function c(u){let f=[],d=u.index,_=u.attributes.position,g=0;if(d!==null){let E=d.array;g=d.version;for(let x=0,y=E.length;x<y;x+=3){let M=E[x+0],T=E[x+1],P=E[x+2];f.push(M,T,T,P,P,M)}}else if(_!==void 0){let E=_.array;g=_.version;for(let x=0,y=E.length/3-1;x<y;x+=3){let M=x+0,T=x+1,P=x+2;f.push(M,T,T,P,P,M)}}else return;let m=new(jc(f)?wr:Er)(f,1);m.version=g;let p=r.get(u);p&&t.remove(p),r.set(u,m)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function sm(i,t,e){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*o),e.update(d,n,1)}function c(f,d,_){_!==0&&(i.drawElementsInstanced(n,d,r,f*o,_),e.update(d,n,_))}function h(f,d,_){if(_===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,_);let m=0;for(let p=0;p<_;p++)m+=d[p];e.update(m,n,1)}function u(f,d,_,g){if(_===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<f.length;p++)c(f[p]/o,d[p],g[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,g,0,_);let p=0;for(let E=0;E<_;E++)p+=d[E]*g[E];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function rm(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function am(i,t,e){let n=new WeakMap,s=new ye;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(a);if(f===void 0||f.count!==u){let S=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",S)};f!==void 0&&f.texture.dispose();let d=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,g=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],x=0;d===!0&&(x=1),_===!0&&(x=2),g===!0&&(x=3);let y=a.attributes.position.count*x,M=1;y>t.maxTextureSize&&(M=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);let T=new Float32Array(y*M*4*u),P=new br(T,y,M,u);P.type=Dn,P.needsUpdate=!0;let R=x*4;for(let v=0;v<u;v++){let A=m[v],L=p[v],I=E[v],U=y*M*4*v;for(let z=0;z<A.count;z++){let H=z*R;d===!0&&(s.fromBufferAttribute(A,z),T[U+H+0]=s.x,T[U+H+1]=s.y,T[U+H+2]=s.z,T[U+H+3]=0),_===!0&&(s.fromBufferAttribute(L,z),T[U+H+4]=s.x,T[U+H+5]=s.y,T[U+H+6]=s.z,T[U+H+7]=0),g===!0&&(s.fromBufferAttribute(I,z),T[U+H+8]=s.x,T[U+H+9]=s.y,T[U+H+10]=s.z,T[U+H+11]=I.itemSize===4?s.w:1)}}f={count:u,texture:P,size:new Lt(y,M)},n.set(a,f),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let d=0;for(let g=0;g<c.length;g++)d+=c[g];let _=a.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function om(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var Rr=class extends Ke{constructor(t,e,n,s,r,o,a,l,c,h=Wi){if(h!==Wi&&h!==Ji)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Wi&&(n=gi),n===void 0&&h===Ji&&(n=$i),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:fn,this.minFilter=l!==void 0?l:fn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},nh=new Ke,mc=new Rr(1,1),ih=new br,sh=new To,rh=new Ar,gc=[],_c=[],yc=new Float32Array(16),xc=new Float32Array(9),vc=new Float32Array(4);function os(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=gc[s];if(r===void 0&&(r=new Float32Array(s),gc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Me(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function be(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Vr(i,t){let e=_c[t];e===void 0&&(e=new Int32Array(t),_c[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function lm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function cm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2fv(this.addr,t),be(e,t)}}function hm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Me(e,t))return;i.uniform3fv(this.addr,t),be(e,t)}}function um(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4fv(this.addr,t),be(e,t)}}function dm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),be(e,t)}else{if(Me(e,n))return;vc.set(n),i.uniformMatrix2fv(this.addr,!1,vc),be(e,n)}}function fm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),be(e,t)}else{if(Me(e,n))return;xc.set(n),i.uniformMatrix3fv(this.addr,!1,xc),be(e,n)}}function pm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),be(e,t)}else{if(Me(e,n))return;yc.set(n),i.uniformMatrix4fv(this.addr,!1,yc),be(e,n)}}function mm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function gm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2iv(this.addr,t),be(e,t)}}function _m(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Me(e,t))return;i.uniform3iv(this.addr,t),be(e,t)}}function ym(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4iv(this.addr,t),be(e,t)}}function xm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function vm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2uiv(this.addr,t),be(e,t)}}function Mm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Me(e,t))return;i.uniform3uiv(this.addr,t),be(e,t)}}function bm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4uiv(this.addr,t),be(e,t)}}function Sm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(mc.compareFunction=$c,r=mc):r=nh,e.setTexture2D(t||r,s)}function Em(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||sh,s)}function wm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||rh,s)}function Tm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||ih,s)}function Am(i){switch(i){case 5126:return lm;case 35664:return cm;case 35665:return hm;case 35666:return um;case 35674:return dm;case 35675:return fm;case 35676:return pm;case 5124:case 35670:return mm;case 35667:case 35671:return gm;case 35668:case 35672:return _m;case 35669:case 35673:return ym;case 5125:return xm;case 36294:return vm;case 36295:return Mm;case 36296:return bm;case 35678:case 36198:case 36298:case 36306:case 35682:return Sm;case 35679:case 36299:case 36307:return Em;case 35680:case 36300:case 36308:case 36293:return wm;case 36289:case 36303:case 36311:case 36292:return Tm}}function Cm(i,t){i.uniform1fv(this.addr,t)}function Rm(i,t){let e=os(t,this.size,2);i.uniform2fv(this.addr,e)}function Pm(i,t){let e=os(t,this.size,3);i.uniform3fv(this.addr,e)}function Im(i,t){let e=os(t,this.size,4);i.uniform4fv(this.addr,e)}function Lm(i,t){let e=os(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Dm(i,t){let e=os(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Um(i,t){let e=os(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Nm(i,t){i.uniform1iv(this.addr,t)}function Fm(i,t){i.uniform2iv(this.addr,t)}function Om(i,t){i.uniform3iv(this.addr,t)}function km(i,t){i.uniform4iv(this.addr,t)}function Bm(i,t){i.uniform1uiv(this.addr,t)}function zm(i,t){i.uniform2uiv(this.addr,t)}function Hm(i,t){i.uniform3uiv(this.addr,t)}function Vm(i,t){i.uniform4uiv(this.addr,t)}function Gm(i,t,e){let n=this.cache,s=t.length,r=Vr(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||nh,r[o])}function Wm(i,t,e){let n=this.cache,s=t.length,r=Vr(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||sh,r[o])}function Xm(i,t,e){let n=this.cache,s=t.length,r=Vr(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||rh,r[o])}function Ym(i,t,e){let n=this.cache,s=t.length,r=Vr(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||ih,r[o])}function qm(i){switch(i){case 5126:return Cm;case 35664:return Rm;case 35665:return Pm;case 35666:return Im;case 35674:return Lm;case 35675:return Dm;case 35676:return Um;case 5124:case 35670:return Nm;case 35667:case 35671:return Fm;case 35668:case 35672:return Om;case 35669:case 35673:return km;case 5125:return Bm;case 36294:return zm;case 36295:return Hm;case 36296:return Vm;case 35678:case 36198:case 36298:case 36306:case 35682:return Gm;case 35679:case 36299:case 36307:return Wm;case 35680:case 36300:case 36308:case 36293:return Xm;case 36289:case 36303:case 36311:case 36292:return Ym}}var Ro=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Am(e.type)}},Po=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=qm(e.type)}},Io=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},Na=/(\w+)(\])?(\[|\.)?/g;function Mc(i,t){i.seq.push(t),i.map[t.id]=t}function Zm(i,t,e){let n=i.name,s=n.length;for(Na.lastIndex=0;;){let r=Na.exec(n),o=Na.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Mc(e,c===void 0?new Ro(a,i,t):new Po(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new Io(a),Mc(e,u)),e=u}}}var Yi=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Zm(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function bc(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var Km=37297,$m=0;function Jm(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}var Sc=new zt;function jm(i){Kt._getMatrix(Sc,Kt.workingColorSpace,i);let t=`mat3( ${Sc.elements.map(e=>e.toFixed(4))} )`;switch(Kt.getTransfer(i)){case Hr:return[t,"LinearTransferOETF"];case ae:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Ec(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Jm(i.getShaderSource(t),o)}else return s}function Qm(i,t){let e=jm(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function tg(i,t){let e;switch(t){case cu:e="Linear";break;case hu:e="Reinhard";break;case uu:e="Cineon";break;case du:e="ACESFilmic";break;case pu:e="AgX";break;case mu:e="Neutral";break;case fu:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var cr=new k;function eg(){Kt.getLuminanceCoefficients(cr);let i=cr.x.toFixed(4),t=cr.y.toFixed(4),e=cr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ng(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bs).join(`
`)}function ig(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function sg(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function bs(i){return i!==""}function wc(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Tc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var rg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Lo(i){return i.replace(rg,og)}var ag=new Map;function og(i,t){let e=Vt[t];if(e===void 0){let n=ag.get(t);if(n!==void 0)e=Vt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Lo(e)}var lg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ac(i){return i.replace(lg,cg)}function cg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Cc(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}function hg(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Oc?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Vh?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ln&&(t="SHADOWMAP_TYPE_VSM"),t}function ug(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Zi:case Ki:t="ENVMAP_TYPE_CUBE";break;case zr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function dg(i){let t="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Ki&&(t="ENVMAP_MODE_REFRACTION"),t}function fg(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case tl:t="ENVMAP_BLENDING_MULTIPLY";break;case ou:t="ENVMAP_BLENDING_MIX";break;case lu:t="ENVMAP_BLENDING_ADD";break}return t}function pg(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function mg(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=hg(e),c=ug(e),h=dg(e),u=fg(e),f=pg(e),d=ng(e),_=ig(r),g=s.createProgram(),m,p,E=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(bs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(bs).join(`
`),p.length>0&&(p+=`
`)):(m=[Cc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bs).join(`
`),p=[Cc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==jn?"#define TONE_MAPPING":"",e.toneMapping!==jn?Vt.tonemapping_pars_fragment:"",e.toneMapping!==jn?tg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Vt.colorspace_pars_fragment,Qm("linearToOutputTexel",e.outputColorSpace),eg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bs).join(`
`)),o=Lo(o),o=wc(o,e),o=Tc(o,e),a=Lo(a),a=wc(a,e),a=Tc(a,e),o=Ac(o),a=Ac(a),e.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===Hl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Hl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let x=E+m+o,y=E+p+a,M=bc(s,s.VERTEX_SHADER,x),T=bc(s,s.FRAGMENT_SHADER,y);s.attachShader(g,M),s.attachShader(g,T),e.index0AttributeName!==void 0?s.bindAttribLocation(g,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(g,0,"position"),s.linkProgram(g);function P(A){if(i.debug.checkShaderErrors){let L=s.getProgramInfoLog(g).trim(),I=s.getShaderInfoLog(M).trim(),U=s.getShaderInfoLog(T).trim(),z=!0,H=!0;if(s.getProgramParameter(g,s.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,g,M,T);else{let Q=Ec(s,M,"vertex"),G=Ec(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(g,s.VALIDATE_STATUS)+`

Material Name: `+A.name+`
Material Type: `+A.type+`

Program Info Log: `+L+`
`+Q+`
`+G)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(I===""||U==="")&&(H=!1);H&&(A.diagnostics={runnable:z,programLog:L,vertexShader:{log:I,prefix:m},fragmentShader:{log:U,prefix:p}})}s.deleteShader(M),s.deleteShader(T),R=new Yi(s,g),S=sg(s,g)}let R;this.getUniforms=function(){return R===void 0&&P(this),R};let S;this.getAttributes=function(){return S===void 0&&P(this),S};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(g,Km)),v},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(g),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=$m++,this.cacheKey=t,this.usedTimes=1,this.program=g,this.vertexShader=M,this.fragmentShader=T,this}var gg=0,Do=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Uo(t),e.set(t,n)),n}},Uo=class{constructor(t){this.id=gg++,this.code=t,this.usedTimes=0}};function _g(i,t,e,n,s,r,o){let a=new Sr,l=new Do,c=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,d=s.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(S){return c.add(S),S===0?"uv":`uv${S}`}function m(S,v,A,L,I){let U=L.fog,z=I.geometry,H=S.isMeshStandardMaterial?L.environment:null,Q=(S.isMeshStandardMaterial?e:t).get(S.envMap||H),G=Q&&Q.mapping===zr?Q.image.height:null,rt=_[S.type];S.precision!==null&&(d=s.getMaxPrecision(S.precision),d!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",d,"instead."));let ht=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Mt=ht!==void 0?ht.length:0,Ft=0;z.morphAttributes.position!==void 0&&(Ft=1),z.morphAttributes.normal!==void 0&&(Ft=2),z.morphAttributes.color!==void 0&&(Ft=3);let jt,K,et,vt;if(rt){let re=xn[rt];jt=re.vertexShader,K=re.fragmentShader}else jt=S.vertexShader,K=S.fragmentShader,l.update(S),et=l.getVertexShaderID(S),vt=l.getFragmentShaderID(S);let ot=i.getRenderTarget(),Rt=i.state.buffers.depth.getReversed(),Dt=I.isInstancedMesh===!0,Ht=I.isBatchedMesh===!0,le=!!S.map,Yt=!!S.matcap,pe=!!Q,F=!!S.aoMap,Re=!!S.lightMap,Gt=!!S.bumpMap,Wt=!!S.normalMap,Ct=!!S.displacementMap,se=!!S.emissiveMap,At=!!S.metalnessMap,C=!!S.roughnessMap,b=S.anisotropy>0,B=S.clearcoat>0,Z=S.dispersion>0,tt=S.iridescence>0,X=S.sheen>0,mt=S.transmission>0,it=b&&!!S.anisotropyMap,dt=B&&!!S.clearcoatMap,qt=B&&!!S.clearcoatNormalMap,nt=B&&!!S.clearcoatRoughnessMap,_t=tt&&!!S.iridescenceMap,Pt=tt&&!!S.iridescenceThicknessMap,bt=X&&!!S.sheenColorMap,xt=X&&!!S.sheenRoughnessMap,Xt=!!S.specularMap,Ot=!!S.specularColorMap,Zt=!!S.specularIntensityMap,D=mt&&!!S.transmissionMap,ct=mt&&!!S.thicknessMap,q=!!S.gradientMap,J=!!S.alphaMap,gt=S.alphaTest>0,ft=!!S.alphaHash,kt=!!S.extensions,_e=jn;S.toneMapped&&(ot===null||ot.isXRRenderTarget===!0)&&(_e=i.toneMapping);let Pe={shaderID:rt,shaderType:S.type,shaderName:S.name,vertexShader:jt,fragmentShader:K,defines:S.defines,customVertexShaderID:et,customFragmentShaderID:vt,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:d,batching:Ht,batchingColor:Ht&&I._colorsTexture!==null,instancing:Dt,instancingColor:Dt&&I.instanceColor!==null,instancingMorph:Dt&&I.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:ot===null?i.outputColorSpace:ot.isXRRenderTarget===!0?ot.texture.colorSpace:ss,alphaToCoverage:!!S.alphaToCoverage,map:le,matcap:Yt,envMap:pe,envMapMode:pe&&Q.mapping,envMapCubeUVHeight:G,aoMap:F,lightMap:Re,bumpMap:Gt,normalMap:Wt,displacementMap:f&&Ct,emissiveMap:se,normalMapObjectSpace:Wt&&S.normalMapType===xu,normalMapTangentSpace:Wt&&S.normalMapType===Kc,metalnessMap:At,roughnessMap:C,anisotropy:b,anisotropyMap:it,clearcoat:B,clearcoatMap:dt,clearcoatNormalMap:qt,clearcoatRoughnessMap:nt,dispersion:Z,iridescence:tt,iridescenceMap:_t,iridescenceThicknessMap:Pt,sheen:X,sheenColorMap:bt,sheenRoughnessMap:xt,specularMap:Xt,specularColorMap:Ot,specularIntensityMap:Zt,transmission:mt,transmissionMap:D,thicknessMap:ct,gradientMap:q,opaque:S.transparent===!1&&S.blending===Gi&&S.alphaToCoverage===!1,alphaMap:J,alphaTest:gt,alphaHash:ft,combine:S.combine,mapUv:le&&g(S.map.channel),aoMapUv:F&&g(S.aoMap.channel),lightMapUv:Re&&g(S.lightMap.channel),bumpMapUv:Gt&&g(S.bumpMap.channel),normalMapUv:Wt&&g(S.normalMap.channel),displacementMapUv:Ct&&g(S.displacementMap.channel),emissiveMapUv:se&&g(S.emissiveMap.channel),metalnessMapUv:At&&g(S.metalnessMap.channel),roughnessMapUv:C&&g(S.roughnessMap.channel),anisotropyMapUv:it&&g(S.anisotropyMap.channel),clearcoatMapUv:dt&&g(S.clearcoatMap.channel),clearcoatNormalMapUv:qt&&g(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:nt&&g(S.clearcoatRoughnessMap.channel),iridescenceMapUv:_t&&g(S.iridescenceMap.channel),iridescenceThicknessMapUv:Pt&&g(S.iridescenceThicknessMap.channel),sheenColorMapUv:bt&&g(S.sheenColorMap.channel),sheenRoughnessMapUv:xt&&g(S.sheenRoughnessMap.channel),specularMapUv:Xt&&g(S.specularMap.channel),specularColorMapUv:Ot&&g(S.specularColorMap.channel),specularIntensityMapUv:Zt&&g(S.specularIntensityMap.channel),transmissionMapUv:D&&g(S.transmissionMap.channel),thicknessMapUv:ct&&g(S.thicknessMap.channel),alphaMapUv:J&&g(S.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(Wt||b),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!z.attributes.uv&&(le||J),fog:!!U,useFog:S.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Rt,skinning:I.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:Mt,morphTextureStride:Ft,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&A.length>0,shadowMapType:i.shadowMap.type,toneMapping:_e,decodeVideoTexture:le&&S.map.isVideoTexture===!0&&Kt.getTransfer(S.map.colorSpace)===ae,decodeVideoTextureEmissive:se&&S.emissiveMap.isVideoTexture===!0&&Kt.getTransfer(S.emissiveMap.colorSpace)===ae,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Ce,flipSided:S.side===Ve,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:kt&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(kt&&S.extensions.multiDraw===!0||Ht)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Pe.vertexUv1s=c.has(1),Pe.vertexUv2s=c.has(2),Pe.vertexUv3s=c.has(3),c.clear(),Pe}function p(S){let v=[];if(S.shaderID?v.push(S.shaderID):(v.push(S.customVertexShaderID),v.push(S.customFragmentShaderID)),S.defines!==void 0)for(let A in S.defines)v.push(A),v.push(S.defines[A]);return S.isRawShaderMaterial===!1&&(E(v,S),x(v,S),v.push(i.outputColorSpace)),v.push(S.customProgramCacheKey),v.join()}function E(S,v){S.push(v.precision),S.push(v.outputColorSpace),S.push(v.envMapMode),S.push(v.envMapCubeUVHeight),S.push(v.mapUv),S.push(v.alphaMapUv),S.push(v.lightMapUv),S.push(v.aoMapUv),S.push(v.bumpMapUv),S.push(v.normalMapUv),S.push(v.displacementMapUv),S.push(v.emissiveMapUv),S.push(v.metalnessMapUv),S.push(v.roughnessMapUv),S.push(v.anisotropyMapUv),S.push(v.clearcoatMapUv),S.push(v.clearcoatNormalMapUv),S.push(v.clearcoatRoughnessMapUv),S.push(v.iridescenceMapUv),S.push(v.iridescenceThicknessMapUv),S.push(v.sheenColorMapUv),S.push(v.sheenRoughnessMapUv),S.push(v.specularMapUv),S.push(v.specularColorMapUv),S.push(v.specularIntensityMapUv),S.push(v.transmissionMapUv),S.push(v.thicknessMapUv),S.push(v.combine),S.push(v.fogExp2),S.push(v.sizeAttenuation),S.push(v.morphTargetsCount),S.push(v.morphAttributeCount),S.push(v.numDirLights),S.push(v.numPointLights),S.push(v.numSpotLights),S.push(v.numSpotLightMaps),S.push(v.numHemiLights),S.push(v.numRectAreaLights),S.push(v.numDirLightShadows),S.push(v.numPointLightShadows),S.push(v.numSpotLightShadows),S.push(v.numSpotLightShadowsWithMaps),S.push(v.numLightProbes),S.push(v.shadowMapType),S.push(v.toneMapping),S.push(v.numClippingPlanes),S.push(v.numClipIntersection),S.push(v.depthPacking)}function x(S,v){a.disableAll(),v.supportsVertexTextures&&a.enable(0),v.instancing&&a.enable(1),v.instancingColor&&a.enable(2),v.instancingMorph&&a.enable(3),v.matcap&&a.enable(4),v.envMap&&a.enable(5),v.normalMapObjectSpace&&a.enable(6),v.normalMapTangentSpace&&a.enable(7),v.clearcoat&&a.enable(8),v.iridescence&&a.enable(9),v.alphaTest&&a.enable(10),v.vertexColors&&a.enable(11),v.vertexAlphas&&a.enable(12),v.vertexUv1s&&a.enable(13),v.vertexUv2s&&a.enable(14),v.vertexUv3s&&a.enable(15),v.vertexTangents&&a.enable(16),v.anisotropy&&a.enable(17),v.alphaHash&&a.enable(18),v.batching&&a.enable(19),v.dispersion&&a.enable(20),v.batchingColor&&a.enable(21),S.push(a.mask),a.disableAll(),v.fog&&a.enable(0),v.useFog&&a.enable(1),v.flatShading&&a.enable(2),v.logarithmicDepthBuffer&&a.enable(3),v.reverseDepthBuffer&&a.enable(4),v.skinning&&a.enable(5),v.morphTargets&&a.enable(6),v.morphNormals&&a.enable(7),v.morphColors&&a.enable(8),v.premultipliedAlpha&&a.enable(9),v.shadowMapEnabled&&a.enable(10),v.doubleSided&&a.enable(11),v.flipSided&&a.enable(12),v.useDepthPacking&&a.enable(13),v.dithering&&a.enable(14),v.transmission&&a.enable(15),v.sheen&&a.enable(16),v.opaque&&a.enable(17),v.pointsUvs&&a.enable(18),v.decodeVideoTexture&&a.enable(19),v.decodeVideoTextureEmissive&&a.enable(20),v.alphaToCoverage&&a.enable(21),S.push(a.mask)}function y(S){let v=_[S.type],A;if(v){let L=xn[v];A=ad.clone(L.uniforms)}else A=S.uniforms;return A}function M(S,v){let A;for(let L=0,I=h.length;L<I;L++){let U=h[L];if(U.cacheKey===v){A=U,++A.usedTimes;break}}return A===void 0&&(A=new mg(i,v,S,r),h.push(A)),A}function T(S){if(--S.usedTimes===0){let v=h.indexOf(S);h[v]=h[h.length-1],h.pop(),S.destroy()}}function P(S){l.remove(S)}function R(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:y,acquireProgram:M,releaseProgram:T,releaseShaderCache:P,programs:h,dispose:R}}function yg(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function xg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Rc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Pc(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,f,d,_,g,m){let p=i[t];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:_,renderOrder:u.renderOrder,z:g,group:m},i[t]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=_,p.renderOrder=u.renderOrder,p.z=g,p.group=m),t++,p}function a(u,f,d,_,g,m){let p=o(u,f,d,_,g,m);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):e.push(p)}function l(u,f,d,_,g,m){let p=o(u,f,d,_,g,m);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):e.unshift(p)}function c(u,f){e.length>1&&e.sort(u||xg),n.length>1&&n.sort(f||Rc),s.length>1&&s.sort(f||Rc)}function h(){for(let u=t,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function vg(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new Pc,i.set(n,[o])):s>=r.length?(o=new Pc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Mg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new k,color:new It};break;case"SpotLight":e={position:new k,direction:new k,color:new It,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new k,color:new It,distance:0,decay:0};break;case"HemisphereLight":e={direction:new k,skyColor:new It,groundColor:new It};break;case"RectAreaLight":e={color:new It,position:new k,halfWidth:new k,halfHeight:new k};break}return i[t.id]=e,e}}}function bg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Sg=0;function Eg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function wg(i){let t=new Mg,e=bg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new k);let s=new k,r=new ge,o=new ge;function a(c){let h=0,u=0,f=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let d=0,_=0,g=0,m=0,p=0,E=0,x=0,y=0,M=0,T=0,P=0;c.sort(Eg);for(let S=0,v=c.length;S<v;S++){let A=c[S],L=A.color,I=A.intensity,U=A.distance,z=A.shadow&&A.shadow.map?A.shadow.map.texture:null;if(A.isAmbientLight)h+=L.r*I,u+=L.g*I,f+=L.b*I;else if(A.isLightProbe){for(let H=0;H<9;H++)n.probe[H].addScaledVector(A.sh.coefficients[H],I);P++}else if(A.isDirectionalLight){let H=t.get(A);if(H.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){let Q=A.shadow,G=e.get(A);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.directionalShadow[d]=G,n.directionalShadowMap[d]=z,n.directionalShadowMatrix[d]=A.shadow.matrix,E++}n.directional[d]=H,d++}else if(A.isSpotLight){let H=t.get(A);H.position.setFromMatrixPosition(A.matrixWorld),H.color.copy(L).multiplyScalar(I),H.distance=U,H.coneCos=Math.cos(A.angle),H.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),H.decay=A.decay,n.spot[g]=H;let Q=A.shadow;if(A.map&&(n.spotLightMap[M]=A.map,M++,Q.updateMatrices(A),A.castShadow&&T++),n.spotLightMatrix[g]=Q.matrix,A.castShadow){let G=e.get(A);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.spotShadow[g]=G,n.spotShadowMap[g]=z,y++}g++}else if(A.isRectAreaLight){let H=t.get(A);H.color.copy(L).multiplyScalar(I),H.halfWidth.set(A.width*.5,0,0),H.halfHeight.set(0,A.height*.5,0),n.rectArea[m]=H,m++}else if(A.isPointLight){let H=t.get(A);if(H.color.copy(A.color).multiplyScalar(A.intensity),H.distance=A.distance,H.decay=A.decay,A.castShadow){let Q=A.shadow,G=e.get(A);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,G.shadowCameraNear=Q.camera.near,G.shadowCameraFar=Q.camera.far,n.pointShadow[_]=G,n.pointShadowMap[_]=z,n.pointShadowMatrix[_]=A.shadow.matrix,x++}n.point[_]=H,_++}else if(A.isHemisphereLight){let H=t.get(A);H.skyColor.copy(A.color).multiplyScalar(I),H.groundColor.copy(A.groundColor).multiplyScalar(I),n.hemi[p]=H,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=lt.LTC_FLOAT_1,n.rectAreaLTC2=lt.LTC_FLOAT_2):(n.rectAreaLTC1=lt.LTC_HALF_1,n.rectAreaLTC2=lt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let R=n.hash;(R.directionalLength!==d||R.pointLength!==_||R.spotLength!==g||R.rectAreaLength!==m||R.hemiLength!==p||R.numDirectionalShadows!==E||R.numPointShadows!==x||R.numSpotShadows!==y||R.numSpotMaps!==M||R.numLightProbes!==P)&&(n.directional.length=d,n.spot.length=g,n.rectArea.length=m,n.point.length=_,n.hemi.length=p,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=x,n.pointShadowMap.length=x,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=x,n.spotLightMatrix.length=y+M-T,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=P,R.directionalLength=d,R.pointLength=_,R.spotLength=g,R.rectAreaLength=m,R.hemiLength=p,R.numDirectionalShadows=E,R.numPointShadows=x,R.numSpotShadows=y,R.numSpotMaps=M,R.numLightProbes=P,n.version=Sg++)}function l(c,h){let u=0,f=0,d=0,_=0,g=0,m=h.matrixWorldInverse;for(let p=0,E=c.length;p<E;p++){let x=c[p];if(x.isDirectionalLight){let y=n.directional[u];y.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),u++}else if(x.isSpotLight){let y=n.spot[d];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),d++}else if(x.isRectAreaLight){let y=n.rectArea[_];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(m),o.identity(),r.copy(x.matrixWorld),r.premultiply(m),o.extractRotation(r),y.halfWidth.set(x.width*.5,0,0),y.halfHeight.set(0,x.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),_++}else if(x.isPointLight){let y=n.point[f];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(m),f++}else if(x.isHemisphereLight){let y=n.hemi[g];y.direction.setFromMatrixPosition(x.matrixWorld),y.direction.transformDirection(m),g++}}}return{setup:a,setupView:l,state:n}}function Ic(i){let t=new wg(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Tg(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new Ic(i),t.set(s,[a])):r>=o.length?(a=new Ic(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var No=class extends ti{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=_u,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Fo=class extends ti{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Ag=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Cg=`uniform sampler2D shadow_pass;
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
}`;function Rg(i,t,e){let n=new Rs,s=new Lt,r=new Lt,o=new ye,a=new No({depthPacking:yu}),l=new Fo,c={},h=e.maxTextureSize,u={[Qn]:Ve,[Ve]:Qn,[Ce]:Ce},f=new $e({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Lt},radius:{value:4}},vertexShader:Ag,fragmentShader:Cg}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let _=new Te;_.setAttribute("position",new he(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let g=new xe(_,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Oc;let p=this.type;this.render=function(T,P,R){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;let S=i.getRenderTarget(),v=i.getActiveCubeFace(),A=i.getActiveMipmapLevel(),L=i.state;L.setBlending(Jn),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let I=p!==Ln&&this.type===Ln,U=p===Ln&&this.type!==Ln;for(let z=0,H=T.length;z<H;z++){let Q=T[z],G=Q.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let rt=G.getFrameExtents();if(s.multiply(rt),r.copy(G.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/rt.x),s.x=r.x*rt.x,G.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/rt.y),s.y=r.y*rt.y,G.mapSize.y=r.y)),G.map===null||I===!0||U===!0){let Mt=this.type!==Ln?{minFilter:fn,magFilter:fn}:{};G.map!==null&&G.map.dispose(),G.map=new kn(s.x,s.y,Mt),G.map.texture.name=Q.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();let ht=G.getViewportCount();for(let Mt=0;Mt<ht;Mt++){let Ft=G.getViewport(Mt);o.set(r.x*Ft.x,r.y*Ft.y,r.x*Ft.z,r.y*Ft.w),L.viewport(o),G.updateMatrices(Q,Mt),n=G.getFrustum(),y(P,R,G.camera,Q,this.type)}G.isPointLightShadow!==!0&&this.type===Ln&&E(G,R),G.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(S,v,A)};function E(T,P){let R=t.update(g);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new kn(s.x,s.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(P,null,R,f,g,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(P,null,R,d,g,null)}function x(T,P,R,S){let v=null,A=R.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(A!==void 0)v=A;else if(v=R.isPointLight===!0?l:a,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0){let L=v.uuid,I=P.uuid,U=c[L];U===void 0&&(U={},c[L]=U);let z=U[I];z===void 0&&(z=v.clone(),U[I]=z,P.addEventListener("dispose",M)),v=z}if(v.visible=P.visible,v.wireframe=P.wireframe,S===Ln?v.side=P.shadowSide!==null?P.shadowSide:P.side:v.side=P.shadowSide!==null?P.shadowSide:u[P.side],v.alphaMap=P.alphaMap,v.alphaTest=P.alphaTest,v.map=P.map,v.clipShadows=P.clipShadows,v.clippingPlanes=P.clippingPlanes,v.clipIntersection=P.clipIntersection,v.displacementMap=P.displacementMap,v.displacementScale=P.displacementScale,v.displacementBias=P.displacementBias,v.wireframeLinewidth=P.wireframeLinewidth,v.linewidth=P.linewidth,R.isPointLight===!0&&v.isMeshDistanceMaterial===!0){let L=i.properties.get(v);L.light=R}return v}function y(T,P,R,S,v){if(T.visible===!1)return;if(T.layers.test(P.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&v===Ln)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,T.matrixWorld);let I=t.update(T),U=T.material;if(Array.isArray(U)){let z=I.groups;for(let H=0,Q=z.length;H<Q;H++){let G=z[H],rt=U[G.materialIndex];if(rt&&rt.visible){let ht=x(T,rt,S,v);T.onBeforeShadow(i,T,P,R,I,ht,G),i.renderBufferDirect(R,null,I,ht,T,G),T.onAfterShadow(i,T,P,R,I,ht,G)}}}else if(U.visible){let z=x(T,U,S,v);T.onBeforeShadow(i,T,P,R,I,z,null),i.renderBufferDirect(R,null,I,z,T,null),T.onAfterShadow(i,T,P,R,I,z,null)}}let L=T.children;for(let I=0,U=L.length;I<U;I++)y(L[I],P,R,S,v)}function M(T){T.target.removeEventListener("dispose",M);for(let R in c){let S=c[R],v=T.target.uuid;v in S&&(S[v].dispose(),delete S[v])}}}var Pg={[Ba]:za,[Ha]:Wa,[Va]:Xa,[qi]:Ga,[za]:Ba,[Wa]:Ha,[Xa]:Va,[Ga]:qi};function Ig(i,t){function e(){let D=!1,ct=new ye,q=null,J=new ye(0,0,0,0);return{setMask:function(gt){q!==gt&&!D&&(i.colorMask(gt,gt,gt,gt),q=gt)},setLocked:function(gt){D=gt},setClear:function(gt,ft,kt,_e,Pe){Pe===!0&&(gt*=_e,ft*=_e,kt*=_e),ct.set(gt,ft,kt,_e),J.equals(ct)===!1&&(i.clearColor(gt,ft,kt,_e),J.copy(ct))},reset:function(){D=!1,q=null,J.set(-1,0,0,0)}}}function n(){let D=!1,ct=!1,q=null,J=null,gt=null;return{setReversed:function(ft){if(ct!==ft){let kt=t.get("EXT_clip_control");ct?kt.clipControlEXT(kt.LOWER_LEFT_EXT,kt.ZERO_TO_ONE_EXT):kt.clipControlEXT(kt.LOWER_LEFT_EXT,kt.NEGATIVE_ONE_TO_ONE_EXT);let _e=gt;gt=null,this.setClear(_e)}ct=ft},getReversed:function(){return ct},setTest:function(ft){ft?ot(i.DEPTH_TEST):Rt(i.DEPTH_TEST)},setMask:function(ft){q!==ft&&!D&&(i.depthMask(ft),q=ft)},setFunc:function(ft){if(ct&&(ft=Pg[ft]),J!==ft){switch(ft){case Ba:i.depthFunc(i.NEVER);break;case za:i.depthFunc(i.ALWAYS);break;case Ha:i.depthFunc(i.LESS);break;case qi:i.depthFunc(i.LEQUAL);break;case Va:i.depthFunc(i.EQUAL);break;case Ga:i.depthFunc(i.GEQUAL);break;case Wa:i.depthFunc(i.GREATER);break;case Xa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}J=ft}},setLocked:function(ft){D=ft},setClear:function(ft){gt!==ft&&(ct&&(ft=1-ft),i.clearDepth(ft),gt=ft)},reset:function(){D=!1,q=null,J=null,gt=null,ct=!1}}}function s(){let D=!1,ct=null,q=null,J=null,gt=null,ft=null,kt=null,_e=null,Pe=null;return{setTest:function(re){D||(re?ot(i.STENCIL_TEST):Rt(i.STENCIL_TEST))},setMask:function(re){ct!==re&&!D&&(i.stencilMask(re),ct=re)},setFunc:function(re,sn,wn){(q!==re||J!==sn||gt!==wn)&&(i.stencilFunc(re,sn,wn),q=re,J=sn,gt=wn)},setOp:function(re,sn,wn){(ft!==re||kt!==sn||_e!==wn)&&(i.stencilOp(re,sn,wn),ft=re,kt=sn,_e=wn)},setLocked:function(re){D=re},setClear:function(re){Pe!==re&&(i.clearStencil(re),Pe=re)},reset:function(){D=!1,ct=null,q=null,J=null,gt=null,ft=null,kt=null,_e=null,Pe=null}}}let r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},f=new WeakMap,d=[],_=null,g=!1,m=null,p=null,E=null,x=null,y=null,M=null,T=null,P=new It(0,0,0),R=0,S=!1,v=null,A=null,L=null,I=null,U=null,z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,Q=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(G)[1]),H=Q>=1):G.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),H=Q>=2);let rt=null,ht={},Mt=i.getParameter(i.SCISSOR_BOX),Ft=i.getParameter(i.VIEWPORT),jt=new ye().fromArray(Mt),K=new ye().fromArray(Ft);function et(D,ct,q,J){let gt=new Uint8Array(4),ft=i.createTexture();i.bindTexture(D,ft),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let kt=0;kt<q;kt++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(ct,0,i.RGBA,1,1,J,0,i.RGBA,i.UNSIGNED_BYTE,gt):i.texImage2D(ct+kt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,gt);return ft}let vt={};vt[i.TEXTURE_2D]=et(i.TEXTURE_2D,i.TEXTURE_2D,1),vt[i.TEXTURE_CUBE_MAP]=et(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),vt[i.TEXTURE_2D_ARRAY]=et(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),vt[i.TEXTURE_3D]=et(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ot(i.DEPTH_TEST),o.setFunc(qi),Gt(!1),Wt(Ll),ot(i.CULL_FACE),F(Jn);function ot(D){h[D]!==!0&&(i.enable(D),h[D]=!0)}function Rt(D){h[D]!==!1&&(i.disable(D),h[D]=!1)}function Dt(D,ct){return u[D]!==ct?(i.bindFramebuffer(D,ct),u[D]=ct,D===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ct),D===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ct),!0):!1}function Ht(D,ct){let q=d,J=!1;if(D){q=f.get(ct),q===void 0&&(q=[],f.set(ct,q));let gt=D.textures;if(q.length!==gt.length||q[0]!==i.COLOR_ATTACHMENT0){for(let ft=0,kt=gt.length;ft<kt;ft++)q[ft]=i.COLOR_ATTACHMENT0+ft;q.length=gt.length,J=!0}}else q[0]!==i.BACK&&(q[0]=i.BACK,J=!0);J&&i.drawBuffers(q)}function le(D){return _!==D?(i.useProgram(D),_=D,!0):!1}let Yt={[ui]:i.FUNC_ADD,[Wh]:i.FUNC_SUBTRACT,[Xh]:i.FUNC_REVERSE_SUBTRACT};Yt[Yh]=i.MIN,Yt[qh]=i.MAX;let pe={[Zh]:i.ZERO,[Kh]:i.ONE,[$h]:i.SRC_COLOR,[Oa]:i.SRC_ALPHA,[nu]:i.SRC_ALPHA_SATURATE,[tu]:i.DST_COLOR,[jh]:i.DST_ALPHA,[Jh]:i.ONE_MINUS_SRC_COLOR,[ka]:i.ONE_MINUS_SRC_ALPHA,[eu]:i.ONE_MINUS_DST_COLOR,[Qh]:i.ONE_MINUS_DST_ALPHA,[iu]:i.CONSTANT_COLOR,[su]:i.ONE_MINUS_CONSTANT_COLOR,[ru]:i.CONSTANT_ALPHA,[au]:i.ONE_MINUS_CONSTANT_ALPHA};function F(D,ct,q,J,gt,ft,kt,_e,Pe,re){if(D===Jn){g===!0&&(Rt(i.BLEND),g=!1);return}if(g===!1&&(ot(i.BLEND),g=!0),D!==Gh){if(D!==m||re!==S){if((p!==ui||y!==ui)&&(i.blendEquation(i.FUNC_ADD),p=ui,y=ui),re)switch(D){case Gi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dl:i.blendFunc(i.ONE,i.ONE);break;case Ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Nl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Gi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dl:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Nl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}E=null,x=null,M=null,T=null,P.set(0,0,0),R=0,m=D,S=re}return}gt=gt||ct,ft=ft||q,kt=kt||J,(ct!==p||gt!==y)&&(i.blendEquationSeparate(Yt[ct],Yt[gt]),p=ct,y=gt),(q!==E||J!==x||ft!==M||kt!==T)&&(i.blendFuncSeparate(pe[q],pe[J],pe[ft],pe[kt]),E=q,x=J,M=ft,T=kt),(_e.equals(P)===!1||Pe!==R)&&(i.blendColor(_e.r,_e.g,_e.b,Pe),P.copy(_e),R=Pe),m=D,S=!1}function Re(D,ct){D.side===Ce?Rt(i.CULL_FACE):ot(i.CULL_FACE);let q=D.side===Ve;ct&&(q=!q),Gt(q),D.blending===Gi&&D.transparent===!1?F(Jn):F(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),r.setMask(D.colorWrite);let J=D.stencilWrite;a.setTest(J),J&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),se(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ot(i.SAMPLE_ALPHA_TO_COVERAGE):Rt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Gt(D){v!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),v=D)}function Wt(D){D!==zh?(ot(i.CULL_FACE),D!==A&&(D===Ll?i.cullFace(i.BACK):D===Hh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Rt(i.CULL_FACE),A=D}function Ct(D){D!==L&&(H&&i.lineWidth(D),L=D)}function se(D,ct,q){D?(ot(i.POLYGON_OFFSET_FILL),(I!==ct||U!==q)&&(i.polygonOffset(ct,q),I=ct,U=q)):Rt(i.POLYGON_OFFSET_FILL)}function At(D){D?ot(i.SCISSOR_TEST):Rt(i.SCISSOR_TEST)}function C(D){D===void 0&&(D=i.TEXTURE0+z-1),rt!==D&&(i.activeTexture(D),rt=D)}function b(D,ct,q){q===void 0&&(rt===null?q=i.TEXTURE0+z-1:q=rt);let J=ht[q];J===void 0&&(J={type:void 0,texture:void 0},ht[q]=J),(J.type!==D||J.texture!==ct)&&(rt!==q&&(i.activeTexture(q),rt=q),i.bindTexture(D,ct||vt[D]),J.type=D,J.texture=ct)}function B(){let D=ht[rt];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function Z(){try{i.compressedTexImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function tt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function X(){try{i.texSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function mt(){try{i.texSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function it(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function dt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function qt(){try{i.texStorage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function nt(){try{i.texStorage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function _t(){try{i.texImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Pt(){try{i.texImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function bt(D){jt.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),jt.copy(D))}function xt(D){K.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),K.copy(D))}function Xt(D,ct){let q=c.get(ct);q===void 0&&(q=new WeakMap,c.set(ct,q));let J=q.get(D);J===void 0&&(J=i.getUniformBlockIndex(ct,D.name),q.set(D,J))}function Ot(D,ct){let J=c.get(ct).get(D);l.get(ct)!==J&&(i.uniformBlockBinding(ct,J,D.__bindingPointIndex),l.set(ct,J))}function Zt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},rt=null,ht={},u={},f=new WeakMap,d=[],_=null,g=!1,m=null,p=null,E=null,x=null,y=null,M=null,T=null,P=new It(0,0,0),R=0,S=!1,v=null,A=null,L=null,I=null,U=null,jt.set(0,0,i.canvas.width,i.canvas.height),K.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ot,disable:Rt,bindFramebuffer:Dt,drawBuffers:Ht,useProgram:le,setBlending:F,setMaterial:Re,setFlipSided:Gt,setCullFace:Wt,setLineWidth:Ct,setPolygonOffset:se,setScissorTest:At,activeTexture:C,bindTexture:b,unbindTexture:B,compressedTexImage2D:Z,compressedTexImage3D:tt,texImage2D:_t,texImage3D:Pt,updateUBOMapping:Xt,uniformBlockBinding:Ot,texStorage2D:qt,texStorage3D:nt,texSubImage2D:X,texSubImage3D:mt,compressedTexSubImage2D:it,compressedTexSubImage3D:dt,scissor:bt,viewport:xt,reset:Zt}}function Lc(i,t,e,n){let s=Lg(n);switch(e){case Vc:return i*t;case Wc:return i*t;case Xc:return i*t*2;case Yc:return i*t/s.components*s.byteLength;case sl:return i*t/s.components*s.byteLength;case qc:return i*t*2/s.components*s.byteLength;case rl:return i*t*2/s.components*s.byteLength;case Gc:return i*t*3/s.components*s.byteLength;case dn:return i*t*4/s.components*s.byteLength;case al:return i*t*4/s.components*s.byteLength;case fr:case pr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case mr:case gr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ja:case Qa:return Math.max(i,16)*Math.max(t,8)/4;case $a:case ja:return Math.max(i,8)*Math.max(t,8)/2;case to:case eo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case no:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case io:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case so:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ro:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ao:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case oo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case lo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case co:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ho:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case uo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case fo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case po:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case mo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case go:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case _o:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case _r:case yo:case xo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Zc:case vo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Mo:case bo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Lg(i){switch(i){case Fn:case Bc:return{byteLength:1,components:1};case Ts:case zc:case Us:return{byteLength:2,components:1};case nl:case il:return{byteLength:2,components:4};case gi:case el:case Dn:return{byteLength:4,components:1};case Hc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Dg(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Lt,h=new WeakMap,u,f=new WeakMap,d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,b){return d?new OffscreenCanvas(C,b):vr("canvas")}function g(C,b,B){let Z=1,tt=At(C);if((tt.width>B||tt.height>B)&&(Z=B/Math.max(tt.width,tt.height)),Z<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let X=Math.floor(Z*tt.width),mt=Math.floor(Z*tt.height);u===void 0&&(u=_(X,mt));let it=b?_(X,mt):u;return it.width=X,it.height=mt,it.getContext("2d").drawImage(C,0,0,X,mt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+X+"x"+mt+")."),it}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),C;return C}function m(C){return C.generateMipmaps}function p(C){i.generateMipmap(C)}function E(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function x(C,b,B,Z,tt=!1){if(C!==null){if(i[C]!==void 0)return i[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let X=b;if(b===i.RED&&(B===i.FLOAT&&(X=i.R32F),B===i.HALF_FLOAT&&(X=i.R16F),B===i.UNSIGNED_BYTE&&(X=i.R8)),b===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(X=i.R8UI),B===i.UNSIGNED_SHORT&&(X=i.R16UI),B===i.UNSIGNED_INT&&(X=i.R32UI),B===i.BYTE&&(X=i.R8I),B===i.SHORT&&(X=i.R16I),B===i.INT&&(X=i.R32I)),b===i.RG&&(B===i.FLOAT&&(X=i.RG32F),B===i.HALF_FLOAT&&(X=i.RG16F),B===i.UNSIGNED_BYTE&&(X=i.RG8)),b===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(X=i.RG8UI),B===i.UNSIGNED_SHORT&&(X=i.RG16UI),B===i.UNSIGNED_INT&&(X=i.RG32UI),B===i.BYTE&&(X=i.RG8I),B===i.SHORT&&(X=i.RG16I),B===i.INT&&(X=i.RG32I)),b===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(X=i.RGB8UI),B===i.UNSIGNED_SHORT&&(X=i.RGB16UI),B===i.UNSIGNED_INT&&(X=i.RGB32UI),B===i.BYTE&&(X=i.RGB8I),B===i.SHORT&&(X=i.RGB16I),B===i.INT&&(X=i.RGB32I)),b===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),B===i.UNSIGNED_INT&&(X=i.RGBA32UI),B===i.BYTE&&(X=i.RGBA8I),B===i.SHORT&&(X=i.RGBA16I),B===i.INT&&(X=i.RGBA32I)),b===i.RGB&&B===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),b===i.RGBA){let mt=tt?Hr:Kt.getTransfer(Z);B===i.FLOAT&&(X=i.RGBA32F),B===i.HALF_FLOAT&&(X=i.RGBA16F),B===i.UNSIGNED_BYTE&&(X=mt===ae?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&t.get("EXT_color_buffer_float"),X}function y(C,b){let B;return C?b===null||b===gi||b===$i?B=i.DEPTH24_STENCIL8:b===Dn?B=i.DEPTH32F_STENCIL8:b===Ts&&(B=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===gi||b===$i?B=i.DEPTH_COMPONENT24:b===Dn?B=i.DEPTH_COMPONENT32F:b===Ts&&(B=i.DEPTH_COMPONENT16),B}function M(C,b){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==fn&&C.minFilter!==vn?Math.log2(Math.max(b.width,b.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?b.mipmaps.length:1}function T(C){let b=C.target;b.removeEventListener("dispose",T),R(b),b.isVideoTexture&&h.delete(b)}function P(C){let b=C.target;b.removeEventListener("dispose",P),v(b)}function R(C){let b=n.get(C);if(b.__webglInit===void 0)return;let B=C.source,Z=f.get(B);if(Z){let tt=Z[b.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&S(C),Object.keys(Z).length===0&&f.delete(B)}n.remove(C)}function S(C){let b=n.get(C);i.deleteTexture(b.__webglTexture);let B=C.source,Z=f.get(B);delete Z[b.__cacheKey],o.memory.textures--}function v(C){let b=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(b.__webglFramebuffer[Z]))for(let tt=0;tt<b.__webglFramebuffer[Z].length;tt++)i.deleteFramebuffer(b.__webglFramebuffer[Z][tt]);else i.deleteFramebuffer(b.__webglFramebuffer[Z]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[Z])}else{if(Array.isArray(b.__webglFramebuffer))for(let Z=0;Z<b.__webglFramebuffer.length;Z++)i.deleteFramebuffer(b.__webglFramebuffer[Z]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let Z=0;Z<b.__webglColorRenderbuffer.length;Z++)b.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[Z]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let B=C.textures;for(let Z=0,tt=B.length;Z<tt;Z++){let X=n.get(B[Z]);X.__webglTexture&&(i.deleteTexture(X.__webglTexture),o.memory.textures--),n.remove(B[Z])}n.remove(C)}let A=0;function L(){A=0}function I(){let C=A;return C>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),A+=1,C}function U(C){let b=[];return b.push(C.wrapS),b.push(C.wrapT),b.push(C.wrapR||0),b.push(C.magFilter),b.push(C.minFilter),b.push(C.anisotropy),b.push(C.internalFormat),b.push(C.format),b.push(C.type),b.push(C.generateMipmaps),b.push(C.premultiplyAlpha),b.push(C.flipY),b.push(C.unpackAlignment),b.push(C.colorSpace),b.join()}function z(C,b){let B=n.get(C);if(C.isVideoTexture&&Ct(C),C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){let Z=C.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(B,C,b);return}}e.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+b)}function H(C,b){let B=n.get(C);if(C.version>0&&B.__version!==C.version){K(B,C,b);return}e.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+b)}function Q(C,b){let B=n.get(C);if(C.version>0&&B.__version!==C.version){K(B,C,b);return}e.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+b)}function G(C,b){let B=n.get(C);if(C.version>0&&B.__version!==C.version){et(B,C,b);return}e.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+b)}let rt={[Za]:i.REPEAT,[pi]:i.CLAMP_TO_EDGE,[Ka]:i.MIRRORED_REPEAT},ht={[fn]:i.NEAREST,[gu]:i.NEAREST_MIPMAP_NEAREST,[Gs]:i.NEAREST_MIPMAP_LINEAR,[vn]:i.LINEAR,[la]:i.LINEAR_MIPMAP_NEAREST,[mi]:i.LINEAR_MIPMAP_LINEAR},Mt={[vu]:i.NEVER,[Tu]:i.ALWAYS,[Mu]:i.LESS,[$c]:i.LEQUAL,[bu]:i.EQUAL,[wu]:i.GEQUAL,[Su]:i.GREATER,[Eu]:i.NOTEQUAL};function Ft(C,b){if(b.type===Dn&&t.has("OES_texture_float_linear")===!1&&(b.magFilter===vn||b.magFilter===la||b.magFilter===Gs||b.magFilter===mi||b.minFilter===vn||b.minFilter===la||b.minFilter===Gs||b.minFilter===mi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,rt[b.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,rt[b.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,rt[b.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,ht[b.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,ht[b.minFilter]),b.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,Mt[b.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===fn||b.minFilter!==Gs&&b.minFilter!==mi||b.type===Dn&&t.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function jt(C,b){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,b.addEventListener("dispose",T));let Z=b.source,tt=f.get(Z);tt===void 0&&(tt={},f.set(Z,tt));let X=U(b);if(X!==C.__cacheKey){tt[X]===void 0&&(tt[X]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,B=!0),tt[X].usedTimes++;let mt=tt[C.__cacheKey];mt!==void 0&&(tt[C.__cacheKey].usedTimes--,mt.usedTimes===0&&S(b)),C.__cacheKey=X,C.__webglTexture=tt[X].texture}return B}function K(C,b,B){let Z=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(Z=i.TEXTURE_3D);let tt=jt(C,b),X=b.source;e.bindTexture(Z,C.__webglTexture,i.TEXTURE0+B);let mt=n.get(X);if(X.version!==mt.__version||tt===!0){e.activeTexture(i.TEXTURE0+B);let it=Kt.getPrimaries(Kt.workingColorSpace),dt=b.colorSpace===Kn?null:Kt.getPrimaries(b.colorSpace),qt=b.colorSpace===Kn||it===dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,qt);let nt=g(b.image,!1,s.maxTextureSize);nt=se(b,nt);let _t=r.convert(b.format,b.colorSpace),Pt=r.convert(b.type),bt=x(b.internalFormat,_t,Pt,b.colorSpace,b.isVideoTexture);Ft(Z,b);let xt,Xt=b.mipmaps,Ot=b.isVideoTexture!==!0,Zt=mt.__version===void 0||tt===!0,D=X.dataReady,ct=M(b,nt);if(b.isDepthTexture)bt=y(b.format===Ji,b.type),Zt&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,bt,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,bt,nt.width,nt.height,0,_t,Pt,null));else if(b.isDataTexture)if(Xt.length>0){Ot&&Zt&&e.texStorage2D(i.TEXTURE_2D,ct,bt,Xt[0].width,Xt[0].height);for(let q=0,J=Xt.length;q<J;q++)xt=Xt[q],Ot?D&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,xt.width,xt.height,_t,Pt,xt.data):e.texImage2D(i.TEXTURE_2D,q,bt,xt.width,xt.height,0,_t,Pt,xt.data);b.generateMipmaps=!1}else Ot?(Zt&&e.texStorage2D(i.TEXTURE_2D,ct,bt,nt.width,nt.height),D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,nt.width,nt.height,_t,Pt,nt.data)):e.texImage2D(i.TEXTURE_2D,0,bt,nt.width,nt.height,0,_t,Pt,nt.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){Ot&&Zt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ct,bt,Xt[0].width,Xt[0].height,nt.depth);for(let q=0,J=Xt.length;q<J;q++)if(xt=Xt[q],b.format!==dn)if(_t!==null)if(Ot){if(D)if(b.layerUpdates.size>0){let gt=Lc(xt.width,xt.height,b.format,b.type);for(let ft of b.layerUpdates){let kt=xt.data.subarray(ft*gt/xt.data.BYTES_PER_ELEMENT,(ft+1)*gt/xt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,ft,xt.width,xt.height,1,_t,kt)}b.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,xt.width,xt.height,nt.depth,_t,xt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,q,bt,xt.width,xt.height,nt.depth,0,xt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?D&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,xt.width,xt.height,nt.depth,_t,Pt,xt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,q,bt,xt.width,xt.height,nt.depth,0,_t,Pt,xt.data)}else{Ot&&Zt&&e.texStorage2D(i.TEXTURE_2D,ct,bt,Xt[0].width,Xt[0].height);for(let q=0,J=Xt.length;q<J;q++)xt=Xt[q],b.format!==dn?_t!==null?Ot?D&&e.compressedTexSubImage2D(i.TEXTURE_2D,q,0,0,xt.width,xt.height,_t,xt.data):e.compressedTexImage2D(i.TEXTURE_2D,q,bt,xt.width,xt.height,0,xt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?D&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,xt.width,xt.height,_t,Pt,xt.data):e.texImage2D(i.TEXTURE_2D,q,bt,xt.width,xt.height,0,_t,Pt,xt.data)}else if(b.isDataArrayTexture)if(Ot){if(Zt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ct,bt,nt.width,nt.height,nt.depth),D)if(b.layerUpdates.size>0){let q=Lc(nt.width,nt.height,b.format,b.type);for(let J of b.layerUpdates){let gt=nt.data.subarray(J*q/nt.data.BYTES_PER_ELEMENT,(J+1)*q/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,nt.width,nt.height,1,_t,Pt,gt)}b.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,_t,Pt,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,bt,nt.width,nt.height,nt.depth,0,_t,Pt,nt.data);else if(b.isData3DTexture)Ot?(Zt&&e.texStorage3D(i.TEXTURE_3D,ct,bt,nt.width,nt.height,nt.depth),D&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,_t,Pt,nt.data)):e.texImage3D(i.TEXTURE_3D,0,bt,nt.width,nt.height,nt.depth,0,_t,Pt,nt.data);else if(b.isFramebufferTexture){if(Zt)if(Ot)e.texStorage2D(i.TEXTURE_2D,ct,bt,nt.width,nt.height);else{let q=nt.width,J=nt.height;for(let gt=0;gt<ct;gt++)e.texImage2D(i.TEXTURE_2D,gt,bt,q,J,0,_t,Pt,null),q>>=1,J>>=1}}else if(Xt.length>0){if(Ot&&Zt){let q=At(Xt[0]);e.texStorage2D(i.TEXTURE_2D,ct,bt,q.width,q.height)}for(let q=0,J=Xt.length;q<J;q++)xt=Xt[q],Ot?D&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,_t,Pt,xt):e.texImage2D(i.TEXTURE_2D,q,bt,_t,Pt,xt);b.generateMipmaps=!1}else if(Ot){if(Zt){let q=At(nt);e.texStorage2D(i.TEXTURE_2D,ct,bt,q.width,q.height)}D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,_t,Pt,nt)}else e.texImage2D(i.TEXTURE_2D,0,bt,_t,Pt,nt);m(b)&&p(Z),mt.__version=X.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function et(C,b,B){if(b.image.length!==6)return;let Z=jt(C,b),tt=b.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+B);let X=n.get(tt);if(tt.version!==X.__version||Z===!0){e.activeTexture(i.TEXTURE0+B);let mt=Kt.getPrimaries(Kt.workingColorSpace),it=b.colorSpace===Kn?null:Kt.getPrimaries(b.colorSpace),dt=b.colorSpace===Kn||mt===it?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,dt);let qt=b.isCompressedTexture||b.image[0].isCompressedTexture,nt=b.image[0]&&b.image[0].isDataTexture,_t=[];for(let J=0;J<6;J++)!qt&&!nt?_t[J]=g(b.image[J],!0,s.maxCubemapSize):_t[J]=nt?b.image[J].image:b.image[J],_t[J]=se(b,_t[J]);let Pt=_t[0],bt=r.convert(b.format,b.colorSpace),xt=r.convert(b.type),Xt=x(b.internalFormat,bt,xt,b.colorSpace),Ot=b.isVideoTexture!==!0,Zt=X.__version===void 0||Z===!0,D=tt.dataReady,ct=M(b,Pt);Ft(i.TEXTURE_CUBE_MAP,b);let q;if(qt){Ot&&Zt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Xt,Pt.width,Pt.height);for(let J=0;J<6;J++){q=_t[J].mipmaps;for(let gt=0;gt<q.length;gt++){let ft=q[gt];b.format!==dn?bt!==null?Ot?D&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt,0,0,ft.width,ft.height,bt,ft.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt,Xt,ft.width,ft.height,0,ft.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt,0,0,ft.width,ft.height,bt,xt,ft.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt,Xt,ft.width,ft.height,0,bt,xt,ft.data)}}}else{if(q=b.mipmaps,Ot&&Zt){q.length>0&&ct++;let J=At(_t[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Xt,J.width,J.height)}for(let J=0;J<6;J++)if(nt){Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,_t[J].width,_t[J].height,bt,xt,_t[J].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Xt,_t[J].width,_t[J].height,0,bt,xt,_t[J].data);for(let gt=0;gt<q.length;gt++){let kt=q[gt].image[J].image;Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt+1,0,0,kt.width,kt.height,bt,xt,kt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt+1,Xt,kt.width,kt.height,0,bt,xt,kt.data)}}else{Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,bt,xt,_t[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Xt,bt,xt,_t[J]);for(let gt=0;gt<q.length;gt++){let ft=q[gt];Ot?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt+1,0,0,bt,xt,ft.image[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,gt+1,Xt,bt,xt,ft.image[J])}}}m(b)&&p(i.TEXTURE_CUBE_MAP),X.__version=tt.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function vt(C,b,B,Z,tt,X){let mt=r.convert(B.format,B.colorSpace),it=r.convert(B.type),dt=x(B.internalFormat,mt,it,B.colorSpace),qt=n.get(b),nt=n.get(B);if(nt.__renderTarget=b,!qt.__hasExternalTextures){let _t=Math.max(1,b.width>>X),Pt=Math.max(1,b.height>>X);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,X,dt,_t,Pt,b.depth,0,mt,it,null):e.texImage2D(tt,X,dt,_t,Pt,0,mt,it,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),Wt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,tt,nt.__webglTexture,0,Gt(b)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,tt,nt.__webglTexture,X),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ot(C,b,B){if(i.bindRenderbuffer(i.RENDERBUFFER,C),b.depthBuffer){let Z=b.depthTexture,tt=Z&&Z.isDepthTexture?Z.type:null,X=y(b.stencilBuffer,tt),mt=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,it=Gt(b);Wt(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,X,b.width,b.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,it,X,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,X,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,mt,i.RENDERBUFFER,C)}else{let Z=b.textures;for(let tt=0;tt<Z.length;tt++){let X=Z[tt],mt=r.convert(X.format,X.colorSpace),it=r.convert(X.type),dt=x(X.internalFormat,mt,it,X.colorSpace),qt=Gt(b);B&&Wt(b)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,qt,dt,b.width,b.height):Wt(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,qt,dt,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,dt,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Rt(C,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=n.get(b.depthTexture);Z.__renderTarget=b,(!Z.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),z(b.depthTexture,0);let tt=Z.__webglTexture,X=Gt(b);if(b.depthTexture.format===Wi)Wt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,tt,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,tt,0);else if(b.depthTexture.format===Ji)Wt(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,tt,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,tt,0);else throw new Error("Unknown depthTexture format")}function Dt(C){let b=n.get(C),B=C.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==C.depthTexture){let Z=C.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),Z){let tt=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,Z.removeEventListener("dispose",tt)};Z.addEventListener("dispose",tt),b.__depthDisposeCallback=tt}b.__boundDepthTexture=Z}if(C.depthTexture&&!b.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");Rt(b.__webglFramebuffer,C)}else if(B){b.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[Z]),b.__webglDepthbuffer[Z]===void 0)b.__webglDepthbuffer[Z]=i.createRenderbuffer(),ot(b.__webglDepthbuffer[Z],C,!1);else{let tt=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=b.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,X)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),ot(b.__webglDepthbuffer,C,!1);else{let Z=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,tt=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,tt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,tt)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ht(C,b,B){let Z=n.get(C);b!==void 0&&vt(Z.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&Dt(C)}function le(C){let b=C.texture,B=n.get(C),Z=n.get(b);C.addEventListener("dispose",P);let tt=C.textures,X=C.isWebGLCubeRenderTarget===!0,mt=tt.length>1;if(mt||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=b.version,o.memory.textures++),X){B.__webglFramebuffer=[];for(let it=0;it<6;it++)if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer[it]=[];for(let dt=0;dt<b.mipmaps.length;dt++)B.__webglFramebuffer[it][dt]=i.createFramebuffer()}else B.__webglFramebuffer[it]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer=[];for(let it=0;it<b.mipmaps.length;it++)B.__webglFramebuffer[it]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(mt)for(let it=0,dt=tt.length;it<dt;it++){let qt=n.get(tt[it]);qt.__webglTexture===void 0&&(qt.__webglTexture=i.createTexture(),o.memory.textures++)}if(C.samples>0&&Wt(C)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let it=0;it<tt.length;it++){let dt=tt[it];B.__webglColorRenderbuffer[it]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[it]);let qt=r.convert(dt.format,dt.colorSpace),nt=r.convert(dt.type),_t=x(dt.internalFormat,qt,nt,dt.colorSpace,C.isXRRenderTarget===!0),Pt=Gt(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,Pt,_t,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+it,i.RENDERBUFFER,B.__webglColorRenderbuffer[it])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),ot(B.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(X){e.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),Ft(i.TEXTURE_CUBE_MAP,b);for(let it=0;it<6;it++)if(b.mipmaps&&b.mipmaps.length>0)for(let dt=0;dt<b.mipmaps.length;dt++)vt(B.__webglFramebuffer[it][dt],C,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,dt);else vt(B.__webglFramebuffer[it],C,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,0);m(b)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(mt){for(let it=0,dt=tt.length;it<dt;it++){let qt=tt[it],nt=n.get(qt);e.bindTexture(i.TEXTURE_2D,nt.__webglTexture),Ft(i.TEXTURE_2D,qt),vt(B.__webglFramebuffer,C,qt,i.COLOR_ATTACHMENT0+it,i.TEXTURE_2D,0),m(qt)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let it=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(it=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(it,Z.__webglTexture),Ft(it,b),b.mipmaps&&b.mipmaps.length>0)for(let dt=0;dt<b.mipmaps.length;dt++)vt(B.__webglFramebuffer[dt],C,b,i.COLOR_ATTACHMENT0,it,dt);else vt(B.__webglFramebuffer,C,b,i.COLOR_ATTACHMENT0,it,0);m(b)&&p(it),e.unbindTexture()}C.depthBuffer&&Dt(C)}function Yt(C){let b=C.textures;for(let B=0,Z=b.length;B<Z;B++){let tt=b[B];if(m(tt)){let X=E(C),mt=n.get(tt).__webglTexture;e.bindTexture(X,mt),p(X),e.unbindTexture()}}}let pe=[],F=[];function Re(C){if(C.samples>0){if(Wt(C)===!1){let b=C.textures,B=C.width,Z=C.height,tt=i.COLOR_BUFFER_BIT,X=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,mt=n.get(C),it=b.length>1;if(it)for(let dt=0;dt<b.length;dt++)e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,mt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,mt.__webglFramebuffer);for(let dt=0;dt<b.length;dt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),it){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,mt.__webglColorRenderbuffer[dt]);let qt=n.get(b[dt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,qt,0)}i.blitFramebuffer(0,0,B,Z,0,0,B,Z,tt,i.NEAREST),l===!0&&(pe.length=0,F.length=0,pe.push(i.COLOR_ATTACHMENT0+dt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(pe.push(X),F.push(X),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,F)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,pe))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),it)for(let dt=0;dt<b.length;dt++){e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,mt.__webglColorRenderbuffer[dt]);let qt=n.get(b[dt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,mt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,qt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,mt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let b=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function Gt(C){return Math.min(s.maxSamples,C.samples)}function Wt(C){let b=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Ct(C){let b=o.render.frame;h.get(C)!==b&&(h.set(C,b),C.update())}function se(C,b){let B=C.colorSpace,Z=C.format,tt=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==ss&&B!==Kn&&(Kt.getTransfer(B)===ae?(Z!==dn||tt!==Fn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),b}function At(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=I,this.resetTextureUnits=L,this.setTexture2D=z,this.setTexture2DArray=H,this.setTexture3D=Q,this.setTextureCube=G,this.rebindTextures=Ht,this.setupRenderTarget=le,this.updateRenderTargetMipmap=Yt,this.updateMultisampleRenderTarget=Re,this.setupDepthRenderbuffer=Dt,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=Wt}function Ug(i,t){function e(n,s=Kn){let r,o=Kt.getTransfer(s);if(n===Fn)return i.UNSIGNED_BYTE;if(n===nl)return i.UNSIGNED_SHORT_4_4_4_4;if(n===il)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Hc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Bc)return i.BYTE;if(n===zc)return i.SHORT;if(n===Ts)return i.UNSIGNED_SHORT;if(n===el)return i.INT;if(n===gi)return i.UNSIGNED_INT;if(n===Dn)return i.FLOAT;if(n===Us)return i.HALF_FLOAT;if(n===Vc)return i.ALPHA;if(n===Gc)return i.RGB;if(n===dn)return i.RGBA;if(n===Wc)return i.LUMINANCE;if(n===Xc)return i.LUMINANCE_ALPHA;if(n===Wi)return i.DEPTH_COMPONENT;if(n===Ji)return i.DEPTH_STENCIL;if(n===Yc)return i.RED;if(n===sl)return i.RED_INTEGER;if(n===qc)return i.RG;if(n===rl)return i.RG_INTEGER;if(n===al)return i.RGBA_INTEGER;if(n===fr||n===pr||n===mr||n===gr)if(o===ae)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===fr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===fr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===gr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===$a||n===Ja||n===ja||n===Qa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===$a)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ja)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ja)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Qa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===to||n===eo||n===no)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===to||n===eo)return o===ae?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===no)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===_o)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===io)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===so)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ro)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ao)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===oo)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===lo)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===co)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ho)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===uo)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===fo)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===po)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===mo)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===go)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===_o)return o===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===_r||n===yo||n===xo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===_r)return o===ae?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===yo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===xo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Zc||n===vo||n===Mo||n===bo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===_r)return r.COMPRESSED_RED_RGTC1_EXT;if(n===vo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Mo)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===bo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===$i?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Oo=class extends Oe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},$n=class extends ke{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ng={type:"move"},ws=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $n,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $n,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $n,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let g of t.hand.values()){let m=e.getJointPose(g,n),p=this._getHandJoint(c,g);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,_=.005;c.inputState.pinching&&f>d+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ng)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new $n;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Fg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Og=`
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

}`,ko=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Ke,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new $e({vertexShader:Fg,fragmentShader:Og,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new xe(new es(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Bo=class extends On{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,_=null,g=new ko,m=e.getContextAttributes(),p=null,E=null,x=[],y=[],M=new Lt,T=null,P=new Oe;P.viewport=new ye;let R=new Oe;R.viewport=new ye;let S=[P,R],v=new Oo,A=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let et=x[K];return et===void 0&&(et=new ws,x[K]=et),et.getTargetRaySpace()},this.getControllerGrip=function(K){let et=x[K];return et===void 0&&(et=new ws,x[K]=et),et.getGripSpace()},this.getHand=function(K){let et=x[K];return et===void 0&&(et=new ws,x[K]=et),et.getHandSpace()};function I(K){let et=y.indexOf(K.inputSource);if(et===-1)return;let vt=x[et];vt!==void 0&&(vt.update(K.inputSource,K.frame,c||o),vt.dispatchEvent({type:K.type,data:K.inputSource}))}function U(){s.removeEventListener("select",I),s.removeEventListener("selectstart",I),s.removeEventListener("selectend",I),s.removeEventListener("squeeze",I),s.removeEventListener("squeezestart",I),s.removeEventListener("squeezeend",I),s.removeEventListener("end",U),s.removeEventListener("inputsourceschange",z);for(let K=0;K<x.length;K++){let et=y[K];et!==null&&(y[K]=null,x[K].disconnect(et))}A=null,L=null,g.reset(),t.setRenderTarget(p),d=null,f=null,u=null,s=null,E=null,jt.stop(),n.isPresenting=!1,t.setPixelRatio(T),t.setSize(M.width,M.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",I),s.addEventListener("selectstart",I),s.addEventListener("selectend",I),s.addEventListener("squeeze",I),s.addEventListener("squeezestart",I),s.addEventListener("squeezeend",I),s.addEventListener("end",U),s.addEventListener("inputsourceschange",z),m.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(M),s.renderState.layers===void 0){let et={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,et),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),E=new kn(d.framebufferWidth,d.framebufferHeight,{format:dn,type:Fn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let et=null,vt=null,ot=null;m.depth&&(ot=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=m.stencil?Ji:Wi,vt=m.stencil?$i:gi);let Rt={colorFormat:e.RGBA8,depthFormat:ot,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(Rt),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),E=new kn(f.textureWidth,f.textureHeight,{format:dn,type:Fn,depthTexture:new Rr(f.textureWidth,f.textureHeight,vt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}E.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),jt.setContext(s),jt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function z(K){for(let et=0;et<K.removed.length;et++){let vt=K.removed[et],ot=y.indexOf(vt);ot>=0&&(y[ot]=null,x[ot].disconnect(vt))}for(let et=0;et<K.added.length;et++){let vt=K.added[et],ot=y.indexOf(vt);if(ot===-1){for(let Dt=0;Dt<x.length;Dt++)if(Dt>=y.length){y.push(vt),ot=Dt;break}else if(y[Dt]===null){y[Dt]=vt,ot=Dt;break}if(ot===-1)break}let Rt=x[ot];Rt&&Rt.connect(vt)}}let H=new k,Q=new k;function G(K,et,vt){H.setFromMatrixPosition(et.matrixWorld),Q.setFromMatrixPosition(vt.matrixWorld);let ot=H.distanceTo(Q),Rt=et.projectionMatrix.elements,Dt=vt.projectionMatrix.elements,Ht=Rt[14]/(Rt[10]-1),le=Rt[14]/(Rt[10]+1),Yt=(Rt[9]+1)/Rt[5],pe=(Rt[9]-1)/Rt[5],F=(Rt[8]-1)/Rt[0],Re=(Dt[8]+1)/Dt[0],Gt=Ht*F,Wt=Ht*Re,Ct=ot/(-F+Re),se=Ct*-F;if(et.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(se),K.translateZ(Ct),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),Rt[10]===-1)K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{let At=Ht+Ct,C=le+Ct,b=Gt-se,B=Wt+(ot-se),Z=Yt*le/C*At,tt=pe*le/C*At;K.projectionMatrix.makePerspective(b,B,Z,tt,At,C),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function rt(K,et){et===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(et.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let et=K.near,vt=K.far;g.texture!==null&&(g.depthNear>0&&(et=g.depthNear),g.depthFar>0&&(vt=g.depthFar)),v.near=R.near=P.near=et,v.far=R.far=P.far=vt,(A!==v.near||L!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),A=v.near,L=v.far),P.layers.mask=K.layers.mask|2,R.layers.mask=K.layers.mask|4,v.layers.mask=P.layers.mask|R.layers.mask;let ot=K.parent,Rt=v.cameras;rt(v,ot);for(let Dt=0;Dt<Rt.length;Dt++)rt(Rt[Dt],ot);Rt.length===2?G(v,P,R):v.projectionMatrix.copy(P.projectionMatrix),ht(K,v,ot)};function ht(K,et,vt){vt===null?K.matrix.copy(et.matrixWorld):(K.matrix.copy(vt.matrixWorld),K.matrix.invert(),K.matrix.multiply(et.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=As*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(K){l=K,f!==null&&(f.fixedFoveation=K),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=K)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(v)};let Mt=null;function Ft(K,et){if(h=et.getViewerPose(c||o),_=et,h!==null){let vt=h.views;d!==null&&(t.setRenderTargetFramebuffer(E,d.framebuffer),t.setRenderTarget(E));let ot=!1;vt.length!==v.cameras.length&&(v.cameras.length=0,ot=!0);for(let Dt=0;Dt<vt.length;Dt++){let Ht=vt[Dt],le=null;if(d!==null)le=d.getViewport(Ht);else{let pe=u.getViewSubImage(f,Ht);le=pe.viewport,Dt===0&&(t.setRenderTargetTextures(E,pe.colorTexture,f.ignoreDepthValues?void 0:pe.depthStencilTexture),t.setRenderTarget(E))}let Yt=S[Dt];Yt===void 0&&(Yt=new Oe,Yt.layers.enable(Dt),Yt.viewport=new ye,S[Dt]=Yt),Yt.matrix.fromArray(Ht.transform.matrix),Yt.matrix.decompose(Yt.position,Yt.quaternion,Yt.scale),Yt.projectionMatrix.fromArray(Ht.projectionMatrix),Yt.projectionMatrixInverse.copy(Yt.projectionMatrix).invert(),Yt.viewport.set(le.x,le.y,le.width,le.height),Dt===0&&(v.matrix.copy(Yt.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),ot===!0&&v.cameras.push(Yt)}let Rt=s.enabledFeatures;if(Rt&&Rt.includes("depth-sensing")){let Dt=u.getDepthInformation(vt[0]);Dt&&Dt.isValid&&Dt.texture&&g.init(t,Dt,s.renderState)}}for(let vt=0;vt<x.length;vt++){let ot=y[vt],Rt=x[vt];ot!==null&&Rt!==void 0&&Rt.update(ot,et,c||o)}Mt&&Mt(K,et),et.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:et}),_=null}let jt=new eh;jt.setAnimationLoop(Ft),this.setAnimationLoop=function(K){Mt=K},this.dispose=function(){}}},ci=new Mn,kg=new ge;function Bg(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,th(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,E,x,y){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,y)):p.isMeshMatcapMaterial?(r(m,p),_(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),g(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,E,x):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ve&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ve&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let E=t.get(p),x=E.envMap,y=E.envMapRotation;x&&(m.envMap.value=x,ci.copy(y),ci.x*=-1,ci.y*=-1,ci.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(ci.y*=-1,ci.z*=-1),m.envMapRotation.value.setFromMatrix4(kg.makeRotationFromEuler(ci)),m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,E,x){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*E,m.scale.value=x*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,E){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ve&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function g(m,p){let E=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function zg(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(E,x){let y=x.program;n.uniformBlockBinding(E,y)}function c(E,x){let y=s[E.id];y===void 0&&(_(E),y=h(E),s[E.id]=y,E.addEventListener("dispose",m));let M=x.program;n.updateUBOMapping(E,M);let T=t.render.frame;r[E.id]!==T&&(f(E),r[E.id]=T)}function h(E){let x=u();E.__bindingPointIndex=x;let y=i.createBuffer(),M=E.__size,T=E.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,M,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,x,y),y}function u(){for(let E=0;E<a;E++)if(o.indexOf(E)===-1)return o.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(E){let x=s[E.id],y=E.uniforms,M=E.__cache;i.bindBuffer(i.UNIFORM_BUFFER,x);for(let T=0,P=y.length;T<P;T++){let R=Array.isArray(y[T])?y[T]:[y[T]];for(let S=0,v=R.length;S<v;S++){let A=R[S];if(d(A,T,S,M)===!0){let L=A.__offset,I=Array.isArray(A.value)?A.value:[A.value],U=0;for(let z=0;z<I.length;z++){let H=I[z],Q=g(H);typeof H=="number"||typeof H=="boolean"?(A.__data[0]=H,i.bufferSubData(i.UNIFORM_BUFFER,L+U,A.__data)):H.isMatrix3?(A.__data[0]=H.elements[0],A.__data[1]=H.elements[1],A.__data[2]=H.elements[2],A.__data[3]=0,A.__data[4]=H.elements[3],A.__data[5]=H.elements[4],A.__data[6]=H.elements[5],A.__data[7]=0,A.__data[8]=H.elements[6],A.__data[9]=H.elements[7],A.__data[10]=H.elements[8],A.__data[11]=0):(H.toArray(A.__data,U),U+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,L,A.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(E,x,y,M){let T=E.value,P=x+"_"+y;if(M[P]===void 0)return typeof T=="number"||typeof T=="boolean"?M[P]=T:M[P]=T.clone(),!0;{let R=M[P];if(typeof T=="number"||typeof T=="boolean"){if(R!==T)return M[P]=T,!0}else if(R.equals(T)===!1)return R.copy(T),!0}return!1}function _(E){let x=E.uniforms,y=0,M=16;for(let P=0,R=x.length;P<R;P++){let S=Array.isArray(x[P])?x[P]:[x[P]];for(let v=0,A=S.length;v<A;v++){let L=S[v],I=Array.isArray(L.value)?L.value:[L.value];for(let U=0,z=I.length;U<z;U++){let H=I[U],Q=g(H),G=y%M,rt=G%Q.boundary,ht=G+rt;y+=rt,ht!==0&&M-ht<Q.storage&&(y+=M-ht),L.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=y,y+=Q.storage}}}let T=y%M;return T>0&&(y+=M-T),E.__size=y,E.__cache={},this}function g(E){let x={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(x.boundary=4,x.storage=4):E.isVector2?(x.boundary=8,x.storage=8):E.isVector3||E.isColor?(x.boundary=16,x.storage=12):E.isVector4?(x.boundary=16,x.storage=16):E.isMatrix3?(x.boundary=48,x.storage=48):E.isMatrix4?(x.boundary=64,x.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),x}function m(E){let x=E.target;x.removeEventListener("dispose",m);let y=o.indexOf(x.__bindingPointIndex);o.splice(y,1),i.deleteBuffer(s[x.id]),delete s[x.id],delete r[x.id]}function p(){for(let E in s)i.deleteBuffer(s[E]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var Pr=class{constructor(t={}){let{canvas:e=Gu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let _=new Uint32Array(4),g=new Int32Array(4),m=null,p=null,E=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=He,this.toneMapping=jn,this.toneMappingExposure=1;let y=this,M=!1,T=0,P=0,R=null,S=-1,v=null,A=new ye,L=new ye,I=null,U=new It(0),z=0,H=e.width,Q=e.height,G=1,rt=null,ht=null,Mt=new ye(0,0,H,Q),Ft=new ye(0,0,H,Q),jt=!1,K=new Rs,et=!1,vt=!1,ot=new ge,Rt=new ge,Dt=new k,Ht=new ye,le={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Yt=!1;function pe(){return R===null?G:1}let F=n;function Re(w,N){return e.getContext(w,N)}try{let w={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r170"),e.addEventListener("webglcontextlost",J,!1),e.addEventListener("webglcontextrestored",gt,!1),e.addEventListener("webglcontextcreationerror",ft,!1),F===null){let N="webgl2";if(F=Re(N,w),F===null)throw Re(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let Gt,Wt,Ct,se,At,C,b,B,Z,tt,X,mt,it,dt,qt,nt,_t,Pt,bt,xt,Xt,Ot,Zt,D;function ct(){Gt=new nm(F),Gt.init(),Ot=new Ug(F,Gt),Wt=new $p(F,Gt,t,Ot),Ct=new Ig(F,Gt),Wt.reverseDepthBuffer&&f&&Ct.buffers.depth.setReversed(!0),se=new rm(F),At=new yg,C=new Dg(F,Gt,Ct,At,Wt,Ot,se),b=new jp(y),B=new em(y),Z=new ud(F),Zt=new Zp(F,Z),tt=new im(F,Z,se,Zt),X=new om(F,tt,Z,se),bt=new am(F,Wt,C),nt=new Jp(At),mt=new _g(y,b,B,Gt,Wt,Zt,nt),it=new Bg(y,At),dt=new vg,qt=new Tg(Gt),Pt=new qp(y,b,B,Ct,X,d,l),_t=new Rg(y,X,Wt),D=new zg(F,se,Wt,Ct),xt=new Kp(F,Gt,se),Xt=new sm(F,Gt,se),se.programs=mt.programs,y.capabilities=Wt,y.extensions=Gt,y.properties=At,y.renderLists=dt,y.shadowMap=_t,y.state=Ct,y.info=se}ct();let q=new Bo(y,F);this.xr=q,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let w=Gt.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=Gt.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(w){w!==void 0&&(G=w,this.setSize(H,Q,!1))},this.getSize=function(w){return w.set(H,Q)},this.setSize=function(w,N,V=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}H=w,Q=N,e.width=Math.floor(w*G),e.height=Math.floor(N*G),V===!0&&(e.style.width=w+"px",e.style.height=N+"px"),this.setViewport(0,0,w,N)},this.getDrawingBufferSize=function(w){return w.set(H*G,Q*G).floor()},this.setDrawingBufferSize=function(w,N,V){H=w,Q=N,G=V,e.width=Math.floor(w*V),e.height=Math.floor(N*V),this.setViewport(0,0,w,N)},this.getCurrentViewport=function(w){return w.copy(A)},this.getViewport=function(w){return w.copy(Mt)},this.setViewport=function(w,N,V,W){w.isVector4?Mt.set(w.x,w.y,w.z,w.w):Mt.set(w,N,V,W),Ct.viewport(A.copy(Mt).multiplyScalar(G).round())},this.getScissor=function(w){return w.copy(Ft)},this.setScissor=function(w,N,V,W){w.isVector4?Ft.set(w.x,w.y,w.z,w.w):Ft.set(w,N,V,W),Ct.scissor(L.copy(Ft).multiplyScalar(G).round())},this.getScissorTest=function(){return jt},this.setScissorTest=function(w){Ct.setScissorTest(jt=w)},this.setOpaqueSort=function(w){rt=w},this.setTransparentSort=function(w){ht=w},this.getClearColor=function(w){return w.copy(Pt.getClearColor())},this.setClearColor=function(){Pt.setClearColor.apply(Pt,arguments)},this.getClearAlpha=function(){return Pt.getClearAlpha()},this.setClearAlpha=function(){Pt.setClearAlpha.apply(Pt,arguments)},this.clear=function(w=!0,N=!0,V=!0){let W=0;if(w){let O=!1;if(R!==null){let st=R.texture.format;O=st===al||st===rl||st===sl}if(O){let st=R.texture.type,pt=st===Fn||st===gi||st===Ts||st===$i||st===nl||st===il,St=Pt.getClearColor(),Et=Pt.getClearAlpha(),Ut=St.r,Bt=St.g,wt=St.b;pt?(_[0]=Ut,_[1]=Bt,_[2]=wt,_[3]=Et,F.clearBufferuiv(F.COLOR,0,_)):(g[0]=Ut,g[1]=Bt,g[2]=wt,g[3]=Et,F.clearBufferiv(F.COLOR,0,g))}else W|=F.COLOR_BUFFER_BIT}N&&(W|=F.DEPTH_BUFFER_BIT),V&&(W|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",J,!1),e.removeEventListener("webglcontextrestored",gt,!1),e.removeEventListener("webglcontextcreationerror",ft,!1),dt.dispose(),qt.dispose(),At.dispose(),b.dispose(),B.dispose(),X.dispose(),Zt.dispose(),D.dispose(),mt.dispose(),q.dispose(),q.removeEventListener("sessionstart",vl),q.removeEventListener("sessionend",Ml),ii.stop()};function J(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function gt(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;let w=se.autoReset,N=_t.enabled,V=_t.autoUpdate,W=_t.needsUpdate,O=_t.type;ct(),se.autoReset=w,_t.enabled=N,_t.autoUpdate=V,_t.needsUpdate=W,_t.type=O}function ft(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function kt(w){let N=w.target;N.removeEventListener("dispose",kt),_e(N)}function _e(w){Pe(w),At.remove(w)}function Pe(w){let N=At.get(w).programs;N!==void 0&&(N.forEach(function(V){mt.releaseProgram(V)}),w.isShaderMaterial&&mt.releaseShaderCache(w))}this.renderBufferDirect=function(w,N,V,W,O,st){N===null&&(N=le);let pt=O.isMesh&&O.matrixWorld.determinant()<0,St=Ih(w,N,V,W,O);Ct.setMaterial(W,pt);let Et=V.index,Ut=1;if(W.wireframe===!0){if(Et=tt.getWireframeAttribute(V),Et===void 0)return;Ut=2}let Bt=V.drawRange,wt=V.attributes.position,$t=Bt.start*Ut,ce=(Bt.start+Bt.count)*Ut;st!==null&&($t=Math.max($t,st.start*Ut),ce=Math.min(ce,(st.start+st.count)*Ut)),Et!==null?($t=Math.max($t,0),ce=Math.min(ce,Et.count)):wt!=null&&($t=Math.max($t,0),ce=Math.min(ce,wt.count));let de=ce-$t;if(de<0||de===1/0)return;Zt.setup(O,W,St,V,Et);let ze,ee=xt;if(Et!==null&&(ze=Z.get(Et),ee=Xt,ee.setIndex(ze)),O.isMesh)W.wireframe===!0?(Ct.setLineWidth(W.wireframeLinewidth*pe()),ee.setMode(F.LINES)):ee.setMode(F.TRIANGLES);else if(O.isLine){let Tt=W.linewidth;Tt===void 0&&(Tt=1),Ct.setLineWidth(Tt*pe()),O.isLineSegments?ee.setMode(F.LINES):O.isLineLoop?ee.setMode(F.LINE_LOOP):ee.setMode(F.LINE_STRIP)}else O.isPoints?ee.setMode(F.POINTS):O.isSprite&&ee.setMode(F.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)ee.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(Gt.get("WEBGL_multi_draw"))ee.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Tt=O._multiDrawStarts,Tn=O._multiDrawCounts,ne=O._multiDrawCount,rn=Et?Z.get(Et).bytesPerElement:1,Ei=At.get(W).currentProgram.getUniforms();for(let Xe=0;Xe<ne;Xe++)Ei.setValue(F,"_gl_DrawID",Xe),ee.render(Tt[Xe]/rn,Tn[Xe])}else if(O.isInstancedMesh)ee.renderInstances($t,de,O.count);else if(V.isInstancedBufferGeometry){let Tt=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Tn=Math.min(V.instanceCount,Tt);ee.renderInstances($t,de,Tn)}else ee.render($t,de)};function re(w,N,V){w.transparent===!0&&w.side===Ce&&w.forceSinglePass===!1?(w.side=Ve,w.needsUpdate=!0,Hs(w,N,V),w.side=Qn,w.needsUpdate=!0,Hs(w,N,V),w.side=Ce):Hs(w,N,V)}this.compile=function(w,N,V=null){V===null&&(V=w),p=qt.get(V),p.init(N),x.push(p),V.traverseVisible(function(O){O.isLight&&O.layers.test(N.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),w!==V&&w.traverseVisible(function(O){O.isLight&&O.layers.test(N.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let W=new Set;return w.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let st=O.material;if(st)if(Array.isArray(st))for(let pt=0;pt<st.length;pt++){let St=st[pt];re(St,V,O),W.add(St)}else re(st,V,O),W.add(st)}),x.pop(),p=null,W},this.compileAsync=function(w,N,V=null){let W=this.compile(w,N,V);return new Promise(O=>{function st(){if(W.forEach(function(pt){At.get(pt).currentProgram.isReady()&&W.delete(pt)}),W.size===0){O(w);return}setTimeout(st,10)}Gt.get("KHR_parallel_shader_compile")!==null?st():setTimeout(st,10)})};let sn=null;function wn(w){sn&&sn(w)}function vl(){ii.stop()}function Ml(){ii.start()}let ii=new eh;ii.setAnimationLoop(wn),typeof self<"u"&&ii.setContext(self),this.setAnimationLoop=function(w){sn=w,q.setAnimationLoop(w),w===null?ii.stop():ii.start()},q.addEventListener("sessionstart",vl),q.addEventListener("sessionend",Ml),this.render=function(w,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(N),N=q.getCamera()),w.isScene===!0&&w.onBeforeRender(y,w,N,R),p=qt.get(w,x.length),p.init(N),x.push(p),Rt.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),K.setFromProjectionMatrix(Rt),vt=this.localClippingEnabled,et=nt.init(this.clippingPlanes,vt),m=dt.get(w,E.length),m.init(),E.push(m),q.enabled===!0&&q.isPresenting===!0){let st=y.xr.getDepthSensingMesh();st!==null&&ra(st,N,-1/0,y.sortObjects)}ra(w,N,0,y.sortObjects),m.finish(),y.sortObjects===!0&&m.sort(rt,ht),Yt=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,Yt&&Pt.addToRenderList(m,w),this.info.render.frame++,et===!0&&nt.beginShadows();let V=p.state.shadowsArray;_t.render(V,w,N),et===!0&&nt.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=m.opaque,O=m.transmissive;if(p.setupLights(),N.isArrayCamera){let st=N.cameras;if(O.length>0)for(let pt=0,St=st.length;pt<St;pt++){let Et=st[pt];Sl(W,O,w,Et)}Yt&&Pt.render(w);for(let pt=0,St=st.length;pt<St;pt++){let Et=st[pt];bl(m,w,Et,Et.viewport)}}else O.length>0&&Sl(W,O,w,N),Yt&&Pt.render(w),bl(m,w,N);R!==null&&(C.updateMultisampleRenderTarget(R),C.updateRenderTargetMipmap(R)),w.isScene===!0&&w.onAfterRender(y,w,N),Zt.resetDefaultState(),S=-1,v=null,x.pop(),x.length>0?(p=x[x.length-1],et===!0&&nt.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,E.pop(),E.length>0?m=E[E.length-1]:m=null};function ra(w,N,V,W){if(w.visible===!1)return;if(w.layers.test(N.layers)){if(w.isGroup)V=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(N);else if(w.isLight)p.pushLight(w),w.castShadow&&p.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||K.intersectsSprite(w)){W&&Ht.setFromMatrixPosition(w.matrixWorld).applyMatrix4(Rt);let pt=X.update(w),St=w.material;St.visible&&m.push(w,pt,St,V,Ht.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||K.intersectsObject(w))){let pt=X.update(w),St=w.material;if(W&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Ht.copy(w.boundingSphere.center)):(pt.boundingSphere===null&&pt.computeBoundingSphere(),Ht.copy(pt.boundingSphere.center)),Ht.applyMatrix4(w.matrixWorld).applyMatrix4(Rt)),Array.isArray(St)){let Et=pt.groups;for(let Ut=0,Bt=Et.length;Ut<Bt;Ut++){let wt=Et[Ut],$t=St[wt.materialIndex];$t&&$t.visible&&m.push(w,pt,$t,V,Ht.z,wt)}}else St.visible&&m.push(w,pt,St,V,Ht.z,null)}}let st=w.children;for(let pt=0,St=st.length;pt<St;pt++)ra(st[pt],N,V,W)}function bl(w,N,V,W){let O=w.opaque,st=w.transmissive,pt=w.transparent;p.setupLightsView(V),et===!0&&nt.setGlobalState(y.clippingPlanes,V),W&&Ct.viewport(A.copy(W)),O.length>0&&zs(O,N,V),st.length>0&&zs(st,N,V),pt.length>0&&zs(pt,N,V),Ct.buffers.depth.setTest(!0),Ct.buffers.depth.setMask(!0),Ct.buffers.color.setMask(!0),Ct.setPolygonOffset(!1)}function Sl(w,N,V,W){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new kn(1,1,{generateMipmaps:!0,type:Gt.has("EXT_color_buffer_half_float")||Gt.has("EXT_color_buffer_float")?Us:Fn,minFilter:mi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Kt.workingColorSpace}));let st=p.state.transmissionRenderTarget[W.id],pt=W.viewport||A;st.setSize(pt.z,pt.w);let St=y.getRenderTarget();y.setRenderTarget(st),y.getClearColor(U),z=y.getClearAlpha(),z<1&&y.setClearColor(16777215,.5),y.clear(),Yt&&Pt.render(V);let Et=y.toneMapping;y.toneMapping=jn;let Ut=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),et===!0&&nt.setGlobalState(y.clippingPlanes,W),zs(w,V,W),C.updateMultisampleRenderTarget(st),C.updateRenderTargetMipmap(st),Gt.has("WEBGL_multisampled_render_to_texture")===!1){let Bt=!1;for(let wt=0,$t=N.length;wt<$t;wt++){let ce=N[wt],de=ce.object,ze=ce.geometry,ee=ce.material,Tt=ce.group;if(ee.side===Ce&&de.layers.test(W.layers)){let Tn=ee.side;ee.side=Ve,ee.needsUpdate=!0,El(de,V,W,ze,ee,Tt),ee.side=Tn,ee.needsUpdate=!0,Bt=!0}}Bt===!0&&(C.updateMultisampleRenderTarget(st),C.updateRenderTargetMipmap(st))}y.setRenderTarget(St),y.setClearColor(U,z),Ut!==void 0&&(W.viewport=Ut),y.toneMapping=Et}function zs(w,N,V){let W=N.isScene===!0?N.overrideMaterial:null;for(let O=0,st=w.length;O<st;O++){let pt=w[O],St=pt.object,Et=pt.geometry,Ut=W===null?pt.material:W,Bt=pt.group;St.layers.test(V.layers)&&El(St,N,V,Et,Ut,Bt)}}function El(w,N,V,W,O,st){w.onBeforeRender(y,N,V,W,O,st),w.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),O.onBeforeRender(y,N,V,W,w,st),O.transparent===!0&&O.side===Ce&&O.forceSinglePass===!1?(O.side=Ve,O.needsUpdate=!0,y.renderBufferDirect(V,N,W,O,w,st),O.side=Qn,O.needsUpdate=!0,y.renderBufferDirect(V,N,W,O,w,st),O.side=Ce):y.renderBufferDirect(V,N,W,O,w,st),w.onAfterRender(y,N,V,W,O,st)}function Hs(w,N,V){N.isScene!==!0&&(N=le);let W=At.get(w),O=p.state.lights,st=p.state.shadowsArray,pt=O.state.version,St=mt.getParameters(w,O.state,st,N,V),Et=mt.getProgramCacheKey(St),Ut=W.programs;W.environment=w.isMeshStandardMaterial?N.environment:null,W.fog=N.fog,W.envMap=(w.isMeshStandardMaterial?B:b).get(w.envMap||W.environment),W.envMapRotation=W.environment!==null&&w.envMap===null?N.environmentRotation:w.envMapRotation,Ut===void 0&&(w.addEventListener("dispose",kt),Ut=new Map,W.programs=Ut);let Bt=Ut.get(Et);if(Bt!==void 0){if(W.currentProgram===Bt&&W.lightsStateVersion===pt)return Tl(w,St),Bt}else St.uniforms=mt.getUniforms(w),w.onBeforeCompile(St,y),Bt=mt.acquireProgram(St,Et),Ut.set(Et,Bt),W.uniforms=St.uniforms;let wt=W.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(wt.clippingPlanes=nt.uniform),Tl(w,St),W.needsLights=Dh(w),W.lightsStateVersion=pt,W.needsLights&&(wt.ambientLightColor.value=O.state.ambient,wt.lightProbe.value=O.state.probe,wt.directionalLights.value=O.state.directional,wt.directionalLightShadows.value=O.state.directionalShadow,wt.spotLights.value=O.state.spot,wt.spotLightShadows.value=O.state.spotShadow,wt.rectAreaLights.value=O.state.rectArea,wt.ltc_1.value=O.state.rectAreaLTC1,wt.ltc_2.value=O.state.rectAreaLTC2,wt.pointLights.value=O.state.point,wt.pointLightShadows.value=O.state.pointShadow,wt.hemisphereLights.value=O.state.hemi,wt.directionalShadowMap.value=O.state.directionalShadowMap,wt.directionalShadowMatrix.value=O.state.directionalShadowMatrix,wt.spotShadowMap.value=O.state.spotShadowMap,wt.spotLightMatrix.value=O.state.spotLightMatrix,wt.spotLightMap.value=O.state.spotLightMap,wt.pointShadowMap.value=O.state.pointShadowMap,wt.pointShadowMatrix.value=O.state.pointShadowMatrix),W.currentProgram=Bt,W.uniformsList=null,Bt}function wl(w){if(w.uniformsList===null){let N=w.currentProgram.getUniforms();w.uniformsList=Yi.seqWithValue(N.seq,w.uniforms)}return w.uniformsList}function Tl(w,N){let V=At.get(w);V.outputColorSpace=N.outputColorSpace,V.batching=N.batching,V.batchingColor=N.batchingColor,V.instancing=N.instancing,V.instancingColor=N.instancingColor,V.instancingMorph=N.instancingMorph,V.skinning=N.skinning,V.morphTargets=N.morphTargets,V.morphNormals=N.morphNormals,V.morphColors=N.morphColors,V.morphTargetsCount=N.morphTargetsCount,V.numClippingPlanes=N.numClippingPlanes,V.numIntersection=N.numClipIntersection,V.vertexAlphas=N.vertexAlphas,V.vertexTangents=N.vertexTangents,V.toneMapping=N.toneMapping}function Ih(w,N,V,W,O){N.isScene!==!0&&(N=le),C.resetTextureUnits();let st=N.fog,pt=W.isMeshStandardMaterial?N.environment:null,St=R===null?y.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:ss,Et=(W.isMeshStandardMaterial?B:b).get(W.envMap||pt),Ut=W.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Bt=!!V.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),wt=!!V.morphAttributes.position,$t=!!V.morphAttributes.normal,ce=!!V.morphAttributes.color,de=jn;W.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(de=y.toneMapping);let ze=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,ee=ze!==void 0?ze.length:0,Tt=At.get(W),Tn=p.state.lights;if(et===!0&&(vt===!0||w!==v)){let je=w===v&&W.id===S;nt.setState(W,w,je)}let ne=!1;W.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==Tn.state.version||Tt.outputColorSpace!==St||O.isBatchedMesh&&Tt.batching===!1||!O.isBatchedMesh&&Tt.batching===!0||O.isBatchedMesh&&Tt.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Tt.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Tt.instancing===!1||!O.isInstancedMesh&&Tt.instancing===!0||O.isSkinnedMesh&&Tt.skinning===!1||!O.isSkinnedMesh&&Tt.skinning===!0||O.isInstancedMesh&&Tt.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Tt.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Tt.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Tt.instancingMorph===!1&&O.morphTexture!==null||Tt.envMap!==Et||W.fog===!0&&Tt.fog!==st||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==nt.numPlanes||Tt.numIntersection!==nt.numIntersection)||Tt.vertexAlphas!==Ut||Tt.vertexTangents!==Bt||Tt.morphTargets!==wt||Tt.morphNormals!==$t||Tt.morphColors!==ce||Tt.toneMapping!==de||Tt.morphTargetsCount!==ee)&&(ne=!0):(ne=!0,Tt.__version=W.version);let rn=Tt.currentProgram;ne===!0&&(rn=Hs(W,N,O));let Ei=!1,Xe=!1,ps=!1,fe=rn.getUniforms(),yn=Tt.uniforms;if(Ct.useProgram(rn.program)&&(Ei=!0,Xe=!0,ps=!0),W.id!==S&&(S=W.id,Xe=!0),Ei||v!==w){Ct.buffers.depth.getReversed()?(ot.copy(w.projectionMatrix),Xu(ot),Yu(ot),fe.setValue(F,"projectionMatrix",ot)):fe.setValue(F,"projectionMatrix",w.projectionMatrix),fe.setValue(F,"viewMatrix",w.matrixWorldInverse);let zn=fe.map.cameraPosition;zn!==void 0&&zn.setValue(F,Dt.setFromMatrixPosition(w.matrixWorld)),Wt.logarithmicDepthBuffer&&fe.setValue(F,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&fe.setValue(F,"isOrthographic",w.isOrthographicCamera===!0),v!==w&&(v=w,Xe=!0,ps=!0)}if(O.isSkinnedMesh){fe.setOptional(F,O,"bindMatrix"),fe.setOptional(F,O,"bindMatrixInverse");let je=O.skeleton;je&&(je.boneTexture===null&&je.computeBoneTexture(),fe.setValue(F,"boneTexture",je.boneTexture,C))}O.isBatchedMesh&&(fe.setOptional(F,O,"batchingTexture"),fe.setValue(F,"batchingTexture",O._matricesTexture,C),fe.setOptional(F,O,"batchingIdTexture"),fe.setValue(F,"batchingIdTexture",O._indirectTexture,C),fe.setOptional(F,O,"batchingColorTexture"),O._colorsTexture!==null&&fe.setValue(F,"batchingColorTexture",O._colorsTexture,C));let ms=V.morphAttributes;if((ms.position!==void 0||ms.normal!==void 0||ms.color!==void 0)&&bt.update(O,V,rn),(Xe||Tt.receiveShadow!==O.receiveShadow)&&(Tt.receiveShadow=O.receiveShadow,fe.setValue(F,"receiveShadow",O.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(yn.envMap.value=Et,yn.flipEnvMap.value=Et.isCubeTexture&&Et.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&N.environment!==null&&(yn.envMapIntensity.value=N.environmentIntensity),Xe&&(fe.setValue(F,"toneMappingExposure",y.toneMappingExposure),Tt.needsLights&&Lh(yn,ps),st&&W.fog===!0&&it.refreshFogUniforms(yn,st),it.refreshMaterialUniforms(yn,W,G,Q,p.state.transmissionRenderTarget[w.id]),Yi.upload(F,wl(Tt),yn,C)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Yi.upload(F,wl(Tt),yn,C),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&fe.setValue(F,"center",O.center),fe.setValue(F,"modelViewMatrix",O.modelViewMatrix),fe.setValue(F,"normalMatrix",O.normalMatrix),fe.setValue(F,"modelMatrix",O.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let je=W.uniformsGroups;for(let zn=0,Hn=je.length;zn<Hn;zn++){let Al=je[zn];D.update(Al,rn),D.bind(Al,rn)}}return rn}function Lh(w,N){w.ambientLightColor.needsUpdate=N,w.lightProbe.needsUpdate=N,w.directionalLights.needsUpdate=N,w.directionalLightShadows.needsUpdate=N,w.pointLights.needsUpdate=N,w.pointLightShadows.needsUpdate=N,w.spotLights.needsUpdate=N,w.spotLightShadows.needsUpdate=N,w.rectAreaLights.needsUpdate=N,w.hemisphereLights.needsUpdate=N}function Dh(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(w,N,V){At.get(w.texture).__webglTexture=N,At.get(w.depthTexture).__webglTexture=V;let W=At.get(w);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=V===void 0,W.__autoAllocateDepthBuffer||Gt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(w,N){let V=At.get(w);V.__webglFramebuffer=N,V.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(w,N=0,V=0){R=w,T=N,P=V;let W=!0,O=null,st=!1,pt=!1;if(w){let Et=At.get(w);if(Et.__useDefaultFramebuffer!==void 0)Ct.bindFramebuffer(F.FRAMEBUFFER,null),W=!1;else if(Et.__webglFramebuffer===void 0)C.setupRenderTarget(w);else if(Et.__hasExternalTextures)C.rebindTextures(w,At.get(w.texture).__webglTexture,At.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let wt=w.depthTexture;if(Et.__boundDepthTexture!==wt){if(wt!==null&&At.has(wt)&&(w.width!==wt.image.width||w.height!==wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(w)}}let Ut=w.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(pt=!0);let Bt=At.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Bt[N])?O=Bt[N][V]:O=Bt[N],st=!0):w.samples>0&&C.useMultisampledRTT(w)===!1?O=At.get(w).__webglMultisampledFramebuffer:Array.isArray(Bt)?O=Bt[V]:O=Bt,A.copy(w.viewport),L.copy(w.scissor),I=w.scissorTest}else A.copy(Mt).multiplyScalar(G).floor(),L.copy(Ft).multiplyScalar(G).floor(),I=jt;if(Ct.bindFramebuffer(F.FRAMEBUFFER,O)&&W&&Ct.drawBuffers(w,O),Ct.viewport(A),Ct.scissor(L),Ct.setScissorTest(I),st){let Et=At.get(w.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+N,Et.__webglTexture,V)}else if(pt){let Et=At.get(w.texture),Ut=N||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,Et.__webglTexture,V||0,Ut)}S=-1},this.readRenderTargetPixels=function(w,N,V,W,O,st,pt){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let St=At.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&pt!==void 0&&(St=St[pt]),St){Ct.bindFramebuffer(F.FRAMEBUFFER,St);try{let Et=w.texture,Ut=Et.format,Bt=Et.type;if(!Wt.textureFormatReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Wt.textureTypeReadable(Bt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=w.width-W&&V>=0&&V<=w.height-O&&F.readPixels(N,V,W,O,Ot.convert(Ut),Ot.convert(Bt),st)}finally{let Et=R!==null?At.get(R).__webglFramebuffer:null;Ct.bindFramebuffer(F.FRAMEBUFFER,Et)}}},this.readRenderTargetPixelsAsync=async function(w,N,V,W,O,st,pt){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let St=At.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&pt!==void 0&&(St=St[pt]),St){let Et=w.texture,Ut=Et.format,Bt=Et.type;if(!Wt.textureFormatReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Wt.textureTypeReadable(Bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(N>=0&&N<=w.width-W&&V>=0&&V<=w.height-O){Ct.bindFramebuffer(F.FRAMEBUFFER,St);let wt=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,wt),F.bufferData(F.PIXEL_PACK_BUFFER,st.byteLength,F.STREAM_READ),F.readPixels(N,V,W,O,Ot.convert(Ut),Ot.convert(Bt),0);let $t=R!==null?At.get(R).__webglFramebuffer:null;Ct.bindFramebuffer(F.FRAMEBUFFER,$t);let ce=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await Wu(F,ce,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,wt),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,st),F.deleteBuffer(wt),F.deleteSync(ce),st}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(w,N=null,V=0){w.isTexture!==!0&&(Ms("WebGLRenderer: copyFramebufferToTexture function signature has changed."),N=arguments[0]||null,w=arguments[1]);let W=Math.pow(2,-V),O=Math.floor(w.image.width*W),st=Math.floor(w.image.height*W),pt=N!==null?N.x:0,St=N!==null?N.y:0;C.setTexture2D(w,0),F.copyTexSubImage2D(F.TEXTURE_2D,V,0,0,pt,St,O,st),Ct.unbindTexture()},this.copyTextureToTexture=function(w,N,V=null,W=null,O=0){w.isTexture!==!0&&(Ms("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,w=arguments[1],N=arguments[2],O=arguments[3]||0,V=null);let st,pt,St,Et,Ut,Bt,wt,$t,ce,de=w.isCompressedTexture?w.mipmaps[O]:w.image;V!==null?(st=V.max.x-V.min.x,pt=V.max.y-V.min.y,St=V.isBox3?V.max.z-V.min.z:1,Et=V.min.x,Ut=V.min.y,Bt=V.isBox3?V.min.z:0):(st=de.width,pt=de.height,St=de.depth||1,Et=0,Ut=0,Bt=0),W!==null?(wt=W.x,$t=W.y,ce=W.z):(wt=0,$t=0,ce=0);let ze=Ot.convert(N.format),ee=Ot.convert(N.type),Tt;N.isData3DTexture?(C.setTexture3D(N,0),Tt=F.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(C.setTexture2DArray(N,0),Tt=F.TEXTURE_2D_ARRAY):(C.setTexture2D(N,0),Tt=F.TEXTURE_2D),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,N.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,N.unpackAlignment);let Tn=F.getParameter(F.UNPACK_ROW_LENGTH),ne=F.getParameter(F.UNPACK_IMAGE_HEIGHT),rn=F.getParameter(F.UNPACK_SKIP_PIXELS),Ei=F.getParameter(F.UNPACK_SKIP_ROWS),Xe=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,de.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,de.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Et),F.pixelStorei(F.UNPACK_SKIP_ROWS,Ut),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Bt);let ps=w.isDataArrayTexture||w.isData3DTexture,fe=N.isDataArrayTexture||N.isData3DTexture;if(w.isRenderTargetTexture||w.isDepthTexture){let yn=At.get(w),ms=At.get(N),je=At.get(yn.__renderTarget),zn=At.get(ms.__renderTarget);Ct.bindFramebuffer(F.READ_FRAMEBUFFER,je.__webglFramebuffer),Ct.bindFramebuffer(F.DRAW_FRAMEBUFFER,zn.__webglFramebuffer);for(let Hn=0;Hn<St;Hn++)ps&&F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,At.get(w).__webglTexture,O,Bt+Hn),w.isDepthTexture?(fe&&F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,At.get(N).__webglTexture,O,ce+Hn),F.blitFramebuffer(Et,Ut,st,pt,wt,$t,st,pt,F.DEPTH_BUFFER_BIT,F.NEAREST)):fe?F.copyTexSubImage3D(Tt,O,wt,$t,ce+Hn,Et,Ut,st,pt):F.copyTexSubImage2D(Tt,O,wt,$t,ce+Hn,Et,Ut,st,pt);Ct.bindFramebuffer(F.READ_FRAMEBUFFER,null),Ct.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else fe?w.isDataTexture||w.isData3DTexture?F.texSubImage3D(Tt,O,wt,$t,ce,st,pt,St,ze,ee,de.data):N.isCompressedArrayTexture?F.compressedTexSubImage3D(Tt,O,wt,$t,ce,st,pt,St,ze,de.data):F.texSubImage3D(Tt,O,wt,$t,ce,st,pt,St,ze,ee,de):w.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,O,wt,$t,st,pt,ze,ee,de.data):w.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,O,wt,$t,de.width,de.height,ze,de.data):F.texSubImage2D(F.TEXTURE_2D,O,wt,$t,st,pt,ze,ee,de);F.pixelStorei(F.UNPACK_ROW_LENGTH,Tn),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ne),F.pixelStorei(F.UNPACK_SKIP_PIXELS,rn),F.pixelStorei(F.UNPACK_SKIP_ROWS,Ei),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Xe),O===0&&N.generateMipmaps&&F.generateMipmap(Tt),Ct.unbindTexture()},this.copyTextureToTexture3D=function(w,N,V=null,W=null,O=0){return w.isTexture!==!0&&(Ms("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,W=arguments[1]||null,w=arguments[2],N=arguments[3],O=arguments[4]||0),Ms('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(w,N,V,W,O)},this.initRenderTarget=function(w){At.get(w).__webglFramebuffer===void 0&&C.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?C.setTextureCube(w,0):w.isData3DTexture?C.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?C.setTexture2DArray(w,0):C.setTexture2D(w,0),Ct.unbindTexture()},this.resetState=function(){T=0,P=0,R=null,Ct.reset(),Zt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=Kt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Kt._getUnpackColorSpace()}};var Ir=class extends ke{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Mn,this.environmentIntensity=1,this.environmentRotation=new Mn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var Ps=class extends ti{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new It(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Dc=new ge,zo=new Qi,hr=new ji,ur=new k,Lr=class extends ke{constructor(t=new Te,e=new Ps){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),hr.copy(n.boundingSphere),hr.applyMatrix4(s),hr.radius+=r,t.ray.intersectsSphere(hr)===!1)return;Dc.copy(s).invert(),zo.copy(t.ray).applyMatrix4(Dc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,o.start),d=Math.min(c.count,o.start+o.count);for(let _=f,g=d;_<g;_++){let m=c.getX(_);ur.fromBufferAttribute(u,m),Uc(ur,m,l,s,t,e,this)}}else{let f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let _=f,g=d;_<g;_++)ur.fromBufferAttribute(u,_),Uc(ur,_,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Uc(i,t,e,n,s,r,o){let a=zo.distanceSqToPoint(i);if(a<e){let l=new k;zo.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var Is=class extends Ke{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ho=class i extends Te{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],f=[],d=[],_=0,g=[],m=n/2,p=0;E(),o===!1&&(t>0&&x(!0),e>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(f,3)),this.setAttribute("uv",new we(d,2));function E(){let y=new k,M=new k,T=0,P=(e-t)/n;for(let R=0;R<=r;R++){let S=[],v=R/r,A=v*(e-t)+t;for(let L=0;L<=s;L++){let I=L/s,U=I*l+a,z=Math.sin(U),H=Math.cos(U);M.x=A*z,M.y=-v*n+m,M.z=A*H,u.push(M.x,M.y,M.z),y.set(z,P,H).normalize(),f.push(y.x,y.y,y.z),d.push(I,1-v),S.push(_++)}g.push(S)}for(let R=0;R<s;R++)for(let S=0;S<r;S++){let v=g[S][R],A=g[S+1][R],L=g[S+1][R+1],I=g[S][R+1];(t>0||S!==0)&&(h.push(v,A,I),T+=3),(e>0||S!==r-1)&&(h.push(A,L,I),T+=3)}c.addGroup(p,T,0),p+=T}function x(y){let M=_,T=new Lt,P=new k,R=0,S=y===!0?t:e,v=y===!0?1:-1;for(let L=1;L<=s;L++)u.push(0,m*v,0),f.push(0,v,0),d.push(.5,.5),_++;let A=_;for(let L=0;L<=s;L++){let U=L/s*l+a,z=Math.cos(U),H=Math.sin(U);P.x=S*H,P.y=m*v,P.z=S*z,u.push(P.x,P.y,P.z),f.push(0,v,0),T.x=z*.5+.5,T.y=H*.5*v+.5,d.push(T.x,T.y),_++}for(let L=0;L<s;L++){let I=M+L,U=A+L;y===!0?h.push(U,U+1,I):h.push(U+1,U,I),R+=3}c.addGroup(p,R,y===!0?1:2),p+=R}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ls=class i extends Ho{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var Dr=class i extends Te{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=t,f=(e-t)/s,d=new k,_=new Lt;for(let g=0;g<=s;g++){for(let m=0;m<=n;m++){let p=r+m/n*o;d.x=u*Math.cos(p),d.y=u*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),_.x=(d.x/e+1)/2,_.y=(d.y/e+1)/2,h.push(_.x,_.y)}u+=f}for(let g=0;g<s;g++){let m=g*(n+1);for(let p=0;p<n;p++){let E=p+m,x=E,y=E+n+1,M=E+n+2,T=E+1;a.push(x,y,T),a.push(y,M,T)}}this.setIndex(a),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};var Ur=class extends ti{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new It(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new It(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Kc,this.normalScale=new Lt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mn,this.combine=tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function dr(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Hg(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var is=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Vo=class extends is{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fl,endingEnd:Fl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Ol:r=t,a=2*e-n;break;case kl:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ol:o=t,l=2*n-e;break;case kl:o=1,l=n+s[1]-s[0];break;default:o=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,_=(n-e)/(s-e),g=_*_,m=g*_,p=-f*m+2*f*g-f*_,E=(1+f)*m+(-1.5-2*f)*g+(-.5+f)*_+1,x=(-1-d)*m+(1.5+d)*g+.5*_,y=d*m-d*g;for(let M=0;M!==a;++M)r[M]=p*o[h+M]+E*o[c+M]+x*o[l+M]+y*o[u+M];return r}},Go=class extends is{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(s-e),u=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*u+o[l+f]*h;return r}},Wo=class extends is{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},mn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=dr(e,this.TimeBufferType),this.values=dr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:dr(t.times,Array),values:dr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Wo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Go(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Vo(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case yr:e=this.InterpolantFactoryMethodDiscrete;break;case So:e=this.InterpolantFactoryMethodLinear;break;case ca:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return yr;case this.InterpolantFactoryMethodLinear:return So;case this.InterpolantFactoryMethodSmooth:return ca}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&Hg(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===ca,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*n,f=u-n,d=u+n;for(let _=0;_!==n;++_){let g=e[u+_];if(g!==e[f+_]||g!==e[d+_]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)e[f+d]=e[u+d]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};mn.prototype.TimeBufferType=Float32Array;mn.prototype.ValueBufferType=Float32Array;mn.prototype.DefaultInterpolation=So;var yi=class extends mn{constructor(t,e,n){super(t,e,n)}};yi.prototype.ValueTypeName="bool";yi.prototype.ValueBufferType=Array;yi.prototype.DefaultInterpolation=yr;yi.prototype.InterpolantFactoryMethodLinear=void 0;yi.prototype.InterpolantFactoryMethodSmooth=void 0;var Xo=class extends mn{};Xo.prototype.ValueTypeName="color";var Yo=class extends mn{};Yo.prototype.ValueTypeName="number";var qo=class extends is{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)pn.slerpFlat(r,0,o,c-a,o,c,l);return r}},Nr=class extends mn{InterpolantFactoryMethodLinear(t){return new qo(this.times,this.values,this.getValueSize(),t)}};Nr.prototype.ValueTypeName="quaternion";Nr.prototype.InterpolantFactoryMethodSmooth=void 0;var xi=class extends mn{constructor(t,e,n){super(t,e,n)}};xi.prototype.ValueTypeName="string";xi.prototype.ValueBufferType=Array;xi.prototype.DefaultInterpolation=yr;xi.prototype.InterpolantFactoryMethodLinear=void 0;xi.prototype.InterpolantFactoryMethodSmooth=void 0;var Zo=class extends mn{};Zo.prototype.ValueTypeName="vector";var Ko=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],_=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return _}return null}}},Vg=new Ko,$o=class{constructor(t){this.manager=t!==void 0?t:Vg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};$o.DEFAULT_MATERIAL_NAME="__DEFAULT";var Fr=class extends ke{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new It(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}};var Fa=new ge,Nc=new k,Fc=new k,Jo=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Lt(512,512),this.map=null,this.mapPass=null,this.matrix=new ge,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rs,this._frameExtents=new Lt(1,1),this._viewportCount=1,this._viewports=[new ye(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Nc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Nc),Fc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Fc),e.updateMatrixWorld(),Fa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Fa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Fa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var jo=class extends Jo{constructor(){super(new ns(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Or=class extends Fr{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ke.DEFAULT_UP),this.updateMatrix(),this.target=new ke,this.shadow=new jo}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}},kr=class extends Fr{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}};var cl="\\[\\]\\.:\\/",Gg=new RegExp("["+cl+"]","g"),hl="[^"+cl+"]",Wg="[^"+cl.replace("\\.","")+"]",Xg=/((?:WC+[\/:])*)/.source.replace("WC",hl),Yg=/(WCOD+)?/.source.replace("WCOD",Wg),qg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",hl),Zg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",hl),Kg=new RegExp("^"+Xg+Yg+qg+Zg+"$"),$g=["material","materials","bones","map"],Qo=class{constructor(t,e,n){let s=n||me.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},me=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Gg,"")}static parseTrackName(t){let e=Kg.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);$g.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};me.Composite=Qo;me.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};me.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};me.prototype.GetterByBindingType=[me.prototype._getValue_direct,me.prototype._getValue_array,me.prototype._getValue_arrayElement,me.prototype._getValue_toArray];me.prototype.SetterByBindingTypeAndVersioning=[[me.prototype._setValue_direct,me.prototype._setValue_direct_setNeedsUpdate,me.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[me.prototype._setValue_array,me.prototype._setValue_array_setNeedsUpdate,me.prototype._setValue_array_setMatrixWorldNeedsUpdate],[me.prototype._setValue_arrayElement,me.prototype._setValue_arrayElement_setNeedsUpdate,me.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[me.prototype._setValue_fromArray,me.prototype._setValue_fromArray_setNeedsUpdate,me.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var V0=new Float32Array(1);var Ds=class{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(De(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Br=class extends On{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var oh={type:"change"},dl={type:"start"},ch={type:"end"},Gr=new Qi,lh=new un,Jg=Math.cos(70*Jc.DEG2RAD),Se=new k,Ge=2*Math.PI,oe={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ul=1e-6,Wr=class extends Br{constructor(t,e=null){super(t,e),this.state=oe.NONE,this.enabled=!0,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:vi.ROTATE,MIDDLE:vi.DOLLY,RIGHT:vi.PAN},this.touches={ONE:Mi.ROTATE,TWO:Mi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new pn,this._lastTargetPosition=new k,this._quat=new pn().setFromUnitVectors(t.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Ds,this._sphericalDelta=new Ds,this._scale=1,this._panOffset=new k,this._rotateStart=new Lt,this._rotateEnd=new Lt,this._rotateDelta=new Lt,this._panStart=new Lt,this._panEnd=new Lt,this._panDelta=new Lt,this._dollyStart=new Lt,this._dollyEnd=new Lt,this._dollyDelta=new Lt,this._dollyDirection=new k,this._mouse=new Lt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Qg.bind(this),this._onPointerDown=jg.bind(this),this._onPointerUp=t0.bind(this),this._onContextMenu=o0.bind(this),this._onMouseWheel=i0.bind(this),this._onKeyDown=s0.bind(this),this._onTouchStart=r0.bind(this),this._onTouchMove=a0.bind(this),this._onMouseDown=e0.bind(this),this._onMouseMove=n0.bind(this),this._interceptControlDown=l0.bind(this),this._interceptControlUp=c0.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(oh),this.update(),this.state=oe.NONE}update(t=null){let e=this.object.position;Se.copy(e).sub(this.target),Se.applyQuaternion(this._quat),this._spherical.setFromVector3(Se),this.autoRotate&&this.state===oe.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Ge:n>Math.PI&&(n-=Ge),s<-Math.PI?s+=Ge:s>Math.PI&&(s-=Ge),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Se.setFromSpherical(this._spherical),Se.applyQuaternion(this._quatInverse),e.copy(this.target).add(Se),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Se.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new k(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Se.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Gr.origin.copy(this.object.position),Gr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Gr.direction))<Jg?this.object.lookAt(this.target):(lh.setFromNormalAndCoplanarPoint(this.object.up,this.target),Gr.intersectPlane(lh,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>ul||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ul||this._lastTargetPosition.distanceToSquared(this.target)>ul?(this.dispatchEvent(oh),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Ge/60*this.autoRotateSpeed*t:Ge/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Se.setFromMatrixColumn(e,0),Se.multiplyScalar(-t),this._panOffset.add(Se)}_panUp(t,e){this.screenSpacePanning===!0?Se.setFromMatrixColumn(e,1):(Se.setFromMatrixColumn(e,0),Se.crossVectors(this.object.up,Se)),Se.multiplyScalar(t),this._panOffset.add(Se)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Se.copy(s).sub(this.target);let r=Se.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Ge*this._rotateDelta.x/e.clientHeight),this._rotateUp(Ge*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(Ge*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-Ge*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(Ge*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-Ge*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Ge*this._rotateDelta.x/e.clientHeight),this._rotateUp(Ge*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new Lt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function jg(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function Qg(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function t0(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(ch),this.state=oe.NONE;break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function e0(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case vi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=oe.DOLLY;break;case vi.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=oe.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=oe.ROTATE}break;case vi.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=oe.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=oe.PAN}break;default:this.state=oe.NONE}this.state!==oe.NONE&&this.dispatchEvent(dl)}function n0(i){switch(this.state){case oe.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case oe.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case oe.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function i0(i){this.enabled===!1||this.enableZoom===!1||this.state!==oe.NONE||(i.preventDefault(),this.dispatchEvent(dl),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(ch))}function s0(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function r0(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Mi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=oe.TOUCH_ROTATE;break;case Mi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=oe.TOUCH_PAN;break;default:this.state=oe.NONE}break;case 2:switch(this.touches.TWO){case Mi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=oe.TOUCH_DOLLY_PAN;break;case Mi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=oe.TOUCH_DOLLY_ROTATE;break;default:this.state=oe.NONE}break;default:this.state=oe.NONE}this.state!==oe.NONE&&this.dispatchEvent(dl)}function a0(i){switch(this._trackPointer(i),this.state){case oe.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case oe.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case oe.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case oe.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=oe.NONE}}function o0(i){this.enabled!==!1&&i.preventDefault()}function l0(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function c0(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var h0=`
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
}`,u0=`
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
}`;function d0(){return new $e({vertexShader:h0,fragmentShader:u0,transparent:!0,depthWrite:!1,side:Ce,uniforms:{uWidth:{value:2},uRibbon:{value:0},uHalf:{value:10},uRes:{value:new Lt(800,600)},uColor:{value:new It(1,1,1)},uOpacity:{value:.8},uHead:{value:0},uFade:{value:0}}})}var Xr=class{constructor(t,e,n,s){j(this,"mesh");j(this,"geo");j(this,"mat");j(this,"n");j(this,"cen");j(this,"prv");j(this,"nxt");j(this,"wng");j(this,"upy");j(this,"orig");j(this,"origW");j(this,"origU");j(this,"patched",-1);let r=t.length/3;this.n=r;let o=r*2;this.cen=new Float32Array(o*3),this.prv=new Float32Array(o*3),this.nxt=new Float32Array(o*3),this.wng=new Float32Array(o*3),this.upy=new Float32Array(o);let a=new Float32Array(o),l=new Float32Array(o);this.orig=t,this.origW=e||new Float32Array(r*3),this.origU=n||new Float32Array(r).fill(1);for(let f=0;f<r;f++){for(let d=0;d<2;d++){let _=f*2+d;a[_]=d?1:-1,l[_]=s[f]}this.writeCenter(f,t[f*3],t[f*3+1],t[f*3+2]),this.writeWing(f,this.origW[f*3],this.origW[f*3+1],this.origW[f*3+2],this.origU[f])}let c=new Uint32Array(Math.max(1,r-1)*6);for(let f=0;f<r-1;f++){let d=f*2;c.set([d,d+1,d+2,d+1,d+3,d+2],f*6)}let h=new Te,u=(f,d)=>new he(f,d).setUsage(rs);h.setAttribute("position",u(this.cen,3)),h.setAttribute("prev",u(this.prv,3)),h.setAttribute("next",u(this.nxt,3)),h.setAttribute("wing",u(this.wng,3)),h.setAttribute("upy",u(this.upy,1)),h.setAttribute("side",new he(a,1)),h.setAttribute("tsec",new he(l,1)),h.setIndex(new he(c,1)),this.geo=h,this.mat=d0(),this.mesh=new xe(h,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1}setV(t,e,n,s,r){if(e<0||e>=this.n)return;let o=e*6;t[o]=n,t[o+1]=s,t[o+2]=r,t[o+3]=n,t[o+4]=s,t[o+5]=r}writeCenter(t,e,n,s){this.setV(this.cen,t,e,n,s),this.setV(this.prv,t+1,e,n,s),this.setV(this.nxt,t-1,e,n,s),t===0&&this.setV(this.prv,0,e,n,s),t===this.n-1&&this.setV(this.nxt,t,e,n,s)}writeWing(t,e,n,s,r){this.setV(this.wng,t,e,n,s),this.upy[t*2]=r,this.upy[t*2+1]=r}touch(){for(let t of["position","prev","next","wing","upy"])this.geo.getAttribute(t).needsUpdate=!0}update(t,e,n,s,r){let o=n?e+1:-1,a=!1;if(this.patched!==o&&this.patched>=0&&this.patched<this.n){let c=this.patched,h=this.orig;this.writeCenter(c,h[c*3],h[c*3+1],h[c*3+2]),this.writeWing(c,this.origW[c*3],this.origW[c*3+1],this.origW[c*3+2],this.origU[c]),a=!0}this.patched=o;let l=e-t+1;if(o>=0&&o<this.n&&n&&(this.writeCenter(o,n[0],n[1],n[2]),s&&this.writeWing(o,s[0],s[1],s[2],r),l+=1,a=!0),a&&this.touch(),l<2){this.mesh.visible=!1;return}this.geo.setDrawRange(t*6,(l-1)*6),this.mesh.visible=!0}dispose(){this.geo.dispose(),this.mat.dispose()}},f0=`
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
}`,p0=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uOpacity;
varying vec3 vColor;
void main() {
  #include <logdepthbuf_fragment>
  gl_FragColor = vec4(vColor, uOpacity);
}`,Ns=class{constructor(t,e=2,n=.9){j(this,"mesh");j(this,"mat");j(this,"pos");j(this,"oth");j(this,"col");j(this,"geo");j(this,"cap");j(this,"count",0);t=Math.max(1,t),this.cap=t;let s=t*4;this.pos=new Float32Array(s*3),this.oth=new Float32Array(s*3),this.col=new Float32Array(s*3);let r=new Float32Array(s),o=new Uint32Array(t*6);for(let c=0;c<t;c++){r.set([-1,1,1,-1],c*4);let h=c*4;o.set([h,h+1,h+3,h,h+3,h+2],c*6)}let a=new Te,l=c=>new he(c,3).setUsage(rs);a.setAttribute("position",l(this.pos)),a.setAttribute("other",l(this.oth)),a.setAttribute("color",l(this.col)),a.setAttribute("side",new he(r,1)),a.setIndex(new he(o,1)),a.setDrawRange(0,0),this.geo=a,this.mat=new $e({vertexShader:f0,fragmentShader:p0,transparent:!0,depthWrite:!1,side:Ce,uniforms:{uWidth:{value:e},uRes:{value:new Lt(800,600)},uOpacity:{value:n}}}),this.mesh=new xe(a,this.mat),this.mesh.frustumCulled=!1}begin(){this.count=0}add(t,e,n,s,r,o,a,l=a){if(this.count>=this.cap)return;let c=this.count*4,h=this.pos,u=this.oth,f=this.col,d=(_,g,m,p,E)=>{_[g*3]=m,_[g*3+1]=p,_[g*3+2]=E};d(h,c,t,e,n),d(h,c+1,t,e,n),d(h,c+2,s,r,o),d(h,c+3,s,r,o),d(u,c,s,r,o),d(u,c+1,s,r,o),d(u,c+2,t,e,n),d(u,c+3,t,e,n),d(f,c,a.r,a.g,a.b),d(f,c+1,a.r,a.g,a.b),d(f,c+2,l.r,l.g,l.b),d(f,c+3,l.r,l.g,l.b),this.count++}end(){this.geo.setDrawRange(0,this.count*6);for(let t of["position","other","color"])this.geo.getAttribute(t).needsUpdate=!0}};var ls=[[0,.3],[.8,.32],[1,.55],[1.2,.62],[1.4,.58],[1.8,.48],[2.2,.43],[2.7,.37],[3.2,.34],[3.7,.32],[5,.29]];function m0(i){for(let t=0;t<ls.length-1;t++)if(i<=ls[t+1][0]){let e=ls[t],n=ls[t+1];return e[1]+(n[1]-e[1])*(i-e[0])/(n[0]-e[0])}return ls[ls.length-1][1]}function g0(i){i=Math.max(0,i);let t,e;return i<=11e3?(t=288.15-.0065*i,e=101325*Math.pow(t/288.15,5.2559)):(t=216.65,e=22632*Math.exp(-(i-11e3)/6341.6)),[e/(287.05*t),Math.sqrt(1.4*287.05*t)]}function hh(i,t,e,n,s,r,o,a){let l=Math.PI*i.caliber*i.caliber/4,c=(e+n)/2;i.loft&&(c+=Math.min(5e3,.08*t));let[h,u]=g0(c),f=n-e,d=Math.hypot(t,f),_=d>0?f/d:0,g=Math.max(280,1.1*a),m=Math.min(i.life,i.guidanceTime);m<=0&&(m=60);let p=Math.max(s,50),E=0,x=0,y=.1;for(;x<m;){let M=i.burn>0?i.mass-(i.mass-i.massEnd)*Math.min(x,i.burn)/i.burn:i.mass,T=x<i.burn?i.thrust:0,P=.5*h*p*p*l*i.cxK*m0(p/u);p+=((T-P)/M-9.81*_)*y,i.machMax>0&&(p=Math.min(p,i.machMax*u)),E+=p*y,x+=y;let R=t+r*x,S=o*x;if(E>=Math.sqrt(R*R+S*S+f*f))return p>=g||x<i.burn;if(p<g&&x>i.burn)return!1}return!1}function Yr(i,t,e,n,s,r){if(!i||i.thrust<=0||i.caliber<=0||i.mass<=0)return[0,0];let o=r*Math.PI/180,a=(l,c)=>{let h=1e3,u=25e4;if(!hh(i,h,t,n,e,l,c,s))return 0;for(let f=0;f<22&&u-h>100;f++){let d=(h+u)/2;hh(i,d,t,n,e,l,c,s)?h=d:u=d}return h};return[Math.round(a(-s*Math.cos(o),s*Math.sin(o))),Math.round(a(s,0))]}var tn,cs=null;async function qr(){if(tn!==void 0)return tn;tn=null;try{let i=await fetch("/api/catalog/weapons.json");i.ok&&(tn=(await i.json()).missiles)}catch{}if(tn){cs=new Map;for(let i of Object.keys(tn).sort()){let t=String(tn[i].name||"").toLowerCase();!cs.has(t)&&tn[i].physics&&cs.set(t,i)}}return tn}function Zr(i,t){if(!tn||!cs)return null;let e=i&&tn[i]?i:cs.get(t.toLowerCase())||"";if(!e){let r=t.toLowerCase(),o="";for(let[a,l]of cs)a.length>r.length&&a.startsWith(r)&&(!o||a<o)&&(o=a,e=l)}let n=e?tn[e]:null;if(!n||!n.physics)return null;let s=n.physics;return{name:n.name,caliber:s.caliberM||0,cxK:s.cxK||1,thrust:s.thrustN||0,burn:s.burnS||0,mass:s.massKg||0,massEnd:s.massEndKg||s.massKg||0,machMax:s.machMax||0,life:s.lifeS||60,guidanceTime:s.guidanceTimeS||60,loft:!!s.loft,multipath:s.multipath||null,guidance:n.guidance||""}}var Be={me:16769357,friend:5088255,enemy:16738877,neutral:11055292,flare:16765514,chaff:14015974,bomb:16757575,dead:9081760},Ae=Math.PI/180,uh=18,dh=5;function _0(){let i=[],t=(c,h,u)=>i.push(...c,...h,...u),e=[0,0,-9],n=[0,.2,8.5],s=[0,1.3,.5],r=[0,-.9,.5],o=[-1.3,0,1],a=[1.3,0,1];t(e,s,a),t(e,o,s),t(e,a,r),t(e,r,o),t(n,a,s),t(n,s,o),t(n,r,a),t(n,o,r),t([1,0,-2.5],[6.5,0,4.5],[1,0,5.5]),t([-1,0,-2.5],[-1,0,5.5],[-6.5,0,4.5]),t([.8,0,6],[3.4,0,9],[.8,0,9]),t([-.8,0,6],[-.8,0,9],[-3.4,0,9]),t([0,.9,4.5],[0,4.2,8.6],[0,.6,8.6]);let l=new Te;return l.setAttribute("position",new we(i,3)),l.computeVertexNormals(),l}var fh=new Map;function ph(i,t,e){let n=i+"_"+t+"_"+e,s=fh.get(n);if(s)return s;let r=Math.max(4,Math.ceil(i/6)),o=[],a=(u,f)=>[Math.sin(u*Ae)*Math.cos(f*Ae),Math.sin(f*Ae),-Math.cos(u*Ae)*Math.cos(f*Ae)],l=(u,f,d)=>o.push(...u,...f,...d),c=[0,0,0];for(let u=0;u<r;u++){let f=-i+2*i*u/r,d=-i+2*i*(u+1)/r,_=a(f,e),g=a(d,e),m=a(f,t),p=a(d,t);l(c,_,g),l(c,p,m),l(_,m,p),l(_,p,g)}l(c,a(-i,t),a(-i,e)),l(c,a(i,e),a(i,t));let h=new Te;return h.setAttribute("position",new we(o,3)),fh.set(n,h),h}function mh(i,t,e){let n=i*Ae,s=t*Ae,r=e*Ae,o=Math.sin(n),a=Math.cos(n),l=Math.sin(s),c=Math.cos(s),h=Math.sin(r),u=Math.cos(r),f=a,d=-o,_=-o*l,g=c,m=-a*l,p=f*u-_*h,E=-g*h,x=d*u-m*h;return[p,E,-x,g*u]}function y0(){let i=document.createElement("canvas");i.width=i.height=32;let t=i.getContext("2d");return t.strokeStyle="#fff",t.lineWidth=5,t.lineCap="round",t.beginPath(),t.moveTo(6,6),t.lineTo(26,26),t.moveTo(26,6),t.lineTo(6,26),t.stroke(),new Is(i)}var Kr=class{constructor(t,e,n){j(this,"renderer");j(this,"scene",new Ir);j(this,"camera");j(this,"cam2d");j(this,"mode","3d");j(this,"controls");j(this,"session",null);j(this,"settings");j(this,"vis",[]);j(this,"byKind",{});j(this,"meSlot",-1);j(this,"myTeam",0);j(this,"selected",-1);j(this,"measure",-1);j(this,"follow",-1);j(this,"onSelect",()=>{});j(this,"t",0);j(this,"root",new $n);j(this,"terrainMesh",null);j(this,"terrainTex",null);j(this,"acGeo",_0());j(this,"msGeo");j(this,"beamGeo");j(this,"cmPts");j(this,"bombPts");j(this,"groundPts");j(this,"deadPts");j(this,"sticks");j(this,"desig");j(this,"seeker");j(this,"measureSeg");j(this,"vectors");j(this,"dlzSeg");j(this,"res",new Lt(800,600));j(this,"dlzInfo",null);j(this,"dlzCache",null);j(this,"onHover",()=>{});j(this,"selRing");j(this,"labelLayer");j(this,"container");j(this,"s",{x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0});j(this,"lastLabelText",0);j(this,"followPrev",new k);j(this,"followHas",!1);j(this,"tmpM",new ge);j(this,"vX",new k);j(this,"vY",new k);j(this,"vZ",new k);j(this,"vP",new k);j(this,"downAt",null);j(this,"airfieldLines",null);j(this,"areaLines",null);j(this,"mapLabels",[]);this.container=t,this.labelLayer=e,this.settings=n,this.renderer=new Pr({antialias:!0,logarithmicDepthBuffer:!0}),this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),this.renderer.setClearColor(1448999),t.appendChild(this.renderer.domElement),this.camera=new Oe(45,1,5,9e5),this.camera.position.set(0,4e4,6e4),this.controls=new Wr(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.maxPolarAngle=Math.PI*.495,this.controls.minDistance=60,this.controls.maxDistance=4e5,this.controls.zoomToCursor=!0,this.controls.screenSpacePanning=!1,this.cam2d=new ns(-1,1,1,-1,10,9e5),this.cam2d.up.set(0,0,-1),this.cam2d.position.set(0,3e5,0),this.cam2d.lookAt(0,0,0),this.cam2d.zoom=.006,this.scene.add(this.root),this.scene.add(new kr(16777215,1.5));let s=new Or(16777215,2);s.position.set(-.4,1,.5),this.scene.add(s),this.msGeo=new Ls(.7,dh,6),this.msGeo.rotateX(-Math.PI/2),this.beamGeo=new Ls(1,1,20,1,!0),this.beamGeo.translate(0,-.5,0),this.beamGeo.rotateX(Math.PI/2);let r=this.renderer.domElement,o=null;r.addEventListener("pointerdown",a=>{this.downAt={x:a.clientX,y:a.clientY},this.mode==="2d"&&(o={x:a.clientX,y:a.clientY},r.setPointerCapture(a.pointerId))}),r.addEventListener("pointermove",a=>{if(!o&&!(a.buttons&7)){let c=r.getBoundingClientRect(),h=a.clientX-c.left,u=a.clientY-c.top;this.onHover(this.pick(h,u),h,u)}if(this.mode!=="2d"||!o)return;let l=1/this.cam2d.zoom;this.follow<0&&(this.cam2d.position.x-=(a.clientX-o.x)*l,this.cam2d.position.z-=(a.clientY-o.y)*l),o={x:a.clientX,y:a.clientY}}),r.addEventListener("pointercancel",()=>{o=null}),r.addEventListener("pointerleave",()=>this.onHover(-1,0,0)),r.addEventListener("wheel",a=>{if(this.mode!=="2d")return;a.preventDefault();let l=r.getBoundingClientRect(),c=this.cam2d,h=a.clientX-l.left-l.width/2,u=a.clientY-l.top-l.height/2,f=c.zoom,d=Math.min(2,Math.max(.002,f*Math.pow(1.0015,-a.deltaY)));this.follow<0&&(c.position.x+=h/f-h/d,c.position.z+=u/f-u/d),c.zoom=d,c.updateProjectionMatrix()},{passive:!1}),r.addEventListener("pointerup",a=>{if(o=null,!this.downAt)return;let l=Math.hypot(a.clientX-this.downAt.x,a.clientY-this.downAt.y);if(this.downAt=null,l<5&&a.button===0){let c=r.getBoundingClientRect(),h=this.pick(a.clientX-c.left,a.clientY-c.top);h>=0&&this.onSelect(h,a.shiftKey)}}),r.addEventListener("dblclick",a=>{let l=r.getBoundingClientRect(),c=this.pick(a.clientX-l.left,a.clientY-l.top);c>=0&&(this.onSelect(c,!1),this.setFollow(c))}),new ResizeObserver(()=>this.resize()).observe(t),this.resize()}resize(){let t=this.container.clientWidth||800,e=this.container.clientHeight||600;this.renderer.setSize(t,e,!1),this.renderer.domElement.style.width=t+"px",this.renderer.domElement.style.height=e+"px",this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.res.set(t,e);let n=this.cam2d;n.left=-t/2,n.right=t/2,n.top=e/2,n.bottom=-e/2,n.updateProjectionMatrix()}setSession(t){this.session=t,this.root.clear(),this.labelLayer.innerHTML="",this.vis=[],this.byKind={aircraft:[],missile:[],countermeasure:[],bomb:[],ground:[]},this.selected=this.measure=this.follow=-1,this.followHas=!1,this.resolveMe(),this.buildTerrain(t.terrain);for(let r of t.units){let o={u:r,mesh:null,trail:null,wing:null,beam:null,scan:null,scanKey:"",label:null,labelText:"",alive:!1,shown:!1,px:0,py:0,pz:0,sx:0,sy:0,onScreen:!1,color:16777215,focus:!1};if(this.vis.push(o),this.byKind[r.kind].push(o),r.kind==="aircraft"||r.kind==="missile"){let a=new Ur({color:16777215,side:Ce,flatShading:!0});o.mesh=new xe(r.kind==="aircraft"?this.acGeo:this.msGeo,a),o.mesh.matrixAutoUpdate=!1,o.mesh.frustumCulled=!1,o.mesh.visible=!1,this.root.add(o.mesh);let l=r.n+1,c=new Float32Array(l*3),h=new Float32Array(l),u=r.heading?new Float32Array(l*3):null,f=r.heading?new Float32Array(l):null;for(let d=0;d<l;d++){let _=Math.min(d,r.n-1);if(c[d*3]=r.x[_],c[d*3+1]=r.y[_],c[d*3+2]=-r.z[_],h[d]=(r.t[_]-t.t0)/1e3,u&&f){let g=mh(r.heading[_],r.pitch[_],r.roll[_]);u[d*3]=g[0],u[d*3+1]=g[1],u[d*3+2]=g[2],f[d]=g[3]}}o.trail=new Xr(c,u,f,h),o.trail.mat.uniforms.uRes.value=this.res,this.root.add(o.trail.mesh)}}let e=(r,o,a)=>{let l=new Te;l.setAttribute("position",new he(new Float32Array(Math.max(1,r)*3),3).setUsage(rs)),l.setAttribute("color",new he(new Float32Array(Math.max(1,r)*3),3).setUsage(rs));let c=new Ps({size:o,sizeAttenuation:!1,vertexColors:!0,map:a||null,alphaTest:a?.3:0,transparent:!!a}),h=new Lr(l,c);return h.frustumCulled=!1,l.setDrawRange(0,0),this.root.add(h),h};this.cmPts=e(this.byKind.countermeasure.length,3.5),this.bombPts=e(this.byKind.bomb.length,4.5),this.groundPts=e(this.byKind.ground.length,5),this.deadPts=e(this.byKind.aircraft.length,11,y0());let n=(r,o,a)=>{let l=new Ns(r,o,a);return l.mat.uniforms.uRes.value=this.res,this.root.add(l.mesh),l};this.sticks=n(this.byKind.aircraft.length,1,.35),this.desig=n(this.byKind.aircraft.length*8,1.6,.9),this.seeker=n(this.byKind.missile.length,1.4,.85),this.measureSeg=n(1,2,.95),this.vectors=n(this.byKind.aircraft.length,1.5,.8),this.dlzSeg=n(256,2,.85),this.dlzCache=null,this.dlzInfo=null;let s=new Dr(.82,1,40);this.selRing=new xe(s,new bn({color:16777215,side:Ce,transparent:!0,opacity:.9,depthTest:!1})),this.selRing.visible=!1,this.selRing.renderOrder=10,this.root.add(this.selRing),this.buildMapOverlays(),this.restyle(),this.homeCamera()}resolveMe(){let t=this.session,e=(this.settings.me||"").trim().toLowerCase();if(this.meSlot=-1,this.myTeam=0,e)for(let n of t.players)n.name.toLowerCase()===e&&(this.meSlot=n.slot,this.myTeam=n.team);if(this.meSlot<0&&e){for(let n of t.players)if(n.name.toLowerCase().includes(e)){this.meSlot=n.slot,this.myTeam=n.team;break}}}colorFor(t){if(t.owner>=0&&t.owner===this.meSlot)return Be.me;if(!t.team)return Be.neutral;let e=this.myTeam||1;return t.team===e?Be.friend:Be.enemy}isFocus(t){if(t.id===this.selected||t.id===this.measure)return!0;let e=this.session;if(t.owner>=0){let n=e.playerBySlot.get(t.owner);if(n&&n.highlight)return!0;let s=this.selected>=0?e.units[this.selected]:null;if(s&&s.owner===t.owner)return!0}return!1}restyle(){if(!this.session)return;let t=new It,e=new It(16777215);for(let o of this.vis){if(o.color=this.colorFor(o.u),o.focus=this.isFocus(o.u),o.mesh){t.set(o.color),o.u.kind==="missile"&&t.lerp(e,.35),o.mesh.material.color.copy(t);let a=o.trail.mat.uniforms;a.uColor.value.copy(t),a.uOpacity.value=o.focus?1:o.u.kind==="missile"?.8:.55}o.label&&o.label.classList.toggle("focus",o.focus)}let n=this.byKind.ground,s=this.groundPts.geometry.getAttribute("position"),r=this.groundPts.geometry.getAttribute("color");for(let o=0;o<n.length;o++){let a=n[o].u;t.set(this.colorFor(a)).multiplyScalar(.75),r.setXYZ(o,t.r,t.g,t.b),s.setXYZ(o,a.x[0],Math.max(a.y[0],wi(this.session.terrain,a.x[0],a.z[0]))+8,-a.z[0])}s.needsUpdate=!0,r.needsUpdate=!0}buildMapOverlays(){let t=this.session;this.mapLabels=[],this.airfieldLines=null,this.areaLines=null;let e=t.map;if(!e)return;let n=(u,f)=>wi(t.terrain,u,f),s=(u,f,d)=>{let _=u.length/6,g=new Ns(_,1.6,d);g.mat.uniforms.uRes.value=this.res;let m=new It;g.begin();for(let p=0;p<_;p++)m.setRGB(f[p*6],f[p*6+1],f[p*6+2]),g.add(u[p*6],u[p*6+1],u[p*6+2],u[p*6+3],u[p*6+4],u[p*6+5],m);return g.end(),this.root.add(g.mesh),g},r=(u,f,d,_,g)=>{let m=document.createElement("div");m.className="lbl map",m.textContent=u,m.style.display="none",this.labelLayer.appendChild(m),this.mapLabels.push({x:f,y:d,z:-_,div:m,kind:g})},o=new It,a=[],l=[],c=(u,f,d,_,g)=>{a.push(u,n(u,f)+g,-f,d,n(d,_)+g,-_),l.push(o.r,o.g,o.b,o.r,o.g,o.b)},h=this.myTeam||1;for(let u of e.airfields||[]){o.set(u.team===h?Be.friend:u.team?Be.enemy:Be.neutral).lerp(new It(16777215),.35);let f=(u.lengthM||0)/2,d=Math.max(60,(u.widthM||0)/2),_=(u.headingDeg||0)*Ae;if(f>0){let g=Math.sin(_),m=Math.cos(_),p=Math.cos(_),E=-Math.sin(_),x=[[-f,-d],[f,-d],[f,d],[-f,d]].map(([y,M])=>[u.x+g*y+p*M,u.z+m*y+E*M]);for(let y=0;y<4;y++)c(x[y][0],x[y][1],x[(y+1)%4][0],x[(y+1)%4][1],6);c(u.x-g*f,u.z-m*f,u.x+g*f,u.z+m*f,6)}else for(let g=0;g<16;g++){let m=g/16*6.2832,p=(g+1)/16*6.2832;c(u.x+800*Math.cos(m),u.z+800*Math.sin(m),u.x+800*Math.cos(p),u.z+800*Math.sin(p),6)}r(u.team===h?"My team airfield":"Enemy airfield",u.x,n(u.x,u.z)+6,u.z,"airfield")}a.length&&(this.airfieldLines=s(a,l,.95)),a=[],l=[];for(let u of e.areas||[])if(u.role!=="airSpawn"){if(o.set(u.role==="missionBorder"?16777215:u.role==="reloadArea"?10475176:14272511),u.type==="Sphere"||u.type==="Cylinder"){let f=u.sizeX/2,d=96;for(let _=0;_<d;_++){let g=_/d*6.2832,m=(_+1)/d*6.2832;c(u.x+f*Math.cos(g),u.z+f*Math.sin(g),u.x+f*Math.cos(m),u.z+f*Math.sin(m),40)}r(u.name.replace(/_/g," "),u.x,n(u.x,u.z+f)+40,u.z+f,"area")}else if(u.type==="Box"){let f=(u.rotationDeg||0)*Ae,d=Math.sin(f),_=Math.cos(f),g=Math.cos(f),m=-Math.sin(f),p=u.sizeX/2,E=u.sizeZ/2,x=[[-p,-E],[p,-E],[p,E],[-p,E]].map(([y,M])=>[u.x+d*y+g*M,u.z+_*y+m*M]);for(let y=0;y<4;y++)for(let M=0;M<16;M++){let T=x[y],P=x[(y+1)%4];c(T[0]+(P[0]-T[0])*M/16,T[1]+(P[1]-T[1])*M/16,T[0]+(P[0]-T[0])*(M+1)/16,T[1]+(P[1]-T[1])*(M+1)/16,40)}r(u.name.replace(/_/g," "),x[2][0],n(x[2][0],x[2][1])+40,x[2][1],"area")}}a.length&&(this.areaLines=s(a,l,.6))}updateMapOverlays(t,e){let n=this.settings;this.airfieldLines&&(this.airfieldLines.mesh.visible=n.airfields),this.areaLines&&(this.areaLines.mesh.visible=n.areas);for(let s of this.mapLabels){let r=s.kind==="airfield"?n.airfields:n.areas,o=!1;r&&(this.vP.set(s.x,s.y,s.z).project(this.cam),o=this.vP.z<1&&Math.abs(this.vP.x)<1&&Math.abs(this.vP.y)<1,o&&(s.div.style.transform=`translate(${Math.round((this.vP.x*.5+.5)*t+6)}px, ${Math.round((-this.vP.y*.5+.5)*e-6)}px)`));let a=o?"":"none";s.div.style.display!==a&&(s.div.style.display=a)}}buildTerrain(t){let e=t?{x0:t.x0,z0:t.z0,x1:t.x1,z1:t.z1}:{x0:-65536,z0:-65536,x1:65536,z1:65536},n=513,s=new Float32Array(n*n*3),r=new Float32Array(n*n*2);for(let u=0;u<n;u++)for(let f=0;f<n;f++){let d=e.x0+(e.x1-e.x0)*f/(n-1),_=e.z0+(e.z1-e.z0)*u/(n-1),g=(u*n+f)*3;s[g]=d,s[g+1]=t?wi(t,d,_):0,s[g+2]=-_,r[(u*n+f)*2]=f/(n-1),r[(u*n+f)*2+1]=u/(n-1)}let o=new Uint32Array((n-1)*(n-1)*6),a=0;for(let u=0;u<n-1;u++)for(let f=0;f<n-1;f++){let d=u*n+f,_=d+1,g=d+n,m=g+1;o[a++]=d,o[a++]=_,o[a++]=g,o[a++]=_,o[a++]=m,o[a++]=g}let l=new Te;l.setAttribute("position",new he(s,3)),l.setAttribute("uv",new he(r,2)),l.setIndex(new he(o,1));let c=document.createElement("canvas");c.width=c.height=1024,this.terrainTex=new Is(c),this.terrainTex.colorSpace=He,this.terrainTex.anisotropy=8,this.terrainMesh=new xe(l,new bn({map:this.terrainTex})),this.root.add(this.terrainMesh);let h=new xe(new es(2e6,2e6),new bn({color:1053981}));h.rotation.x=-Math.PI/2,h.position.y=(t?Math.min(t.hMin,t.water):0)-30,this.root.add(h),this.paintTerrain()}paintTerrain(){if(!this.terrainTex||!this.session)return;let t=this.session.terrain,e=this.terrainTex.image,n=e.width,s=e.getContext("2d"),r=s.createImageData(n,n),o=r.data,a=[[58,74,54],[92,104,72],[128,124,92],[150,140,118],[186,180,170],[225,224,220]];if(t){let l=t.n,c=t.h,h=Math.max(1,t.hMax-Math.max(t.hMin,t.water)),u=Math.max(t.hMin,t.water),f=-.6,d=.6,_=.55,g=Math.hypot(f,_,d);for(let m=0;m<l;m++)for(let p=0;p<l;p++){let E=c[m*l+p],x=((l-1-m)*n+p)*4;if(E<=t.water+.5){o[x]=38,o[x+1]=58,o[x+2]=82,o[x+3]=255;continue}let y=Math.min(.999,Math.max(0,(E-u)/h))*(a.length-1),M=Math.floor(y);y-=M;let T=a[M][0]+(a[M+1][0]-a[M][0])*y,P=a[M][1]+(a[M+1][1]-a[M][1])*y,R=a[M][2]+(a[M+1][2]-a[M][2])*y,S=1;if(this.settings.shade){let v=Math.max(0,p-1),A=Math.min(l-1,p+1),L=Math.max(0,m-1),I=Math.min(l-1,m+1),U=(c[m*l+A]-c[m*l+v])/((A-v)*t.cell)*1.6,z=(c[I*l+p]-c[L*l+p])/((I-L)*t.cell)*1.6,H=Math.hypot(U,1,z);S=.5+.62*Math.max(0,(-U*f+_-z*d)/(H*g))/(_/g),S=Math.min(1.3,S)}o[x]=Math.min(255,T*S),o[x+1]=Math.min(255,P*S),o[x+2]=Math.min(255,R*S),o[x+3]=255}}else for(let l=0;l<o.length;l+=4)o[l]=44,o[l+1]=52,o[l+2]=60,o[l+3]=255;if(s.putImageData(r,0,0),this.settings.grid){let l=t?t.x0:-65536,c=t?t.x1:65536,h=t?t.z0:-65536,u=t?t.z1:65536;s.lineWidth=1;for(let f=Math.ceil(l/1e4)*10;f*1e3<=c;f+=10){let d=(f*1e3-l)/(c-l)*n;s.strokeStyle=f===0?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.16)",s.beginPath(),s.moveTo(d,0),s.lineTo(d,n),s.stroke()}for(let f=Math.ceil(h/1e4)*10;f*1e3<=u;f+=10){let d=n-(f*1e3-h)/(u-h)*n;s.strokeStyle=f===0?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.16)",s.beginPath(),s.moveTo(0,d),s.lineTo(n,d),s.stroke()}s.strokeStyle="rgba(255,255,255,0.5)",s.lineWidth=2,s.strokeRect(1,1,n-2,n-2)}this.terrainTex.needsUpdate=!0}get cam(){return this.mode==="2d"?this.cam2d:this.camera}setMode(t){if(t!==this.mode){if(t==="2d"){let e=this.controls.target;this.cam2d.position.set(e.x,3e5,e.z);let n=this.container.clientHeight||600,s=this.camera.position.distanceTo(e);this.cam2d.zoom=Math.min(.05,Math.max(.002,n/(2*s*Math.tan(this.camera.fov*Ae/2)))),this.cam2d.updateProjectionMatrix()}else{let e=this.camera.position.clone().sub(this.controls.target);this.controls.target.set(this.cam2d.position.x,this.controls.target.y,this.cam2d.position.z),this.camera.position.copy(this.controls.target).add(e)}this.mode=t,this.controls.enabled=t==="3d",this.followHas=!1}}metresPerPx(){return 1/this.cam2d.zoom}homeCamera(){let t=this.session,e=0,n=0,s=0;for(let l of this.byKind.aircraft)if(l.u.player>=0){let c=l.u.n>>1;e+=l.u.x[c],n+=l.u.z[c],s++}s&&(e/=s,n/=s);let r=wi(t.terrain,e,n);this.controls.target.set(e,r+2e3,-n),this.camera.position.set(e-15e3,r+55e3,-n+6e4),this.follow=-1,this.followHas=!1,this.controls.zoomToCursor=!0,this.controls.update();let o=this.container.clientWidth||800,a=this.container.clientHeight||600;this.cam2d.position.set(0,3e5,0),this.cam2d.zoom=Math.min(o,a)/14e4,this.cam2d.updateProjectionMatrix()}topView(){if(this.mode==="2d")return;let t=this.controls.target,e=Math.max(2e4,this.camera.position.distanceTo(t));this.camera.position.set(t.x,t.y+e,t.z+e*.02),this.controls.update()}setFollow(t){if(this.follow=t,this.followHas=!1,this.controls.zoomToCursor=t<0,t>=0&&this.mode==="2d")this.unitPos(this.vis[t].u,this.t,this.vP),this.cam2d.position.x=this.vP.x,this.cam2d.position.z=this.vP.z,this.cam2d.zoom<.02&&(this.cam2d.zoom=.02,this.cam2d.updateProjectionMatrix());else if(t>=0){let e=this.vis[t];this.unitPos(e.u,this.t,this.vP);let n=this.camera.position.clone().sub(this.controls.target),s=e.u.kind==="missile"?2500:6e3;n.length()>s*4&&n.setLength(s),this.controls.target.copy(this.vP),this.camera.position.copy(this.vP).add(n),this.followPrev.copy(this.vP),this.followHas=!0}}unitPos(t,e,n){let s=Math.min(Math.max(e,t.tStart),t.tEnd);return an(t,s,this.s),n.set(this.s.x,this.s.y,-this.s.z)}playerHidden(t){if(t.owner<0)return!1;let e=this.session.playerBySlot.get(t.owner);return!!e&&e.hidden}update(t){let e=this.session;if(!e)return;this.t=t;let n=this.settings,s=this.cam,r=this.mode==="2d",o=this.container.clientHeight||600,a=this.container.clientWidth||800,l=r?1/this.cam2d.zoom:2*Math.tan(this.camera.fov*Ae/2)/o,c=this.s;if(this.follow>=0){let E=this.vis[this.follow].u;if(this.unitPos(E,t,this.vP),r)this.cam2d.position.x=this.vP.x,this.cam2d.position.z=this.vP.z;else{if(this.followHas){let x=this.vP.clone().sub(this.followPrev);s.position.add(x)}this.controls.target.copy(this.vP),this.followPrev.copy(this.vP),this.followHas=!0}}r||this.controls.update(),s.updateMatrixWorld();let h=0;this.sticks.begin(),this.desig.begin(),this.vectors.begin();let u=new It,f=this.deadPts.geometry.getAttribute("position"),d=this.deadPts.geometry.getAttribute("color"),_=new It;for(let E of["aircraft","missile"]){let x=E==="aircraft",y=x?n.acTrail:n.msTrail;for(let M of this.byKind[E]){let T=M.u,P=!this.playerHidden(T)&&(x?n.ai||!T.ai:n.missiles),R=t>=T.tStart&&t<=T.tEnd,S=t>T.tEnd;if(M.alive=R,M.shown=P&&R,M.onScreen=!1,!P||t<T.tStart){M.mesh.visible=!1,M.trail.mesh.visible=!1,M.beam&&(M.beam.visible=!1),M.scan&&(M.scan.visible=!1);continue}if(R){an(T,t,c),M.px=c.x,M.py=c.y,M.pz=-c.z;let G=c.heading*Ae,rt=r?0:c.pitch*Ae,ht=r?0:c.roll*Ae,Mt=Math.sin(G),Ft=Math.cos(G),jt=Math.sin(rt),K=Math.cos(rt),et=Math.sin(ht),vt=Math.cos(ht),ot=Mt*K,Rt=jt,Dt=Ft*K,Ht=Ft,le=-Mt,Yt=-Mt*jt,pe=K,F=-Ft*jt,Re=Ht*vt-Yt*et,Gt=-pe*et,Wt=le*vt-F*et,Ct=Yt*vt+Ht*et,se=pe*vt,At=F*vt+le*et;this.vX.set(Re,Gt,-Wt),this.vY.set(Ct,se,-At),this.vZ.set(-ot,-Rt,Dt);let C=r?1:Math.hypot(s.position.x-M.px,s.position.y-M.py,s.position.z-M.pz),b=(x?26:12)*(M.focus?1.3:1),B=Math.max(1,b*l*C/(x?uh:dh));if(this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(B,B,B)),this.tmpM.setPosition(M.px,M.py,M.pz),M.mesh.matrix.copy(this.tmpM),M.mesh.visible=!0,M.wing=x&&T.heading?mh(c.heading,c.pitch,c.roll):null,this.vP.set(M.px,M.py,M.pz).project(s),M.onScreen=this.vP.z<1&&Math.abs(this.vP.x)<1.05&&Math.abs(this.vP.y)<1.05,M.sx=(this.vP.x*.5+.5)*a,M.sy=(-this.vP.y*.5+.5)*o,x){if(n.sticks&&!r){let X=wi(e.terrain,c.x,c.z);_.set(M.color),this.sticks.add(M.px,M.py,M.pz,M.px,X,M.pz,_)}if(n.vector){let X=Math.min(T.n-1,c.i+1),mt=Math.max(0,c.i-1),it=(T.t[X]-T.t[mt])/1e3;if(it>0){let dt=10/it;_.set(M.color),this.vectors.add(M.px,M.py,M.pz,M.px+(T.x[X]-T.x[mt])*dt,M.py+(T.y[X]-T.y[mt])*dt,M.pz-(T.z[X]-T.z[mt])*dt,_)}}let Z=Ti(T,t);if(Z&&Z.on&&(n.radar==="all"||n.radar==="focus"&&M.focus)){M.beam||(M.beam=new xe(this.beamGeo,new bn({color:M.color,transparent:!0,opacity:.14,side:Ce,depthWrite:!1})),M.beam.matrixAutoUpdate=!1,M.beam.frustumCulled=!1,this.root.add(M.beam));let X=Z.az*Ae,mt=Z.el*Ae,it=Math.cos(mt),dt=ot*it*Math.cos(X)+Re*it*Math.sin(X)+Ct*Math.sin(mt),qt=Rt*it*Math.cos(X)+Gt*it*Math.sin(X)+se*Math.sin(mt),nt=Dt*it*Math.cos(X)+Wt*it*Math.sin(X)+At*Math.sin(mt),_t=Z.state==="track",Pt=_t&&Z.targetRange>100?Z.targetRange:2e4,bt=n.scanZone&&!_t?Pl(e.radars,T.cls,Z.sensor,Z.pattern):null,xt=bt&&bt.type==="pyramide"&&bt.azHalfDeg>0&&bt.elHalfDeg>0;if(xt){let Zt=bt.centerElevationDeg||0,D=bt.azHalfDeg+"_"+(Zt-bt.elHalfDeg)+"_"+(Zt+bt.elHalfDeg);M.scan?M.scanKey!==D&&(M.scan.geometry=ph(bt.azHalfDeg,Zt-bt.elHalfDeg,Zt+bt.elHalfDeg),M.scanKey=D):(M.scan=new xe(ph(bt.azHalfDeg,Zt-bt.elHalfDeg,Zt+bt.elHalfDeg),new bn({color:M.color,transparent:!0,opacity:.08,side:Ce,depthWrite:!1})),M.scan.matrixAutoUpdate=!1,M.scan.frustumCulled=!1,this.root.add(M.scan),M.scanKey=D),(bt.rollStabDeg||0)>=60?(this.vX.set(Ft,0,Mt),this.vY.set(0,1,0),this.vZ.set(-Mt,0,Ft)):(this.vX.set(Re,Gt,-Wt),this.vY.set(Ct,se,-At),this.vZ.set(-ot,-Rt,Dt)),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(3e4,3e4,3e4)),this.tmpM.setPosition(M.px,M.py,M.pz),M.scan.matrix.copy(this.tmpM),M.scan.visible=!0,M.scan.material.color.set(M.color)}else M.scan&&(M.scan.visible=!1);let Xt=Pt*Math.tan((_t?1.5:xt?1:3.5)*Ae);this.vZ.set(-dt,-qt,nt).normalize(),this.vX.set(0,1,0).cross(this.vZ),this.vX.lengthSq()<1e-6&&this.vX.set(1,0,0),this.vX.normalize(),this.vY.crossVectors(this.vZ,this.vX),this.tmpM.makeBasis(this.vX,this.vY,this.vZ),this.tmpM.scale(this.vP.set(Xt,Xt,Pt)),this.tmpM.setPosition(M.px,M.py,M.pz),M.beam.matrix.copy(this.tmpM),M.beam.visible=!0;let Ot=M.beam.material;Ot.color.set(M.color),Ot.opacity=_t?.26:.09}else M.beam&&(M.beam.visible=!1),M.scan&&(M.scan.visible=!1);if(Z&&Z.targets.length&&(n.desig==="all"||n.desig==="focus"&&(M.focus||Z.targets.some(X=>this.vis[X]&&this.vis[X].focus))))for(let X of Z.targets){let mt=this.vis[X];if(!mt)continue;let it=mt.u;t<it.tStart||t>it.tEnd||this.playerHidden(it)||(an(it,t,c),_.set(M.color),u.copy(_).multiplyScalar(.55),this.desig.add(M.px,M.py,M.pz,c.x,c.y,-c.z,_,u))}}}else if(M.mesh.visible=!1,M.beam&&(M.beam.visible=!1),M.scan&&(M.scan.visible=!1),x&&S&&T.destroyed&&n.dead){let G=T.n-1;f.setXYZ(h,T.x[G],T.y[G],-T.z[G]),_.set(M.color).lerp(new It(Be.dead),.5),d.setXYZ(h,_.r,_.g,_.b),h++}let v=M.trail;if(!(y!==0&&(R||S&&(x?n.dead:n.msKeep==="all"||n.msKeep==="focus"&&M.focus||t-T.tEnd<4e3)))){v.mesh.visible=!1;continue}let L=R?Ye(T,t):T.n-1,I=0;y>0&&(I=Ye(T,Math.max(0,t-y*1e3))+(t-y*1e3>T.t[0]?1:0)),I=Math.min(I,L);let U=x&&n.trailStyle==="ribbon"&&!!T.heading,z=v.mat.uniforms;if(z.uRibbon.value=U?1:0,z.uWidth.value=(n.lineWidth||2)+(M.focus?1:0),z.uHead.value=(t-e.t0)/1e3,z.uFade.value=y>0?y:0,U){let G=r?1:Math.hypot(s.position.x-M.px,s.position.y-M.py,s.position.z-M.pz);z.uHalf.value=Math.max(4,26*(M.focus?1.3:1)*l*G/uh*6.5*.8)}let H=null,Q=1;R&&M.wing&&(H=M.wing,Q=M.wing[3]),v.update(I,L,R?[M.px,M.py,M.pz]:null,H,Q)}}if(this.sticks.end(),this.sticks.mesh.visible=n.sticks&&!r,this.desig.end(),this.vectors.end(),this.deadPts.geometry.setDrawRange(0,h),f.needsUpdate=!0,d.needsUpdate=!0,this.seeker.begin(),n.seeker&&n.missiles){let E=new It(1,1,1),x=new It(1,.9,.3);for(let y of this.byKind.missile){if(!y.shown||!y.u.seekerMode)continue;let M=y.u,T=Ye(M,t);if(M.seekerMode[T]!==2)continue;let P=M.tex[T],R=M.tey[T],S=M.tez[T];!isFinite(P)||R<-500||Math.hypot(P-y.px,R-y.py,-S-y.pz)>8e4||this.seeker.add(y.px,y.py,y.pz,P,R,-S,E,x)}}this.seeker.end();let g=(E,x,y,M)=>{let T=0;if(y){let P=E.geometry.getAttribute("position"),R=E.geometry.getAttribute("color");for(let S of x){let v=S.u;t<v.tStart||t>v.tEnd||this.playerHidden(v)||(an(v,t,c),P.setXYZ(T,c.x,c.y,-c.z),_.set(M(v)),R.setXYZ(T,_.r,_.g,_.b),T++)}P.needsUpdate=!0,R.needsUpdate=!0}E.geometry.setDrawRange(0,T)};g(this.cmPts,this.byKind.countermeasure,n.cms,E=>E.cmType==="Flare"?Be.flare:Be.chaff),g(this.bombPts,this.byKind.bomb,n.bombs,()=>Be.bomb),this.groundPts.visible=n.ground,this.groundPts.geometry.setDrawRange(0,n.ground?this.byKind.ground.length:0);let m=this.selected>=0?this.vis[this.selected]:null;if(m&&m.shown){let E=r?1:s.position.distanceTo(this.vP.set(m.px,m.py,m.pz)),x=22*l*E;this.selRing.position.set(m.px,m.py,m.pz),this.selRing.quaternion.copy(s.quaternion),this.selRing.scale.setScalar(x),this.selRing.visible=!0}else this.selRing.visible=!1;let p=this.measure>=0?this.vis[this.measure]:null;this.measureSeg.begin(),m&&p&&m.shown&&p.shown&&this.measureSeg.add(m.px,m.py,m.pz,p.px,p.py,p.pz,new It(1,1,1)),this.measureSeg.end(),this.updateDlz(t,m),this.updateMapOverlays(a,o),this.updateLabels(),this.renderer.render(this.scene,s)}missileOf(t){let e=this.session,n=new Map,s="",r=0,o="";for(let a of e.launches){if(a.shooter!==t.id&&!(t.owner>=0&&a.shooterPlayer===t.owner))continue;let l=e.units[a.missile];if(!l||l.kind!=="missile")continue;let c=(n.get(l.name)||0)+1;n.set(l.name,c),c>r&&(!l.missile||l.missile.guidance!=="IR"||!s)&&(r=c,s=l.name,o=l.missile?l.missile.internalName:"")}return s?Zr(o,s):null}updateDlz(t,e){if(this.dlzSeg.begin(),this.dlzInfo=null,this.settings.dlz&&e&&e.shown&&e.u.kind==="aircraft"){let s=this.measure>=0?this.vis[this.measure]:null;if(!s||!s.shown||s.u.kind!=="aircraft"){let o=Ti(e.u,t);if(s=null,o)for(let a of o.targets){let l=this.vis[a];if(l&&l.shown&&l.u.kind==="aircraft"){s=l;break}}}let r=s?this.missileOf(e.u):null;if(s&&r){let o=performance.now(),a=e.u.id+":"+s.u.id+":"+r.name;if(!this.dlzCache||this.dlzCache.key!==a||o-this.dlzCache.at>250){let f=gh(e.u,t),d=gh(s.u,t),_=e.px-s.px,g=e.py-s.py,m=e.pz-s.pz,p=_h(s.u,t),E=Math.hypot(_,g,m),x=Math.hypot(p[0],p[1],p[2]),y=E>0&&x>0?Math.acos(Math.max(-1,Math.min(1,(p[0]*_+p[1]*g+p[2]*m)/(E*x))))*180/Math.PI:0,[M,T]=Yr(r,e.py,f,s.py,d,y);this.dlzCache={key:a,at:o,rmax:M,rne:T,missile:r.name}}let l=this.dlzCache;this.dlzInfo={missile:l.missile,rmax:l.rmax,rne:l.rne,range:Math.hypot(e.px-s.px,e.py-s.py,e.pz-s.pz)};let c=new It(e.color),h=c.clone().multiplyScalar(.6),u=(f,d,_)=>{if(f<=0)return;let g=96;for(let m=0;m<g;m++){if(_&&m%2)continue;let p=m/g*Math.PI*2,E=(m+1)/g*Math.PI*2;this.dlzSeg.add(e.px+f*Math.cos(p),e.py,e.pz+f*Math.sin(p),e.px+f*Math.cos(E),e.py,e.pz+f*Math.sin(E),d)}};u(l.rmax,h,!0),u(l.rne,c,!1)}}this.dlzSeg.end()}labelFor(t){let e=this.settings,n=t.u,s=this.session;if(n.kind==="missile")return n.name;let r=[],o=n.player>=0?s.playerBySlot.get(n.player):null;e.lblName&&o&&r.push(o.name),(e.lblType||!o)&&r.push(n.name);let a=[];return an(n,this.t,this.s),e.lblAlt&&a.push(ie(this.s.y,e.units)),e.lblSpeed&&a.push(Je(Vn(n.speed,this.s,n.n),e.units)),r.join(" \xB7 ")+(a.length?`
`+a.join("  "):"")}updateLabels(){let t=this.settings,e=performance.now(),n=e-this.lastLabelText>200;n&&(this.lastLabelText=e);let s=[];for(let a of["aircraft","missile"])for(let l of this.byKind[a]){let c=l.shown&&l.onScreen;c&&(a==="missile"?c=t.missileLabels&&(t.labels==="all"||t.labels==="focus"&&l.focus):c=t.labels==="all"||t.labels==="focus"&&l.focus),c?s.push(l):l.label&&l.label.style.display!=="none"&&(l.label.style.display="none")}let r=a=>a.u.id===this.selected?0:a.focus?1:a.u.kind==="aircraft"?a.u.ai?3:2:4;s.sort((a,l)=>r(a)-r(l));let o=[];for(let a of s){(n||!a.labelText)&&(a.labelText=this.labelFor(a));let l=a.labelText.split(`
`),c=0;for(let m of l)c=Math.max(c,m.length);let h=a.sx+12,u=a.sy-8,f=h+c*6.6+4,d=u+l.length*14,_=!1;if(r(a)>1||a.u.kind==="missile"){for(let m=0;m<o.length;m+=4)if(h<o[m+2]&&f>o[m]&&u<o[m+3]&&d>o[m+1]){_=!0;break}}if(_){a.label&&a.label.style.display!=="none"&&(a.label.style.display="none");continue}if(o.push(h,u,f,d),!a.label){let m=document.createElement("div");m.className="lbl "+a.u.kind+(a.focus?" focus":""),m.addEventListener("click",p=>{this.onSelect(a.u.id,p.shiftKey),p.stopPropagation()}),this.labelLayer.appendChild(m),a.label=m}let g=a.label;g.style.display==="none"&&(g.style.display=""),g.style.transform=`translate(${Math.round(h)}px, ${Math.round(u)}px)`,g.style.color="#"+new It(a.color).lerp(new It(16777215),.45).getHexString(),g.textContent!==a.labelText&&(g.textContent=a.labelText)}}pick(t,e){let n=-1,s=18;for(let r of["aircraft","missile"])for(let o of this.byKind[r]){if(!o.shown||!o.onScreen)continue;let a=Math.hypot(o.sx-t,o.sy-e)+(r==="missile"?4:0);a<s&&(s=a,n=o.u.id)}return n}viewHeading(){if(this.mode==="2d")return 0;let t=new k;return this.camera.getWorldDirection(t),(Math.atan2(t.x,-t.z)*180/Math.PI+360)%360}};function ie(i,t){return t==="aviation"?Math.round(i*3.28084/100)*100+" ft":i>=1e3?(i/1e3).toFixed(1)+" km":Math.round(i)+" m"}function Je(i,t){return isFinite(i)?t==="aviation"?Math.round(i*1.94384)+" kt":Math.round(i*3.6)+" km/h":""}function ue(i,t){return t==="aviation"?(i/1852).toFixed(1)+" nm":(i/1e3).toFixed(1)+" km"}function _h(i,t){let e=Ye(i,t),n=Math.max(0,e-1),s=Math.min(i.n-1,e+1),r=(i.t[s]-i.t[n])/1e3;return r>0?[(i.x[s]-i.x[n])/r,(i.y[s]-i.y[n])/r,-(i.z[s]-i.z[n])/r]:[0,0,0]}function gh(i,t){let e=_h(i,t);return Math.hypot(e[0],e[1],e[2])}var Qt={blue:"#2a78d6",orange:"#eb6834",aqua:"#1baf7a",ink:"#e6eaf0",ink2:"#a9b3c2",ink3:"#7b8696",grid:"#2f3948",yellow:"#ffe14d"};function gn(i,t){let e=document.createElement("div");if(e.className="chartBox",t.legend!==!1&&t.series.length>1){let u=document.createElement("div");u.className="legendRow";for(let f of t.series){let d=document.createElement("span"),_=document.createElement("i");_.style.background=f.color,f.dashed&&(_.className="dash"),d.append(_,document.createTextNode(f.name)),u.appendChild(d)}e.appendChild(u)}let n=document.createElement("canvas");n.style.height=(t.height||120)+"px",e.appendChild(n);let s=document.createElement("div");s.className="readout",e.appendChild(s),i.appendChild(e);let r=70,o=10,a=8,l=20,c=null,h=u=>{let f=window.devicePixelRatio||1,d=n.clientWidth,_=n.clientHeight;if(!d)return;(n.width!==Math.round(d*f)||n.height!==Math.round(_*f))&&(n.width=Math.round(d*f),n.height=Math.round(_*f));let g=n.getContext("2d");g.setTransform(f,0,0,f,0,0),g.clearRect(0,0,d,_);let m=t.yMin,p=t.yMax;if(m===void 0||p===void 0){let A=1/0,L=-1/0;for(let I of t.series)for(let U of I.pts)isFinite(U[1])&&(A=Math.min(A,U[1]),L=Math.max(L,U[1]));for(let I of t.bands||[])A=Math.min(A,I.y0),L=Math.max(L,I.y1);isFinite(A)||(A=0,L=1),m===void 0&&(m=A),p===void 0&&(p=L)}p-m<1e-9&&(p=m+1);let E=(p-m)*.06,x=m-(t.yMin===void 0?E:0),y=p+(t.yMax===void 0?E:0),M=A=>r+(A-t.x0)/Math.max(1e-9,t.x1-t.x0)*(d-r-o),T=A=>a+(1-(A-x)/(y-x))*(_-a-l);c={X:M,Y:T,w:d,h:_,ix:A=>t.x0+(A-r)/(d-r-o)*(t.x1-t.x0)};for(let A of t.bands||[]){g.fillStyle=A.color;let L=T(Math.min(y,A.y1)),I=T(Math.max(x,A.y0));g.fillRect(r,L,d-r-o,I-L)}g.strokeStyle=Qt.grid,g.lineWidth=1,g.fillStyle=Qt.ink3,g.font="11px Segoe UI, system-ui, sans-serif";let P=t.yFmt||(A=>String(Math.round(A))),R=A=>P(Math.abs(A)<1e-9?0:A);for(let A of[x+(y-x)*.05,(x+y)/2,y-(y-x)*.05])g.beginPath(),g.moveTo(r,Math.round(T(A))+.5),g.lineTo(d-o,Math.round(T(A))+.5),g.stroke(),g.textAlign="right",g.fillText(R(A),r-5,T(A)+4);t.zeroLine&&x<0&&y>0&&(g.strokeStyle=Qt.ink3,g.beginPath(),g.moveTo(r,T(0)),g.lineTo(d-o,T(0)),g.stroke());let S=t.xFmt||(A=>String(Math.round(A)));g.textAlign="left",g.fillText(S(t.x0),r,_-5),g.textAlign="right",g.fillText(S(t.x1),d-o,_-5);for(let A of t.markers||[]){let L=Math.round(M(A.x))+.5;L<r||L>d-o||(g.strokeStyle=A.color,g.setLineDash([3,3]),g.beginPath(),g.moveTo(L,a),g.lineTo(L,_-l),g.stroke(),g.setLineDash([]))}for(let A of t.series){g.strokeStyle=A.color,g.lineWidth=A.width||2,g.lineJoin="round",A.dashed&&g.setLineDash([5,4]),g.beginPath();let L=!0,I=0;for(let U of A.pts){if(!isFinite(U[1])){L=!0;continue}let z=M(U[0]),H=T(Math.max(x,Math.min(y,U[1])));L?(g.moveTo(z,H),L=!1):(A.step&&g.lineTo(z,I),g.lineTo(z,H)),I=H}g.stroke(),g.setLineDash([])}let v=u!==null?u:t.cursorX;if(v!=null&&v>=t.x0&&v<=t.x1&&(g.strokeStyle="rgba(255,255,255,.55)",g.lineWidth=1,g.beginPath(),g.moveTo(M(v)+.5,a),g.lineTo(M(v)+.5,_-l),g.stroke()),u!==null){let A=[S(u)];for(let I of t.series){let U=null;for(let z of I.pts)if(z[0]<=u)U=z;else break;U&&isFinite(U[1])&&A.push(I.name+" "+R(U[1]))}let L=(t.markers||[]).filter(I=>Math.abs(M(I.x)-M(u))<4).map(I=>I.label);s.textContent=A.concat(L).join(" \xB7 ")}else s.textContent=""};return n.addEventListener("mousemove",u=>{if(!c)return;let f=n.getBoundingClientRect(),d=c.ix(u.clientX-f.left);h(Math.max(t.x0,Math.min(t.x1,d)))}),n.addEventListener("mouseleave",()=>h(null)),t.onClick&&(n.style.cursor="pointer",n.addEventListener("click",u=>{if(!c)return;let f=n.getBoundingClientRect();t.onClick(c.ix(u.clientX-f.left))})),requestAnimationFrame(()=>h(null)),new ResizeObserver(()=>h(null)).observe(n),n}function yh(i,t,e,n=Qt.blue){let s=document.createElement("div");s.className="barList";for(let r of t){let o=document.createElement("div");o.className="barRow";let a=document.createElement("span");a.className="bl",a.textContent=r.label;let l=document.createElement("div");l.className="bt";let c=document.createElement("div");if(c.className="bf",c.style.width=Math.max(0,Math.min(100,r.value/e*100))+"%",c.style.background=n,l.appendChild(c),r.compare!==void 0){let u=document.createElement("div");u.className="bc",u.style.left=Math.max(0,Math.min(100,r.compare/e*100))+"%",l.appendChild(u)}let h=document.createElement("span");h.className="bv",h.textContent=r.text||String(r.value),o.append(a,l,h),s.appendChild(o)}i.appendChild(s)}var fl=null;function $r(i=!1){return(!fl||i)&&(fl=fetch("/api/library").then(t=>t.ok?t.json():{matches:[]}).catch(()=>({matches:[]}))),fl}function Fs(i){let t=/^([A-Za-z]+[- ]?\d+)/.exec(i||"");return t?t[1].toUpperCase().replace(" ","-"):(i||"").toUpperCase()}function Jr(i,t){let e=[];for(let n of i.matches||[])if(!(t&&!t.has(n.id)))for(let s of n.shots||[])s.range==null||s.aspect==null||s.shooterAlt==null||s.targetAlt==null||!["kill","miss","close"].includes(s.outcome)||s.reason==="target_down"||e.push({match:n.id,t:s.t,model:s.model,guidance:s.guidance,range:s.range,aspect:s.aspect,shooterAlt:s.shooterAlt,targetAlt:s.targetAlt,shooterMach:s.shooterMach??.9,targetMach:s.targetMach??.9,targetAgl:s.targetAgl??null,rangeRatio:s.rangeRatio??null,rmax:s.rmax??null,rne:s.rne??null,multipath:s.multipath||0,notch:!!s.notch,locked:!!s.locked,outcome:s.outcome,reason:s.reason||"",grade:s.grade,shooterSlot:s.shooterSlot,targetSlot:s.targetSlot,kill:s.outcome==="kill"});return e}function x0(i,t){if(t===0)return[0,1];let e=1.645,n=i/t,s=1+e*e/t,r=(n+e*e/(2*t))/s,o=e*Math.sqrt(n*(1-n)/t+e*e/(4*t*t))/s;return[Math.max(0,r-o),Math.min(1,r+o)]}function jr(i,t,e){let n=Fs(t.model),s=g=>!(e&&g.match===e.match&&Math.abs(g.t-e.t)<1),r=i.filter(g=>g.model===t.model&&s(g)),o=t.model;if(r.length<25&&(r=i.filter(g=>Fs(g.model)===n&&s(g)),o=n+" family"),r.length<25&&t.guidance&&(r=i.filter(g=>g.guidance===t.guidance&&s(g)),o="all "+t.guidance+" missiles"),r.length<8)return null;let a=t.targetAgl!=null&&t.targetAgl<60,l=g=>{let m=g.targetAgl!=null&&g.targetAgl<60;return Math.hypot((g.range-t.range)/8e3,(g.aspect-t.aspect)/40,(g.shooterAlt-t.shooterAlt)/3e3,(g.targetAlt-t.targetAlt)/3e3,(g.targetMach-t.targetMach)/.3,(g.shooterMach-t.shooterMach)/.3)+(m!==a&&t.guidance!=="IR"?1.5:0)},c=r.map(g=>[l(g),g]).sort((g,m)=>g[0]-m[0]),h=Math.min(30,Math.max(8,Math.round(r.length/4))),u=c.slice(0,h).map(g=>g[1]),f=u.filter(g=>g.kill).length,[d,_]=x0(f,u.length);return{pk:f/u.length,n:u.length,lo:d,hi:_,pool:o,poolSize:r.length,neighbours:u}}function Y(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var v0={good:"\u2713 Good",fair:"! Fair",poor:"\u2715 Poor",unknown:"? Unknown"};function xh(i){return Y("span","chip g-"+(i||"unknown"),v0[i]||i)}function _n(i){return i==null?"\u2014":Math.round(i*100)+"%"}function M0(i){return i==null?"none":i.toFixed(1)+" s"}var b0=[["report","Report card"],["shots","My shots"],["incoming","Shots at me"],["deaths","Deaths"],["engage","Engagements"],["position","Threats & position"]],Qr=class{constructor(t,e){j(this,"host");j(this,"root");j(this,"body");j(this,"picker");j(this,"ana",null);j(this,"anaFor","");j(this,"slot",-1);j(this,"tab","report");j(this,"lib",null);this.root=t,this.host=e}async open(){let t=this.host.ses();if(t){if(this.root.hidden=!1,this.anaFor!==t.id){this.root.innerHTML="",this.root.appendChild(Y("div","pageMsg","Analysing the match\u2026 (the first time takes a few seconds)"));try{let e=await fetch("/api/analysis/"+encodeURIComponent(t.id));if(!e.ok)throw new Error(await e.text());this.ana=await e.json(),this.anaFor=t.id}catch(e){this.root.innerHTML="",this.root.appendChild(Y("div","pageMsg","Could not analyse this match: "+(e&&e.message||e)));return}this.slot=this.host.meSlot(),!this.ana.players.some(e=>e.slot===this.slot)&&this.ana.players.length&&(this.slot=this.ana.players[0].slot)}this.lib||$r().then(e=>{this.lib=Jr(e),!this.root.hidden&&this.tab==="shots"&&this.render()}),this.build()}}close(){this.root.hidden=!0}invalidate(){this.anaFor=""}player(){return this.ana.players.find(t=>t.slot===this.slot)}unit(t){let e=this.host.ses();return e&&t>=0&&e.units[t]||null}title(t){let e=this.unit(t);return e?this.host.unitTitle(e):"?"}clock(t){return on(t-this.ana.t0)}watchBtn(t,e,n,s=!0){let r=Y("button","watch","\u25B6 "+t);return r.onclick=o=>{o.stopPropagation(),this.host.watch(e,n,s)},r}build(){let t=this.root;t.innerHTML="";let e=Y("div","pageHead");e.appendChild(Y("div","pageTitle","Debrief")),this.picker=document.createElement("select");let n=this.host.ses(),s=[...this.ana.players].sort((a,l)=>a.team-l.team||a.name.localeCompare(l.name));for(let a of s){let l=document.createElement("option");l.value=String(a.slot),l.textContent=a.name+" \u2014 "+(a.vehicles||[]).join(", ")+(a.slot===this.host.meSlot()?"  (me)":""),this.picker.appendChild(l)}this.picker.value=String(this.slot),this.picker.onchange=()=>{this.slot=Number(this.picker.value),this.render()},e.appendChild(this.picker);let r=Y("div","pageTabs");for(let[a,l]of b0){let c=Y("button",a===this.tab?"on":"",l);c.dataset.tab=a,c.onclick=()=>{this.tab=a;for(let h of Array.from(r.children))h.classList.toggle("on",h.dataset.tab===a);this.render()},r.appendChild(c)}e.appendChild(r);let o=Y("button","back","\u2190 Back to replay");o.onclick=()=>this.host.watch(-1,-1,!1),e.appendChild(o),t.appendChild(e),this.body=Y("div","pageBody"),t.appendChild(this.body),this.render()}render(){let t=this.body;t.innerHTML="",t.scrollTop=0;let e=this.player();if(!e){t.appendChild(Y("div","pageMsg","No data for this player."));return}for(let n of this.ana.notes||[])t.appendChild(Y("div","note",n));switch(this.tab){case"report":this.report(t,e);break;case"shots":this.shots(t,e);break;case"incoming":this.incoming(t,e);break;case"deaths":this.deaths(t,e);break;case"engage":this.engagements(t,e);break;case"position":this.position(t,e);break}}report(t,e){let n=e.summary,s=this.host.settings.units,r=Y("div","tiles"),o=(l,c,h="")=>{let u=Y("div","tile");u.append(Y("span","",l),Y("b","",c)),h&&u.appendChild(Y("small","",h)),r.appendChild(u)};o("Kills / deaths",(n.kills||0)+" / "+(n.deaths||0),n.teamKills?n.teamKills+" team kill"+(n.teamKills>1?"s":""):""),o("Missiles fired",String(n.shots||0),(n.missileKills||0)+" killed"),o("Shot quality",(n.shotsGood||0)+" \u2713  "+(n.shotsFair||0)+" !  "+(n.shotsPoor||0)+" \u2715","good \xB7 fair \xB7 poor"),o("Missiles at you",String(n.missilesAtMe||0),n.missilesAtMe?_n(n.missilesSurvivedShare)+" survived":""),o("Reaction to launches",n.avgReactionS!=null?n.avgReactionS.toFixed(1)+" s":"\u2014","median"+(n.noReaction?" \xB7 "+n.noReaction+" with no reaction":"")),o("Notch held",_n(n.avgNotchShare),"of the critical time, radar missiles"),o("Engagements",String(n.engagements||0),(n.engagementsWon||0)+" won \xB7 "+(n.engagementsLost||0)+" lost \xB7 first shot "+_n(n.firstShotShare)),o("Average altitude",n.meanAltM!=null?ie(n.meanAltM,s):"\u2014"),o("Flying alone",_n(n.aloneShare),"no teammate within 20 km"),n.avgShotRangeM&&o("Average shot range",ue(n.avgShotRangeM,s),n.avgRangeRatio!=null?Math.round(n.avgRangeRatio*100)+"% of estimated max range":""),t.appendChild(r),t.appendChild(Y("h3","","Biggest mistakes"));let a=e.mistakes||[];a.length||t.appendChild(Y("div","muted","Nothing flagged in this match."));for(let l of a.slice(0,3))t.appendChild(this.mistakeCard(l,!0));if(a.length>3){t.appendChild(Y("h3","","Everything else flagged"));for(let l of a.slice(3))t.appendChild(this.mistakeCard(l,!1))}t.appendChild(Y("p","fine","Shot grades use an estimated launch envelope from the game's missile data and the multipath and notch rules from the game files. Miss reasons and reactions are worked out from the recording, not recorded by the game."))}mistakeCard(t,e){let n=Y("div","mistake"+(e?" big":"")+" sev"+t.severity);return n.appendChild(Y("div","mt",this.clock(t.t))),n.appendChild(Y("div","mx",t.text)),t.select>=0&&n.appendChild(this.watchBtn("Watch",t.t-5e3,t.select)),n}shots(t,e){let n=(e.shots||[]).map(a=>this.ana.shots[a]);if(!n.length){t.appendChild(Y("div","muted",this.ana.hasShots?"No missiles fired.":"No shot records in this file."));return}t.appendChild(Y("p","fine","Range bar: green = inside the estimated no-escape range, amber = the target can still outrun it, red = beyond the estimated max range. Pk from history = share of similar shots in your library that killed."));let s=Y("div","tbl shots"),r=Y("div","tr th");for(let a of["Time","Missile","Target","Range vs envelope","Aspect","Alt you / target","Target above ground","Pk (history)","Grade","Result"])r.appendChild(Y("div","",a));s.appendChild(r);let o=this.host.settings.units;for(let a of n){let l=Y("div","tr click");l.appendChild(Y("div","num",this.clock(a.t))),l.appendChild(Y("div","",a.model)),l.appendChild(Y("div","",a.target>=0?this.title(a.target):"not identified")),l.appendChild(this.rangeBar(a)),l.appendChild(Y("div","num",a.aspectDeg!=null?a.aspectDeg+"\xB0 "+(a.aspectDeg<60?"hot":a.aspectDeg>120?"cold":"beam"):"\u2014")),l.appendChild(Y("div","num",a.shooterAltM!=null?ie(a.shooterAltM,o)+" / "+ie(a.targetAltM,o):"\u2014"));let c=Y("div","num",a.targetAglM!=null?ie(Math.max(0,a.targetAglM),o):"\u2014");a.multipathLaunch>0&&c.appendChild(Y("span","tag warn","multipath")),l.appendChild(c),l.appendChild(this.pkCell(a));let h=Y("div","");h.appendChild(xh(a.grade)),l.appendChild(h),l.appendChild(Y("div","res "+(a.outcome==="kill"?"kill":""),this.outcome(a)));let u=Y("div","detail");u.hidden=!0,l.onclick=()=>{u.hidden=!u.hidden,!u.hidden&&!u.childElementCount&&this.shotDetail(u,a)},s.append(l,u)}t.appendChild(s)}outcome(t){if(t.outcome==="kill")return"Kill";let e={target_down:"target already down",decoyed:"decoyed",out_of_energy:"out of energy",no_lock:"never locked",lost_lock:"lost the target"};return t.outcome==="close"?"Close pass, no kill":t.outcome==="miss"?"Miss"+(e[t.reason]?" \u2014 "+e[t.reason]:""):"Unknown"}rangeBar(t){let e=Y("div","rb");if(t.rangeM==null)return e.textContent="\u2014",e;let n=this.host.settings.units;if(!t.rmaxM)return e.textContent=ue(t.rangeM,n)+" (no envelope)",e;let s=Math.max(t.rangeM,t.rmaxM)*1.1,r=Y("div","rbar"),o=(l,c,h)=>{let u=Y("div","rs "+h);u.style.left=l/s*100+"%",u.style.width=Math.max(0,c-l)/s*100+"%",r.appendChild(u)};o(0,t.rneM||0,"ok"),o(t.rneM||0,t.rmaxM,"mid"),o(t.rmaxM,s,"bad");let a=Y("div","rdot");return a.style.left=t.rangeM/s*100+"%",r.appendChild(a),e.append(r,Y("span","rtxt",ue(t.rangeM,n)+" \xB7 max "+ue(t.rmaxM,n)+" \xB7 NEZ "+ue(t.rneM||0,n))),e}pkFor(t){return!this.lib||t.rangeM==null||t.aspectDeg==null||t.shooterAltM==null||t.targetAltM==null?null:jr(this.lib,{model:t.model,guidance:t.guidance,range:t.rangeM,aspect:t.aspectDeg,shooterAlt:t.shooterAltM,targetAlt:t.targetAltM,shooterMach:t.shooterMach??.9,targetMach:t.targetMach??.9,targetAgl:t.targetAglM},{match:this.ana.session,t:t.t})}pkCell(t){let e=Y("div","num");if(!this.lib)return e.textContent="\u2026",e;let n=this.pkFor(t);return n?(e.textContent=Math.round(n.pk*100)+"%",e.title="Based on "+n.n+" similar shots ("+n.pool+"); 90% range "+Math.round(n.lo*100)+"\u2013"+Math.round(n.hi*100)+"%",n.pk<.15&&e.classList.add("bad"),e):(e.textContent="too few shots",e.className="muted",e)}factors(t,e){let n=Y("ul","factors");for(let s of e||[]){let r=Y("li","g-"+s.grade);r.append(Y("span","fi",s.grade==="good"?"\u2713":s.grade==="fair"?"!":"\u2715"),document.createTextNode(" "+s.text)),n.appendChild(r)}t.appendChild(n)}shotDetail(t,e){let n=this.host.settings.units,s=Y("div","cols"),r=Y("div");r.appendChild(Y("h4","","Why this grade")),this.factors(r,e.factors),e.multipathTerminal>0&&e.targetAglMinM!=null&&r.appendChild(Y("div","fine","Target's lowest height during the last 10 s of the flight: "+ie(Math.max(0,e.targetAglMinM),n)));let o=this.pkFor(e);o&&r.appendChild(Y("div","fine","Pk from history: "+Math.round(o.pk*100)+"% ("+o.n+" similar shots from "+o.pool+", 90% range "+Math.round(o.lo*100)+"\u2013"+Math.round(o.hi*100)+"%)"));let a=Y("div");a.appendChild(Y("h4","","After the launch"));let l=Y("div","kv2"),c=(u,f)=>{l.append(Y("span","",u),Y("b","",f))};c("Lock held (until the missile went active)",_n(e.supportShare)),c("Most you turned away from the target (crank)",e.maxOffAngleDeg!=null?e.maxOffAngleDeg+"\xB0":"\u2014"),c("Your distance to the target when the missile went active",e.distAtActiveM!=null?ue(e.distAtActiveM,n):"\u2014"),c("Your distance to the target when the missile arrived",e.distAtEndM!=null?ue(e.distAtEndM,n):"\u2014"),c("You turned away (cold)",e.shooterTurnedColdT!=null?"+"+((e.shooterTurnedColdT-e.t)/1e3).toFixed(0)+" s after launch":"no"),c("Missile speed at the end",e.endSpeedMs!=null?Je(e.endSpeedMs,n):"\u2014"),c("Closest pass",e.missDistanceM!=null?Math.round(e.missDistanceM)+" m":"\u2014"),a.appendChild(l),s.append(r,a),t.appendChild(s),t.appendChild(Y("h4","","Missile energy")),this.energyChart(t,e);let h=Y("div","btnRow");h.append(this.watchBtn("Watch the launch",e.t-3e3,e.missile),this.watchBtn("Watch the end",(e.tClosest||this.unit(e.missile)?.tEnd||e.t)-6e3,e.missile)),t.appendChild(h)}energyChart(t,e){if(!this.host.ses())return;let n=this.unit(e.missile),s=e.target>=0?this.unit(e.target):null;if(!n||n.n<3){t.appendChild(Y("div","muted","No track for this missile."));return}let r=this.host.settings.units,o=_=>r==="aviation"?_*1.94384:_*3.6,a=[],l=[],c=[],h=NaN,u=Math.max(1,Math.floor(n.n/200)),f=(_,g)=>{let m=Ye(_,g);return[_.x[m],_.y[m],_.z[m]]};for(let _=0;_<n.n;_+=u){let g=n.t[_],m=(g-n.tStart)/1e3,p=Math.max(0,_-3),E=Math.min(n.n-1,_+3),x=(n.t[E]-n.t[p])/1e3,y=n.speed?n.speed[_]:x>0?Math.hypot(n.x[E]-n.x[p],n.y[E]-n.y[p],n.z[E]-n.z[p])/x:NaN;if(a.push([m,o(y)]),s&&g>=s.tStart&&g<=s.tEnd&&x>0){let M=Ye(s,g);l.push([m,o(s.speed?s.speed[M]:NaN)]);let T=f(s,n.t[p]),P=f(s,n.t[E]),R=Math.hypot(T[0]-n.x[p],T[1]-n.y[p],T[2]-n.z[p]),S=Math.hypot(P[0]-n.x[E],P[1]-n.y[E],P[2]-n.z[E]),v=(R-S)/x;c.push([m,o(v)]),v<0&&isNaN(h)&&m>3&&(h=m)}}let d=[];e.activeT!=null&&d.push({x:(e.activeT-n.tStart)/1e3,label:"seeker active",color:Qt.ink2}),isNaN(h)||d.push({x:h,label:"stopped closing",color:Qt.orange}),gn(t,{x0:0,x1:(n.tEnd-n.tStart)/1e3,height:140,zeroLine:!0,markers:d,series:[{name:"Missile speed",color:Qt.blue,pts:a},{name:"Target speed",color:Qt.ink3,pts:l,dashed:!0},{name:"Closing speed",color:Qt.aqua,pts:c}],xFmt:_=>_.toFixed(0)+" s",yFmt:_=>Math.round(_)+(r==="aviation"?" kt":" km/h")})}incoming(t,e){let n=e.incoming||[];if(!n.length){t.appendChild(Y("div","muted","No missiles were identified as fired at this player."));return}t.appendChild(Y("p","fine","Reaction = first turn of more than 30\xB0, dive of more than 600 m or countermeasure after the launch. Notch = your speed toward or away from the radar inside \xB120 m/s (game radars filter a 40 m/s band of ground-clutter speeds) while the radar looks down at you."));let s=Y("div","tbl inc"),r=Y("div","tr th");for(let a of["Time","Missile","From","Range / aspect","Reaction","Notch held","Chaff / flares","Grade","Result"])r.appendChild(Y("div","",a));s.appendChild(r);let o=this.host.settings.units;for(let a of n){let l=Y("div","tr click");l.appendChild(Y("div","num",this.clock(a.t))),l.appendChild(Y("div","",a.model+(a.guidance?" ("+a.guidance+")":""))),l.appendChild(Y("div","",a.shooter>=0?this.title(a.shooter):"?")),l.appendChild(Y("div","num",(a.rangeM!=null?ue(a.rangeM,o):"\u2014")+(a.aspectDeg!=null?" \xB7 "+a.aspectDeg+"\xB0":""))),l.appendChild(Y("div","num",a.reactionS!=null?a.reactionS.toFixed(1)+" s ("+a.reactionKind+")":"none")),l.appendChild(Y("div","num",a.notchApplies?_n(a.notchShare):"n/a (IR)"));let c=(a.cms||[]).filter(d=>d.type==="chaff").length,h=(a.cms||[]).length-c;l.appendChild(Y("div","num",c+" / "+h+(a.chaffInNotch?" \xB7 "+a.chaffInNotch+" chaff in notch":"")));let u=Y("div","");u.appendChild(xh(a.grade)),l.appendChild(u),l.appendChild(Y("div","res "+(a.killedMe?"dead":""),a.killedMe?"Killed you":this.outcome(a)));let f=Y("div","detail");f.hidden=!0,l.onclick=()=>{f.hidden=!f.hidden,!f.hidden&&!f.childElementCount&&this.incomingDetail(f,a)},s.append(l,f)}t.appendChild(s)}incomingDetail(t,e){let n=Y("div","cols"),s=Y("div");s.appendChild(Y("h4","","Your defence")),this.factors(s,e.factors),e.shooterLOS===!1&&s.appendChild(Y("div","fine","Terrain was between you and the shooter at launch."));let r=Y("div");r.appendChild(Y("h4","","Timeline"));let o=Y("div","kv2"),a=(c,h)=>{o.append(Y("span","",c),Y("b","",h))};if(a("Seeker went active",e.activeT!=null?"+"+((e.activeT-e.t)/1e3).toFixed(1)+" s":"\u2014"),a("Seeker lost you",e.lostT!=null?"+"+((e.lostT-e.t)/1e3).toFixed(1)+" s":"no"),a("Missile ended","+"+((e.tEnd-e.t)/1e3).toFixed(1)+" s"),a("Countermeasures",(e.cms||[]).map(c=>c.type+" +"+((c.t-e.t)/1e3).toFixed(1)).join(", ")||"none"),r.appendChild(o),n.append(s,r),t.appendChild(n),e.notchApplies&&e.notchSeries&&e.notchSeries.length){t.appendChild(Y("h4","","Notch meter \u2014 your speed toward (\u2212) or away from (+) the radar"));let c=[],h=[];for(let d of e.notchSeries){let _=(d[0]-e.t)/1e3;c.push([_,d[2]?d[1]:NaN]),h.push([_,d[2]?NaN:d[1]])}let u=[];for(let d of e.cms||[])u.push({x:(d.t-e.t)/1e3,label:d.type,color:d.type==="chaff"?Qt.aqua:Qt.yellow});e.activeT!=null&&u.push({x:(e.activeT-e.t)/1e3,label:"seeker active",color:Qt.ink}),e.lostT!=null&&u.push({x:(e.lostT-e.t)/1e3,label:"seeker lost you",color:Qt.aqua});let f=Math.max(80,...e.notchSeries.map(d=>Math.min(400,Math.abs(d[1]))));gn(t,{x0:0,x1:(e.notchSeries[e.notchSeries.length-1][0]-e.t)/1e3,height:170,yMin:-f,yMax:f,zeroLine:!0,markers:u,bands:[{y0:-40,y1:40,color:"rgba(27,175,122,.10)"},{y0:-20,y1:20,color:"rgba(27,175,122,.22)"}],series:[{name:"Radar looking down at you (notch possible)",color:Qt.blue,pts:c},{name:"Radar looking up at you (no notch)",color:Qt.ink3,pts:h,dashed:!0}],xFmt:d=>"+"+d.toFixed(0)+" s",yFmt:d=>Math.round(d)+" m/s",onClick:d=>this.host.seek(e.t+d*1e3)}),t.appendChild(Y("div","fine","Dark green band: inside the notch (\xB120 m/s). Light band: \xB140 m/s. Click the chart to jump there in the replay."))}let l=Y("div","btnRow");l.append(this.watchBtn("Watch from the launch",e.t-3e3,e.missile),this.watchBtn("Watch the end",e.tEnd-8e3,e.missile)),t.appendChild(l)}deaths(t,e){let n=e.deaths||[];if(!n.length){t.appendChild(Y("div","muted","No deaths in this match."));return}let s=this.host.settings.units;for(let r of n){let o=Y("div","card"),a=Y("div","cardHead");a.append(Y("span","mt",this.clock(r.t)),Y("b","",r.crash?"Crashed / no recorded killer":"Killed by "+(r.killerName||"?")+(r.weapon?" \u2014 "+r.weapon:""))),a.appendChild(this.watchBtn("Watch the last 30 s",r.t-3e4,r.unit)),r.missile>=0&&a.appendChild(this.watchBtn("Follow the missile",r.t-15e3,r.missile)),o.appendChild(a);let l=Y("div","tags");for(let u of r.tags||[])l.appendChild(Y("span","tag",u));o.appendChild(l);let c=Y("div","kv2 four"),h=(u,f)=>{c.append(Y("span","",u),Y("b","",f))};if(h("Altitude",r.altM!=null?ie(r.altM,s)+(r.aglM!=null?" ("+ie(Math.max(0,r.aglM),s)+" above ground)":""):"\u2014"),h("Speed",r.speedMs!=null?Je(r.speedMs,s)+" \xB7 Mach "+(r.mach??0).toFixed(2):"\u2014"),h("In the last 30 s",(r.altLost30M!=null?(r.altLost30M>=0?"lost ":"gained ")+ie(Math.abs(r.altLost30M),s):"")+(r.speedLost30Ms!=null?", "+(r.speedLost30Ms>=0?"lost ":"gained ")+Je(Math.abs(r.speedLost30Ms),s):"")),h("Radar locks on you (last 30 s)",(r.lockedBy||[]).join(", ")||"none"),h("Missiles at you (last minute)",String(r.missilesAt60||0)),h("Reaction to the killing missile",r.missile>=0?M0(r.reactionS):"\u2014"),h("Notch held",r.missile>=0?_n(r.notchShare):"\u2014"),h("Nearest teammate",r.nearestTeammateKm!=null&&r.nearestTeammateKm>=0?ue(r.nearestTeammateKm*1e3,s):"none alive"),h("Enemies within 20 km",String(r.enemiesWithin20)),o.appendChild(c),r.series&&r.series.length>2){let u=Y("div","cols"),f=Y("div"),d=Y("div");f.appendChild(Y("div","cap","Altitude, last 30 s")),d.appendChild(Y("div","cap","Speed, last 30 s"));let _=(r.series[0][0]-r.t)/1e3;gn(f,{x0:_,x1:0,height:90,legend:!1,series:[{name:"Altitude",color:Qt.blue,pts:r.series.map(g=>[(g[0]-r.t)/1e3,g[1]])}],xFmt:g=>g.toFixed(0)+" s",yFmt:g=>ie(g,s)}),gn(d,{x0:_,x1:0,height:90,legend:!1,series:[{name:"Speed",color:Qt.blue,pts:r.series.map(g=>[(g[0]-r.t)/1e3,g[2]])}],xFmt:g=>g.toFixed(0)+" s",yFmt:g=>Je(g,s)}),u.append(f,d),o.appendChild(u)}t.appendChild(o)}}engagements(t,e){let n=e.engagements||[];if(!n.length){t.appendChild(Y("div","muted","No engagements (no shots, kills or deaths against an enemy)."));return}t.appendChild(Y("p","fine","One row per enemy you exchanged shots with. Energy = altitude plus the height your speed is worth (h + v\xB2/2g): more energy means more missile range and more room to defend."));let s=this.host.settings.units,r=Y("div","tbl eng"),o=Y("div","tr th");for(let a of["Start","Enemy","First shot","Energy at first shot","Shots you / they","Result",""])o.appendChild(Y("div","",a));r.appendChild(o);for(let a of n){let l=Y("div","tr");l.appendChild(Y("div","num",this.clock(a.start))),l.appendChild(Y("div","",(a.opponentNames||[]).join(", "))),l.appendChild(Y("div","",a.firstShotT!=null?(a.firstShotByMe?"You":"They")+" at "+(a.firstShotRangeM!=null?ue(a.firstShotRangeM,s):"?"):"\u2014"));let c="\u2014";if(a.myEnergyM!=null&&a.theirEnergyM!=null){let d=a.myEnergyM-a.theirEnergyM;c=(d>=0?"+":"\u2212")+ie(Math.abs(d),s)+" "+(d>=0?"more":"less")+" than them",a.altDiffM!=null&&(c+=" (alt "+(a.altDiffM>=0?"+":"\u2212")+ie(Math.abs(a.altDiffM),s)+", speed "+(a.speedDiffMs>=0?"+":"\u2212")+Je(Math.abs(a.speedDiffMs),s)+")")}l.appendChild(Y("div","num",c)),l.appendChild(Y("div","num",(a.myShots||[]).length+" / "+(a.theirShots||[]).length)),l.appendChild(Y("div","res "+(a.result==="won"?"kill":a.result==="lost"?"dead":""),a.result));let h=this.host.ses()?.playerBySlot.get(this.slot),u=-1;if(h)for(let d of h.units){let _=this.unit(d);_&&a.start>=_.tStart-1e3&&a.start<=_.tEnd&&(u=d)}let f=Y("div","");f.appendChild(this.watchBtn("Watch",(a.firstShotT??a.start)-8e3,u)),l.appendChild(f),r.appendChild(l)}t.appendChild(r)}position(t,e){let n=e.threat,s=this.host.settings.units;if(!n||!n.t||!n.t.length){t.appendChild(Y("div","muted","No flight data."));return}let r=this.ana.t0,o=y=>(y-r)/6e4,a=[];for(let y of e.kills||[])y.teamKill||a.push({x:o(y.t),label:"kill: "+y.victimName,color:Qt.aqua});for(let y of e.deaths||[])a.push({x:o(y.t),label:"death",color:Qt.orange});let l=o(n.t[0]),c=o(n.t[n.t.length-1]),h=y=>n.t.map((M,T)=>[o(M),y[T]]),u=y=>{let M=Math.max(0,y*60);return Math.floor(M/60)+":"+String(Math.floor(M%60)).padStart(2,"0")};t.appendChild(Y("h3","","Threat picture")),t.appendChild(Y("p","fine","Enemies within 40 km, enemy radars locked on you, and missiles in the air at you. Click to jump there.")),gn(t,{x0:l,x1:c,height:170,markers:a,series:[{name:"Enemies within 40 km",color:Qt.blue,pts:h(n.enemiesNear),step:!0},{name:"Radars locked on you",color:Qt.orange,pts:h(n.radarsOnMe),step:!0},{name:"Missiles at you",color:Qt.aqua,pts:h(n.missilesAtMe),step:!0}],xFmt:u,yFmt:y=>String(Math.round(y)),yMin:0,onClick:y=>this.host.seek(r+y*6e4)}),this.ana.terrain&&(t.appendChild(Y("h3","","Terrain masking")),t.appendChild(Y("p","fine","Enemies within 60 km that could see you over the terrain, against all enemies within 40 km."+(e.maskedShare!=null?" Hidden from every nearby enemy "+_n(e.maskedShare)+" of the time they were near.":""))),gn(t,{x0:l,x1:c,height:120,markers:a,series:[{name:"Enemies within 40 km",color:Qt.blue,pts:h(n.enemiesNear),step:!0},{name:"Enemies with line of sight (60 km)",color:Qt.orange,pts:h(n.enemiesLOS),step:!0}],xFmt:u,yMin:0,onClick:y=>this.host.seek(r+y*6e4)})),t.appendChild(Y("h3","","Altitude and energy"));let f=[0,0,0,0,0],d=0;for(let y of this.ana.players)for(let M=0;M<5;M++)f[M]+=y.bands.timeS[M],d+=y.bands.timeS[M];let _=e.bands.timeS,g=_.reduce((y,M)=>y+M,0)||1,m=e.bands.edgesM,p=m.map((y,M)=>M<4?ie(y,s)+"\u2013"+ie(m[M+1],s):"above "+ie(y,s)),E=[];for(let y=4;y>=0;y--){let M=_[y]/g,T=d?f[y]/d:0;E.push({label:p[y],value:M,compare:T,text:_n(M)+" (lobby "+_n(T)+") \xB7 "+e.bands.shots[y]+" shots \xB7 "+e.bands.kills[y]+" kills \xB7 "+e.bands.deaths[y]+" deaths"})}yh(t,E,1),t.appendChild(Y("div","fine","Bar: your share of flight time at that altitude. Tick: the whole lobby's share.")),gn(t,{x0:l,x1:c,height:120,markers:a,legend:!1,series:[{name:"Altitude",color:Qt.blue,pts:h(n.altM)}],xFmt:u,yFmt:y=>ie(y,s),yMin:0,onClick:y=>this.host.seek(r+y*6e4)}),t.appendChild(Y("h3","","Teammates")),t.appendChild(Y("p","fine","Distance to the nearest teammate and the nearest enemy. Flying alone (no teammate within 20 km): "+_n(e.aloneShare)+" of the time."+((e.kills||[]).length?" At your kills the nearest teammate was "+e.kills.filter(y=>!y.teamKill).map(y=>y.nearestTeammateKm!=null&&y.nearestTeammateKm>=0?y.nearestTeammateKm.toFixed(1)+" km":"none").join(", ")+" away.":"")+((e.deaths||[]).length?" At your deaths: "+e.deaths.map(y=>y.nearestTeammateKm!=null&&y.nearestTeammateKm>=0?y.nearestTeammateKm.toFixed(1)+" km":"none").join(", ")+".":"")));let x=y=>y.map(M=>M<0?NaN:M);gn(t,{x0:l,x1:c,height:130,markers:a,bands:[{y0:0,y1:20,color:"rgba(42,120,214,.08)"}],series:[{name:"Nearest teammate (km)",color:Qt.blue,pts:h(x(n.nearestTeammateKm))},{name:"Nearest enemy (km)",color:Qt.orange,pts:h(x(n.nearestEnemyKm))}],xFmt:u,yFmt:y=>y.toFixed(0)+" km",yMin:0,onClick:y=>this.host.seek(r+y*6e4)})}};function ut(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var en=i=>i==null||!isFinite(i)?"\u2014":Math.round(i*100)+"%",nn=i=>{let t=i.filter(e=>e!=null&&isFinite(e));return t.length?t.reduce((e,n)=>e+n,0)/t.length:NaN},pl=i=>(i||"").replace(/^(air|avg)_/,"").replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase()),S0=[["overview","Overview & trends"],["pk","Pk calculator"],["heat","Heatmaps"],["compare","Compare with the best"]],ta=class{constructor(t,e){j(this,"root");j(this,"host");j(this,"lib",null);j(this,"rows",[]);j(this,"selected",new Set);j(this,"tab","overview");j(this,"body");j(this,"list");j(this,"fMap","");j(this,"fAc","");j(this,"pkState",null);j(this,"heatState",{level:"",layer:"fly"});j(this,"terrains",new Map);this.root=t,this.host=e}async open(t=!1){if(this.root.hidden=!1,(!this.lib||t)&&(this.root.innerHTML="",this.root.appendChild(ut("div","pageMsg","Reading the library\u2026 (new matches are analysed the first time, a few seconds each)")),this.lib=await $r(t),await qr(),this.index(),!this.selected.size))for(let e of this.rows)this.selected.add(e.m.id);this.build()}close(){this.root.hidden=!0}reset(){this.lib=null,this.selected.clear(),this.pkState=null}meName(){return(this.host.settings.me||"").trim().toLowerCase()}index(){let t=this.meName();this.rows=(this.lib.matches||[]).map(e=>({m:e,me:t&&(e.players||[]).find(n=>n.name.toLowerCase()===t)||null,date:new Date(e.startUTC||0)})),this.rows.sort((e,n)=>e.date.getTime()-n.date.getTime())}sel(){return this.rows.filter(t=>this.selected.has(t.m.id))}build(){let t=this.root;t.innerHTML="";let e=ut("div","pageHead");e.appendChild(ut("div","pageTitle","Library")),e.appendChild(ut("div","muted",this.rows.length+" matches \xB7 me = "+(this.host.settings.me||"(set your name in the top bar)")));let n=ut("div","pageTabs");for(let[m,p]of S0){let E=ut("button",m===this.tab?"on":"",p);E.dataset.tab=m,E.onclick=()=>{this.tab=m;for(let x of Array.from(n.children))x.classList.toggle("on",x.dataset.tab===m);this.render()},n.appendChild(E)}e.appendChild(n);let s=ut("button","","Refresh");s.onclick=()=>this.open(!0);let r=ut("button","back","\u2190 Back to replay");r.onclick=()=>this.host.close(),e.append(s,r),t.appendChild(e);let o=ut("div","libSplit"),a=ut("div","libSide"),l=[...new Set(this.rows.map(m=>m.m.level))].sort(),c=[...new Set(this.rows.flatMap(m=>m.me?m.me.vehicles||[]:[]))].sort(),h=document.createElement("select");h.appendChild(new Option("All maps",""));for(let m of l)h.appendChild(new Option(pl(m),m));h.value=this.fMap;let u=document.createElement("select");u.appendChild(new Option("All my aircraft",""));for(let m of c)u.appendChild(new Option(m,m));u.value=this.fAc;let f=()=>{this.fMap=h.value,this.fAc=u.value,this.selected.clear();for(let m of this.rows)(!this.fMap||m.m.level===this.fMap)&&(!this.fAc||m.me&&(m.me.vehicles||[]).includes(this.fAc))&&this.selected.add(m.m.id);this.renderList(),this.render()};h.onchange=f,u.onchange=f;let d=ut("div","filters");d.append(h,u);let _=ut("button","","All");_.onclick=()=>{for(let m of this.rows)this.selected.add(m.m.id);this.renderList(),this.render()};let g=ut("button","","None");g.onclick=()=>{this.selected.clear(),this.renderList(),this.render()},d.append(_,g),a.appendChild(d),this.list=ut("div","matchList"),a.appendChild(this.list),this.body=ut("div","pageBody"),o.append(a,this.body),t.appendChild(o),this.renderList(),this.render()}renderList(){let t=this.list;t.innerHTML="";for(let e of[...this.rows].reverse()){let n=ut("label","mrow"),s=document.createElement("input");s.type="checkbox",s.checked=this.selected.has(e.m.id),s.onchange=()=>{s.checked?this.selected.add(e.m.id):this.selected.delete(e.m.id),this.render()};let r=ut("div","");r.appendChild(ut("div","",pl(e.m.level)+" \xB7 "+e.date.toLocaleDateString([],{month:"short",day:"numeric"})+" "+e.date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}))),r.appendChild(ut("div","muted",e.me?(e.me.vehicles||[]).join(", ")+" \xB7 "+(e.me.summary.kills||0)+" / "+(e.me.summary.deaths||0):"you are not in this match"));let o=ut("button","mini","Open");o.onclick=a=>{a.preventDefault(),this.host.openMatch(e.m.id)},n.append(s,r,o),t.appendChild(n)}}render(){let t=this.body;if(t.innerHTML="",!this.rows.length){t.appendChild(ut("div","pageMsg","No converted matches yet."));return}if(!this.sel().length){t.appendChild(ut("div","pageMsg","Tick at least one match on the left."));return}switch(this.tab){case"overview":this.overview(t);break;case"pk":this.pk(t);break;case"heat":this.heat(t);break;case"compare":this.compare(t);break}}metrics(t){let e=t.summary||{};return{kills:e.kills||0,deaths:e.deaths||0,shots:e.shots||0,killRate:e.shots?(e.missileKills||0)/e.shots:NaN,poorShare:e.shots?(e.shotsPoor||0)/e.shots:NaN,shotRangeKm:e.avgShotRangeM?e.avgShotRangeM/1e3:NaN,rangeRatio:e.avgRangeRatio??NaN,reaction:e.avgReactionS??NaN,notch:e.avgNotchShare??NaN,survived:e.missilesSurvivedShare??NaN,alone:e.aloneShare??NaN,alt:e.meanAltM??NaN,firstShot:e.engagements?e.firstShotShare:NaN}}overview(t){let e=this.sel().filter(g=>g.me);if(!e.length){t.appendChild(ut("div","pageMsg",'You are not in the selected matches. Check your name in the top bar ("Me").'));return}let n=this.host.settings.units,s=e.map(g=>this.metrics(g.me)),r=g=>s.reduce((m,p)=>m+(p[g]||0),0),o=e.reduce((g,m)=>g+(m.me.summary.teamKills||0),0),a=e.reduce((g,m)=>g+(m.me.summary.missileKills||0),0),l=e.reduce((g,m)=>g+(m.me.summary.shotsPoor||0),0),c=ut("div","tiles"),h=(g,m,p="")=>{let E=ut("div","tile");E.append(ut("span","",g),ut("b","",m)),p&&E.appendChild(ut("small","",p)),c.appendChild(E)};h("Matches",String(e.length)),h("Kills / deaths",r("kills")+" / "+r("deaths"),"K/D "+(r("deaths")?(r("kills")/r("deaths")).toFixed(2):"\u221E")+(o?" \xB7 "+o+" team kills":"")),h("Missiles fired",String(r("shots")),(r("shots")?Math.round(a/r("shots")*100):0)+"% killed"),h("Poor shots",en(r("shots")?l/r("shots"):NaN),"graded poor at launch"),h("Average shot range",isFinite(nn(s.map(g=>g.shotRangeKm)))?ue(nn(s.map(g=>g.shotRangeKm))*1e3,n):"\u2014",en(nn(s.map(g=>g.rangeRatio)))+" of max range"),h("Reaction to launches",isFinite(nn(s.map(g=>g.reaction)))?nn(s.map(g=>g.reaction)).toFixed(1)+" s":"\u2014"),h("Notch held",en(nn(s.map(g=>g.notch)))),h("Missiles survived",en(nn(s.map(g=>g.survived)))),h("Flying alone",en(nn(s.map(g=>g.alone)))),h("Average altitude",isFinite(nn(s.map(g=>g.alt)))?ie(nn(s.map(g=>g.alt)),n):"\u2014"),t.appendChild(c),t.appendChild(ut("h3","","Trends, match by match")),t.appendChild(ut("p","fine","Solid: you. Dashed: the average of everyone in that match. Click a point to open the match."));let u=g=>{let m=e[Math.max(0,Math.min(e.length-1,Math.round(g)))];return m?m.date.toLocaleDateString([],{month:"short",day:"numeric"}):""},f=(g,m)=>nn((g.m.players||[]).map(p=>this.metrics(p)[m])),d=ut("div","grid2"),_=(g,m,p,E=!0)=>{let x=ut("div","gbox");x.appendChild(ut("div","cap",g));let y=[{name:"You",color:Qt.blue,pts:e.map((M,T)=>[T,s[T][m]])}];E&&y.push({name:"Lobby average",color:Qt.ink3,pts:e.map((M,T)=>[T,f(M,m)]),dashed:!0}),gn(x,{x0:0,x1:Math.max(1,e.length-1),height:110,series:y,xFmt:u,yFmt:p,onClick:M=>this.host.openMatch(e[Math.max(0,Math.min(e.length-1,Math.round(M)))].m.id)}),d.appendChild(x)};_("Kills per match","kills",g=>g.toFixed(1)),_("Deaths per match","deaths",g=>g.toFixed(1)),_("Share of missiles that killed","killRate",g=>Math.round(g*100)+"%"),_("Share of poor shots","poorShare",g=>Math.round(g*100)+"%"),_("Reaction time to launches","reaction",g=>g.toFixed(1)+" s"),_("Notch held","notch",g=>Math.round(g*100)+"%"),_("Flying alone","alone",g=>Math.round(g*100)+"%"),_("Average altitude","alt",g=>ie(g,n)),t.appendChild(d),e.length<5&&t.appendChild(ut("p","fine","Trends become meaningful after 10 or more matches."))}pk(t){let e=new Set(this.sel().map(R=>R.m.id)),n=Jr(this.lib,e);if(n.length<10){t.appendChild(ut("div","pageMsg","Not enough recorded shots in the selected matches."));return}let s=this.host.settings.units,r=new Map;for(let R of n)r.set(R.model,(r.get(R.model)||0)+1);let o=[...r.entries()].sort((R,S)=>S[1]-R[1]),a=this.meName(),l=new Map;for(let R of this.sel())R.me&&l.set(R.m.id,R.me.slot);let c=R=>l.get(R.match)===R.shooterSlot;if(!this.pkState||!r.has(this.pkState.model)){let S=(o.find(([v])=>n.some(A=>A.model===v&&c(A)))||o[0])[0];this.pkState=this.defaultsFor(S,n.filter(v=>v.model===S))}let h=this.pkState;t.appendChild(ut("p","fine","Set up a shot. The estimate comes from the most similar shots recorded in the selected matches (all players), plus the fly-out estimate from the game's missile data. Shots whose target was destroyed by something else are left out."));let u=ut("div","pkForm"),f=document.createElement("select");for(let[R,S]of o)f.appendChild(new Option(R+" ("+S+" shots)",R));f.value=h.model,f.onchange=()=>{this.pkState=this.defaultsFor(f.value,n.filter(R=>R.model===f.value)),this.render()};let d=(R,S,v,A,L,I)=>{let U=ut("label","pkf");U.appendChild(ut("span","",R));let z=document.createElement("input");z.type="range",z.min=String(A),z.max=String(L),z.step=String(v),z.value=String(h[S]);let H=ut("b","",I(h[S]));z.oninput=()=>{h[S]=Number(z.value),H.textContent=I(h[S]),p()},U.append(z,H),u.appendChild(U)},_=ut("label","pkf");_.append(ut("span","","Missile"),f),u.appendChild(_),d("Range","range",500,1e3,9e4,R=>ue(R,s)),d("Target aspect (0 = flying at you)","aspect",5,0,180,R=>R+"\xB0"),d("Your altitude","shooterAlt",250,0,14e3,R=>ie(R,s)),d("Target altitude","targetAlt",250,0,14e3,R=>ie(R,s)),d("Your Mach","shooterMach",.05,.3,2.2,R=>R.toFixed(2)),d("Target Mach","targetMach",.05,.3,2.2,R=>R.toFixed(2)),d("Target height above ground","targetAgl",10,0,3e3,R=>ie(R,s)),t.appendChild(u);let g=ut("div","pkOut");t.appendChild(g);let m=ut("div","");t.appendChild(m);let p=()=>{g.innerHTML="";let R=n,S=jr(R,{model:h.model,guidance:R.find(L=>L.model===h.model)?.guidance||"",range:h.range,aspect:h.aspect,shooterAlt:h.shooterAlt,targetAlt:h.targetAlt,shooterMach:h.shooterMach,targetMach:h.targetMach,targetAgl:h.targetAgl}),v=ut("div","pkBig");S?v.append(ut("b","",Math.round(S.pk*100)+"%"),ut("span","","chance of a kill \xB7 "+S.n+" similar shots from "+S.pool+" \xB7 90% range "+Math.round(S.lo*100)+"\u2013"+Math.round(S.hi*100)+"%")):v.append(ut("b","","\u2014"),ut("span","","too few similar shots")),g.appendChild(v);let A=Zr(void 0,h.model);if(A){let[L]=[Math.sqrt(401.87*(288.15-.0065*Math.min(h.shooterAlt,11e3)))],[I]=[Math.sqrt(1.4*287.05*(288.15-.0065*Math.min(h.targetAlt,11e3)))],[U,z]=Yr(A,h.shooterAlt,h.shooterMach*L,h.targetAlt,h.targetMach*I,h.aspect),H=h.range<=z?"inside no-escape range":h.range<=U?"inside max range, but the target can outrun it":"beyond max range";g.appendChild(ut("div","pkEnv","Fly-out estimate: max range "+ue(U,s)+", no-escape range "+ue(z,s)+" \u2014 "+H+".")),A.multipath&&A.multipath.length===4&&h.targetAgl<A.multipath[2]&&A.guidance!=="IR"&&g.appendChild(ut("div","pkEnv warn","Target below "+Math.round(A.multipath[2])+" m above ground: this radar missile suffers multipath."))}if(S){let L=S.neighbours.filter(c);g.appendChild(ut("div","fine","Of these similar shots, "+L.length+" were yours ("+L.filter(I=>I.kill).length+" killed)."))}};p();let E=Fs(h.model),x=n.filter(R=>Fs(R.model)===E);m.appendChild(ut("h3","","Kill rate by range and aspect \u2014 "+E+" family ("+x.length+" shots)"));let y=[[0,1e4],[1e4,2e4],[2e4,3e4],[3e4,4e4],[4e4,1e9]],M=[["Hot (0\u201360\xB0)",0,60],["Beam (60\u2013120\xB0)",60,120],["Cold (120\u2013180\xB0)",120,181]],T=ut("div","tbl pkTbl"),P=ut("div","tr th");P.appendChild(ut("div","","Range"));for(let R of M)P.appendChild(ut("div","",R[0]));T.appendChild(P);for(let[R,S]of y){let v=ut("div","tr");v.appendChild(ut("div","",ue(R,s)+(S<1e9?"\u2013"+ue(S,s):"+")));for(let A of M){let L=x.filter(z=>z.range>=R&&z.range<S&&z.aspect>=A[1]&&z.aspect<A[2]),I=L.filter(z=>z.kill).length,U=ut("div","num cell",L.length?Math.round(I/L.length*100)+"%":"\u2014");L.length&&(U.title=I+" kills of "+L.length+" shots",U.style.background="rgba(27,175,122,"+(.08+.5*I/L.length)+")",U.appendChild(ut("small",""," "+I+"/"+L.length))),v.appendChild(U)}T.appendChild(v)}m.appendChild(T)}defaultsFor(t,e){let n=(s,r)=>{let o=e.map(a=>a[s]).filter(a=>a!=null&&isFinite(a)).sort((a,l)=>a-l);return o.length?o[Math.floor(o.length/2)]:r};return{model:t,range:Math.round(n("range",2e4)/500)*500,aspect:Math.round(n("aspect",45)/5)*5,shooterAlt:Math.round(n("shooterAlt",6e3)/250)*250,targetAlt:Math.round(n("targetAlt",6e3)/250)*250,shooterMach:Math.round(n("shooterMach",1)*20)/20,targetMach:Math.round(n("targetMach",1)*20)/20,targetAgl:2e3}}heat(t){let e=this.sel(),n=[...new Set(e.map(d=>d.m.level))].sort(),s=this.heatState;n.includes(s.level)||(s.level=n[0]);let r=ut("div","filters"),o=document.createElement("select");for(let d of n)o.appendChild(new Option(pl(d)+" ("+e.filter(_=>_.m.level===d).length+")",d));o.value=s.level;let a=[["fly","Where I fly"],["kills","Where I get kills"],["deaths","Where I die"],["launches","Where I fire missiles"],["allDeaths","Where everyone dies"],["allKills","Where everyone gets kills"],["top","Where each match's top scorer flies"]],l=document.createElement("select");for(let[d,_]of a)l.appendChild(new Option(_,d));l.value=s.layer,o.onchange=()=>{s.level=o.value,this.render()},l.onchange=()=>{s.layer=l.value,this.render()},r.append(o,l),t.appendChild(r);let c=document.createElement("canvas");c.className="heat",c.width=c.height=720,t.appendChild(c);let h=ut("p","fine","");t.appendChild(h);let u=c.getContext("2d"),f=d=>{let _=c.width,g=d?{x0:d.x0,z0:d.z0,x1:d.x1,z1:d.z1}:{x0:-65536,z0:-65536,x1:65536,z1:65536},m=u.createImageData(_,_),p=m.data;for(let A=0;A<_;A++)for(let L=0;L<_;L++){let I=.18;if(d){let z=Math.min(d.n-2,Math.floor(L/_*d.n)),H=Math.min(d.n-2,Math.floor((1-A/_)*d.n)),Q=d.h[H*d.n+z];if(Q<=d.water+.5)I=.12;else{let G=d.h[H*d.n+z+1]-Q,rt=d.h[(H+1)*d.n+z]-Q;I=.22+.1*(Q-d.hMin)/Math.max(1,d.hMax-d.hMin)+Math.max(-.06,Math.min(.08,(-G+rt)/d.cell*.6))}}let U=(A*_+L)*4;p[U]=p[U+1]=p[U+2]=Math.round(I*255),p[U+3]=255}u.putImageData(m,0,0);let E=128,x=new Float32Array(E*E),y=(A,L=1)=>{if(A)for(let I=0;I+1<A.length;I+=2){let U=Math.floor((A[I]*1e3-g.x0)/(g.x1-g.x0)*E),z=Math.floor((A[I+1]*1e3-g.z0)/(g.z1-g.z0)*E);U>=0&&U<E&&z>=0&&z<E&&(x[z*E+U]+=L)}},M=0,T=this.meName();for(let A of e.filter(L=>L.m.level===s.level)){let L=A.m.players||[],I=L.find(U=>U.name.toLowerCase()===T);switch(s.layer){case"fly":I&&(y(I.track),M+=I.track.length/2);break;case"kills":I&&(y(I.kills,8),M+=I.kills.length/2);break;case"deaths":I&&(y(I.deaths,8),M+=I.deaths.length/2);break;case"launches":I&&(y(I.launches,8),M+=I.launches.length/2);break;case"allDeaths":for(let U of L)y(U.deaths,8),M+=U.deaths.length/2;break;case"allKills":for(let U of L)y(U.kills,8),M+=U.kills.length/2;break;case"top":{let U=L.filter(z=>z.name.toLowerCase()!==T).sort((z,H)=>((H.results||{}).score||0)-((z.results||{}).score||0))[0];U&&(y(U.track),M+=U.track.length/2);break}}}let P=A=>{let L=new Float32Array(E*E);for(let I=0;I<E;I++)for(let U=0;U<E;U++){let z=0,H=0;for(let Q=-1;Q<=1;Q++)for(let G=-1;G<=1;G++){let rt=U+G,ht=I+Q;if(rt>=0&&rt<E&&ht>=0&&ht<E){let Mt=G===0&&Q===0?4:G===0||Q===0?2:1;z+=A[ht*E+rt]*Mt,H+=Mt}}L[I*E+U]=z/H}return L},R=P(P(x)),S=0;for(let A of R)S=Math.max(S,A);let v=_/E;if(S>0)for(let A=0;A<E;A++)for(let L=0;L<E;L++){let I=R[A*E+L]/S;if(I<.03)continue;let U=Math.min(.9,.15+.85*Math.sqrt(I)),z=255,H=Math.round(200-140*I),Q=Math.round(80-60*I);u.fillStyle=`rgba(${z},${H},${Q},${U})`,u.fillRect(L*v,_-(A+1)*v,v+.5,v+.5)}u.strokeStyle="rgba(255,255,255,.12)",u.lineWidth=1;for(let A=Math.ceil(g.x0/1e4)*10;A*1e3<=g.x1;A+=10){let L=(A*1e3-g.x0)/(g.x1-g.x0)*_;u.beginPath(),u.moveTo(L,0),u.lineTo(L,_),u.stroke()}for(let A=Math.ceil(g.z0/1e4)*10;A*1e3<=g.z1;A+=10){let L=_-(A*1e3-g.z0)/(g.z1-g.z0)*_;u.beginPath(),u.moveTo(0,L),u.lineTo(_,L),u.stroke()}h.textContent=Math.round(M)+" points from "+e.filter(A=>A.m.level===s.level).length+" matches. North is up; grid lines every 10 km. Darker orange = more."};this.terrains.has(s.level)?f(this.terrains.get(s.level)):aa(s.level).then(d=>{this.terrains.set(s.level,d),f(d)})}compare(t){let e=this.sel().filter(d=>d.me);if(!e.length){t.appendChild(ut("div","pageMsg","You are not in the selected matches."));return}let n=this.host.settings.units,s=this.meName(),r=[],o=[],a=[],l=[];for(let d of e){let _=(d.m.players||[]).filter(p=>p.name.toLowerCase()!==s);r.push(this.metrics(d.me));let g=[..._].sort((p,E)=>((E.results||{}).score||0)-((p.results||{}).score||0))[0];g&&o.push(this.metrics(g));for(let p of _)a.push(this.metrics(p));let m=new Set(d.me.vehicles||[]);for(let p of _)(p.vehicles||[]).some(E=>m.has(E))&&l.push(this.metrics(p))}t.appendChild(ut("p","fine","Averages per match over the "+e.length+' selected matches you played. "Top scorer" = the highest-scoring other player of each match. "Same aircraft" = other players who flew one of your aircraft in that match ('+l.length+" player-matches)."));let c=(d,_)=>nn(d.map(g=>g[_])),h=[["Kills","kills",d=>d.toFixed(2),!0],["Deaths","deaths",d=>d.toFixed(2),!1],["Missiles fired","shots",d=>d.toFixed(1),!0],["Share of missiles that killed","killRate",d=>en(d),!0],["Share of poor shots","poorShare",d=>en(d),!1],["Average shot range","shotRangeKm",d=>ue(d*1e3,n),!0],["Shot range as share of max range","rangeRatio",d=>en(d),!1],["Reaction time to launches","reaction",d=>d.toFixed(1)+" s",!1],["Notch held","notch",d=>en(d),!0],["Missiles survived","survived",d=>en(d),!0],["First shot in engagements","firstShot",d=>en(d),!0],["Flying alone","alone",d=>en(d),!1],["Average altitude","alt",d=>ie(d,n),!0]],u=ut("div","tbl cmp"),f=ut("div","tr th");for(let d of["","You","Top scorer","Same aircraft","Lobby average"])f.appendChild(ut("div","",d));u.appendChild(f);for(let[d,_,g]of h){let m=ut("div","tr");m.appendChild(ut("div","",d));for(let p of[r,o,l,a]){let E=c(p,_);m.appendChild(ut("div","num"+(p===r?" me":""),isFinite(E)?g(E):"\u2014"))}u.appendChild(m)}t.appendChild(u)}};var yt=i=>document.getElementById(i);function Nt(i,t="",e=""){let n=document.createElement(i);return t&&(n.className=t),e&&(n.textContent=e),n}var E0=i=>"#"+i.toString(16).padStart(6,"0"),w0={me:"spurzz",units:"metric",labels:"all",lblName:!0,lblType:!0,lblAlt:!0,lblSpeed:!1,missileLabels:!0,acTrail:30,msTrail:-1,missiles:!0,cms:!0,bombs:!0,ground:!0,ai:!0,dead:!1,sticks:!0,radar:"focus",desig:"focus",seeker:!0,msKeep:"focus",view:"3d",scanZone:!0,airfields:!0,areas:!1,trailStyle:"ribbon",lineWidth:2,vector:!1,dlz:!0,shade:!0,grid:!0},te=Object.assign({},w0);try{Object.assign(te,JSON.parse(localStorage.getItem("wtrv.settings")||"{}"))}catch{}var ia=()=>{try{localStorage.setItem("wtrv.settings",JSON.stringify(te))}catch{}},at=new Kr(yt("canvasHost"),yt("labels"),te),$=null,Jt=0,bi=!1,Os=1,vh=performance.now(),ea=[.25,.5,1,2,4,8,16,32,64],Ue={x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0},Sn={x:0,y:0,z:0,heading:0,pitch:0,roll:0,i:0,f:0};function Sh(i){return $&&i.owner>=0&&$.playerBySlot.get(i.owner)||null}function We(i){let t=i.kind==="aircraft"?Sh(i):null;return t?t.name:i.ai?i.name+" (AI)":i.name}function ml(i,t){if(!$||!i.units.length)return null;let e=null,n=1/0;for(let s of i.units){let r=$.units[s];if(!r)continue;let o=t<r.tStart?r.tStart-t:t>r.tEnd?t-r.tEnd:0;o<n&&(n=o,e=r)}return e}function T0(i){if(i.missile!==void 0&&$.units[i.missile])return $.units[i.missile].name;let t=String(i.weapon||"");return t?t.replace(/^[a-z]{2,3}_/,"").replace(/_/g," ").toUpperCase():""}function A0(){let i=yt("fetchBox"),t=yt("fetchId"),e=yt("fetchMsg"),n=yt("fetchGo"),s=!1,r=(o,a=!1)=>{e.textContent=o,e.classList.toggle("err",a)};yt("btnFetch").onclick=()=>{i.hidden=!1,s||r(""),t.focus(),t.select()},yt("fetchClose").onclick=()=>{i.hidden=!0},t.onkeydown=o=>{o.key==="Enter"&&n.click(),o.key==="Escape"&&(i.hidden=!0)},n.onclick=async()=>{if(s)return;let o=t.value.trim();if(!o){r("Paste a session ID first.",!0);return}let a;try{let c=await fetch("/api/fetch?id="+encodeURIComponent(o),{method:"POST"});if(!c.ok){r(await c.text(),!0);return}a=await c.json()}catch{r("Could not reach the viewer program.",!0);return}s=!0,n.disabled=!0;let l=a.id;for(;;){let c=(a.bytes/1e6).toFixed(1);if(a.state==="downloading")r(`Session ${l}: downloading\u2026 ${a.pieces} pieces, ${c} MB`);else if(a.state==="converting")r(`Session ${l}: ${a.pieces} pieces, ${c} MB downloaded. Converting\u2026`);else if(a.state==="done"){r(`Session ${l}: ready. Opening it\u2026`);break}else{r(`Session ${l}: failed.
${a.message||""}`,!0),s=!1,n.disabled=!1;return}await new Promise(h=>setTimeout(h,700));try{a=await(await fetch("/api/fetch/"+l)).json()}catch{}}s=!1,n.disabled=!1,location.href=location.pathname+"?s="+encodeURIComponent(l)}}async function C0(){k0(),U0(),D0(),B0(),A0(),qr();let i;try{i=await(await fetch("/api/sessions")).json()}catch{hs(`Could not reach the viewer program.
Is wtviewer still running?`);return}let t=yt("session");if(!i.sessions.length){hs(`No converted matches found in
`+i.sessionsFolder+`

Use \u201C+ Add match\u201D at the top to download one by session ID,
or drag a downloaded replay zip onto tools\\convert.bat.`);return}for(let n of i.sessions){let s=document.createElement("option");s.value=n.id;let r=n.startTimeUtc?new Date(n.startTimeUtc).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";s.textContent=Eh(n.level)+" \u2014 "+r+(n.terrain?"":" (no terrain)"),t.appendChild(s)}let e=new URLSearchParams(location.search).get("s");e&&i.sessions.some(n=>n.id===e)&&(t.value=e),t.onchange=()=>gl(t.value),await gl(t.value),requestAnimationFrame(Ph)}function Eh(i){return(i||"").replace(/^(air|avg)_/,"").replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}function hs(i){yt("loading").style.display=i===null?"none":"flex",i!==null&&(yt("loadingText").textContent=i)}async function gl(i){bi=!1,yl(),hs("Loading\u2026");try{$=await Il(i,hs)}catch(n){hs(`Could not open this match.
`+(n&&n.message||n));return}at.setSession($),us.invalidate(),yt("debrief").hidden||us.open(),at.onSelect=(n,s)=>Bn(n,s),at.onHover=(n,s,r)=>{let o=yt("tip");if(n<0||!$){o.hidden=!0;return}let a=$.units[n];an(a,Math.min(Math.max(Jt,a.tStart),a.tEnd),Sn);let l=a.speed?Vn(a.speed,Sn,a.n):Ah(a,Jt);o.textContent=(a.kind==="aircraft"?We(a)+" \xB7 "+a.name:a.name+(a.parent>=0&&$.units[a.parent]?" from "+We($.units[a.parent]):""))+`
`+ie(Sn.y,te.units)+" \xB7 "+Je(l,te.units),o.style.transform=`translate(${Math.round(s+14)}px, ${Math.round(r+14)}px)`,o.hidden=!1};let t=at.meSlot>=0?$.playerBySlot.get(at.meSlot):null;t&&(t.highlight=!0),at.restyle(),Jt=$.t0;let e=$.manifest.match;yt("matchInfo").textContent=Eh($.levelName)+" \xB7 "+on($.t1-$.t0)+" \xB7 "+$.players.length+" players"+($.terrain?"":" \xB7 no terrain file for this map"),yt("dur").textContent=on($.t1-$.t0),Si(),ks(),fs(),ds(!0),Bs(te.view==="2d"?"2d":"3d"),hs(null)}function Si(){let i=yt("players");if(i.innerHTML="",!$)return;let t=[...new Set($.players.map(e=>e.team))].sort((e,n)=>e===at.myTeam?-1:n===at.myTeam?1:e-n);for(let e of t){let n=$.players.filter(c=>c.team===e).sort((c,h)=>(h.results.score||0)-(c.results.score||0)),s=Nt("div","team"),r=Nt("i"),o=n[0]&&$.units[n[0].units[0]],a=o?o.team===(at.myTeam||1)?Be.friend:Be.enemy:Be.neutral;r.style.background=E0(a),s.appendChild(r),s.appendChild(Nt("span","",(at.myTeam?e===at.myTeam?"My team":"Enemy team":"Team "+e)+" \xB7 "+n.length));let l=Nt("button","",n.every(c=>c.hidden)?"Show":"Hide");l.onclick=()=>{let c=!n.every(h=>h.hidden);for(let h of n)h.hidden=c;at.restyle(),Si()},s.appendChild(l),i.appendChild(s);for(let c of n){let h=Nt("div","pl"+(c.slot===at.meSlot?" me":"")+(c.hidden?" hidden":""));h.dataset.slot=String(c.slot);let u=Nt("button","ic"+(c.hidden?"":" on"),c.hidden?"\u25CB":"\u25CF");u.title=c.hidden?"Show this player":"Hide this player",u.onclick=p=>{p.stopPropagation(),c.hidden=!c.hidden,at.restyle(),Si()};let f=Nt("button","ic star"+(c.highlight?" on":""),c.highlight?"\u2605":"\u2606");f.title="Highlight this player",f.onclick=p=>{p.stopPropagation(),c.highlight=!c.highlight,at.restyle(),Si()};let d=Nt("div");d.appendChild(Nt("div","nm",c.name));let _=$.units[c.units[0]];d.appendChild(Nt("div","ac",_?_.name:"did not fly"));let g=c.results,m=Nt("div","kd",(g.kills||0)+" / "+(g.deaths||0));m.title="Air kills / deaths",h.append(u,f,d,m),h.onclick=()=>{let p=ml(c,Jt);p&&Bn(p.id,!1)},h.ondblclick=()=>{let p=ml(c,Jt);p&&(Bn(p.id,!1),at.setFollow(p.id),ei())},i.appendChild(h)}}sa()}function sa(){if(!$)return;let i=at.selected>=0?$.units[at.selected]:null;for(let t of Array.from(yt("players").querySelectorAll(".pl"))){let e=$.playerBySlot.get(Number(t.dataset.slot)),n=e.units.length?$.units[e.units[e.units.length-1]]:null;t.classList.toggle("down",!!n&&n.destroyed&&Jt>n.tEnd),t.classList.toggle("sel",!!i&&i.owner===e.slot)}}function R0(){let i=new Set;if(!$||at.meSlot<0)return i;let t=at.meSlot;i.add(t);let e=new Set($.playerBySlot.get(t).units),n=s=>{if(s===void 0)return;let r=$.units[s];r&&r.owner>=0&&i.add(r.owner)};for(let s of $.events)if(s.type==="kill"){let r=s.victim!==void 0&&$.units[s.victim]?$.units[s.victim].owner:-1;s.killerPlayer===t&&n(s.victim),r===t&&(s.killerPlayer!==void 0&&i.add(s.killerPlayer),n(s.killer))}else if(s.type==="message"&&s.units&&s.units.some(r=>e.has(r)))for(let r of s.units)n(r);for(let s of $.units){if(!s.radar)continue;let r=e.has(s.id);for(let o of s.radar)for(let a of o.targets)r?n(a):e.has(a)&&i.add(s.owner)}return i.delete(-1),i}function Bn(i,t){$&&(t&&at.selected>=0&&i!==at.selected?at.measure=i:(at.selected=i,at.measure===i&&(at.measure=-1)),at.restyle(),sa(),Ch("selected"),ds(!0),fs())}function wh(){at.selected=-1,at.measure=-1,at.setFollow(-1),at.restyle(),sa(),ds(!0),ei(),fs()}function ei(){ds(!0),yt("btnFollow").classList.toggle("on",at.follow>=0),yt("btnFollow").textContent=at.follow>=0?"Following":"Follow"}var na=-2;function ds(i){let t=yt("selBody");if(!$||at.selected<0){na!==-1&&(t.className="muted",t.textContent="Click an aircraft or a missile.",na=-1);return}let e=$.units[at.selected];if(i||na!==e.id){na=e.id,t.className="",t.innerHTML="";let h=Sh(e);t.appendChild(Nt("div","selName",e.kind==="aircraft"?We(e):e.name));let u="";if(e.kind==="aircraft")u=e.name+(h&&h.clan?" \xB7 "+h.clan:"");else if(e.kind==="missile"){let p=e.parent>=0?$.units[e.parent]:null;u=(e.missile&&e.missile.guidance?P0(e.missile.guidance)+" \xB7 ":"")+(p?"launched by "+We(p):"")}t.appendChild(Nt("div","selSub",u));let f=Nt("div","btnRow"),d=Nt("button",at.follow===e.id?"on":"",at.follow===e.id?"Following":"Follow");if(d.onclick=()=>{at.setFollow(at.follow===e.id?-1:e.id),ei()},f.appendChild(d),e.kind==="missile"&&e.parent>=0){let p=Nt("button","","Select launcher");p.onclick=()=>Bn(e.parent,!1),f.appendChild(p)}let _=Nt("button","","Go to start");_.onclick=()=>En(e.tStart),f.appendChild(_);let g=Nt("button","","Clear");g.onclick=wh,f.appendChild(g),t.appendChild(f);let m=Nt("div","kv");if(m.id="selKV",t.appendChild(m),e.kind==="missile"){let p=$.launchByMissile.get(e.id);t.appendChild(Nt("div","cap","Missile energy"));let E=e.seekerMode?Array.from(e.seekerMode).indexOf(2):-1;us.energyChart(t,{missile:e.id,target:p&&p.target!==void 0?p.target:-1,activeT:E>=0?e.t[E]:null})}if(e.kind==="aircraft"||e.kind==="missile")for(let[p,E]of[["alt","Altitude"],["spd","Speed"]]){let x=Nt("div","chart"),y=Nt("div","cap");y.append(Nt("span","",E),Nt("span","","")),y.id="cap-"+p;let M=document.createElement("canvas");M.id="chart-"+p,M.onclick=T=>{let P=M.getBoundingClientRect();En(e.tStart+(e.tEnd-e.tStart)*(T.clientX-P.left)/P.width)},x.append(y,M),t.appendChild(x)}}let n=yt("selKV");n.innerHTML="";let s=(h,u,f=!1)=>{let d=Nt("div",f?"wide":"");d.append(Nt("span","",h),Nt("b","",u)),n.appendChild(d)};Jt>=e.tStart&&Jt<=e.tEnd||s("Status",Jt<e.tStart?"Not yet in the match (starts "+on(e.tStart-$.t0)+")":(e.destroyed?"Destroyed at ":"Ended at ")+on(e.tEnd-$.t0),!0);let o=Math.min(Math.max(Jt,e.tStart),e.tEnd);an(e,o,Ue);let a=e.speed?Vn(e.speed,Ue,e.n):Ah(e,o),l=e.mach?Vn(e.mach,Ue,e.n):NaN,c=e.agl?Vn(e.agl,Ue,e.n):NaN;if(s("Altitude",ie(Ue.y,te.units)+(isFinite(c)?" ("+ie(Math.max(0,c),te.units)+" above ground)":""),isFinite(c)),s("Speed",Je(a,te.units)),isFinite(l)&&s("Mach",l.toFixed(2)),e.kind==="aircraft"){s("Heading",String(Math.round((Ue.heading+360)%360)).padStart(3,"0")+"\xB0"),s("G (estimated)",Vn(e.g,Ue,e.n).toFixed(1)),s("Pitch",Ue.pitch.toFixed(0)+"\xB0"),s("Roll",Ue.roll.toFixed(0)+"\xB0");let h=Ti(e,o);h&&(s("Radar",(h.sensor||"Radar")+" \u2014 "+(h.on?h.label||h.state:"off"),!0),h.targets.length&&s("Locked on",h.targets.map(d=>$.units[d]?We($.units[d]):"?").join(", "),!0));let u=[];for(let d of $.units){if(d.kind!=="aircraft"||!d.radar||d.id===e.id)continue;let _=Ti(d,o);_&&_.targets.includes(e.id)&&o>=d.tStart&&o<=d.tEnd&&u.push(We(d))}u.length&&s("Locked by",u.join(", "),!0);let f=e.owner>=0?$.stats.get(e.owner):null;f&&(s("Flight time (match)",on(f.flightTimeS*1e3)),s("Distance flown",ue(f.distanceKm*1e3,te.units)),s("Highest G",f.maxG.toFixed(1)),s("Top speed","Mach "+f.maxMach.toFixed(2)),s("Missiles fired / kills",f.missilesFired+" / "+f.missileKills),s("Missiles fired at them",String(f.missilesFiredAtPlayer)))}else if(e.kind==="missile"){let h=Ye(e,o),u=e.seekerMode?e.seekerMode[h]:0;s("Seeker",u===2?"Tracking":u===1?"Searching":"\u2014"),s("Flight time",((o-e.tStart)/1e3).toFixed(1)+" s");let f=e.missile&&e.missile.spec;f&&f.maxG&&(s("Missile limit",f.maxG+" G"),s("Top speed (game data)","Mach "+f.machMax));let d=$.launchByMissile.get(e.id);if(d)d.target!==void 0&&$.units[d.target]&&s("Fired at",We($.units[d.target])+" ("+$.units[d.target].name+")",!0),d.rangeM!==void 0&&(s("Launch range",ue(d.rangeM,te.units)),s("Target aspect",d.aspectDeg===void 0?"\u2014":d.aspectDeg+"\xB0 "+(d.aspectDeg<60?"(head-on)":d.aspectDeg>120?"(tail)":"(beam)"))),d.closureMs!==void 0&&(s("Closure at launch",Je(d.closureMs,te.units)),s("Off the nose",d.offBoresightDeg+"\xB0")),s(d.outcome==="kill"?"Result":"Result (estimate, "+d.confidence+" confidence)",oa(d),!0);else{let _=$.kills.find(g=>g.missile===e.id);s("Result",_?"Kill":"No kill recorded",!0)}}Mh("alt",e,h=>e.y[h],h=>ie(h,te.units)),Mh("spd",e,h=>Th(e,h),h=>Je(h,te.units))}function P0(i){return{ARH:"Active radar",SARH:"Semi-active radar",IR:"Infrared"}[i]||i}function Th(i,t){if(i.speed)return i.speed[t];let e=Math.max(0,t-2),n=Math.min(i.n-1,t+2),s=(i.t[n]-i.t[e])/1e3;return s>0?Math.hypot(i.x[n]-i.x[e],i.y[n]-i.y[e],i.z[n]-i.z[e])/s:0}function Ah(i,t){return Th(i,Ye(i,t))}function Mh(i,t,e,n){let s=document.getElementById("chart-"+i);if(!s)return;let r=window.devicePixelRatio||1,o=s.clientWidth,a=s.clientHeight;if(!o)return;s.width!==Math.round(o*r)&&(s.width=Math.round(o*r),s.height=Math.round(a*r));let l=s.getContext("2d");l.setTransform(r,0,0,r,0,0),l.clearRect(0,0,o,a);let c=1/0,h=-1/0,u=Math.max(1,Math.floor(t.n/o));for(let p=0;p<t.n;p+=u){let E=e(p);E<c&&(c=E),E>h&&(h=E)}if(!isFinite(c))return;h-c<1&&(h=c+1);let f=p=>(p-t.tStart)/Math.max(1,t.tEnd-t.tStart)*o,d=p=>a-5-(p-c)/(h-c)*(a-10);l.strokeStyle="#4da3ff",l.lineWidth=2,l.lineJoin="round",l.beginPath();for(let p=0;p<t.n;p+=u){let E=f(t.t[p]),x=d(e(p));p===0?l.moveTo(E,x):l.lineTo(E,x)}l.stroke();let _=Math.min(Math.max(Jt,t.tStart),t.tEnd),g=Ye(t,_);l.strokeStyle="rgba(255,255,255,.55)",l.lineWidth=1,l.beginPath(),l.moveTo(f(_),0),l.lineTo(f(_),a),l.stroke(),l.fillStyle="#fff",l.beginPath(),l.arc(f(_),d(e(g)),3,0,7),l.fill();let m=document.getElementById("cap-"+i);m&&(m.lastChild.textContent=n(c)+" \u2013 "+n(h))}function I0(){let i=yt("measure");if(!$||at.selected<0||at.measure<0){i.hidden=!0;return}let t=$.units[at.selected],e=$.units[at.measure];if(Jt<t.tStart||Jt>t.tEnd||Jt<e.tStart||Jt>e.tEnd){i.hidden=!0;return}let n=u=>(an(t,u,Ue),an(e,u,Sn),Math.hypot(Ue.x-Sn.x,Ue.y-Sn.y,Ue.z-Sn.z)),s=n(Math.max(t.tStart,e.tStart,Jt-250)),r=n(Jt),o=(Math.atan2(Sn.x-Ue.x,Sn.z-Ue.z)*180/Math.PI+360)%360,a=(s-r)/Math.max(.05,Math.min(250,Jt-Math.max(t.tStart,e.tStart))/1e3),l=Sn.y-Ue.y;i.hidden=!1,i.innerHTML="",i.append(Nt("b","",We(t)),document.createTextNode(" \u2192 "),Nt("b","",We(e)),document.createTextNode("   range "+ue(r,te.units)+" \xB7 bearing "+String(Math.round(o)).padStart(3,"0")+"\xB0 \xB7 "+(l>=0?"+":"\u2212")+ie(Math.abs(l),te.units)+" \xB7 closing "+Je(a,te.units)));let c=at.dlzInfo;if(c&&c.rmax>0){let u=c.range<=c.rne?"inside no-escape range":c.range<=c.rmax?"inside max range only":"out of range";i.appendChild(Nt("div","dlz",c.missile+": max "+ue(c.rmax,te.units)+" \xB7 no-escape "+ue(c.rne,te.units)+" \u2014 "+u+" (estimate)"))}let h=Nt("button","","\xD7");h.onclick=()=>{at.measure=-1,at.restyle()},i.appendChild(h)}function L0(i,t){let e=at.meSlot,n=0;for(let s of $.launches){if(!$.units[s.missile])continue;let o=e>=0&&s.shooterPlayer===e,a=e>=0&&s.targetPlayer===e;if(t&&!o&&!a)continue;let l=Nt("div","ev"+(o?" mine":a?" lost":""));l.appendChild(Nt("div","tm",on(s.t-$.t0)));let c=Nt("div"),h=s.shooter!==void 0&&$.units[s.shooter]?We($.units[s.shooter]):"?",u=s.target!==void 0&&$.units[s.target]?We($.units[s.target]):"?";c.appendChild(Nt("div","",h+" \u2192 "+u)),c.appendChild(Nt("div","wp",s.model+(s.rangeM!==void 0?" \xB7 "+ue(s.rangeM,te.units):"")+" \xB7 "+oa(s))),l.appendChild(c),l.onclick=()=>{En(s.t-2e3),Bn(s.missile,!1)},i.appendChild(l),n++}n||i.appendChild(Nt("div","muted",$.launches.length?"No missile shots to show.":"This match was converted before shot records existed. Convert it again to see them."))}function ks(){let i=yt("events");if(i.innerHTML="",!$)return;let t=yt("evMine").checked,e=at.meSlot;if(yt("evKind").value==="shots"){L0(i,t);return}let n=0;for(let s of $.kills){let r=s.victim!==void 0?$.units[s.victim]:null,o=s.killer!==void 0?$.units[s.killer]:null;if(!r||r.kind!=="aircraft")continue;let a=s.killerPlayer!==void 0?s.killerPlayer:o?o.owner:-1,l=e>=0&&a===e,c=e>=0&&r.owner===e;if(t&&!l&&!c)continue;let h=Nt("div","ev"+(l?" mine":c?" lost":""));h.appendChild(Nt("div","tm",on(s.t-$.t0)));let u=Nt("div"),f=a>=0&&$.playerBySlot.get(a)?$.playerBySlot.get(a).name:o?We(o):"",d=Nt("div");d.textContent=(f?f+" \u2192 ":"Lost: ")+We(r),s.teamKill&&d.appendChild(Nt("span","tk","  team kill")),u.appendChild(d);let _=T0(s);u.appendChild(Nt("div","wp",(o?o.name+" \xB7 ":"")+(_||"crash / unknown")+" \u2192 "+r.name)),h.appendChild(u),h.onclick=()=>{En(s.t-8e3),Bn(s.missile!==void 0?s.missile:r.id,!1)},i.appendChild(h),n++}n||i.appendChild(Nt("div","muted","No shoot-downs to show."))}function fs(){let i=yt("strip");if(!$)return;let t=window.devicePixelRatio||1,e=i.clientWidth,n=i.clientHeight;if(!e)return;(i.width!==Math.round(e*t)||i.height!==Math.round(n*t))&&(i.width=Math.round(e*t),i.height=Math.round(n*t));let s=i.getContext("2d");s.setTransform(t,0,0,t,0,0),s.clearRect(0,0,e,n);let r=l=>6+(l-$.t0)/Math.max(1,$.t1-$.t0)*(e-12),o=24;if(s.fillStyle="#2f3948",s.fillRect(6,o-2,e-12,4),at.selected>=0){let l=$.units[at.selected];s.fillStyle="#5a6b8a",s.fillRect(r(l.tStart),o-2,Math.max(2,r(l.tEnd)-r(l.tStart)),4)}s.fillStyle="#ffe14d",s.fillRect(6,o-2,r(Jt)-6,4);let a=at.meSlot;for(let l of $.kills){let c=l.victim!==void 0?$.units[l.victim]:null;if(!c||c.kind!=="aircraft")continue;let h=a>=0&&l.killerPlayer===a,u=a>=0&&c.owner===a;s.fillStyle=h?"#ffe14d":u?"#ff6a3d":"#7b8696";let f=h||u?14:7;s.fillRect(Math.round(r(l.t))-1,o-5-f,2,f)}if(a>=0){s.fillStyle="#e6eaf0";for(let l of $.events)l.type==="launch"&&$.units[l.unit]&&$.units[l.unit].kind==="missile"&&$.units[l.unit].owner===a&&(s.beginPath(),s.arc(r(l.t),o+8,2,0,7),s.fill())}s.fillStyle="#fff",s.beginPath(),s.arc(r(Jt),o,6,0,7),s.fill()}function En(i){$&&(Jt=Math.min($.t1,Math.max($.t0,i)),Rh(!0))}function yl(){yt("play").textContent=bi?"\u275A\u275A":"\u25B6"}function D0(){let i=yt("speed");for(let s of ea){let r=document.createElement("option");r.value=String(s),r.textContent=s+"\xD7",i.appendChild(r)}i.value="1",i.onchange=()=>{Os=Number(i.value)},yt("play").onclick=_l;let t=yt("strip"),e=!1,n=s=>{let r=t.getBoundingClientRect();En($.t0+($.t1-$.t0)*Math.min(1,Math.max(0,(s.clientX-r.left-6)/(r.width-12))))};t.addEventListener("pointerdown",s=>{$&&(e=!0,t.setPointerCapture(s.pointerId),n(s))}),t.addEventListener("pointermove",s=>{e&&$&&n(s)}),t.addEventListener("pointerup",()=>{e=!1}),window.addEventListener("resize",fs),window.addEventListener("keydown",s=>{let r=s.target.tagName;if(!(r==="INPUT"||r==="SELECT"))if(s.code==="Space")_l(),s.preventDefault();else if(s.code==="ArrowLeft")En(Jt-(s.shiftKey?3e4:5e3));else if(s.code==="ArrowRight")En(Jt+(s.shiftKey?3e4:5e3));else if(s.key===","||s.key==="."){let o=ea.indexOf(Os)+(s.key==="."?1:-1);o>=0&&o<ea.length&&(Os=ea[o],i.value=String(Os))}else s.key==="f"||s.key==="F"?yt("btnFollow").click():s.key==="m"||s.key==="M"?yt("btnMe").click():s.key==="t"||s.key==="T"?at.topView():s.key==="2"?Bs("2d"):s.key==="3"?Bs("3d"):s.key==="h"||s.key==="H"?(at.homeCamera(),ei()):s.key==="Escape"&&(!yt("debrief").hidden||!yt("library").hidden?ni(""):wh())})}function _l(){$&&(!bi&&Jt>=$.t1&&(Jt=$.t0),bi=!bi,yl())}function U0(){yt("btnHome").onclick=()=>{at.homeCamera(),ei()},yt("btnTop").onclick=()=>at.topView(),yt("btn3d").onclick=()=>Bs("3d"),yt("btn2d").onclick=()=>Bs("2d"),yt("btnDebrief").onclick=()=>ni(yt("debrief").hidden?"debrief":""),yt("btnLibrary").onclick=()=>ni(yt("library").hidden?"library":""),yt("btnMe").onclick=()=>{if(!$||at.meSlot<0)return;let e=$.playerBySlot.get(at.meSlot),n=ml(e,Jt);n&&(Bn(n.id,!1),at.setFollow(n.id),ei())},yt("btnFollow").onclick=()=>{at.follow>=0?at.setFollow(-1):at.selected>=0&&at.setFollow(at.selected),ei()};let i=yt("units");i.value=te.units,i.onchange=()=>{te.units=i.value,ia(),ds(!0),ks()};let t=yt("me");t.value=te.me,t.onchange=()=>{if(te.me=t.value.trim(),ia(),!$)return;for(let n of $.players)n.highlight=!1;at.resolveMe();let e=$.playerBySlot.get(at.meSlot);e&&(e.highlight=!0),at.restyle(),Si(),ks(),fs(),xl.reset(),us.invalidate()},yt("btnAll").onclick=()=>{if($){for(let e of $.players)e.hidden=!1;at.restyle(),Si()}},yt("btnInvolved").onclick=()=>{if(!$)return;let e=R0();if(e.size){for(let n of $.players)n.hidden=!e.has(n.slot);at.restyle(),Si()}},yt("evMine").onchange=ks,yt("evKind").onchange=ks}var N0="Drag: rotate \xB7 Right-drag: move \xB7 Wheel: zoom \xB7 Click: select \xB7 Double-click: follow \xB7 Shift-click: measure",F0="Drag: move \xB7 Wheel: zoom \xB7 Click: select \xB7 Double-click: follow \xB7 Shift-click: measure";function Bs(i){at.setMode(i),te.view=i,ia(),yt("btn3d").classList.toggle("on",i==="3d"),yt("btn2d").classList.toggle("on",i==="2d"),yt("btnTop").disabled=i==="2d",yt("hint").textContent=i==="2d"?F0:N0,yt("scale").hidden=i!=="2d"}function O0(){if(at.mode!=="2d")return;let i=at.metresPerPx(),t=te.units==="aviation",e=t?1852:1e3,n=[.1,.2,.5,1,2,5,10,20,50,100],s=n[0];for(let r of n)r*e/i<=160&&(s=r);yt("scaleBar").style.width=Math.round(s*e/i)+"px",yt("scaleTxt").textContent=s+(t?" nm":" km")}function k0(){for(let i of Array.from(document.querySelectorAll("[data-set]"))){let t=i.dataset.set;i instanceof HTMLInputElement?i.checked=!!te[t]:i.value=String(te[t]),i.onchange=()=>{te[t]=i instanceof HTMLInputElement?i.checked:i.dataset.num?Number(i.value):i.value,ia(),(t==="shade"||t==="grid")&&at.paintTerrain()}}}function Ch(i){for(let t of Array.from(document.querySelectorAll(".tabs button")))t.classList.toggle("on",t.dataset.tab===i);for(let t of["display","selected","events"])yt("tab-"+t).hidden=t!==i}function B0(){for(let i of Array.from(document.querySelectorAll(".tabs button")))i.onclick=()=>Ch(i.dataset.tab)}function ni(i){yt("debrief").hidden=i!=="debrief",yt("library").hidden=i!=="library",yt("btnDebrief").classList.toggle("on",i==="debrief"),yt("btnLibrary").classList.toggle("on",i==="library"),i==="debrief"?us.open():i==="library"&&xl.open()}var us=new Qr(yt("debrief"),{ses:()=>$,settings:te,meSlot:()=>at.meSlot,unitTitle:We,seek:i=>{ni(""),En(i)},watch:(i,t,e)=>{ni(""),!(i<0||!$)&&(En(i),t>=0&&(Bn(t,!1),e&&(at.setFollow(t),ei())))}}),xl=new ta(yt("library"),{settings:te,close:()=>ni(""),openMatch:async i=>{ni("");let t=yt("session");t.value!==i&&(t.value=i,await gl(i))}}),bh=0;function Rh(i){let t=performance.now();!i&&t-bh<120||(bh=t,$&&(yt("clock").textContent=on(Jt-$.t0),fs(),ds(!1),I0(),sa(),O0(),yt("needle").style.transform="rotate("+-at.viewHeading()+"deg)"))}function Ph(i){let t=Math.min(100,i-vh);vh=i,$&&(bi&&(Jt+=t*Os,Jt>=$.t1&&(Jt=$.t1,bi=!1,yl())),at.update(Jt),Rh(!1)),requestAnimationFrame(Ph)}window.wtrv={viewer:at,seek:En,select:Bn,showPage:ni,debrief:us,library:xl,get t(){return Jt},get ses(){return $},play:_l};C0();})();
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
