(() => {
  "use strict";
  const API = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/";
  const KEY = window.CINEVERSE_CONFIG?.TMDB_API_KEY || "";
  const DB = "cineverse_local_v1";
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  let state = { user:null, mode:"login", currentMovie:null, explorePage:1, exploreItems:[], exploreQuery:"", genreId:"", sort:"popular" };
  let genres = [];
  const movieCache = new Map();
  let toastTimer;

  const store = {
    read(){ try{return JSON.parse(localStorage.getItem(DB)) || {users:[],watchlists:{},reviews:{},session:null};}catch{return {users:[],watchlists:{},reviews:{},session:null};}},
    write(data){localStorage.setItem(DB,JSON.stringify(data));},
    user(){const d=this.read();return d.users.find(u=>u.id===d.session)||null;},
    watchlist(){const u=this.user();return u ? (this.read().watchlists[u.id]||[]) : [];},
    reviews(){const d=this.read(),u=this.user();return u ? (d.reviews[u.id]||[]) : [];},
    async hash(value){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");}
  };

  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2500);}
  function safe(text=""){return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function dateYear(value){return value ? String(value).slice(0,4) : "—";}
  function poster(path,size="w500"){return path ? IMG+size+path : "";}
  function imageMarkup(movie){return movie.poster_path ? `<img loading="lazy" src="${poster(movie.poster_path)}" alt="${safe(movie.title||movie.name)} poster">` : `<div class="poster-fallback">${safe(movie.title||movie.name||"Film")}</div>`;}
  function getReviewsForMovie(movieId){const d=store.read();return Object.entries(d.reviews||{}).flatMap(([uid,items])=>items.filter(r=>String(r.movieId)===String(movieId)).map(r=>({...r,user:(d.users.find(u=>u.id===uid)||{}).name||"Film lover"})));}
  function loggedIn(){return !!store.user();}
  function requireLogin(action){if(!loggedIn()){toast("Sign in to "+action+".");location.hash="#login";return false;}return true;}

  async function api(path){
    if(!KEY || KEY.includes("PASTE_YOUR")) throw new Error("Add your TMDB API key in config.js first.");
    const url=new URL(API+path);url.searchParams.set("api_key",KEY);
    const res=await fetch(url);if(!res.ok)throw new Error("TMDB request failed ("+res.status+"). Check your API key.");return res.json();
  }
  function errorBlock(message){return `<div class="empty-state">${safe(message)}</div>`;}
  async function loadHome(){
    if(!KEY || KEY.includes("PASTE_YOUR")){["#trending-grid","#popular-grid","#top-grid"].forEach(s=>$(s).innerHTML=errorBlock("Add your TMDB API key in config.js to load live films."));return;}
    try{
      const [tr,pop,top]=await Promise.all([api("/trending/movie/week"),api("/movie/popular"),api("/movie/top_rated")]);
      renderMovies("#trending-grid",tr.results.slice(0,5));renderMovies("#popular-grid",pop.results.slice(0,5));renderMovies("#top-grid",top.results.slice(0,5));
      const feature=tr.results.find(m=>m.backdrop_path)||tr.results[0];
      if(feature?.poster_path)$("#hero-poster-stack").innerHTML=`<img src="${poster(feature.poster_path,"w500")}" alt="${safe(feature.title)} poster">`;
    }catch(e){["#trending-grid","#popular-grid","#top-grid"].forEach(s=>$(s).innerHTML=errorBlock(e.message));}
  }
  function renderMovies(target,movies){
    const el=typeof target==="string"?$(target):target;
    (movies||[]).forEach(m=>movieCache.set(String(m.id),m));
    if(!movies?.length){el.innerHTML=errorBlock("Nothing to show here yet.");return;}
    el.innerHTML=movies.map((m,i)=>movieCard(m,i)).join("");
  }
  function movieCard(m,i=0){
    const saved=store.watchlist().some(x=>String(x.id)===String(m.id));
    return `<article class="movie-card" data-movie="${m.id}">
      <div class="poster-wrap">${imageMarkup(m)}<span class="card-number">${String(i+1).padStart(2,"0")}</span><button class="card-save ${saved?"saved":""}" data-save="${m.id}" aria-label="${saved?"Remove from":"Add to"} watchlist" title="${saved?"Remove from":"Add to"} watchlist">${saved?"✓":"＋"}</button></div>
      <div class="card-info"><h3 class="card-title">${safe(m.title||m.name)}</h3><div class="card-meta"><span>${dateYear(m.release_date||m.first_air_date)}</span><span class="card-rating">★ ${Number(m.vote_average||0).toFixed(1)}</span></div></div>
    </article>`;
  }
  async function loadGenres(){
    try{const data=await api("/genre/movie/list");genres=data.genres||[];$("#genre-filter").innerHTML='<option value="">All genres</option>'+genres.map(g=>`<option value="${g.id}">${safe(g.name)}</option>`).join("");}catch{}
  }
  async function loadExplore(reset=true){
    if(reset){state.explorePage=1;state.exploreItems=[];}
    const grid=$("#explore-grid");grid.innerHTML='<div class="loading-state">Finding films...</div>';
    try{
      let path;
      if(state.exploreQuery) path=`/search/movie?query=${encodeURIComponent(state.exploreQuery)}&page=${state.explorePage}`;
      else if(state.genreId) path=`/discover/movie?with_genres=${state.genreId}&sort_by=${state.sort==="rating"?"vote_average.desc":state.sort==="newest"?"primary_release_date.desc":"popularity.desc"}&page=${state.explorePage}&vote_count.gte=30`;
      else path=`/movie/${state.sort==="rating"?"top_rated":state.sort==="newest"?"now_playing":"popular"}?page=${state.explorePage}`;
      const data=await api(path);state.exploreItems=reset?data.results:state.exploreItems.concat(data.results);
      renderMovies(grid,state.exploreItems);$("#result-count").textContent=`${state.exploreItems.length} FILMS`;$("#explore-label").textContent=state.exploreQuery?"SEARCH RESULTS":state.genreId?"GENRE COLLECTION":"POPULAR DISCOVERIES";
      $("#load-more").hidden=state.explorePage>=data.total_pages||!data.results.length;
    }catch(e){grid.innerHTML=errorBlock(e.message);$("#load-more").hidden=true;}
  }
  async function openMovie(id){
    try{
      const m=await api(`/movie/${id}?append_to_response=credits`);state.currentMovie=m;
      const saved=store.watchlist().some(x=>String(x.id)===String(m.id));
      const cast=(m.credits?.cast||[]).slice(0,5).map(x=>safe(x.name)).join(", ");
      const reviews=getReviewsForMovie(m.id);
      $("#movie-modal-content").innerHTML=`<div class="detail-layout">
        <div>${m.poster_path?`<img class="detail-poster" src="${poster(m.poster_path)}" alt="${safe(m.title)} poster">`:""}</div>
        <div class="detail-copy"><p class="eyebrow">FILM / ${dateYear(m.release_date)}</p><h2>${safe(m.title)}</h2><p class="detail-tagline">${safe(m.tagline||"A story waiting to be discovered.")}</p>
        <div class="detail-meta"><span>★ ${Number(m.vote_average||0).toFixed(1)} / 10</span><span>${m.runtime||"—"} MIN</span><span>${(m.genres||[]).map(g=>safe(g.name)).join(" · ")}</span></div>
        <p class="detail-overview">${safe(m.overview||"No synopsis available.")}</p><p class="detail-overview"><strong>CAST</strong><br>${cast||"Cast details unavailable."}</p>
        <div class="detail-actions"><button class="button button-dark" data-save="${m.id}">${saved?"Remove from watchlist":"Add to watchlist"} <span>${saved?"✓":"＋"}</span></button><button class="button button-outline" data-review="${m.id}">Write a review <span>↗</span></button></div>
        <div class="detail-reviews"><h3>COMMUNITY NOTES (${reviews.length})</h3>${reviews.length?reviews.map(r=>`<div class="detail-review"><strong>${safe(r.user)}</strong><span>★ ${r.rating}/5</span><p>${safe(r.text)}</p></div>`).join(""):"<p class='detail-overview'>No reviews yet. Be the first to share your thoughts.</p>"}</div></div></div>`;
      $("#movie-modal").classList.add("open");$("#movie-modal").setAttribute("aria-hidden","false");
    }catch(e){toast(e.message);}
  }
  function closeMovie(){$("#movie-modal").classList.remove("open");$("#movie-modal").setAttribute("aria-hidden","true");}
  function addWatchlist(id){
    if(!requireLogin("save films"))return;
    const m=state.currentMovie&&String(state.currentMovie.id)===String(id)?state.currentMovie:null;
    const d=store.read(),u=store.user();d.watchlists[u.id]=d.watchlists[u.id]||[];
    const index=d.watchlists[u.id].findIndex(x=>String(x.id)===String(id));
    if(index>=0){d.watchlists[u.id].splice(index,1);toast("Removed from your watchlist.");}
    else{
      const fromExplore=state.exploreItems.find(x=>String(x.id)===String(id));
      const fromWatch= d.watchlists[u.id].find(x=>String(x.id)===String(id));
      const item=m||fromExplore||fromWatch||movieCache.get(String(id));
      if(item)d.watchlists[u.id].push({id:item.id,title:item.title,poster_path:item.poster_path,release_date:item.release_date,vote_average:item.vote_average});
      else {toast("Open the film details and try again.");return;}
      toast("Added to your watchlist.");
    }
    store.write(d);refreshAccount();refreshCurrentView();
    if($("#movie-modal").classList.contains("open"))openMovie(id);
  }
  function renderWatchlist(){
    const list=store.watchlist();$("#watchlist-count").textContent=`${list.length} SAVED`;
    if(!loggedIn()){$("#watchlist-grid").innerHTML=`<div class="empty-state">Sign in to build your personal watchlist.<br><br><a class="text-link" href="#login">Sign in →</a></div>`;return;}
    if(!list.length){$("#watchlist-grid").innerHTML=errorBlock("Your watchlist is empty. Explore a few films and save the ones that catch your eye.");return;}
    $("#watchlist-grid").innerHTML=list.map((m,i)=>movieCard(m,i)).join("");
  }
  function renderProfile(){
    const user=store.user(),el=$("#profile-content");
    if(!user){el.innerHTML=errorBlock('Sign in to access your profile. <a href="#login">Sign in →</a>');return;}
    const list=store.watchlist(),reviews=store.reviews();
    el.innerHTML=`<div class="profile-summary"><div class="profile-avatar">${safe(user.name.slice(0,1).toUpperCase())}</div><div><h2 class="profile-name">${safe(user.name)}</h2><span class="profile-email">${safe(user.email)}</span></div><div class="profile-stats"><div class="stat"><strong>${list.length}</strong><span>WATCHLIST</span></div><div class="stat"><strong>${reviews.length}</strong><span>REVIEWS</span></div></div></div>
      <h3 class="profile-section-title">YOUR REVIEWS / ${reviews.length}</h3><div class="review-list">${reviews.length?reviews.slice().reverse().map(r=>`<article class="review-item"><div><h3>${safe(r.title)} <small>· ${dateYear(r.release_date)}</small></h3><small>★ ${r.rating}/5</small><p>${safe(r.text)}</p></div><button class="review-delete" data-delete-review="${r.id}">DELETE ×</button></article>`).join(""):'<div class="empty-state">Your reviews will appear here after you share your first one.</div>'}</div>
      <button class="button button-outline" id="logout-button">Sign out <span>↗</span></button>`;
  }
  function startReview(id){
    if(!requireLogin("write reviews"))return;
    $("#review-movie-id").value=id;$("#review-text").value="";$("#review-modal").classList.add("open");
  }
  function saveReview(event){
    event.preventDefault();if(!requireLogin("write reviews"))return;
    const id=$("#review-movie-id").value,text=$("#review-text").value.trim(),rating=Number($("#review-rating").value);
    if(!text){toast("Please write a few words first.");return;}
    const d=store.read(),u=store.user(),movie=state.currentMovie&&String(state.currentMovie.id)===String(id)?state.currentMovie:state.exploreItems.find(x=>String(x.id)===String(id))||store.watchlist().find(x=>String(x.id)===String(id));
    if(!movie){toast("Could not identify this film. Open its details and try again.");return;}
    d.reviews[u.id]=d.reviews[u.id]||[];
    const existing=d.reviews[u.id].find(r=>String(r.movieId)===String(id));
    const review={id:existing?.id||String(Date.now()),movieId:id,title:movie.title||movie.name,release_date:movie.release_date,text,rating,createdAt:new Date().toISOString()};
    if(existing)Object.assign(existing,review);else d.reviews[u.id].push(review);
    store.write(d);$("#review-modal").classList.remove("open");toast("Your review has been saved.");refreshCurrentView();
    if($("#movie-modal").classList.contains("open"))openMovie(id);
  }
  function refreshAccount(){
    const u=store.user(),area=$("#account-area");
    area.innerHTML=u?`<a class="account-pill" href="#profile"><span class="avatar">${safe(u.name.slice(0,1).toUpperCase())}</span><span>${safe(u.name.split(" ")[0])}</span></a>`:`<a class="account-link" href="#login">Sign in ↗</a>`;
  }
  function refreshCurrentView(){const route=location.hash.slice(1)||"home";if(route==="watchlist")renderWatchlist();if(route==="profile")renderProfile();if(route==="explore")loadExplore(false);if(route==="home")refreshMovieSaveButtons();}
  function refreshMovieSaveButtons(){$$("[data-save]").forEach(btn=>{const saved=store.watchlist().some(x=>String(x.id)===String(btn.dataset.save));btn.classList.toggle("saved",saved);if(btn.closest(".poster-wrap"))btn.textContent=saved?"✓":"＋";});}
  function setAuthMode(mode){
    state.mode=mode;const reg=mode==="register";
    $("#auth-title").innerHTML=reg?"Create your <em>account.</em>":"Welcome <em>back.</em>";
    $("#auth-subtitle").textContent=reg?"A little space to save films and share your thoughts.":"Sign in to keep your film collection close.";
    $("#name-field").hidden=!reg;$("#auth-name").required=reg;$("#auth-password").autocomplete=reg?"new-password":"current-password";
    $("#auth-submit").innerHTML=reg?"Create account <span>↗</span>":"Sign in <span>↗</span>";
    $("#auth-switch").innerHTML=reg?'Already a member? <button type="button" id="auth-switch-button">Sign in</button>':'New to Cineverse? <button type="button" id="auth-switch-button">Create an account</button>';
    $("#auth-error").textContent="";
  }
  async function authSubmit(e){
    e.preventDefault();const email=$("#auth-email").value.trim().toLowerCase(),password=$("#auth-password").value;
    const d=store.read(),hash=await store.hash(password);
    if(state.mode==="register"){
      const name=$("#auth-name").value.trim();if(!name){$("#auth-error").textContent="Please enter your name.";return;}
      if(d.users.some(u=>u.email===email)){$("#auth-error").textContent="An account with this email already exists.";return;}
      const user={id:"u_"+Date.now(),name,email,passwordHash:hash};d.users.push(user);d.session=user.id;store.write(d);state.user=user;toast("Your account is ready.");location.hash="#profile";
    }else{
      const user=d.users.find(u=>u.email===email&&u.passwordHash===hash);
      if(!user){$("#auth-error").textContent="Email or password is incorrect.";return;}
      d.session=user.id;store.write(d);state.user=user;toast("Welcome back.");location.hash="#profile";
    }
  }
  async function seedDemo(){
    const d=store.read();
    if(!d.users.some(u=>u.email==="admin@cineverse.com")){
      d.users.push({id:"demo_admin",name:"Demo Admin",email:"admin@cineverse.com",passwordHash:await store.hash("Admin@12345")});
      d.users.push({id:"demo_user",name:"Demo User",email:"demo@cineverse.com",passwordHash:await store.hash("Demo@12345")});
      store.write(d);
    }
  }
  function logout(){const d=store.read();d.session=null;store.write(d);toast("Signed out.");location.hash="#home";refreshAccount();}
  function navigate(){
    const route=(location.hash.slice(1)||"home").split("?")[0],valid=["home","explore","watchlist","profile","login","register"];
    const page=valid.includes(route)?route:"home";
    $$(".view").forEach(v=>v.classList.remove("active"));
    const view=$("#"+(page==="login"||page==="register"?"auth":page)+"-view");if(view)view.classList.add("active");
    $$(".main-nav a").forEach(a=>a.classList.toggle("active",a.dataset.nav===page));
    $("#main-nav")?.classList.remove("open");
    if(page==="watchlist")renderWatchlist();
    if(page==="profile")renderProfile();
    if(page==="login")setAuthMode("login");
    if(page==="register")setAuthMode("register");
    if(page==="explore"&&!state.exploreItems.length)loadExplore();
    window.scrollTo({top:0,behavior:"instant"});
  }
  function openSearch(){ $("#search-overlay").classList.add("open");$("#search-overlay").setAttribute("aria-hidden","false");setTimeout(()=>$("#global-search").focus(),50);}
  function closeSearch(){ $("#search-overlay").classList.remove("open");$("#search-overlay").setAttribute("aria-hidden","true");}
  function searchSubmit(value){state.exploreQuery=value.trim();state.genreId="";$("#explore-search").value=state.exploreQuery;location.hash="#explore";closeSearch();loadExplore();}
  function bind(){
    window.addEventListener("hashchange",navigate);
    $("#menu-toggle").addEventListener("click",()=>$(".main-nav").classList.toggle("open"));
    $("#search-open").addEventListener("click",openSearch);$("#search-close").addEventListener("click",closeSearch);
    $("#global-search").addEventListener("keydown",e=>{if(e.key==="Enter")searchSubmit(e.target.value);if(e.key==="Escape")closeSearch();});
    $("#explore-search").addEventListener("keydown",e=>{if(e.key==="Enter"){state.exploreQuery=e.target.value.trim();loadExplore();}});
    $("#genre-filter").addEventListener("change",e=>{state.genreId=e.target.value;loadExplore();});
    $("#sort-filter").addEventListener("change",e=>{state.sort=e.target.value;loadExplore();});
    $("#load-more").addEventListener("click",()=>{state.explorePage++;loadExplore(false);});
    $("#auth-form").addEventListener("submit",authSubmit);
    $("#auth-switch").addEventListener("click",e=>{if(e.target.id==="auth-switch-button")setAuthMode(state.mode==="login"?"register":"login");});
    $("#demo-login").addEventListener("click",()=>{$("#auth-email").value="admin@cineverse.com";$("#auth-password").value="Admin@12345";state.mode="login";$("#auth-form").requestSubmit();});
    $("#modal-close").addEventListener("click",closeMovie);$("#movie-modal").addEventListener("click",e=>{if(e.target.id==="movie-modal")closeMovie();});
    $("#review-close").addEventListener("click",()=>$("#review-modal").classList.remove("open"));
    $("#review-form").addEventListener("submit",saveReview);
    $("#review-modal").addEventListener("click",e=>{if(e.target.id==="review-modal")$("#review-modal").classList.remove("open");});
    document.body.addEventListener("click",e=>{
      const save=e.target.closest("[data-save]"),review=e.target.closest("[data-review]"),card=e.target.closest("[data-movie]"),del=e.target.closest("[data-delete-review]");
      if(save){e.stopPropagation();addWatchlist(save.dataset.save);return;}
      if(review){e.stopPropagation();startReview(review.dataset.review);return;}
      if(del){const d=store.read(),u=store.user();d.reviews[u.id]=(d.reviews[u.id]||[]).filter(r=>r.id!==del.dataset.deleteReview);store.write(d);renderProfile();toast("Review deleted.");return;}
      if(card&&!e.target.closest("button"))openMovie(card.dataset.movie);
      if(e.target.id==="logout-button")logout();
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMovie();closeSearch();$("#review-modal").classList.remove("open");}});
  }
  async function init(){
    bind();await seedDemo();refreshAccount();navigate();loadHome();loadGenres();
    if(location.hash==="#register")setAuthMode("register");
  }
  init();
})();