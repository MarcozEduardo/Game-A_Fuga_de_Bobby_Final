# 🧠 MEMÓRIA DA EQUIPE — leia ESTE arquivo PRIMEIRO

> **Como usar (sessão nova):** leia este arquivo inteiro (2 min). Depois leia a
> `ESPECIFICACAO-DO-JOGO.md`. Só então toque em código. Tudo que importa está
> aqui e na especificação — o resto é histórico, **não leia**.

---

## 📌 O PROJETO
**"A Fuga de Bobby"** — platformer pixel-art em canvas (React + Vite + Tailwind),
portfólio do **Marcos Eduardo**, narrado pelo Bobby IA. Deve impressionar
recrutador: jogável, bonito, leve. O jogo NÃO pode ficar gigante.

## 📂 ARQUIVOS QUE SÃO A VERDADE (nesta ordem)
1. `MEMORIA-DA-EQUIPE.md` — este arquivo (memória da equipe)
2. `ESPECIFICACAO-DO-JOGO.md` — **fonte única da verdade** (tamanhos, coords, sagrado)
3. `QUARENTENA/ORDEM-DE-PEDIDO.md` — protocolo obrigatório pra qualquer código
4. `src/game/*.ts` — o código atual (sempre ler antes de editar)

## 🚫 LIXO — NÃO LER (histórico, já superado)
- `REUNIOES/Reuniao-01` a `13` — atas antigas. Só curiosidade histórica.
- Qualquer chunk de HTML colado em chat antigo — o código atual é outro.

## 👥 A EQUIPE E O PROTOCOLO (lei da casa)
- **Marcos Eduardo** = chefe. Só ele autoriza código.
- **🕵️ Fiscal** = sentinela. Não edita; confere, libera etapas e assina relatório.
- **5 agentes** (🔎 Escopo · 🧾 Diff · 🧪 Teste · 🐌 Perf · 📐 Regra) votam ao fim:
  `5🟢` = obedeceram · qualquer `🔴` = mexeram onde não deviam.
- **Toda ordem de código segue a ORDEM-DE-PEDIDO (Quarentena):**
  1️⃣ ler o código atual → 2️⃣ ficha das funções que vai mexer → 3️⃣ O.S. →
  4️⃣ fiscal libera → 5️⃣ UM fix por vez + build de prova + votação.

## ⛔ REGRAS DE PEDRA
1. **UM fix por vez.** Nada de "aproveitar e já que estou aqui...".
2. **ZERO-MEMÓRIA:** proibido editar de cabeça — leia o bloco antes.
3. **Jogo aprovado não se toca.** Refatorar/dividir só com ordem explícita do chefe.
   ✅ **Fragmentação CONCLUÍDA (O.S. 002, build verde, 47 módulos):**
   `state.ts` (G) + cenario/ + personagens/ + entidades/ + lugares/ + telas/ +
   controles/. Engine virou maestro magrinho. Daqui em frente: cada O.S. toca UM
   módulo por vez; nenhum módulo importa o engine.
4. Robôs amigos são **menorzinhos (escala 2)**. NÃO do tamanho do Bobby.
5. Relatório no chat **só quando terminar**; comentários de trabalho vão p/ registros.

## ✅ ESTADO ATUAL (o que funciona — versão que o chefe aprovou)
Jogo completo: loading → intro (scroll no mobile) → fase → colina → MARCOS →
robôs atiram pedras (HP 3) → "Socorro!!!" → míssil do ombro abre a mina →
câmara do boss (laranja) → 2 bombas matam → boss cai no portão e explode →
chave (15s → voa) → antena → foguete → VITÓRIA. Cards c/ LinkedIn.
Mobile 1:1. Som reativado (FIX SOM entregue).

## 📋 FILA DE PENDÊNCIAS (próximas O.S., nesta ordem)
1. ✅ **FIX SOM** — entregue.
2. ✅ **FIX Bomba** — entregue (5 de dano no boss = 2 bombas matam; inimigos a
   80px morrem; queimado + tremor de impacto).
3. ✅ **FIX Parede da masmorra** — entregue (coluna sólida + parede de rocha
   visível acima do portão; explode junto com o boss na cutscene).
4. **FIX Estação de rádio completa:** hoje só existe a antena. Voltar a
   estação como era no original (cerca + portão com fechadura dourada +
   casinha com janela acesa). O chefe pode enviar o HTML original se precisar.
5. **ÚLTIMO — Performance no mobile** (lentidão). Só quando 3-4 estiverem OK.

## 💡 POR QUE ESTE ARQUIVO EXISTE
Contexto longo = erro bobo (foi assim que os robôs cresceram e a estação sumiu).
Memória boa é **memória escrita num lugar só**. Na dúvida entre este arquivo e
qualquer lembrança de chat: **este arquivo vence**.
