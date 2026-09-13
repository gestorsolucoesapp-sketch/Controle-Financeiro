import {getSupabase} from './supabase/client';
import {type Data} from './finance';
export async function loadData(household:string):Promise<Data>{
 const db=getSupabase(),tables=['accounts','credit_cards','categories','transactions','budgets'] as const;
 const entries=await Promise.all(tables.map(async table=>{
  const rows:unknown[]=[];
  for(let from=0;;from+=1000){
   const {data,error}=await db.from(table).select('*').eq('household_id',household).order('id').range(from,from+999);
   if(error)throw error;rows.push(...data);if(data.length<1000)break;
  }
  return [table,rows];
 }));return Object.fromEntries(entries) as Data;
}
export function errorText(e:unknown){
 const message=e&&typeof e==='object'&&'message' in e?String(e.message):'Não foi possível concluir. Tente novamente.';
 if(/Invalid login credentials/i.test(message))return 'E-mail ou senha incorretos.';
 if(/Email not confirmed/i.test(message))return 'Confirme seu e-mail antes de entrar.';
 if(/rate limit/i.test(message))return 'Muitas tentativas. Aguarde alguns minutos.';
 if(/row-level security|permission denied/i.test(message))return 'Sua conta não tem permissão para esta operação.';
 if(/fetch|network/i.test(message))return 'Não foi possível conectar. Verifique sua internet.';
 return message;
}
