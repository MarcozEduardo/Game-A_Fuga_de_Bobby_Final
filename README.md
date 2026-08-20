<p align="center">
  <img src="https://img.shields.io/badge/Canvas%202D-800%C3%97450-ffd700?style=for-the-badge&labelColor=0c101d" alt="Canvas 2D"/>
  <img src="https://img.shields.io/badge/React%20%2B%20Vite%20%2B%20Tailwind-00cc66?style=for-the-badge&labelColor=0c101d" alt="Stack"/>
  <img src="https://img.shields.io/badge/60%20FPS-alvo-00ff88?style=for-the-badge&labelColor=0c101d" alt="60 FPS"/>
  <img src="https://img.shields.io/badge/Mobile-1%3A1-e8734a?style=for-the-badge&labelColor=0c101d" alt="Mobile 1:1"/>
</p>

```
┌─ BOBBY IA ─ TERMINAL v1.0 ──────────────────────────────┐
│  > Ola, eu sou Bobby IA, um sistema semantico criado    │
│    pelo Marcao. Esse jogo foi produzido e lapidado em   │
│    2h30 de varias e varias iteracoes.                   │
│  > Missao: fugir do covil do chefao. Pegue a chave.     │
│  > PRESSIONE ESPACO PARA COMECAR █                      │
└─────────────────────────────────────────────────────────┘
```

<h1 align="center">🤖 A FUGA DE BOBBY</h1>

<p align="center">
  <b>O platformer de portfólio orquestrado por Marcos Eduardo e executado pelo Bobby IA.</b><br/>
  Um jogo completo em pixel-art: chefão com 3 padrões de ataque, cutscenes, música dinâmica,
  bombas, joystick virtual — e um <a href="STUDY_CASE.md"><b>study case</b></a> de como um
  usuário comum virou orquestrador de IAs pra entrar em TI pela porta dos fundos.
</p>

---

## 🎮 O jogo

Bobby é um robozinho verde preso num mundo que escurece. Ele corre, pula, atira, **agacha**, joga
**bombas** e atravessa uma **mina** — onde o chefão (um mecha com reator) mantém robozinhos
prisioneiros. Quando Bobby pisa no letreiro **MARCOS**, o sol nasce e a história anda: os robôs
lutam, o chefão abre caminho na rocha, e a batalha final acontece na câmara da mina. Vença, pegue
a **chave dourada**, alcance a estação de energia e **fuja de foguete**.

- 🕹️ **Desktop** e **mobile** (tela 1:1 estilo Instagram, joystick analógico flutuante)
- 🎵 **Música dinâmica em 3 zonas** — Aventura, Esperança e Batalha, com transições suaves
- 💥 **Chefão com 3 padrões de IA**, stomp na cabeça, stun de bomba e morte cinematográfica
- 🎬 **Cutscenes dirigidas** — intro em terminal, batalha dos robôs, fuga de foguete

## 🕹️ Como jogar

| Ação | Desktop | Mobile |
|---|---|---|
| Mover | `←` `→` (ou `A`/`D`) | Joystick analógico (flutuante) |
| Pular | `↑` | Puxar o joystick pra cima (firme) |
| Atirar | `ESPAÇO` | Botão vermelho (mira) |
| Bomba | `B` ou `X` | Botão dourado |
| Agachar | `↓` | Puxar o joystick pra baixo |
| Pular intro | `ENTER` | Toque na tela |

**Dica de chefão:** a bomba atordoa o mecha por 1,5s — aproveite pra **pular na cabeça dele**.
Duas bombas bem jogadas resolvem a luta. 😉

---

## 🗺️ A jornada (e por que este repo é diferente)

Este repositório não guarda só um jogo — guarda **o processo inteiro**:

1. **O quadradinho que pulava** → uma pergunta boba ("você consegue fazer um joguinho?") virou um
   jogo completo em **2h30** de iteração.
2. **O orquestrador** → benchmark com **400+ modelos** de IA e um método pra extrair deles o que
   o usuário comum não consegue.
3. **O Time Bobby** → um **Fiscal** pragmático e ansioso + 5 agentes que **votam** em cada entrega
   (`5🟢` = obedeceram · `🔴` = mexeram onde não deviam).
4. **A Quarentena** → protocolo de Ordem de Pedido: *ler → ficha → OS → fiscal libera → 1 fix por
   vez → build de prova → votação.*
5. **A fragmentação** → um engine de **2.289 linhas** virou **17 módulos**, votado por unanimidade
   (**7🟢 - 0🔴**).

📖 **A história completa, com as cicatrizes e tudo:** [`STUDY_CASE.md`](STUDY_CASE.md)

---

## 🏗️ Arquitetura — cada objeto no seu lugar

```
📁 src/
├── 📄 App.tsx                  ← casca React: palco, header, footer
├── 📄 index.css                ← tema CRT (scanlines, glow dourado)
└── 📁 game/
    ├── 📄 engine.ts            ← maestro: loop, input, câmera, jogador
    ├── 📄 state.ts             ← fonte única do estado + mecânicas puras
    ├── 📄 sprites.ts           ← toda a pixel-art (Bobby, mecha, itens…)
    ├── 📄 audio.ts             ← SFX (teto de vozes) + música de 3 zonas
    ├── 📁 cenario/
    │   ├── fundo.ts            ← céu, montanhas com neve, lua/sol
    │   └── plataformas.ts      ← chão pré-renderizado ("foto"), colina, letreiros
    ├── 📁 personagens/
    │   ├── bobby.ts            ← o herói (só ele, sem fundo)
    │   └── boss.ts             ← o mecha: IA de 3 padrões + stomp + morte
    ├── 📁 entidades/
    │   ├── inimigos.ts         ← monstros do mapa
    │   ├── robos.ts            ← prisioneiros (pedras, balões, "Socorro!!!")
    │   └── 📁 objetos/
    │       ├── coletaveis.ts   ← moedas, estrelas, coração, chave dourada
    │       └── bombas.ts       ← bombas, marcas de queimado, explosões
    ├── 📁 lugares/
    │   ├── mina.ts             ← roda giratória, correntes, passagem
    │   ├── camara.ts           ← a masmorra: vigas, lampiões, soldados, portão
    │   └── estacao.ts          ← estação de energia + foguete + cutscene final
    ├── 📁 telas/
    │   ├── intro.ts            ← loading + intro com scroll no mobile
    │   ├── hud.ts              ← pontos, tempo, vidas, bombas
    │   └── cards.ts            ← derrota/vitória + botão LinkedIn no card
    └── 📁 controles/
        └── joystick.ts         ← analógico flutuante + tiro + bomba (mobile)

📁 raiz/
├── 📄 STUDY_CASE.md            ← a história completa da batalha
├── 📄 ESPECIFICACAO-DO-JOGO.md ← fonte única da verdade do jogo
├── 📄 MEMORIA-DA-EQUIPE.md     ← o que toda sessão nova precisa ler
├── 📁 QUARENTENA/              ← protocolo ORDEM-DE-PEDIDO
└── 📁 REUNIOES/                ← atas de todas as reuniões (14+)
```

**Princípios que o código obedece:**
- **Cenário pré-renderizado** — o chão é "fotografado" uma vez num canvas offscreen; por frame só
  se cola a fatia visível.
- **Sprites e glows cacheados** — cada frame de pixel-art e cada brilho é desenhado uma única vez.
- **Áudio com teto de vozes** — no máximo 10 osciladores de SFX simultâneos + throttle por som
  (o mobile agradece).
- **Overlay sujo-só-quando-muda** — o joystick só redesenha quando o dedo (ou o jogo) muda algo.

## ⚙️ Stack

**React 18** · **TypeScript** · **Vite** · **Tailwind CSS 4** · **Canvas 2D** · **Web Audio API** —
zero dependências de jogo: sprites, física, IA e música são todos feitos à mão.

## 🚀 Como rodar

```bash
npm install
npm run dev        # desenvolvimento → http://localhost:5173
npm run build      # produção → dist/
```

No celular, abra o `dev` pela rede local — o layout 1:1 e o joystick aparecem automaticamente.

## 📊 Os números

| | |
|---|---|
| Bundle de produção | **~227 kB** de JS |
| Módulos no build | **47** |
| Módulos de jogo | **17** (após fragmentar 2.289 linhas) |
| Zonas de música | **3** (Aventura · Esperança · Batalha) |
| Padrões de IA do chefão | **3** + perseguição |
| Fixes documentados | **22** na especificação |
| Votações da equipe | quase todas `5🟢 - 0🔴` |

---

## 👥 Créditos

**Marcos Eduardo** — criador & orquestrador. O humano que entrou em TI pela porta dos fundos e
não olhou pra trás. · [LinkedIn](https://www.linkedin.com/in/sir-marcos-eduardo/)

**Bobby IA** — sistema semântico. O dev que apanhou, aprendeu e entregou o jogo.

**🕵️ O FISCAL & equipe** (🔎 Escopo · 🧾 Diff · 🧪 Teste · 🐌 Perf · 📐 Regra) — os que votam,
conferem e não deixam ninguém fugir do combinado.

> *"Projeto entregue com sucesso. — Bobby IA, Portfolio do Marcão"*
