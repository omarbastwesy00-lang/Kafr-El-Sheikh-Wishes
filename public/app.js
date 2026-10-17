import { createClient } from '@supabase/supabase-js';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';

var backendUrl=import.meta.env.VITE_SUPABASE_URL||"",backendKey=import.meta.env.VITE_SUPABASE_ANON_KEY||"";
var supabase=backendUrl&&backendKey?createClient(backendUrl,backendKey,{auth:{persistSession:true,autoRefreshToken:true}}):null;
(function(){
var TOTAL=1000,CATS=[["a","فيروزي","#6fd8cb",100,.85],["b","ذهبي","#f4c874",100,1],["c","أرجواني","#c79bff",100,1.15]];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var PI=Math.PI,a0=.5,h0=.9,RN=8,Ls=[],sumL=0,k,j,slots=[],dust=[],r=rng(77);
for(k=0;k<RN;k++){Ls.push(2*h0+PI*(a0+.1+k*.093));sumL+=Ls[k]}
var ns=Ls.map(function(L){return Math.round(TOTAL*L/sumL)});ns[RN-1]+=TOTAL-ns.reduce(function(x,y){return x+y},0);
for(k=0;k<RN;k++){var rad=a0+.1+k*.093,L=Ls[k];
 for(j=0;j<ns[k];j++){var s=(j+.5)/ns[k]*L,x,y;
  if(s<h0){x=-rad;y=s}else if(s<h0+PI*rad){var th=PI-(s-h0)/rad;x=rad*Math.cos(th);y=h0+rad*Math.sin(th)}else{x=rad;y=h0-(s-h0-PI*rad)}
  slots.push({x:x+(r()-.5)*.012,y:y+(r()-.5)*.012,ph:r()*6.28,rt:700+k*260+s/L*1200,w:null,born:-1e9,px:0,py:0,dl:r()*2600})}}
for(j=0;j<130;j++)dust.push({x:r(),y:r(),s:.4+r()*.9,ph:r()*6});
var motes=[];for(j=0;j<80;j++)motes.push({x:(r()-.5)*.8,o:r(),sp:.00004+r()*.00005,s:.6+r()*1.4});
var orderCodes=[];try{var storedOrders=JSON.parse(localStorage.getItem("kfsOrderCodes"));orderCodes=Array.isArray(storedOrders)?storedOrders.filter(function(item){return item&&typeof item.code==="string"&&/^KS-[A-F0-9]{10}$/.test(item.code)}):[]}catch(e){}
var perm=[],num=[],pj,pk,pt;for(pj=0;pj<TOTAL;pj++)perm.push(pj);for(pj=TOTAL-1;pj>0;pj--){pk=Math.floor(r()*(pj+1));pt=perm[pj];perm[pj]=perm[pk];perm[pk]=pt}perm.forEach(function(sl,n){num[sl]=n+1});
function put(no,t,n,c){slots[perm[no-1]].w={t:t,n:n,c:c}}

var mineNos={},flighted={},apiMessage=document.getElementById("api-message"),networkMessage=document.getElementById("network-message"),activeOrderCode="";
function saveOrders(){try{localStorage.setItem("kfsOrderCodes",JSON.stringify(orderCodes))}catch(e){}}
async function invokeEdge(name,body){if(!supabase)throw new Error("configuration_missing");var result=await supabase.functions.invoke(name,{body:body});if(result.error){var details=null,response=result.error.context;if(response&&typeof response.clone==="function"){try{details=await response.clone().json()}catch(e){}}if(details&&typeof details.error==="string")throw new Error(details.error);throw result.error}return result.data}
var API={order:async function(o){var data=await invokeEdge("create-order",o);if(!data||!data.code)throw new Error("invalid_response");return data},status:async function(code){return invokeEdge("order-status",{code:code})},list:async function(){if(!supabase)throw new Error("configuration_missing");var result=await supabase.rpc("get_public_wishes");if(result.error)throw result.error;return result.data||[]}};
var cv=document.getElementById("c"),cx=cv.getContext("2d"),W,H,dpr,U,gx,gy,t0=performance.now(),last=t0,
filt=-1,sel=-1,searchHighlight=-1,searchHighlightUntil=0,fly=null,fin=null,pulse=-1e9,sparks=[],par={x:0,y:0,tx:0,ty:0},snd=true,ac,wcat=0,
reduce=matchMedia("(prefers-reduced-motion:reduce)").matches,openedReal=false;
var spr=CATS.map(function(c){var k=document.createElement("canvas");k.width=k.height=64;var g=k.getContext("2d"),d=g.createRadialGradient(32,32,0,32,32,32);
 d.addColorStop(0,"#fff");d.addColorStop(.16,c[2]);d.addColorStop(.45,c[2]+"55");d.addColorStop(1,c[2]+"00");g.fillStyle=d;g.fillRect(0,0,64,64);return k});
var LA=60,LH=110,SP=10;
var lowQ=false,dl=null,lastT=0,slow=0,rzT,zm=1,tx=0,ty=0,PT={},pre=null;
function fit(fw,fh){var best=null,sCap=Math.min(16,fh/30),Amin=Math.max(26,Math.min(fw*.17,fh*.14)),Amax=Math.max(Amin,Math.min(fw*.4,fh*.3));
 for(var A=Amin;A<=Amax;A+=3)for(var hr=1.8;hr<=3.45;hr+=.4){var h=hr*A,Dm=Math.min(fw/2-A,fh-h-A);if(Dm<14)continue;
  for(var s=Math.min(18,sCap+4);s>=4;s-=.25){var g=s*1.3,R=Math.floor((Dm-g)/s)+1;if(R<2)continue;var cap=0;for(var k=0;k<R;k++)cap+=(2*h+PI*(A+g+k*(Dm-g)/(R-1)))/s;
   if(cap>=TOTAL){var key=Math.min(s,sCap)*1000+A;if(!best||key>best.key)best={key:key,A:A,h:h,Dm:Dm,s:s,R:R,g:g};break}}}
 return best||{A:26,h:47,Dm:Math.max(16,fw/2-26),s:4,R:3,g:6}}
function place(b){LA=b.A;LH=b.h;SP=b.s;var ds=[],Ls=[],sum=0,k,j,idx=0,tot=0;
 for(k=0;k<b.R;k++){ds.push(b.g+k*(b.Dm-b.g)/(b.R-1));Ls.push(2*b.h+PI*(b.A+ds[k]));sum+=Ls[k]}
 var cn=Ls.map(function(L){var c=Math.round(TOTAL*L/sum);tot+=c;return c});cn[b.R-1]+=TOTAL-tot;
 for(k=0;k<b.R;k++){var rad=b.A+ds[k];for(j=0;j<cn[k];j++){var t=(j+(k%2?.75:.25))/cn[k]*Ls[k],x,y;
  if(t<b.h){x=-rad;y=t}else if(t<b.h+PI*rad){var th=PI-(t-b.h)/rad;x=rad*Math.cos(th);y=b.h+rad*Math.sin(th)}else{x=rad;y=b.h-(t-b.h-PI*rad)}
  var s=slots[idx++];s.x=x;s.y=y;s.rt=700+k*1900/b.R+t/Ls[k]*900}}}
function size(){dpr=lowQ?1:Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
 var hb=document.querySelector("header").getBoundingClientRect().bottom,bt=document.querySelector(".bar").getBoundingClientRect().top;place(fit(W-16,Math.max(120,bt-hb-14)));U=LA*2;gx=W/2;gy=bt-6;dl=document.createElement("canvas");dl.width=W*dpr;dl.height=H*dpr;var dg=dl.getContext("2d");dg.scale(dpr,dpr);dg.fillStyle="rgba(191,225,240,.6)";slots.forEach(function(s){dg.fillRect(gx+s.x-.7,gy-s.y-.7,1.4,1.4)});clampCam()}
function total(){var c=0;slots.forEach(function(s){if(s.w)c++});return c}
var nEl=document.getElementById("n"),lEl=document.getElementById("left"),shown=-1;
function counter(el){var c=total(),v=Math.round(c*Math.min(1,el/3600));if(v!==shown){shown=v;nEl.textContent=String(v).padStart(3,"0");lEl.textContent=c>=TOTAL?"The door is open":(TOTAL-c).toLocaleString("en-US")+" wishes until the door opens"}}
function chime(f){if(!snd)return;try{ac=ac||new AudioContext();if(ac.state==="suspended")ac.resume();var o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.13,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);g.connect(ac.destination);o.start();o.stop(t+1.7)}catch(e){}}
function ease(p){return 1-Math.pow(1-p,3)}
function cl(v){return Math.max(0,Math.min(1,v))}
function arch(c,x,y,A,Hh){c.beginPath();c.moveTo(x-A,y);c.lineTo(x-A,y-Hh);c.arc(x,y-Hh,A,PI,0);c.lineTo(x+A,y);c.closePath()}
function leaf(A,Hh){var top=gy-Hh-A,g=cx.createLinearGradient(0,0,A,0);g.addColorStop(0,"#04101b");g.addColorStop(1,"#0f3552");cx.fillStyle=g;cx.fillRect(0,top,A,Hh+A);
 cx.strokeStyle="rgba(244,200,116,.6)";cx.lineWidth=1.3;cx.beginPath();
 [.1,.5,1].forEach(function(f){cx.moveTo(0,gy-Hh*f);cx.lineTo(A,gy-Hh*f)});
 cx.moveTo(A*.1,gy);cx.lineTo(A*.1,gy-Hh);cx.moveTo(A*.94,gy);cx.lineTo(A*.94,top+A*.2);cx.stroke();
 cx.beginPath();cx.arc(A,gy-Hh,A*.8,PI,1.5*PI);cx.stroke();cx.beginPath();cx.arc(A,gy-Hh,A*.55,PI,1.5*PI);cx.stroke();
 [.28,.74].forEach(function(f){var y=gy-Hh*f,d=A*.15,x=A*.5;cx.beginPath();cx.moveTo(x,y-d);cx.lineTo(x+d,y);cx.lineTo(x,y+d);cx.lineTo(x-d,y);cx.closePath();cx.stroke()});
 cx.beginPath();cx.arc(A*.84,gy-Hh*.4,A*.07,0,6.283);cx.stroke()}
function draw(now){if(now-lastT<24){requestAnimationFrame(draw);return}var fd=now-lastT;lastT=now;if(fd>45&&fd<400&&!lowQ){if(++slow>25){lowQ=true;size()}}else if(slow>0&&fd<=45)slow--;
 var el=now-t0,dt=Math.min(50,now-last)/1000,f=fin?now-fin.t0:0,tot=total(),prog=tot/TOTAL;last=now;
 var build=fin?ease(cl(f/1400)):0,o=openedReal?1:(fin?ease(cl((f-1500)/3600)):0),boost=cl(1-(now-pulse)/1400),
 vis=Math.min(1,.18+.82*Math.sqrt(prog)+.25*boost+build),ip=cl(el/2600),A=LA,Hh=LH;
 par.x+=(par.tx-par.x)*.06;par.y+=(par.ty-par.y)*.06;
 cx.clearRect(0,0,W,H);cx.save();cx.translate(tx,ty);cx.scale(zm,zm);
 if(fin&&f>800&&f<2600){var sk=Math.min(1,(f-800)/600)*(f>1500?Math.max(0,1-(f-1500)/1100):1)*7;cx.translate((Math.random()-.5)*sk,(Math.random()-.5)*sk)}
 var i,s,ox=par.x*10,oy=par.y*6;
 for(i=0;i<dust.length;i++){var d=dust[i];cx.fillStyle="rgba(180,210,230,"+(.1+.16*Math.sin(now/1400+d.ph))+")";cx.fillRect(d.x*W+par.x*4*d.s,d.y*H+par.y*3*d.s,d.s,d.s)}
 cx.globalCompositeOperation="lighter";
 var oyc=gy-Hh*.9,Rr=Math.max(W,H)*1.3,ra=.06*ip+.16*vis+.5*o+.25*build,gg=cx.createRadialGradient(gx,oyc,0,gx,oyc,U*2.9);
 gg.addColorStop(0,"rgba(255,226,160,"+(.14+.3*vis+.5*o)*ip+")");gg.addColorStop(1,"rgba(244,200,116,0)");cx.fillStyle=gg;cx.fillRect(0,0,W,H);
 var rg=cx.createRadialGradient(gx,oyc,0,gx,oyc,Rr);rg.addColorStop(0,"rgba(255,230,170,"+ra+")");rg.addColorStop(.5,"rgba(255,222,150,"+ra*.3+")");rg.addColorStop(1,"rgba(255,222,150,0)");
 cx.fillStyle=rg;cx.beginPath();
 var RC=lowQ?12:26;for(i=0;i<RC;i++){var an=i/RC*2*PI+now*.00007*(reduce?0:1),w=.028+.02*Math.sin(i*7.3);cx.moveTo(gx+par.x*3,oyc);cx.lineTo(gx+Math.cos(an-w)*Rr,oyc+Math.sin(an-w)*Rr);cx.lineTo(gx+Math.cos(an+w)*Rr,oyc+Math.sin(an+w)*Rr)}
 cx.fill();cx.globalCompositeOperation="source-over";
 cx.save();arch(cx,gx,gy,A,Hh);cx.clip();
 if(o>0){var ig=cx.createRadialGradient(gx,gy-Hh*.75,0,gx,gy-Hh*.75,A*2.2);ig.addColorStop(0,"rgba(255,252,238,"+o+")");ig.addColorStop(.5,"rgba(255,224,150,"+.92*o+")");ig.addColorStop(1,"rgba(244,200,116,"+.75*o+")");cx.fillStyle=ig;cx.fillRect(gx-A,gy-Hh-A,A*2,Hh+A)}
 var sw=(.004+.03*vis*ip+.007*Math.sin(now/520)+.02*boost)*U,gap=Math.min(A*.95,sw+o*A*.95);
 cx.globalCompositeOperation="lighter";
 for(var q=0;q<3;q++){var wq=Math.max(gap,sw)*(1+q*2.4),lg=cx.createLinearGradient(gx-wq,0,gx+wq,0);lg.addColorStop(0,"rgba(255,225,150,0)");lg.addColorStop(.5,"rgba(255,238,190,"+(.8/(q+1))*Math.min(1,vis*1.3)*ip+")");lg.addColorStop(1,"rgba(255,225,150,0)");cx.fillStyle=lg;cx.fillRect(gx-wq,gy-Hh-A,wq*2,Hh+A)}
 cx.globalCompositeOperation="source-over";
 var wl=A-gap;if(wl>1){cx.save();cx.translate(gx-A,0);cx.scale(wl/A,1);leaf(A,Hh);cx.restore();cx.save();cx.translate(gx+A,0);cx.scale(-wl/A,1);leaf(A,Hh);cx.restore()}
 cx.restore();
 cx.strokeStyle="rgba(244,200,116,.85)";cx.lineWidth=2.2;arch(cx,gx,gy,A,Hh);cx.stroke();
 cx.strokeStyle="rgba(244,200,116,.35)";cx.lineWidth=1;arch(cx,gx,gy,A*1.05,Hh);cx.stroke();
 cx.save();cx.globalCompositeOperation="lighter";cx.translate(0,gy);cx.scale(1,.22);var fg=cx.createRadialGradient(gx,0,0,gx,0,A*2.4);fg.addColorStop(0,"rgba(255,226,160,"+(.3*vis+.6*o)*ip+")");fg.addColorStop(1,"rgba(255,226,160,0)");cx.fillStyle=fg;cx.fillRect(0,-A*3,W,A*6);cx.restore();
 cx.globalCompositeOperation="lighter";
 for(i=0;i<(lowQ?0:motes.length);i++){var m=motes[i],u=(m.o+now*m.sp)%1;cx.fillStyle="rgba(255,230,170,"+(Math.sin(u*PI)*(.55*vis+.4*o)*ip)+")";cx.fillRect(gx+m.x*U*(.5+u*.9),gy-u*Hh*1.5,m.s,m.s)}
 if(zm>1.5){cx.fillStyle="rgba(191,225,240,"+ip*.5+")";for(i=0;i<TOTAL;i++){s=slots[i];if(s.w)continue;var qx=s.px*zm+tx,qy=s.py*zm+ty;if(qx>-4&&qx<W+4&&qy>-4&&qy<H+4){cx.beginPath();cx.arc(s.px,s.py,.9,0,6.283);cx.fill()}}}else if(dl){cx.globalAlpha=ip*(.5+.25*Math.sin(now/1700));cx.drawImage(dl,ox*.35,oy*.5,W,H);cx.globalAlpha=1}var wr=SP*.62,pr=SP*.6;
 for(i=0;i<slots.length;i++){s=slots[i];var al=cl((el-s.rt)/500);if(!al)continue;
  s.px=gx+s.x+ox*.35;s.py=gy-s.y+oy*.5+Math.sin(now/1100+s.ph)*(reduce?0:1.2);
  var lit=!!s.w,pv=!lit&&fin&&f>300+s.dl*.8;
  if(lit){var ff=filt<0||filt===s.w.c?1:.14,R=wr*CATS[s.w.c][4]*(.85+.2*Math.sin(now/700+s.ph));cx.globalAlpha=al*ff;cx.drawImage(spr[s.w.c],s.px-R,s.py-R,R*2,R*2);
   var ag=now-s.born;if(ag<1700){var uu=ag/1700;cx.globalAlpha=(1-uu)*ff;cx.strokeStyle=CATS[s.w.c][2];cx.lineWidth=2;cx.beginPath();cx.arc(s.px,s.py,8+uu*80,0,6.283);cx.stroke()}}
  else if(pv){cx.globalAlpha=al*.85;cx.drawImage(spr[i%3],s.px-pr,s.py-pr,pr*2,pr*2)}
  }
 cx.globalAlpha=1;
 if(sel>=0){s=slots[sel];cx.strokeStyle="#6fd8cb";cx.lineWidth=1.6;cx.beginPath();cx.arc(s.px,s.py,10+3*Math.sin(now/280),0,6.283);cx.stroke()}
 if(searchHighlight>=0&&now<searchHighlightUntil){s=slots[searchHighlight];cx.strokeStyle="#fff0c7";cx.lineWidth=2.5;cx.globalAlpha=.75+.25*Math.sin(now/110);cx.beginPath();cx.arc(s.px,s.py,15+3*Math.sin(now/150),0,6.283);cx.stroke();cx.globalAlpha=1}else if(searchHighlight>=0)searchHighlight=-1;
 if(fly){var p=Math.min(1,(now-fly.t0)/1400),T=slots[fly.i];
  for(var z=0;z<10;z++){var qq=Math.max(0,p-z*.024),e=ease(qq),fx=gx+(T.px-gx)*e+Math.sin(qq*6)*30*(1-qq),fy=H+20+(T.py-H-20)*e;cx.globalAlpha=.9-z*.08;cx.drawImage(spr[fly.c],fx-14+z,fy-14+z,28-z*2,28-z*2)}
  cx.globalAlpha=1;
  if(p>=1){slots[fly.i].w={t:fly.t,n:fly.n,c:fly.c};slots[fly.i].born=now;pulse=now;chime(660);chime(880);var finished=fly,fi=fly.i;fly=null;sel=-1;if(finished.no){var ownOrder=orderCodes.filter(function(item){return item.code===finished.code})[0];if(ownOrder){ownOrder.shown=true;saveOrders();updateTracking(ownOrder)}}showRead(fi)}}
 if(pre){var p3=now-pre.t0,T3=slots[pre.i],q3=Math.min(1,p3/1300);
 if(p3<1300)for(var z3=0;z3<10;z3++){var qq3=Math.max(0,q3-z3*.024),e3=ease(qq3);cx.globalAlpha=.9-z3*.08;cx.drawImage(spr[pre.c],gx+(T3.px-gx)*e3+Math.sin(qq3*6)*30*(1-qq3)-14+z3,H+20+(T3.py-H-20)*e3-14+z3,28-z3*2,28-z3*2)}
 else{var u3=Math.min(1,(p3-1300)/700),R3=wr*CATS[pre.c][4]*(1.4+u3);cx.globalAlpha=1-u3;cx.drawImage(spr[pre.c],T3.px-R3,T3.py-R3,R3*2,R3*2);cx.strokeStyle=CATS[pre.c][2];cx.lineWidth=2;cx.beginPath();cx.arc(T3.px,T3.py,8+u3*50,0,6.283);cx.stroke();if(u3>=1)pre=null}
 cx.globalAlpha=1}
 if(fin&&!fin.b&&f>1450){fin.b=1;for(i=0;i<260;i++){var aa=Math.random()*2*PI,sp=80+Math.random()*520;sparks.push({x:gx,y:gy-Hh*.6,vx:Math.cos(aa)*sp,vy:Math.sin(aa)*sp-80,l:1.5+Math.random()*2,a:0,c:Math.random()<.5?1:i%3})}}
 for(i=sparks.length-1;i>=0;i--){var sp2=sparks[i];sp2.a+=dt;sp2.x+=sp2.vx*dt;sp2.y+=sp2.vy*dt;sp2.vx*=.985;sp2.vy*=.985;if(sp2.a>sp2.l){sparks.splice(i,1);continue}
  var sa=1-sp2.a/sp2.l;cx.globalAlpha=sa;cx.drawImage(spr[sp2.c],sp2.x-9,sp2.y-9,18,18)}
 cx.globalAlpha=1;cx.globalCompositeOperation="source-over";cx.restore();
 if(fin){var fl=f<1300?0:f<1500?(f-1300)/200:Math.max(0,1-(f-1500)/1500);if(o>.5)fl=Math.max(fl,(o-.5)*.9);if(fl>0){cx.fillStyle="rgba(255,248,226,"+fl+")";cx.fillRect(0,0,W,H)}
  if(f>5000&&!fin.sh){fin.sh=1;document.getElementById("fin").classList.add("on")}}
 counter(el);requestAnimationFrame(draw)}
var sheet=document.getElementById("sheet"),rd=document.getElementById("read"),wr=document.getElementById("write"),wt=document.getElementById("wt"),wn=document.getElementById("wn"),wp=document.getElementById("wp"),go=document.getElementById("go"),cashPrice=document.getElementById("cash-price"),searchToggle=document.getElementById("search-toggle"),searchForm=document.getElementById("wish-search-form"),searchInput=document.getElementById("wish-number"),searchMessage=document.getElementById("wish-search-message"),searchButton=searchForm.querySelector("button[type=submit]");
var governorateInput=document.getElementById("governorate"),governorateStrip=document.getElementById("governorate-strip"),governorateOptions=document.getElementById("governorate-options"),governorateNames=["القاهرة","الإسكندرية","بورسعيد","السويس","دمياط","الدقهلية","الشرقية","القليوبية","كفر الشيخ","الغربية","المنوفية","البحيرة","الإسماعيلية","الجيزة","بني سويف","الفيوم","المنيا","أسيوط","سوهاج","قنا","أسوان","الأقصر","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"];
governorateNames.forEach(function(name){var option=document.createElement("option"),choice=document.createElement("button");option.value=name;governorateOptions.appendChild(option);choice.type="button";choice.className="governorate-choice";choice.textContent=name;choice.setAttribute("aria-pressed","false");choice.addEventListener("click",function(){governorateInput.value=name;updateForm();governorateInput.focus()});governorateStrip.appendChild(choice)});
var py=document.getElementById("pay");function open(m){rd.hidden=m!=="read";wr.hidden=m!=="write";py.hidden=m!=="pay";sheet.classList.add("open")}
function close(){sheet.classList.remove("open");sel=-1;setTimeout(startMineFlight,450)}
function showRead(i){var w=slots[i].w;sel=-1;document.getElementById("rt").textContent="“"+w.t+"”";document.getElementById("rb").textContent=w.n?"— "+w.n:"";
 document.getElementById("rk").textContent=CATS[w.c][1];document.getElementById("rc").style.setProperty("--c",CATS[w.c][2]);document.getElementById("rn").textContent=num[i].toLocaleString("ar-EG");
 open("read");chime(440+(i%5)*60)}
function free(){var f=[];for(var i=0;i<TOTAL;i++)if(!slots[i].w)f.push(i);return f.length?f[Math.floor(Math.random()*f.length)]:-1}
function compose(){if(fly||fin||openedReal)return;wt.value=wn.value=wp.value="";document.getElementById("website").value="";setNotice(apiMessage,"");go.disabled=true;open("write")}
function near(x,y){x=(x-tx)/zm;y=(y-ty)/zm;var b=-1,d=900/(zm*zm),e,i,s;for(i=0;i<TOTAL;i++){s=slots[i];if(!s.w)continue;e=(s.px-x)*(s.px-x)+(s.py-y)*(s.py-y);if(e<d){d=e;b=i}}
 if(b>=0)return b;d=150;for(i=0;i<TOTAL;i++){s=slots[i];e=(s.px-x)*(s.px-x)+(s.py-y)*(s.py-y);if(e<d){d=e;b=i}}return b}
var st=null;
function clampCam(){tx=Math.min(0,Math.max(W*(1-zm),tx));ty=Math.min(0,Math.max(H*(1-zm),ty))}
function zoomAt(x,y,f){var nz=Math.max(1,Math.min(6,zm*f)),k=nz/zm;tx=x-(x-tx)*k;ty=y-(y-ty)*k;zm=nz;clampCam()}
cv.addEventListener("wheel",function(e){e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0015))},{passive:false});
document.addEventListener("gesturestart",function(e){e.preventDefault()});
cv.addEventListener("pointerdown",function(e){PT[e.pointerId]={x:e.clientX,y:e.clientY};try{cv.setPointerCapture(e.pointerId)}catch(_){}st=Object.keys(PT).length>1?null:{t:performance.now(),x:e.clientX,y:e.clientY}});
cv.addEventListener("pointercancel",function(e){delete PT[e.pointerId];st=null});
cv.addEventListener("pointermove",function(e){par.tx=(e.clientX/W-.5)*2;par.ty=(e.clientY/H-.5)*2;var p=PT[e.pointerId];if(!p)return;var ks=Object.keys(PT);
 if(ks.length===2){var o=PT[ks[0]==e.pointerId?ks[1]:ks[0]],d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);if(d0>0)zoomAt((e.clientX+o.x)/2,(e.clientY+o.y)/2,d1/d0)}
 else if(zm>1){tx+=e.clientX-p.x;ty+=e.clientY-p.y;clampCam()}
 p.x=e.clientX;p.y=e.clientY});
cv.addEventListener("pointerup",function(e){delete PT[e.pointerId];if(!st||fin)return;if(Math.hypot(e.clientX-st.x,e.clientY-st.y)<10&&performance.now()-st.t<700){var i=near(e.clientX,e.clientY);if(i<0)close();else if(slots[i].w)showRead(i)}st=null});
document.getElementById("add").onclick=function(){compose()};
document.getElementById("x").onclick=close;
addEventListener("keydown",function(e){if(e.key==="Escape"){if(!searchForm.hidden)hideWishSearch();else close()}});
function chips(box,all,fn,init){box.innerHTML="";(all?[["all","الكل","#ffffff"]]:[]).concat(CATS).forEach(function(c,j){var b=document.createElement("button");b.className="chip";b.style.setProperty("--c",c[2]);b.innerHTML="<i></i>"+c[1];var idx=all?j-1:j;
 b.onclick=function(){fn(idx);[].forEach.call(box.children,function(x){x.classList.remove("on")});b.classList.add("on")};if(idx===init)b.classList.add("on");box.appendChild(b)})}
(function(){var b=document.getElementById("wc");CATS.forEach(function(c,j){var e=document.createElement("button");e.className="tier"+(j===0?" on":"");e.style.setProperty("--c",c[2]);var z=c[4]*14;e.innerHTML="<i style='width:"+z+"px;height:"+z+"px'></i><b>"+c[1]+"</b><span>"+c[3]+" جنيه</span>";e.onclick=function(){wcat=j;cashPrice.textContent=String(c[3]);[].forEach.call(b.children,function(x){x.classList.remove("on")});e.classList.add("on")};b.appendChild(e)})})();
[wt,wn,wp,governorateInput].forEach(function(e){e.addEventListener("input",updateForm)});
function updateForm(){var selectedGovernorate=governorateInput.value.trim(),validGovernorate=governorateNames.indexOf(selectedGovernorate)!==-1;[].forEach.call(governorateStrip.children,function(choice){var selected=choice.textContent===selectedGovernorate;choice.classList.toggle("selected",selected);choice.setAttribute("aria-pressed",String(selected))});go.disabled=submitting||openedReal||!(wt.value.trim().length>=3&&wt.value.trim().length<=140&&wn.value.trim().length>=2&&wn.value.trim().length<=30&&validGovernorate&&/^01[0125]\d{8}$/.test(wp.value.trim()))}
function setNotice(el,text){if(!el)return;el.textContent=text;el.hidden=!text}
async function searchWish(event){event.preventDefault();setNotice(searchMessage,"");var raw=searchInput.value.trim().replace(/[٠-٩]/g,function(d){return String("٠١٢٣٤٥٦٧٨٩".indexOf(d))}).replace(/[۰-۹]/g,function(d){return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))});var no=Number(raw);
 if(!/^\d{1,4}$/.test(raw)||!Number.isInteger(no)||no<1||no>TOTAL){setNotice(searchMessage,"اكتب رقمًا صحيحًا من 1 إلى 1,000.");return}
 searchButton.disabled=true;
 try{var wishes=await API.list(),wish=wishes.filter(function(item){return Number(item.no)===no})[0];if(!wish){setNotice(searchMessage,"لا توجد أمنية مؤكدة بهذا الرقم حتى الآن.");return}
  var index=perm[no-1],slot=slots[index];if(!slot.w){put(no,wish.wish,wish.name,Number(wish.color));slot.born=performance.now();pulse=slot.born;updateClosed()}
  searchHighlight=index;searchHighlightUntil=performance.now()+5500;hideWishSearch();showRead(index)
 }catch(error){setNotice(searchMessage,describeError(error))}finally{searchButton.disabled=false}}
function hideWishSearch(){searchForm.hidden=true;searchToggle.setAttribute("aria-expanded","false");setNotice(searchMessage,"")}
searchToggle.addEventListener("click",function(){var opening=searchForm.hidden;searchForm.hidden=!opening;searchToggle.setAttribute("aria-expanded",String(opening));setNotice(searchMessage,"");if(opening)searchInput.focus()});
searchForm.addEventListener("submit",searchWish);searchInput.addEventListener("input",function(){setNotice(searchMessage,"")});
function updateClosed(){openedReal=total()>=TOTAL;var addButton=document.getElementById("add");addButton.disabled=openedReal;addButton.textContent=openedReal?"الباب مفتوح واكتمل العدد":"اكتب أمنيتك";updateForm()}
function describeError(error){var message=String(error&&error.message||error||"").toLowerCase();if(message.indexOf("configuration_missing")>=0)return"إعدادات Supabase غير موجودة. أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY إلى .env ثم أعد تشغيل الموقع أو أعد بناءه.";if(message.indexOf("database_schema_missing")>=0||message.indexOf("pgrst202")>=0||message.indexOf("schema cache")>=0)return"قاعدة بيانات Supabase غير مجهزة بعد. طبّق ملفات الترحيل بالأمر npx supabase db push ثم أعد المحاولة.";if(message.indexOf("backend_not_configured")>=0)return"إعدادات خدمة الطلبات ناقصة على Supabase. راجع SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY وRATE_LIMIT_SALT في أسرار Edge Functions.";if(message.indexOf("function_not_found")>=0||message.indexOf("404")>=0)return"خدمة إنشاء الطلبات غير منشورة. انشر Edge Function باسم create-order على Supabase.";if(message.indexOf("ordering_closed")>=0)return"اكتمل عدد الأمنيات، باب النور مفتوح.";if(message.indexOf("rate_limited")>=0)return"وصلت لحد الطلبات المسموح به. حاول لاحقًا.";if(message.indexOf("invalid_")>=0)return"راجع نص الأمنية والاسم ورقم فودافون كاش ثم حاول مرة أخرى.";if(message.indexOf("fetch")>=0||message.indexOf("network")>=0||message.indexOf("cors")>=0)return"تعذّر الاتصال بخدمة الطلبات. تحقق من الإنترنت ورابط Supabase والنطاقات المسموحة في إعداد CORS.";return"رفضت خدمة الطلبات إنشاء الطلب. راجع نشر create-order وإعدادات Supabase، ثم حاول مرة أخرى."}
var submitting=false,website=document.getElementById("website"),mineQueue=[];
go.onclick=async function(){if(submitting||go.disabled)return;submitting=true;go.disabled=true;go.textContent="جاري إرسال الطلب...";setNotice(apiMessage,"");setNotice(networkMessage,"");
 try{var order=await API.order({name:wn.value.trim(),wish:wt.value.trim(),governorate:governorateInput.value.trim(),color:wcat,phone:wp.value.trim(),website:website.value});order.phone=wp.value.trim();order.color=wcat;
  orderCodes.push({code:order.code,no:null,status:"pending",shown:false});if(orderCodes.length>20)orderCodes=orderCodes.slice(-20);saveOrders();activeOrderCode=order.code;showPay(order)
 }catch(error){setNotice(apiMessage,describeError(error));setNotice(networkMessage,describeError(error))}
 finally{submitting=false;go.textContent="تابع للدفع";updateForm()}};
function showPay(x){document.getElementById("pa").textContent=String(x.price);document.getElementById("ps").textContent=x.phone;document.getElementById("pc").textContent=x.code;document.getElementById("pq").textContent=Number(x.pos).toLocaleString("ar-EG");document.getElementById("tracking").textContent="بانتظار تأكيد الدفع. الرقم المعروض مؤقت حتى التأكيد.";sheet.classList.remove("open");zm=1;tx=ty=0;pre={i:perm[x.pos-1],c:x.color,t0:performance.now()};setTimeout(function(){open("pay")},2000)}
function updateTracking(order){if(order.code!==activeOrderCode)return;var track=document.getElementById("tracking"),finalNo=document.getElementById("pq");if(order.status==="confirmed"&&order.no){finalNo.textContent=Number(order.no).toLocaleString("ar-EG");track.textContent="تم تأكيد الدفع. أمنيتك الآن على اللوحة."}else if(order.status==="expired")track.textContent="انتهت مهلة الطلب، لكن يمكن للإدارة تأكيده يدويًا.";else if(order.status==="rejected")track.textContent="لم يتم قبول الطلب. تواصل مع إدارة الموقع."}
function startMineFlight(){if(fly||!mineQueue.length||!mineQueue[0].wish)return;var item=mineQueue.shift();fly={i:item.i,t:item.wish,n:item.name,c:item.color,no:item.no,code:item.code,t0:performance.now()}}
var syncRunning=false;
async function sync(){
 if(!supabase||syncRunning)return;syncRunning=true;
 await Promise.all(orderCodes.filter(function(item){return item.code&&!item.shown&&item.status!=="rejected"}).map(async function(item){
  try{var status=await API.status(item.code);item.status=status.status;
   if(status.status==="confirmed"&&status.no){item.no=status.no;var index=perm[status.no-1];mineNos[index]=true;
    if(!item.shown&&slots[index].w){item.shown=true;showRead(index)}
    else if(!item.shown&&!flighted[status.no]){flighted[status.no]=true;mineQueue.push({i:index,wish:"",name:"",color:0,no:status.no,code:item.code})}}
   updateTracking(item)
  }catch(error){setNotice(networkMessage,describeError(error))}
 }));saveOrders();
 try{var wishes=await API.list();wishes.forEach(function(item){var no=Number(item.no),index=perm[no-1];if(no<1||no>TOTAL||!Number.isInteger(no)||item.color<0||item.color>2)return;var slot=slots[index];
  if(!slot.w&&mineNos[index]){put(no,item.wish,item.name,item.color);slot.born=performance.now();pulse=slot.born;var own=orderCodes.filter(function(order){return order.no===no})[0],queued=mineQueue.filter(function(entry){return entry.no===no})[0];
    if(own&&!own.shown&&!queued&&!flighted[no]){flighted[no]=true;queued={i:index,wish:item.wish,name:item.name,color:item.color,no:no,code:own.code};mineQueue.push(queued)}
    if(queued){queued.wish=item.wish;queued.name=item.name;queued.color=item.color}
   }else if(!slot.w){put(no,item.wish,item.name,item.color);slot.born=performance.now();pulse=slot.born;chime(660)}});
  updateClosed();setNotice(networkMessage,"");startMineFlight()
 }catch(error){setNotice(networkMessage,describeError(error))}
 syncRunning=false;
}
window.addEventListener("offline",function(){setNotice(networkMessage,"أنت غير متصل بالإنترنت. ستعود المزامنة عند الاتصال.")});window.addEventListener("online",function(){setNotice(networkMessage,"");sync()});
setInterval(sync,10000);sync();
document.getElementById("copy-cash").onclick=function(){var button=this,reset=function(){button.classList.remove("copied");button.setAttribute("aria-label","نسخ رقم فودافون كاش");button.title="نسخ رقم فودافون كاش"};navigator.clipboard.writeText(document.querySelector(".cash-number").textContent.trim()).then(function(){button.classList.add("copied");button.setAttribute("aria-label","تم نسخ الرقم");button.title="تم نسخ الرقم";setTimeout(reset,1500)}).catch(function(){button.setAttribute("aria-label","تعذر نسخ الرقم");button.title="تعذر نسخ الرقم";setTimeout(reset,1500)})};
document.getElementById("pn").onclick=function(){var b=this;try{navigator.clipboard.writeText("01043668450");b.textContent="تم النسخ ✓";setTimeout(function(){b.textContent="01043668450"},1500)}catch(e){}};
document.getElementById("pd").onclick=close;
addEventListener("pointerdown",function(e){if(snd&&e.target.id!=="snd")chime(523)},{once:true,capture:true});
document.getElementById("snd").onclick=function(){snd=!snd;this.classList.toggle("off",!snd);chime(523)};
var finEl=document.getElementById("fin");
document.getElementById("pvb").onclick=function(){close();sparks=[];fin={t0:performance.now()};[262,330,392,523].forEach(function(f,k){setTimeout(function(){chime(f)},k*750)});setTimeout(function(){chime(784);chime(1047)},1500)};
document.getElementById("back").onclick=function(){fin=null;sparks=[];finEl.classList.remove("on")};
size();addEventListener("resize",function(){clearTimeout(rzT);rzT=setTimeout(size,150)});if(document.fonts)document.fonts.ready.then(size);openedReal=total()>=TOTAL;requestAnimationFrame(draw);
})();
