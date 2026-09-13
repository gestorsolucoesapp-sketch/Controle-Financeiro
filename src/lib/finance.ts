export type Account = {id:string;name:string;institution:string|null;type:string;opening_balance:number;active:boolean};
export type Card = {id:string;name:string;last4:string|null;credit_limit:number;closing_day:number;due_day:number;active:boolean};
export type Category = {id:string;name:string;kind:string;active:boolean};
export type Transaction = {id:string;description:string;kind:string;status:string;amount:number;occurred_on:string;account_id:string|null;credit_card_id:string|null;category_id:string|null;transfer_account_id?:string|null};
export type Budget = {id:string;category_id:string;month:string;amount:number};
export type Data = {accounts:Account[];credit_cards:Card[];categories:Category[];transactions:Transaction[];budgets:Budget[]};
export const emptyData:Data={accounts:[],credit_cards:[],categories:[],transactions:[],budgets:[]};
const cents=(n:number)=>Math.round(Number(n)*100);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function monthEnd(month:string){const [y,m]=month.split('-').map(Number);return `${month}-${new Date(y,m,0).getDate()}`;}
export function cashDelta(t:Transaction,account?:string){
 const n=cents(t.amount);
 if(t.kind==='transfer')return account?(t.transfer_account_id===account?n:0)-(t.account_id===account?n:0):0;
 if(!t.account_id||(account&&t.account_id!==account))return 0;
 if(t.kind==='income')return n;
 if(t.kind==='card_payment'||(t.kind==='expense'&&!t.credit_card_id))return -n;
 return 0;
}
export function cardBalance(data:Data,id:string,end=today()){
 return data.transactions.filter(t=>t.credit_card_id===id&&t.status!=='cancelled'&&t.occurred_on<=end).reduce((n,t)=>n+(t.kind==='expense'?cents(t.amount):t.kind==='card_payment'?-cents(t.amount):0),0)/100;
}
export function totals(data:Data,month:string,asOf=today()){
 const end=monthEnd(month),cutoff=asOf<end?asOf:end;
 const valid=data.transactions.filter(t=>t.status!=='cancelled');
 const settled=valid.filter(t=>t.status==='cleared'&&t.occurred_on<=cutoff);
 const balance=data.accounts.reduce((n,a)=>n+cents(a.opening_balance),0)+settled.reduce((n,t)=>n+cashDelta(t),0);
 const monthly=valid.filter(t=>t.occurred_on.startsWith(month));
 const income=monthly.filter(t=>t.kind==='income').reduce((n,t)=>n+cents(t.amount),0);
 const expenses=monthly.filter(t=>t.kind==='expense').reduce((n,t)=>n+cents(t.amount),0);
 const future=valid.filter(t=>t.occurred_on<=end&&!(t.status==='cleared'&&t.occurred_on<=cutoff));
 const debt=data.credit_cards.reduce((n,c)=>n+Math.max(0,cents(cardBalance(data,c.id,end))),0);
 return {balance:balance/100,income:income/100,expenses:expenses/100,projected:(balance+future.reduce((n,t)=>n+cashDelta(t),0)-debt)/100,cardDebt:debt/100,budget:data.budgets.filter(b=>b.month.startsWith(month)).reduce((n,b)=>n+cents(b.amount),0)/100};
}
export function accountBalance(data:Data,a:Account){return (cents(a.opening_balance)+data.transactions.filter(t=>t.status==='cleared'&&t.occurred_on<=today()).reduce((n,t)=>n+cashDelta(t,a.id),0))/100;}
export function parseAmount(raw:string,negative=false){
 if(!/^-?\d+(?:[.,]\d{1,2})?$/.test(raw.trim()))throw new Error('Informe um valor com até duas casas decimais, sem separador de milhar.');
 const n=Number(raw.replace(',','.'));
 if(!Number.isFinite(n)||Math.abs(n)>999999999||(!negative&&n<0))throw new Error('Valor fora do intervalo permitido.');
 return n;
}
