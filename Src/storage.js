import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function getUser(id,name="Aspirant"){
  const {data}=await sb.from("profiles").select("*").eq("telegram_id",id).maybeSingle();
  if(data) return data;
  const row={telegram_id:id,name,roast_level:"friendly",questions:0,correct:0,streak:0};
  const {data:created,error}=await sb.from("profiles").insert(row).select().single();
  if(error) throw error;
  return created;
}
export async function updateUser(id,patch){
  const {data,error}=await sb.from("profiles").update(patch).eq("telegram_id",id).select().single();
  if(error) throw error; return data;
}
export async function addAttempt(id,a){
  const u=await getUser(id);
  const next={questions:(u.questions||0)+1,correct:(u.correct||0)+(a.correct?1:0),last_active:new Date().toISOString()};
  await updateUser(id,next);
  await sb.from("attempts").insert({telegram_id:id,question_id:a.questionId,choice:a.choice,correct:a.correct});
  if(!a.correct){
    const {data}=await sb.from("revision_bank").select("*").eq("telegram_id",id).eq("question_id",a.questionId).maybeSingle();
    if(data) await sb.from("revision_bank").update({wrong_count:data.wrong_count+1,last_wrong_at:new Date().toISOString()}).eq("id",data.id);
    else await sb.from("revision_bank").insert({telegram_id:id,question_id:a.questionId});
  }
  return await getUser(id);
}
export async function getStats(id){
  const u=await getUser(id);
  const {count}=await sb.from("revision_bank").select("*",{count:"exact",head:true}).eq("telegram_id",id);
  return {...u,accuracy:u.questions?+(100*u.correct/u.questions).toFixed(1):0,mistakes:count||0};
}
export async function getQuestion(subject=null){
  let q=sb.from("questions").select("*");
  if(subject) q=q.ilike("subject",subject);
  const {data,error}=await q.limit(50);
  if(error||!data?.length) return null;
  return data[Math.floor(Math.random()*data.length)];
}
export async function getRevisionQuestion(id){
  const {data}=await sb.from("revision_bank").select("question_id").eq("telegram_id",id).order("last_wrong_at",{ascending:true}).limit(20);
  if(!data?.length) return null;
  const ids=data.map(x=>x.question_id);
  const {data:qs}=await sb.from("questions").select("*").in("id",ids);
  return qs?.[0]||null;
}
