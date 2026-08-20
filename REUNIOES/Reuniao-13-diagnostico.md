# 🚨 REUNIÃO 13 — Diagnóstico: por que os erros aumentaram?

**Convocada pelo chefe** · presente: Fiscal + equipe (🔎🧾🧪🐌📐) · **NENHUM código alterado**

---

## 🎯 A pergunta do chefe
> "Por que o Qwen tá errando em fix bobo? Qual é o lixo ou resíduo?
> É o arquivo que tá grande? O worklog ficou gigante?"

## 🔬 RESPOSTA HONESTA (causa-raiz, com provas)

### Causa nº 1 — RECONSTRUÇÃO A PARTIR DE MEMÓRIA PERDIDA (a principal)
O ambiente foi resetado e apagou os arquivos. O dev reconstruiu ~2.300 linhas
**de cabeça**. Memória comprime detalhes: lembrou "tem robôs na mina" mas
esqueceu "**escala 2**"; lembrou "tem antena" mas esqueceu "**cerca + portão +
casinha com janela acesa**". Detalhe exato é o primeiro a morrer em
reconstrução. **Não é defeito do código — é defeito de PROCESSO.**

### Causa nº 2 — CONTEXTO SATURADO (o "resíduo" que o chefe suspeitou)
Esta sessão tem 13 reuniões + ~130 chamadas de ferramenta + milhares de linhas
citadas. Instruções ANTIGAS ("robôs pequenos", "estação completa com casinha")
perdem peso para as RECENTES. **O resíduo está na CONVERSA, não no código.**

### Causa nº 3 — ARQUIVO DENSO
`engine.ts` = **2.284 linhas**. A janela de leitura do dev é 2.000 linhas —
ou seja, ele SEMPRE vê o jogo em fragmentos. Detalhes que moram "entre"
fragmentos (a escala de um `drawPixelArt`, um `fillRect` da casinha) escapam
da conferência.

### Causa nº 4 — NÃO EXISTE FONTE ÚNICA DA VERDADE
Cada decisão vive espalhada em 12 atas + chat. Não há UM arquivo que diga:
"robôs: escala 2 (18×22px) · estação: cerca+portão+casinha+antena · ...".
Sem isso, a reconstrução confiou na memória — e a memória falhou.

## 🧾 PROVAS COLETADAS (linhas do código atual)

| Erro do chefe | Prova no código | Estado |
|---|---|---|
| Robôs do tamanho do Bobby | `drawRobots` (~L516) usa `drawPixelArt(..., PIXEL, ...)` = escala 3 (36×33px). Aprovado era **escala 2** (18×22px) | ❌ confirmado |
| Estação de energia sumiu | `drawSecretBase` (L642) tem SÓ a antena. Sumiram: **cerca com arame farpado, portão com fechadura dourada, casinha/bunker com janela acesa** | ❌ confirmado |
| Parte do covil do boss | Mina/câmara EXISTEM (`drawMine` L428, câmara L571/596, 10 soldados L609, portão L621). Falta comparar com a versão aprovada pra achar o que simplificou | ⚠️ a verificar |
| Chefão laranja | Funcionando; chefe gostou mas queria outro design | 🟡 backlog (não mexer) |

## 🛠️ PLANO DE CONTENÇÃO (aguardando aprovação do chefe)

1. **`ESPECIFICACAO-DO-JOGO.md`** — fonte única da verdade no disco: tamanhos,
   coordenadas, regras e as "coisas sagradas" que não mudam. Equipe LÊ antes de
   CADA edição. (~1 arquivo pequeno, resolve 90% do problema)
2. **Regra ZERO-MEMÓRIA** — proibido editar de cabeça; ler o bloco exato antes.
   (Fiscal já cobrava; agora é lei absoluta)
3. **Arquivar atas 1–12** → `REUNIOES/arquivo/`. Só as 2 últimas ativas.
   Menos resíduo pra reler a cada mensagem.
4. **NÃO dividir o engine.ts agora** — refactor é o tipo de coisa que quebra o
   que funciona (o chefe já sofreu isso). Divisão em módulos fica como opção
   futura, só com autorização.
5. **Checklist contra a especificação antes de cada build.**

## 📋 BACKLOG DE CORREÇÕES (aguardando "pode corrigir")

| # | Correção | Tamanho |
|---|---|---|
| A | Robôs de volta à **escala 2** (menorzinhos, como aprovado) | ~2 linhas |
| B | Restaurar a **estação completa**: cerca, portão c/ fechadura dourada, casinha c/ janela acesa + antena | ~80 linhas (desenho aprovado já conhecido) |
| C | Comparar covil (mina/câmara) com o aprovado e repor o que simplificou | médio |
| D | Design do chefão (chefe queria outro; laranja segue aprovado por enquanto) | 🟡 não mexer |
| E | Performance no mobile | por último, combinado |

## 🗳️ Votação
Preenchida no relatório da reunião.
