"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Category = "help" | "share";
type View = "latest" | Category | "resolved";
type Post = { id:number; authorName:string; category:Category; content:string; resolved:boolean; ownedByViewer:boolean; createdAt:string };
type Payload = { posts:Post[]; stats:{posts:number;participants:number}; viewer:{authenticated:boolean}; error?:string };

const views: Array<{id:View;label:string}> = [
  {id:"latest",label:"最新讨论"},{id:"help",label:"编程求助"},{id:"share",label:"学习分享"},{id:"resolved",label:"已解决"},
];
const labels:Record<Category,string>={help:"编程求助",share:"学习分享"};

async function readResponse(response:Response):Promise<Payload>{
  const payload=response.headers.get("content-type")?.includes("application/json")
    ? await response.json().catch(()=>null) as Payload|null:null;
  if(!response.ok||!payload) throw new Error(payload?.error||"论坛暂时无法连接，请稍后重试");
  return payload;
}

function formatTime(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(date);
}

function DiscussionIcon(){return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 10h24a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7H25l-7.5 6v-6H12a7 7 0 0 1-7-7V17a7 7 0 0 1 7-7Z"/><circle cx="17" cy="23" r="2"/><circle cx="24" cy="23" r="2"/><circle cx="31" cy="23" r="2"/></svg>}

export default function ForumClient(){
  const [posts,setPosts]=useState<Post[]>([]);
  const [stats,setStats]=useState({posts:0,participants:0});
  const [authenticated,setAuthenticated]=useState(false);
  const [activeView,setActiveView]=useState<View>("latest");
  const [category,setCategory]=useState<Category>("help");
  const [content,setContent]=useState("");
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [notice,setNotice]=useState("");
  const composerRef=useRef<HTMLTextAreaElement>(null);

  function applyPayload(payload:Payload){setPosts(payload.posts);setStats(payload.stats);setAuthenticated(payload.viewer.authenticated)}

  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/forum",{credentials:"same-origin",signal:controller.signal,headers:{Accept:"application/json"}})
      .then(readResponse).then(applyPayload)
      .catch((error:unknown)=>{if((error as Error).name!=="AbortError")setNotice(error instanceof Error?error.message:"论坛暂时无法连接，请稍后重试")})
      .finally(()=>setLoading(false));
    return()=>controller.abort();
  },[]);

  useEffect(()=>{const saved=window.sessionStorage.getItem("blinga-forum-draft");if(saved)setContent(saved.slice(0,1000))},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>{if(content)window.sessionStorage.setItem("blinga-forum-draft",content);else window.sessionStorage.removeItem("blinga-forum-draft")},300);return()=>window.clearTimeout(timer)},[content]);

  const visiblePosts=useMemo(()=>activeView==="latest"?posts:activeView==="resolved"?posts.filter(post=>post.resolved):posts.filter(post=>post.category===activeView&&!post.resolved),[activeView,posts]);
  function focusComposer(next?:Category){if(next)setCategory(next);composerRef.current?.focus({preventScroll:true});composerRef.current?.scrollIntoView({behavior:"smooth",block:"center"})}

  async function submitPost(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const message=content.trim();
    if(!message){setNotice("请先写下讨论内容");focusComposer();return}
    if(!authenticated){setNotice("登录后即可发布讨论");return}
    setSubmitting(true);setNotice("");
    try{const response=await fetch("/api/forum",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({category,content:message})});const payload=await readResponse(response);applyPayload(payload);setContent("");setActiveView("latest");window.sessionStorage.removeItem("blinga-forum-draft");setNotice("讨论已发布")}
    catch(error){setNotice(error instanceof Error?error.message:"发布失败，请稍后重试")}finally{setSubmitting(false)}
  }

  async function markResolved(post:Post){
    setNotice("");
    try{const response=await fetch("/api/forum",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({id:post.id,resolved:true})});const payload=await readResponse(response);applyPayload(payload);setNotice("讨论已标记为解决")}
    catch(error){setNotice(error instanceof Error?error.message:"操作失败，请稍后重试")}
  }

  return <section className="forum-shell">
      <header className="forum-heading"><h1>用户论坛</h1><p aria-live="polite">{stats.posts} 条留言 · {stats.participants} 位参与者</p></header>
      <nav className="forum-tabs" aria-label="讨论筛选">{views.map(view=><button key={view.id} type="button" className={activeView===view.id?"is-active":""} aria-pressed={activeView===view.id} onClick={()=>setActiveView(view.id)}>{view.label}</button>)}</nav>
      <div className="forum-layout">
        <div className="forum-primary">
          <form className="forum-composer" onSubmit={submitPost}>
            <div className="forum-composer-head"><h2>发布讨论</h2><label><span className="sr-only">选择分类</span><select value={category} onChange={event=>setCategory(event.target.value as Category)}><option value="help">编程求助</option><option value="share">学习分享</option></select></label></div>
            <div className="forum-editor"><textarea ref={composerRef} value={content} maxLength={1000} onChange={event=>setContent(event.target.value)} placeholder="写下问题、代码思路或学习记录" aria-label="讨论内容"/><div className="forum-editor-actions"><span>{content.length} / 1000</span>{authenticated?<button type="submit" disabled={submitting||!content.trim()}>{submitting?"发布中":"发布"}</button>:<a href="/login?returnTo=%2Fforum">登录后发布</a>}</div></div>
          </form>
          {notice&&<p className="forum-notice" role="status">{notice}</p>}
          <section className="forum-discussions" aria-busy={loading} aria-label="讨论列表">
            {loading?<div className="forum-list-status">正在读取讨论</div>:visiblePosts.length?<div className="forum-post-list">{visiblePosts.map(post=><article className="forum-post" key={post.id}><header><div><b>{post.authorName}</b><span>{labels[post.category]}{post.resolved?" · 已解决":""}</span></div><time dateTime={post.createdAt}>{formatTime(post.createdAt)}</time></header><p>{post.content}</p>{post.ownedByViewer&&post.category==="help"&&!post.resolved&&<button type="button" onClick={()=>markResolved(post)}>标记已解决</button>}</article>)}</div>:<div className="forum-empty"><DiscussionIcon/><h2>{activeView==="latest"?"暂无讨论":`暂无${views.find(view=>view.id===activeView)?.label}`}</h2><p>成为第一个发起讨论的人吧</p><button type="button" onClick={()=>focusComposer(activeView==="share"?"share":"help")}>写下第一条讨论</button></div>}
          </section>
        </div>
        <aside className="forum-aside" aria-label="社区信息"><section><h2>社区指南</h2><ol><li><b>1</b><span>友善交流，尊重每一位成员</span></li><li><b>2</b><span>提问请附问题与复现步骤</span></li><li><b>3</b><span>分享有价值的内容与结果</span></li></ol></section><section><h2>热门标签</h2><div className="forum-tags"><span>Python</span><span>C/C++</span><span>JavaScript</span><span>Java</span></div></section></aside>
      </div>
  </section>;
}
