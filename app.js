const SUPABASE_URL="https://qqwifsgnzweslkcyuqmg.supabase.co";
const SUPABASE_KEY="sb_publishable_AI6rSMSOAag61TCJzapLbg_frex6ks9";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const CRED={user:"irancraft",pass:String.fromCharCode(105,114,97,110,49,52,48,53)};const $=id=>document.getElementById(id);
const statusNames={pending:"در انتظار بررسی",approved:"تأیید شد",in_progress:"در حال انجام",ready:"آماده تحویل",rejected:"رد شد"};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const coins=()=>Number(localStorage.getItem("irancraft_coins")||0);
function setCoins(n){localStorage.setItem("irancraft_coins",String(Math.max(0,Math.floor(n))));if($("coinBalance"))$("coinBalance").textContent=Math.max(0,Math.floor(n))}
function auth(){
 if(document.body.dataset.page!=="admin"){loadShop();return}
 if(localStorage.getItem("irancraft_login")==="1"){$("loginGate")?.classList.add("hidden");$("adminSite")?.classList.remove("hidden");loadAdmin();return}
 $("loginForm")?.addEventListener("submit",e=>{e.preventDefault();if($("loginUser").value.trim()===CRED.user && $("loginPass").value===CRED.pass){localStorage.setItem("irancraft_login","1");location.reload()}else $("loginError").textContent="نام کاربری یا رمز عبور اشتباه است."});
}
$("logoutBtn")?.addEventListener("click",()=>{localStorage.removeItem("irancraft_login");location.reload()});

function makeMcPassword(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";let out="";const bytes=crypto.getRandomValues(new Uint32Array(14));for(let i=0;i<bytes.length;i++)out+=chars[bytes[i]%chars.length];return out}
function mcPasswordKey(){const server=$("mcServerSelect")?.value||"default";const username=$("mcServerUsername")?.value.trim().toLowerCase()||"guest";return "irancraft_mc_pass_"+username+"_"+server}
function loadMcPassword(){const key=mcPasswordKey();let p=localStorage.getItem(key);if(!p){p=makeMcPassword();localStorage.setItem(key,p)}if($("mcPassword1"))$("mcPassword1").value=p;if($("mcPassword2"))$("mcPassword2").value=p}
async function copyText(value){try{await navigator.clipboard.writeText(value)}catch(e){const ta=document.createElement("textarea");ta.value=value;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}}
function initMinecraftPasswords(){$("mcServerSelect")?.addEventListener("change",loadMcPassword);$("mcServerUsername")?.addEventListener("blur",loadMcPassword);$("generateMcPassword")?.addEventListener("click",()=>{const p=makeMcPassword();localStorage.setItem(mcPasswordKey(),p);loadMcPassword();const r=$("mcPasswordResult");r.classList.remove("hidden");r.textContent="✅ رمز جدید ساخته شد؛ هر دو کادر یکسان هستند."});$("copyMcPassword1")?.addEventListener("click",async()=>{await copyText($("mcPassword1").value)});$("copyMcPassword2")?.addEventListener("click",async()=>{await copyText($("mcPassword2").value)});$("copyBothMcPasswords")?.addEventListener("click",async()=>{const p=$("mcPassword1").value;await copyText(p+" "+p)});loadMcPassword()}
let services=[],selectedService=null;
async function loadShop(){

 setCoins(coins());
 const {data}=await db.from("irancraft_services").select("*").eq("active",true).order("created_at",{ascending:true});
 services=data||[];renderServices();await renderAds();
 const p=JSON.parse(localStorage.getItem("irancraft_profile")||"{}");
 if($("customerName")&&p.name)$("customerName").value=p.name;
 if($("customerPhone")&&p.phone)$("customerPhone").value=p.phone;
}
function renderServices(){
 const grid=$("serviceGrid");if(!grid)return;
 if(!services.length){grid.innerHTML="<div class='empty'>فعلاً سرویسی فعال نیست.</div>";return}
 grid.innerHTML=services.map(s=>"<article class='service-card'><div class='service-icon'>"+(s.price>0?"🪙":"⛏️")+"</div><h3>"+esc(s.name)+"</h3><p>"+esc(s.description)+"</p><div class='service-price'>"+(s.price>0?"🪙 "+s.price+" ایران‌کوین":"رایگان")+"</div><button class='btn primary service-open' data-id='"+s.id+"'>سفارش این سرویس</button></article>").join("");
 document.querySelectorAll(".service-open").forEach(b=>b.onclick=()=>openOrder(b.dataset.id));
}
function openOrder(id){
 selectedService=services.find(s=>s.id===id);if(!selectedService)return;
 $("orderSection").classList.remove("hidden");$("serviceId").value=selectedService.id;$("orderType").value=(selectedService.name.includes("هیروبراین")?"herobrine":selectedService.name.includes("ماد")?"mod":"service");
 $("formTitle").textContent="سفارش "+selectedService.name;
 $("serverFields").style.display=$("orderType").value==="herobrine"?"grid":"none";
 $("serverName").required=$("orderType").value==="herobrine";$("serverAddress").required=$("orderType").value==="herobrine";
 $("orderPriceBox").innerHTML=selectedService.price>0?"🪙 هزینه این سرویس: <b>"+selectedService.price+" ایران‌کوین</b> — موجودی شما: <b>"+coins()+"</b>":"✅ این سرویس رایگان است.";
 $("orderSection").scrollIntoView({behavior:"smooth"});
}
$("closeForm")?.addEventListener("click",()=>$("orderSection").classList.add("hidden"));

$("orderForm")?.addEventListener("submit",async e=>{
 e.preventDefault();if(!selectedService)return;
 const price=Number(selectedService.price||0);
 if(price>coins()){alert("موجودی ایران‌کوین کافی نیست. ابتدا از بخش ایران‌کوین کد شارژ وارد کن.");return}
 const name=$("customerName").value.trim(),phone=$("customerPhone").value.trim();
 localStorage.setItem("irancraft_profile",JSON.stringify({name,phone}));
 const {data,error}=await db.from("irancraft_orders").insert({
  order_type:$("orderType").value,service_id:selectedService.id,price,
  payment_amount:price,customer_name:name,customer_phone:phone,
  admin_note:selectedService.auto_reply||"",
  username:$("orderUsername").value.trim(),server_name:$("serverName").value.trim()||null,
  server_address:$("serverAddress").value.trim()||null,description:$("description").value.trim()
 }).select().single();
 const r=$("orderResult");r.classList.remove("hidden");
 if(error){r.textContent="خطا در ثبت سفارش: "+error.message;return}
 if(price>0)setCoins(coins()-price);
 r.innerHTML="✅ سفارش ثبت شد.<br>کد تیکت: <b>"+data.ticket_code+"</b><br><small>"+(price>0?"هزینه از ایران‌کوین کم شد. ":"")+(selectedService?.auto_reply?("<br>🤖 پاسخ خودکار: "+esc(selectedService.auto_reply)):"")+"<br>کد را نگه دار و از بخش پیگیری استفاده کن.</small>";
 e.target.reset();selectedService=null;
});

$("ticketForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const code=$("ticketCode").value.trim().toUpperCase(),r=$("ticketResult");r.classList.remove("hidden");
 const {data,error}=await db.from("irancraft_orders").select("*,irancraft_services(name)").eq("ticket_code",code).maybeSingle();
 if(error||!data){r.textContent="تیکتی با این کد پیدا نشد.";return}
 r.innerHTML="<b>"+esc(data.irancraft_services?.name||(data.order_type==="herobrine"?"👁️ سفارش هیروبراین":data.order_type==="mod"?"🧩 سفارش ساخت ماد":"سفارش ایران کرفت"))+"</b><br>وضعیت: <strong class='status "+data.status+"'>"+(statusNames[data.status]||data.status)+"</strong><br><small>پاسخ ادمین: "+esc(data.admin_note||"هنوز پاسخی ثبت نشده است.")+"</small>"+(data.file_url?"<br><a class='btn primary' target='_blank' href='"+data.file_url+"'>⬇️ دریافت فایل ماد</a>":"");
});

async function renderAds(){
 const {data}=await db.from("irancraft_ads").select("*").eq("active",true).order("created_at",{ascending:false});
 const ad=data?.[0];["topAd","afterOrderAd"].forEach(id=>renderAdInto($(id),ad));
}
function renderAdInto(el,ad){
 if(!el)return;if(!ad){el.classList.add("hidden");return}el.classList.remove("hidden");
 const media=ad.media_type==="video"?"<video class='ad-media' controls playsinline preload='metadata'><source src='"+esc(ad.media_url)+"'></video>":"<img class='ad-media' src='"+esc(ad.media_url)+"' alt='"+esc(ad.title)+"'>";
 el.innerHTML="<div class='ad-card'><div class='ad-head'><span>📢 "+esc(ad.title||"تبلیغ")+"</span><button class='ad-close' aria-label='بستن'>×</button></div>"+media+"<div class='ad-finished hidden'>× پایان تبلیغ</div></div>";
 const close=el.querySelector(".ad-close"),video=el.querySelector("video"),done=el.querySelector(".ad-finished");
 close.onclick=()=>el.classList.add("hidden");
 if(video)video.addEventListener("ended",()=>{done.classList.remove("hidden");close.classList.remove("hidden")});
}

let adminType="herobrine",orders=[];
async function loadAdmin(){
 const {data,error}=await db.from("irancraft_orders").select("*,irancraft_services(name)").order("created_at",{ascending:false});
 if(error){$("orders").innerHTML="<div class='empty'>خطا در دریافت سفارش‌ها.</div>";return}
 const seen=new Map();(data||[]).forEach(o=>{const key=o.ticket_code||o.id;if(!seen.has(key))seen.set(key,o)});orders=[...seen.values()];
 $("countHero").textContent=orders.filter(x=>x.order_type==="herobrine").length;
 $("countMod").textContent=orders.filter(x=>x.order_type==="mod"||x.order_type==="service").length;
 if(adminType==="manage"){await loadManage();return}
 $("ordersPanel").classList.remove("hidden");$("managePanel").classList.add("hidden");renderOrders();
}
function renderOrders(){
 $("adminTitle").textContent=adminType==="herobrine"?"سفارش‌های هیروبراین":"سفارش‌های ساخت ماد و سرویس‌ها";
 const list=orders.filter(x=>adminType==="herobrine"?x.order_type==="herobrine":x.order_type!=="herobrine");
 if(!list.length){$("orders").innerHTML="<div class='empty'>هنوز سفارشی در این بخش نیست.</div>";return}
 $("orders").innerHTML=list.map(o=>"<article class='order-card'><div class='order-top'><div><span class='order-code'>"+esc(o.ticket_code)+"</span><h3>👤 "+esc(o.customer_name)+"</h3><div class='order-user-line'>📞 "+esc(o.customer_phone||"ثبت نشده")+"　🎮 "+esc(o.username)+"</div><small>🧩 "+esc(o.irancraft_services?.name||o.order_type)+"</small></div><span class='status "+o.status+"'>"+(statusNames[o.status]||o.status)+"</span></div><div class='order-meta'>"+(o.server_name?"🧱 "+esc(o.server_name):"")+(o.server_address?"　🌐 "+esc(o.server_address):"")+"　🕒 "+new Date(o.created_at).toLocaleString("fa-IR")+"　🪙 "+Number(o.price||0)+"</div><div class='order-description'><b>توضیحات مشتری:</b><p>"+esc(o.description)+"</p></div><div class='admin-edit'><label>وضعیت<select data-status='"+o.id+"'>"+Object.entries(statusNames).map(([k,v])=>"<option value='"+k+"' "+(o.status===k?"selected":"")+">"+v+"</option>").join("")+"</select></label><label>پاسخ ادمین<textarea data-note='"+o.id+"' rows='3'>"+esc(o.admin_note||"")+"</textarea></label>"+(o.order_type==="mod"||o.order_type==="service"?"<label>فایل تحویلی<input type='file' data-file='"+o.id+"' accept='.jar,.zip,.mcpack,.mcaddon,.rar'></label>":"")+"<div class='edit-actions'><button class='btn primary save-order' data-id='"+o.id+"'>تأیید و ذخیره</button><button class='btn danger delete-order' data-id='"+o.id+"'>🗑 حذف سفارش</button>"+(o.file_url?"<a class='btn ghost' target='_blank' href='"+o.file_url+"'>فایل فعلی</a>":"")+"</div></div></article>").join("");
 document.querySelectorAll(".save-order").forEach(b=>b.onclick=()=>saveOrder(b.dataset.id));
 document.querySelectorAll(".delete-order").forEach(b=>b.onclick=()=>deleteOrder(b.dataset.id));
}
async function saveOrder(id){
 const input=document.querySelector("[data-file='"+id+"']");let file_url=orders.find(x=>x.id===id)?.file_url||null,file_name=orders.find(x=>x.id===id)?.file_name||null;
 if(input?.files?.[0]){const f=input.files[0],path="deliveries/"+id+"/"+Date.now()+"_"+f.name.replace(/[^\w.\-\u0600-\u06ff]/g,"_");const up=await db.storage.from("irancraft-mods").upload(path,f,{upsert:true});if(up.error){alert("آپلود ناموفق: "+up.error.message);return}file_url=db.storage.from("irancraft-mods").getPublicUrl(path).data.publicUrl;file_name=f.name}
 const {error}=await db.from("irancraft_orders").update({status:document.querySelector("[data-status='"+id+"']").value,admin_note:document.querySelector("[data-note='"+id+"']").value,file_url,file_name,updated_at:new Date().toISOString()}).eq("id",id);
 if(error){alert("ذخیره نشد: "+error.message);return}await loadAdmin();alert("سفارش ذخیره شد.");
}
async function deleteOrder(id){
 if(!confirm("این سفارش برای همیشه حذف شود؟"))return;
 const {error}=await db.from("irancraft_orders").delete().eq("id",id);
 if(error){alert("حذف نشد: "+error.message);return}await loadAdmin();
}

async function loadManage(){await Promise.all([loadAdsAdmin(),loadCouponsAdmin(),loadServicesAdmin()])}
async function loadAdsAdmin(){
 const {data}=await db.from("irancraft_ads").select("*").order("created_at",{ascending:false});
 $("adsList").innerHTML=(data||[]).map(a=>"<div class='manage-row'><div><b>"+esc(a.title||"تبلیغ")+"</b><small>"+esc(a.media_type)+"</small></div><button class='btn danger delete-ad' data-id='"+a.id+"'>🗑 حذف</button></div>").join("")||"<div class='empty'>تبلیغی ثبت نشده.</div>";
 document.querySelectorAll(".delete-ad").forEach(b=>b.onclick=async()=>{if(!confirm("تبلیغ حذف شود؟"))return;await db.from("irancraft_ads").delete().eq("id",b.dataset.id);loadAdsAdmin()});
}
$("adForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const f=$("adFile").files[0];if(!f)return;const type=f.type.startsWith("video")?"video":"image",path="ads/"+Date.now()+"_"+f.name.replace(/[^\w.\-\u0600-\u06ff]/g,"_");
 const up=await db.storage.from("irancraft-mods").upload(path,f,{upsert:true});if(up.error){alert("آپلود ناموفق: "+up.error.message);return}
 const url=db.storage.from("irancraft-mods").getPublicUrl(path).data.publicUrl;
 const {error}=await db.from("irancraft_ads").insert({title:$("adTitle").value.trim(),media_type:type,media_url:url,active:true});
 if(error){alert("تبلیغ ثبت نشد: "+error.message);return}e.target.reset();await loadAdsAdmin();alert("تبلیغ اضافه شد.");
});
async function loadCouponsAdmin(){
 const {data}=await db.from("irancraft_coupons").select("*").order("created_at",{ascending:false});
 $("couponsList").innerHTML=(data||[]).map(c=>"<div class='manage-row'><div><b>"+esc(c.code)+"</b><small>"+Number(c.amount)+" ایران‌کوین · "+esc(c.occasion||"بدون مناسبت")+"</small></div><div class='edit-actions'><button class='btn ghost edit-coupon' data-id='"+c.id+"'>✏️ ویرایش</button><button class='btn danger delete-coupon' data-id='"+c.id+"'>🗑 حذف</button></div></div>").join("")||"<div class='empty'>کدی ثبت نشده.</div>";
 document.querySelectorAll(".edit-coupon").forEach(b=>b.onclick=async()=>{const c=data.find(x=>x.id===b.dataset.id);if(!c)return;const amount=prompt("مبلغ ایران‌کوین:",c.amount);if(amount===null)return;const occasion=prompt("مناسبت:",c.occasion||"");if(occasion===null)return;const code=prompt("کد:",c.code);if(code===null)return;const {error}=await db.from("irancraft_coupons").update({code:code.trim().toUpperCase(),amount:Number(amount),occasion:occasion.trim()}).eq("id",c.id);if(error){alert("ویرایش نشد: "+error.message);return}loadCouponsAdmin()});
document.querySelectorAll(".delete-coupon").forEach(b=>b.onclick=async()=>{if(!confirm("کد حذف شود؟"))return;await db.from("irancraft_coupons").delete().eq("id",b.dataset.id);loadCouponsAdmin()});
}
$("couponAdminForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const {error}=await db.from("irancraft_coupons").insert({code:$("couponAdminCode").value.trim().toUpperCase(),amount:Number($("couponAdminAmount").value),occasion:$("couponAdminOccasion").value.trim(),active:true});
 if(error){alert("کد ساخته نشد: "+error.message);return}e.target.reset();await loadCouponsAdmin();alert("کد ایران‌کوین ساخته شد.");
});
$("couponForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const code=$("couponCode").value.trim().toUpperCase(),phone=$("couponPhone").value.trim(),r=$("couponResult");
 if(!phone){r.textContent="شماره تماس را وارد کن تا هر کد فقط یک‌بار برای هر نفر قابل استفاده باشد.";return}r.classList.remove("hidden");
 const {data,error}=await db.from("irancraft_coupons").select("*").eq("code",code).eq("active",true).maybeSingle();
 if(error||!data){r.textContent="کد معتبر نیست.";return}
 const {data:used}=await db.from("irancraft_coupon_redemptions").select("id").eq("coupon_id",data.id).eq("customer_phone",phone).maybeSingle();
 if(used){r.textContent="⛔ این کد را قبلاً استفاده کرده‌ای.";return}
 const {error:redeemError}=await db.from("irancraft_coupon_redemptions").insert({coupon_id:data.id,customer_phone:phone});
 if(redeemError){r.textContent=redeemError.code==="23505"?"⛔ این کد را قبلاً استفاده کرده‌ای.":"خطا در ثبت استفاده از کد.";return}
 setCoins(coins()+Number(data.amount));localStorage.setItem("irancraft_coupon_phone",phone);r.textContent="✅ "+Number(data.amount)+" ایران‌کوین اضافه شد. موجودی: "+coins();e.target.reset();
});
async function loadServicesAdmin(){
 const {data}=await db.from("irancraft_services").select("*").order("created_at",{ascending:true});
 $("servicesList").innerHTML=(data||[]).map(s=>"<div class='manage-row service-admin-row'><div><b>"+esc(s.name)+"</b><small>"+(s.price>0?"🪙 "+s.price+" ایران‌کوین":"رایگان")+" · "+(s.active?"فعال":"خاموش")+"</small></div><div class='edit-actions'><button class='btn ghost toggle-service' data-id='"+s.id+"'>"+(s.active?"خاموش":"فعال")+"</button><button class='btn danger delete-service' data-id='"+s.id+"'>🗑 حذف</button></div></div>").join("")||"<div class='empty'>سرویسی نیست.</div>";
 document.querySelectorAll(".toggle-service").forEach(b=>b.onclick=async()=>{const s=data.find(x=>x.id===b.dataset.id);await db.from("irancraft_services").update({active:!s.active,updated_at:new Date().toISOString()}).eq("id",s.id);loadServicesAdmin()});
 document.querySelectorAll(".delete-service").forEach(b=>b.onclick=async()=>{if(!confirm("سرویس حذف شود؟"))return;await db.from("irancraft_services").delete().eq("id",b.dataset.id);loadServicesAdmin()});
}
$("serviceAdminForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const paid=$("serviceAdminPaid").checked,price=paid?Number($("serviceAdminPrice").value):0;
 const {error}=await db.from("irancraft_services").insert({name:$("serviceAdminName").value.trim(),description:$("serviceAdminDesc").value.trim(),auto_reply:$("serviceAdminReply").value.trim(),price,active:true});
 if(error){alert("سرویس ساخته نشد: "+error.message);return}e.target.reset();$("serviceAdminPrice").value=0;await loadServicesAdmin();alert("سرویس اضافه شد.");
});
document.querySelectorAll(".admin-tab").forEach(b=>b.onclick=async()=>{
 document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");adminType=b.dataset.tab;
 if(adminType==="manage"){$("ordersPanel").classList.add("hidden");$("managePanel").classList.remove("hidden");await loadManage()}else{await loadAdmin()}
});
$("refreshOrders")?.addEventListener("click",loadAdmin);
initMinecraftPasswords();\nauth();