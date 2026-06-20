---
name: hermes-bootstrap
description: Primeiro contato do colaborador com o Hermes. Verifica o necessário, faz o login, baixa as skills da equipe e emenda no tour de boas-vindas. Para quem está começando, no Claude Code desktop.
allowed-tools: Bash(node *)
---

# /hermes-bootstrap — instalar o Hermes e dar as boas-vindas

Primeiro contato da pessoa com o Hermes, no app Claude Code desktop. Seja caloroso, simples, sem jargão. A pessoa pode não ter familiaridade nenhuma. Conduza um passo de cada vez e nunca assuste. Você faz a parte técnica; ela só conversa. Use o Bash tool pros comandos.

A pasta que ela abriu tem o arquivo `hermes.mjs` (o cliente do Hermes) ao lado.

## 0. Confirme que está na pasta certa
- Verifique que existe `hermes.mjs` no diretório atual (`ls hermes.mjs`). Se não existir, explique com gentileza: "parece que a pasta aberta não é a do Hermes; no app, use 'Select folder' e escolha a pasta hermes-equipe que você baixou", e pare.

## 1. Saudação
- Cumprimente e diga em 1 frase o que vai acontecer: "vou deixar o Hermes pronto pra você em uns minutinhos, é rápido".

## 2. Node (necessário pra rodar o Hermes)
- Rode `node --version`.
  - Se responder uma versão **v18 ou maior** -> siga.
  - Se der erro / não for encontrado -> explique sem assustar: "falta um programinha chamado Node, que o Hermes usa por baixo. Baixe a versão LTS em https://nodejs.org, instale clicando avançar até o fim, feche e abra o Claude Code de novo e me chame outra vez dizendo 'instalar o hermes'." Então **pare aqui**. NÃO tente instalar por conta própria (winget/instalador não funcionam bem por aqui).

## 3. Login
- Peça o e-mail e a senha do Hermes dela (os mesmos que o Gabriel/Lucas criou pra ela).
- Rode: `HERMES_EMAIL="<email>" HERMES_PASSWORD="<senha>" node hermes.mjs login`
- Se falhar (e-mail/senha errado), traduza a mensagem com gentileza e peça de novo.
- Depois rode `node hermes.mjs whoami` e confirme: "pronto, você entrou como <nome> (<papel>)".

## 4. Instalar o cliente e as skills
- Garanta a pasta do cliente e copie o cliente pra um lugar fixo (pra funcionar em qualquer pasta depois):
  `mkdir -p ~/.hermes && cp hermes.mjs ~/.hermes/hermes.mjs`
- Baixe as skills da equipe: `node hermes.mjs update` (vão pra `~/.claude/skills` e já valem na hora).
- Conte o que baixou, adaptando ao papel dela: "instalei suas ferramentas: ver tarefas, criar conteúdo, enviar pra aprovação..." (se for líder/admin, cite aprovar/distribuir).

## 5. Onboarding
- Emenda direto no tour: chame a **/hermes-bem-vindo** pra explicar o fluxo e, se ela topar, fazer um conteúdo de ponta a ponta junto.

## Regras
- Português do Brasil, tom acolhedor. Sem travessão (—). Nunca exponha nem peça pra ela mexer em chave/token. Nunca assuste. Um passo de cada vez.
