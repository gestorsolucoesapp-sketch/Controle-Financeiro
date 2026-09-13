'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {X} from 'lucide-react';
import {getSupabase} from '@/lib/supabase/client';
import {errorText} from '@/lib/data';
import {type Data,parseAmount,today} from '@/lib/finance';
export type Table='accounts'|'credit_cards'|'categories'|'transactions'|'budgets';
export type Editing={table:Table;row?:Record<string,unknown>};
const titles:Record<Table,string>={accounts:'conta',credit_cards:'cartão',categories:'categoria',transactions:'lançamento',budgets:'orçamento'};
export function EntryForm({editing,data,household,month,onClose,onSaved}:{editing:Editing;data:Data;household:string;month:string;onClose:()=>void;onSaved:()=>Promise<void>}){
 const {table,row}=editing,[error,setError]=useState(''),[busy,setBusy]=useState(false),[kind,setKind]=useState(String(row?.kind||'expense')),[payment,setPayment]=useState(row?.credit_card_id?'card':'account');const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 const field=(key:string,fallback='')=>String(row?.[key]??fallback);
 const option=(items:{id:string;name:string;active?:boolean}[],selected?:unknown)=>items.filter(i=>i.active!==false||i.id===selected).map(i=><option key={i.id} value={i.id}>{i.name}</option>);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');const f=new FormData(event.currentTarget),s=(k:string)=>String(f.get(k)||'').trim(),n=(k:string,negative=false)=>parseAmount(s(k),negative);
  try{let payload:Record<string,unknown>={household_id:household};
   if(table==='accounts')payload={...payload,name:s('name'),institution:s('institution')||null,type:s('type'),opening_balance:n('opening_balance',true)};
   if(table==='categories')payload={...payload,name:s('name'),kind:s('kind')};
   if(table==='credit_cards')payload={...payload,name:s('name'),last4:s('last4')||null,credit_limit:n('credit_limit'),closing_day:Number(s('closing_day')),due_day:Number(s('due_day'))};
   if(table==='budgets')payload={...payload,category_id:s('category_id'),month:s('month')+'-01',amount:n('amount')};
   if(table==='transactions'){
    const isCard=kind==='expense'&&payment==='card';
    payload={...payload,description:s('description'),kind,status:s('status'),amount:n('amount'),occurred_on:s('occurred_on'),account_id:isCard?null:s('account_id')||null,credit_card_id:isCard||kind==='card_payment'?s('credit_card_id'):null,category_id:kind==='income'||kind==='expense'?s('category_id')||null:null,transfer_account_id:kind==='transfer'?s('transfer_account_id'):null,source:'manual'};
    if(Number(payload.amount)<=0)throw new Error('O valor do lançamento precisa ser maior que zero.');
    if(kind==='transfer'&&payload.account_id===payload.transfer_account_id)throw new Error('Escolha contas diferentes para a transferência.');
    if(payload.status==='cleared'&&String(payload.occurred_on)>today())throw new Error('Para datas futuras, use a situação Previsto ou Pendente.');
   }
   const db=getSupabase();const query=row?db.from(table).update(payload).eq('id',String(row.id)).eq('household_id',household):db.from(table).insert(payload);
   const {data:result,error}=await query.select('id');if(error)throw error;if(!result?.length)throw new Error('O registro não foi salvo. Verifique sua permissão.');
   await onSaved();onClose();
  }catch(e){setError(errorText(e));}finally{setBusy(false);}
 }
 return <dialog ref={ref} className="entryDialog" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><div className="dialogHead"><h2>{row?'Editar':'Novo'} {titles[table]}</h2><button className="iconBtn" aria-label="Fechar formulário" onClick={onClose} disabled={busy}><X size={18}/></button></div><form onSubmit={submit}>
 {['accounts','categories','credit_cards'].includes(table)&&<label>Nome<input name="name" defaultValue={field('name')} required maxLength={100} autoFocus/></label>}
 {table==='accounts'&&<><label>Instituição<input name="institution" defaultValue={field('institution')} maxLength={100}/></label><label>Tipo<select name="type" defaultValue={field('type','checking')}><option value="checking">Conta corrente</option><option value="savings">Poupança</option><option value="cash">Dinheiro</option><option value="wallet">Carteira digital</option><option value="investment">Investimentos</option><option value="other">Outra</option></select></label><label>Saldo inicial (R$)<input name="opening_balance" inputMode="decimal" defaultValue={field('opening_balance','0')} required/></label><small>Saldo anterior ao primeiro lançamento registrado nesta conta.</small></>}
 {table==='categories'&&<label>Tipo<select name="kind" defaultValue={field('kind','expense')}><option value="expense">Despesa</option><option value="income">Receita</option><option value="both">Receita e despesa</option></select></label>}
 {table==='credit_cards'&&<><label>Últimos 4 dígitos (opcional)<input name="last4" defaultValue={field('last4')} pattern="[0-9]{4}" maxLength={4} inputMode="numeric"/></label><label>Limite (R$)<input name="credit_limit" inputMode="decimal" defaultValue={field('credit_limit','0')} required/></label><div className="formGrid"><label>Dia de fechamento<input name="closing_day" type="number" min={1} max={31} defaultValue={field('closing_day','1')} required/></label><label>Dia de vencimento<input name="due_day" type="number" min={1} max={31} defaultValue={field('due_day','10')} required/></label></div></>}
 {table==='budgets'&&<><label>Categoria<select name="category_id" defaultValue={field('category_id')} required><option value="">Selecione</option>{option(data.categories.filter(c=>c.kind!=='income'),row?.category_id)}</select></label><label>Mês<input name="month" type="month" defaultValue={field('month',month).slice(0,7)} required/></label><label>Limite de gastos (R$)<input name="amount" inputMode="decimal" defaultValue={field('amount')} required/></label></>}
 {table==='transactions'&&<><label>Descrição<input name="description" defaultValue={field('description')} maxLength={160} required autoFocus/></label><div className="formGrid"><label>Tipo<select name="kind" value={kind} onChange={e=>setKind(e.target.value)}><option value="expense">Despesa</option><option value="income">Receita</option><option value="transfer">Transferência</option><option value="card_payment">Pagamento de cartão</option></select></label><label>Valor (R$)<input name="amount" inputMode="decimal" defaultValue={field('amount')} required/></label></div><div className="formGrid"><label>Data<input name="occurred_on" type="date" defaultValue={field('occurred_on',today())} required/></label><label>Situação<select name="status" defaultValue={field('status','cleared')}><option value="cleared">Realizado</option><option value="pending">Pendente</option><option value="planned">Previsto</option><option value="cancelled">Cancelado</option></select></label></div>
 {kind==='expense'&&<label>Forma de pagamento<select value={payment} onChange={e=>setPayment(e.target.value)}><option value="account">Conta / dinheiro</option><option value="card">Cartão de crédito</option></select></label>}
 {!(kind==='expense'&&payment==='card')&&<label>{kind==='transfer'?'Conta de origem':'Conta'}<select name="account_id" defaultValue={field('account_id')} required><option value="">Selecione uma conta</option>{option(data.accounts,row?.account_id)}</select></label>}
 {kind==='transfer'&&<label>Conta de destino<select name="transfer_account_id" defaultValue={field('transfer_account_id')} required><option value="">Selecione outra conta</option>{option(data.accounts,row?.transfer_account_id)}</select></label>}
 {(kind==='card_payment'||(kind==='expense'&&payment==='card'))&&<label>Cartão<select name="credit_card_id" defaultValue={field('credit_card_id')} required><option value="">Selecione um cartão</option>{option(data.credit_cards,row?.credit_card_id)}</select></label>}
 {['expense','income'].includes(kind)&&<label>Categoria<select name="category_id" defaultValue={field('category_id')}><option value="">Sem categoria</option>{option(data.categories.filter(c=>c.kind===kind||c.kind==='both'),row?.category_id)}</select></label>}
 </>}
 {error&&<p className="error" role="alert">{error}</p>}<div className="formActions"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Salvando…':'Salvar'}</button></div></form></dialog>;
}
