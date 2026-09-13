import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {totals,parseAmount,cashDelta,emptyData,type Transaction,type Data} from '../src/lib/finance.ts';
const tx=(overrides:Partial<Transaction>):Transaction=>({id:Math.random().toString(),description:'Teste',kind:'expense',status:'cleared',amount:0,occurred_on:'2026-09-10',account_id:'a',credit_card_id:null,category_id:null,...overrides});
test('saldo e projeção não descontam compra no cartão duas vezes',()=>{
 const data:Data={...emptyData,accounts:[{id:'a',name:'Conta',type:'checking',institution:null,opening_balance:1000,active:true}],credit_cards:[{id:'c',name:'Cartão',last4:null,credit_limit:2000,closing_day:5,due_day:15,active:true}],transactions:[tx({kind:'income',amount:2000}),tx({amount:300}),tx({account_id:null,credit_card_id:'c',amount:500}),tx({kind:'card_payment',credit_card_id:'c',amount:200}),tx({status:'planned',amount:100,occurred_on:'2026-09-20'}),tx({amount:999,status:'cancelled'})]};
 const result=totals(data,'2026-09','2026-09-13');assert.equal(result.balance,2500);assert.equal(result.expenses,900);assert.equal(result.cardDebt,300);assert.equal(result.projected,2100);
});
test('transferência conserva saldo consolidado e move entre contas',()=>{const t=tx({kind:'transfer',amount:250,transfer_account_id:'b'});assert.equal(cashDelta(t),0);assert.equal(cashDelta(t,'a'),-25000);assert.equal(cashDelta(t,'b'),25000);});
test('centavos e validação de valores',()=>{assert.equal(parseAmount('12,34'),12.34);assert.throws(()=>parseAmount('1.234,56'));assert.throws(()=>parseAmount('-1'));assert.throws(()=>parseAmount('NaN'));assert.equal(parseAmount('-1',true),-1);const d={...emptyData,transactions:[tx({kind:'income',amount:0.1}),tx({kind:'income',amount:0.2})]};assert.equal(totals(d,'2026-09','2026-09-13').income,0.3);});
test('lançamento futuro fora do mês e cancelado não entram na projeção',()=>{const d={...emptyData,transactions:[tx({kind:'income',amount:100,status:'planned',occurred_on:'2026-10-01'}),tx({kind:'income',amount:50,status:'cancelled'})]};assert.equal(totals(d,'2026-09','2026-09-13').projected,0);});
