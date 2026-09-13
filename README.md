# Finanças — Controle Financeiro

Aplicativo em Next.js com autenticação Supabase, contas, cartões, categorias, lançamentos e orçamentos. Cada espaço financeiro usa as políticas de acesso do Supabase.

## Executar

Use Node.js 22 ou superior. Instale com `npm ci`, copie `.env.example` para `.env.local` e configure as duas variáveis públicas do projeto Supabase. Execute `npm run dev`.

Este aplicativo está vinculado exclusivamente ao projeto Supabase `dsfexbtcvkyjqaondqiv`.

## Verificações

- `npm run build`
- `npm run lint`
- `node --experimental-strip-types --test tests/finance.test.ts`

Compilação, lint e quatro testes dos cálculos financeiros passaram localmente. Login, gravação e isolamento entre dois usuários ainda precisam de validação completa com contas de teste. Não declarar esta versão validada para produção antes dessa etapa.

## Publicação

Importe este repositório como projeto Next.js no Vercel e configure as variáveis indicadas em `.env.example`. Configure a URL publicada nas opções de autenticação e redirecionamento do Supabase. Não envie `.env.local` ao GitHub.

## Cálculos

O saldo considera os saldos iniciais e as movimentações realizadas. Receitas e despesas mensais incluem valores previstos. Transferências não alteram o saldo consolidado. Compras no cartão entram nas despesas; pagamentos de fatura não são contados como nova despesa. A projeção desconta todo o saldo de compras no cartão ainda não coberto por pagamentos até o fim do mês, independentemente do vencimento.
