import { placeCategory } from "../data/travelFilters";
// Loaded only by the explicit development preview command. Never a production fallback.
const photos = Array.from({length:6}, (_,index) => `preview-photo:${index}`);
const titles = ["바다를 가까이 두고 걷는 하루", "그늘을 따라 천천히", "오후를 보낸 작은 미술관", "초록 사이에서 쉬어가기", "호수 곁에서 잠시", "익숙한 동네의 새로운 길"];
const names = ["인천 바닷길", "서울숲", "대전 미술관", "제주 정원", "춘천 호수", "수원 산책길"];
const places = names.map((name,index) => ({id:`preview-place-${index}`,name,address:name,city:name.slice(0,2),type:index === 2 ? "culture" : "tour",lat:127+index*.1,lng:36.3+index*.1,tags:["wheelchair", "parking"]}));

export function installDesignPreview(api) {
  let posts = titles.map((title,index) => ({id:`preview-${index}`,title,place:names[index],author:index < 5 ? "정민" : "여행친구",written_date:`2026-09-${String(14-index).padStart(2,"0")}T09:00:00`,photo:[photos[index]],tag:["♿ 휠체어|rating:4","🚼 유아차|rating:5"],likes:12+index*3,views:40+index*13,content:"천천히 걸으며 만난 풍경을 여행 수첩에 담았어요. 길 옆에 잠시 쉬어갈 곳이 있어 더 여유롭게 둘러볼 수 있었습니다.\n\n혼자서도 좋지만, 함께여서 더 오래 기억에 남을 하루. 다음 여행을 준비하는 친구들에게 작은 도움이 되었으면 좋겠어요.\n\n이 글과 사진은 디자인을 확인하기 위한 예시이며, 실제 장소의 접근성 정보가 아닙니다."}));
  let profile = {username:"정민",uid:"preview-user",character:0,display_name:"정민",avatar:""};
  let likedIds = ["preview-0","preview-2","preview-4"];
  const response = (config,data) => ({data,status:200,statusText:"OK",headers:{},config});
  const reject = (config,message,status=400) => Promise.reject({message,response:{status,data:{detail:message}},config});
  api.defaults.adapter = async config => {
    const url = config.url, method = config.method;
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    if (url === "/login") return response(config,{access_token:"bf-design-preview"});
    if (url === "/me") return localStorage.getItem("token") === "bf-design-preview" ? response(config,profile) : reject(config,"Preview login required",401);
    if (url === "/me/profile" || url === "/me/character") {profile = {...profile,...data};return response(config,profile);}
    if (url === "/password-change/verify") return response(config,{verified:true});
    if (url === "/load-post") return response(config,[...posts]);
    if (url === "/liked-posts") return response(config,posts.filter(p => likedIds.includes(p.id)));
    if (/^\/posts\/.+\/like$/.test(url)) {
      const id = url.split("/")[2], post = posts.find(p => p.id === id);
      if (!post) return reject(config,"Post not found",404);
      const liked = method === "post";
      if (liked && !likedIds.includes(id)) {likedIds.push(id);post.likes++;}
      if (!liked && likedIds.includes(id)) {likedIds = likedIds.filter(v => v !== id);post.likes--;}
      return response(config,{likes:post.likes,liked});
    }
    if (url === "/place-options") return response(config,places);
    if (url === "/places/filters") return response(config,{groups:[{key:"mobility",label:"이동 편의",filters:[{key:"wheelchair",label:"휠체어 접근"},{key:"elevator",label:"엘리베이터"},{key:"ramp",label:"경사로"}]},{key:"facilities",label:"편의 시설",filters:[{key:"parking",label:"장애인 주차장"},{key:"restroom",label:"장애인 화장실"}]}]});
    if (url === "/places") { const params = new URLSearchParams(config.params), q = params.get("q") || "", category = params.get("category"), filtered = places.filter(p => p.name.includes(q) && (!category || placeCategory(p) === category) && params.getAll("filters").every(f => p.tags.includes(f))); return response(config,{items:filtered,total:filtered.length}); }
    if (/^\/places\/.+\/posts$/.test(url)) {const place = places.find(p => p.id === url.split("/")[2]);return response(config,posts.filter(p => p.place === place?.name));}
    if (/^\/places\/preview-place-/.test(url)) {const place = places.find(p => p.id === url.split("/")[2]);return response(config,{...place,overview:"디자인 확인용 예시 장소입니다. 실제 장소의 시설 정보가 아닙니다.",photos:[],facilities:[{key:"parking",description:"예시: 주차장과 입구 사이의 이동 경로를 확인해주세요."}]});}

    if (url === "/bus-stations" || url === "/bus-arrival") return response(config,[]);
    if (url === "/upload-image/") return response(config,{filename:URL.createObjectURL(config.data.get("file"))});
    if (url === "/write-post") { posts.unshift({...data,id:`preview-${Date.now()}`,author:"정민",written_date:new Date().toISOString(),likes:0,views:0}); return response(config,{}); }
    if (url === "/edit-post") {posts = posts.map(p => p.id === data.id ? {...p,...data} : p); return response(config,{});}
    if (url === "/delete-post") {posts = posts.filter(p => p.id !== data.id); return response(config,{});}
    if (["/register","/send-email","/password-change/send-email","/password-change"].includes(url) || url.startsWith("/validate/")) return response(config,{});
    return reject(config,"Unsupported preview endpoint",404);
  };
}
