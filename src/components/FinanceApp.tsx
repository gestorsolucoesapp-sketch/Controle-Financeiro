'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {getSupabase} from '@/lib/supabase/client';
import {errorText} from '@/lib/data';
import {Dashboard} from './Dashboard';
export function FinanceApp(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [mode,setMode]=useState<'login'|'signup'|'reset'|'password'>('login');
 useEffect(()=>{let mounted=true;let unsubscribe:undefined|(()=>void);async function initialize(){try{const db=getSupabase();const {data:{subscription}}=db.auth.onAuthStateChange((event,s)=>{if(!mounted)return;setSession(s);if(event==='PASSWORD_RECOVERY')setMode('password');});unsubscribe=()=>subscription.unsubscribe();const {data,error}=await db.auth.getSession();if(!mounted)return;if(error)setError(errorText(error));setSession(data.session);}catch(e){if(mounted)setError(errorText(e));}finally{if(mounted)setLoading(false);}}void initialize();return()=>{mounted=false;unsubscribe?.();};},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');setNotice('');const v=new FormData(event.currentTarget),email=String(v.get('email')||'').trim(),password=String(v.get('password')||'');
  try{const db=getSupabase();
   if(mode==='login'){const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;}
   if(mode==='signup'){const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin,data:{display_name:String(v.get('name')||'')}}});if(error)throw error;if(!data.session)setNotice('Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha.');}
   if(mode==='reset'){const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)throw error;setNotice('Se houver uma conta com esse e-mail, você receberá as instruções.');}
   if(mode==='password'){const {error}=await db.auth.updateUser({password});if(error)throw error;setMode('login');}
  }catch(e){setError(errorText(e));}finally{setBusy(false);}
 }
 if(loading)return <main className="authShell"><p role="status">Carregando suas finanças…</p></main>;
 if(session&&mode!=='password')return <Dashboard key={session.user.id} user={session.user}/>;
 return <main className="authShell"><section className="authIntro"><div className="brand"><div className="brandMark">F</div><strong>Finanças</strong></div><p className="eyebrow">CONTROLE FINANCEIRO</p><h1>Seu dinheiro,<br/>sob controle.</h1><p>Organize suas contas, acompanhe seus gastos e planeje o próximo mês com clareza.</p><div className="authIllustration"><span>Um passo de cada vez.</span><strong>Mais clareza.<br/>Mais tranquilidade.</strong><div className="authBars">{[32,48,40,65,58,78,92].map((h,i)=><i key={i} style={{height:h}}/>)}</div></div></section><section className="authPanel"><div className="authCard"><p className="eyebrow">BEM-VINDO AO FINANÇAS</p><h2>{mode==='signup'?'Crie sua conta':mode==='reset'?'Recuperar acesso':mode==='password'?'Defina uma nova senha':'Entre na sua conta'}</h2><p className="muted">Seu espaço financeiro pessoal, organizado em um só lugar.</p><form onSubmit={submit}>{mode==='signup'&&<label>Seu nome<input name="name" autoComplete="name" required maxLength={80}/></label>}{mode!=='password'&&<label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}{mode!=='reset'&&<label>Senha<input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={8} required maxLength={128}/></label>}{mode==='signup'&&<small>Use pelo menos 8 caracteres. Confirme seu cadastro pelo e-mail.</small>}{error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}<button className="primary" disabled={busy}>{busy?'Aguarde…':mode==='signup'?'Criar conta':mode==='reset'?'Enviar instruções':mode==='password'?'Salvar senha':'Entrar'}</button></form><div className="authLinks">{mode!=='password'&&<button onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setNotice('');}}>{mode==='signup'?'Já tenho uma conta':'Criar uma conta'}</button>}{mode==='login'&&<button onClick={()=>{setMode('reset');setError('');}}>Esqueci minha senha</button>}{mode==='reset'&&<button onClick={()=>setMode('login')}>Voltar para entrar</button>}</div></div></section></main>;
}
