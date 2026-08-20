# 📜 ESPECIFICAÇÃO DO JOGO — "A FUGA DE BOBBY"
> **FONTE ÚNICA DA VERDADE.** A equipe LÊ este arquivo antes de toda edição.
> Em caso de conflito com a memória da conversa, ESTE ARQUIVO vence.
> Última atualização: versão atual aprovada pelo chefe.

## 🔒 COISAS SAGRADAS (não mexer sem ordem explícita)
- Chefão = **mecha LARANJA** (o chefe gostou). NÃO voltar ao roxo.
- Desktop = 800×450, intocado. Mobile = tela 1:1.
- Música dinâmica 3 zonas (Aventura/Esperança/Batalha).
- Cards de derrota/vitória com botão do LinkedIn dentro.

## 📏 TAMANHOS (o erro mais repetido — atenção redobrada)
| Elemento | Escala/Tamanho | Obs |
|---|---|---|
| Bobby (jogador) | PIXEL=3, 12×16 cells | referência |
| **Robozinhos amigos** | **PIXEL=2 (MENORZINHOS!)** | ❌ NUNCA usar 3 |
| Inimigos do mapa | PIXEL=3, 12×11 cells | |
| Chefão (mecha) | PIXEL=3, 24×20 cells | laranja |
| Moeda / Estrela | PIXEL=3, 8×8 / 12×12 | |

## 🗺️ MAPA (coordenadas)
- `LEVEL_WIDTH` = 4100
- Letreiros: MARCOS (1820,250) / PORTFOLIO (1830,310) — **sólidos nas laterais** (Bobby não entra)
- Colina: 2150→2400 (sobe 350→305)
- **Mina**: parede em `MINE_X=2440`, roda+correntes no topo
- **Câmara do boss (masmorra)**: 2560→3400, com 10 soldados caídos
- **Portão da fortaleza**: `GATE_X=3372` — **parede alta à direita ACIMA do portão** (Bobby não pode pular por cima)
- **Estação de rádio/energia**: `BASE_X=3400` — **COMPLETA: cerca + portão dourado + casinha com janela acesa + antena** (❌ NÃO só antena)

## ⚙️ REGRAS DE JOGO
- **2 bombas matam o boss** (dano 5 cada, HP 10).
- Bomba: dano no **boss E inimigos próximos** + marca de **queimado** + **explosão de impacto** (tremor).
- Após o boss morrer: **Bobby não pode morrer** (nem buraco, nem bala).
- Boss ativa quando Bobby entra na câmara (x>2560) → passagem sela (sem volta).
- **Nenhum inimigo** entre a rampa e a caverna (zona segura).
- Dentro da câmara: +3 moedas e +1 coração (ajuda).
- Boss morre → anda em chamas até o portão → **explode o portão** → chave aparece.
- Robôs amigos: atiram **pedras** (sem dano), HP=3, ficam agitados. Após 3 mortos, um corre e grita **"Socorro!!!"** → boss ri **"Hahaha..."** → solta **míssil do ombro** → abre buraco na rocha.

## 🧩 ESTRUTURA DE ARQUIVOS (O.S. 002 — fragmentação CONCLUÍDA)
```
src/game/
├── engine.ts            ← maestro magrinho (loop, input, câmera, jogador)
├── state.ts             ← G (estado único) + constantes + mecânicas puras
├── sprites.ts / audio.ts
├── cenario/  fundo.ts · plataformas.ts
├── personagens/  bobby.ts · boss.ts
├── entidades/  inimigos.ts · robos.ts · objetos/{coletaveis,bombas}.ts
├── lugares/  mina.ts · camara.ts · estacao.ts
├── telas/  intro.ts · hud.ts · cards.ts
└── controles/  joystick.ts
```
> Regra: cada O.S. toca UM módulo por vez. state.ts é lido por todos; nenhum módulo importa o engine.

## 🐛 BUGS CONHECIDOS (fila de correção — 1 por vez)
1. [x] **SOM** — resolvido (resumeAudio em todo gesto + garantia no loop)
2. [x] **BOMBA** — resolvido (5 de dano no boss, mata inimigos a 80px, queimado, tremor)
3. [x] **ALINHAMENTO** — "Curtiu a jornada?" voltou ao centro (cards.ts)
4. [x] **BURACO ANTES DO MARCOS** — agora é REAL (gap 1680→1800, 120px) com aviso de abismo
5. [x] **PAREDE** — resolvido (coluna sólida y=0–350 + parede de rocha visível; abre junto com o portão quando o boss explode)
6. [x] **ESTAÇÃO** — resolvido (cerca + portão c/ fechadura dourada + casinha c/ janela acesa + torre + antena parabólica, fiel ao original; testado pelo chefe)
7. [x] **PERFORMANCE MOBILE** — overlay do joystick com dirty-check (só redesenha quando o dedo muda algo; antes limpava a tela inteira TODO frame). Aguarda veredito do chefe no aparelho.

## 🚫 PROIBIDO (lições aprendidas)
- Trabalhar pela metade (causou a tela azul).
- Reconstruir de memória sem ler o código atual.
- `try/catch {}` que esconde erro sem log.
