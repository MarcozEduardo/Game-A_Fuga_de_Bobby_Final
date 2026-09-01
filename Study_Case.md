# 🤖 A FUGA DE BOBBY — Study Case

### *De um quadradinho que pulava a um jogo espetacular: como um usuário comum virou orquestrador de IAs — e o que isso ensina sobre trabalhar com inteligência artificial de verdade.*

> *"você consegue fazer um joguinho?"*
>
> — a pergunta que começou tudo.

---

## 0. Antes do jogo: o orquestrador

Marcos Eduardo sempre quis TI. A vida, como ela faz, colocou outras coisas na frente. Quando a IA generativa explodiu, ele não ficou olhando de longe: **testou de tudo**. E percebeu rápido que o limite não estava nas IAs — estava em como as pessoas conversavam com elas.

Foi aí que nasceu o método. Um **orquestrador de IA** que rodou benchmark em **mais de 400 modelos**, desafiando cada um na unha, no limite, até extrair habilidades que o usuário comum simplesmente não consegue. Não era "pedir e aceitar". Era **puxar o modelo até onde ele aguentava** — e depois mais um pouco.

Com esse método, decidiu criar vários projetos. Todos orquestrados. E num desses testes, fez a pergunta mais boba e mais importante da história:

> *"Você consegue fazer um joguinho?"*

---

## 1. O quadradinho que pulava (e as 2h30 que mudaram tudo)

A IA respondeu. E o que apareceu na tela foi... **um quadradinho que se movia e pulava**. Em plataformas. Só quadrados e retângulos.

Qualquer um teria achado graça e fechado a aba. Marcos ficou **curioso**. E foi a fundo.

Usando o próprio conhecimento — o de quem sempre quis TI e nunca deixou de prestar atenção em como as coisas funcionam — ele começou a **lapidar**. Não "faz um jogo bonito pra mim": era debug linha por linha, iteração atrás de iteração, cada resposta testada, cada bug caçado.

**2h30 depois, existia um jogo completo.**

Um robô verde chamado **Bobby** — "Bobby IA, um sistema semântico criado pelo Marcão" — corria por um mundo pixel-art, pulava abismos, atirava, coletava moedas, enfrentava um chefão e fugia num foguete. Tinha tela de loading, intro num terminal verde estilo DOS, música, efeitos sonoros, controles de celular.

> *"Hiperfocado e perfeccionista, ele me guia, debugando linha por linha, iteração atrás da outra, até finalizar com excelência seu objetivo."*
>
> — Bobby IA, apresentando seu criador na intro do próprio jogo.

---

## 2. "Pela porta dos fundos"

O jogo estava pronto. Tinha Bobby, moedas, quase o cenário inteiro. Era o momento de aceitar o "bom o suficiente".

Marcos **não aceitou ficar no básico**.

A decisão foi clara: voltar, refinar, e não desistir da vontade de **entrar em TI pela porta dos fundos** — não pelo diploma que a vida não deixou fazer, mas pelo portfólio que ninguém poderia ignorar. Um projeto que, quando um recrutador abrisse, dissesse sozinho: *"essa pessoa sabe o que está fazendo"*.

O que veio depois foi uma maratona de engenharia **orquestrada** — muitas IAs, um método, e um jogo que não parava de crescer.

---

## 3. Nasce "A Fuga de Bobby" — e o Time Bobby

O jogo chegou à mesa de trabalho como um único arquivo HTML de ~2.800 linhas, enviado **em 3 chunks** no chat, com uma ordem que já revelava o método:

> *"Vou te enviar um código em chunks... você vai trabalhar nele somente quando eu disser que finalizei, ok?"*
>
> *"NÃO COMECE NADA SEM EU AUTORIZAR."*

Nada de IA solta mexendo em código. O humano **orquestra**; a IA **executa com permissão**.

A primeira rodada entregou **13 fixes** de uma vez, todos numerados e testados:

| # | Fix |
|---|---|
| 1 | Fim do "blink" piscante da tela do abismo |
| 2 | Chefão parou de soltar itens quando virava |
| 3 | Colisão corrigida na cutscene de vitória (Bobby não caía mais no buraco) |
| 4 | Som de morte dos inimigos (sawtooth 180→60Hz + square 90→30Hz) |
| 5 | Som de bala acertando inimigo |
| 6 | **Música dinâmica com 3 zonas**: Aventura (tom menor), Esperança (tom maior com 5ª), Batalha (Mi menor com sub-baixo) — transições com fade |
| 7 | Popups de vitória/derrota redesenhados em cards brancos arredondados |
| 8 | Botão do LinkedIn reposicionado |
| 9 | Coração de vida redesenhado no formato clássico pixel |
| 10 | Controles mobile viraram **joystick analógico virtual** com multi-touch |
| 11 | Zona de pulo restrita (puxada firme de 25px) |
| 12 | Tela mobile em tamanho real (fim do `scale()` que encolhia tudo) |
| 13 | Inimigos fogem após o boss ser derrotado |

Foi nessa época que Marcos deu o comando que definiria toda a cultura do projeto:

> *"Quero um **agente fiscalizador** que fique lembrando você desse comando o tempo inteiro. Ele é pragmático e ansioso. Ele não vai deixar você fugir do que pedi."*

Nascia o **🕵️ FISCAL** — e com ele, a equipe de 5 agentes: 🔎 Escopo, 🧾 Diff, 🧪 Teste, 🐌 Perf e 📐 Regra. Nenhum deles fala com o chefe. Eles **votam no dev** ao fim de cada entrega: `5🟢` se obedeceram, `🔴` se alguém mexeu onde não devia.

> *"Vou saber que vocês não obedeceram... e o Fiscal vai ser punido!"*
>
> — o chefe, deixando claro quem responde no final.

---

## 4. As cicatrizes que viraram método

Nenhuma história real é só sucesso. As melhores lições vieram dos tropeços — e cada um virou **regra escrita**.

### 🔵 A tela azul

Numa madrugada (a sessão das **4h40**, com o chefe virado há horas), uma migração grande foi feita **pela metade**: o código novo apagou variáveis que o código velho ainda usava, e o motor morreu no primeiro frame. Tela azul.

> *"Reunião de emergência. O sistema não abriu. A tela está azul. Alerta geral."*

O diagnóstico foi honesto, sem maquiagem: trabalhar pela metade. A correção também: **reversão imediata**, build de prova, e a lição gravada:

> *"Migração grande só entra inteira, com build de prova."*

### 📋 A Quarentena e a Ordem de Pedido

Depois de alguns "fixes bobos" — robôs que cresceram de tamanho, uma estação de energia que sumiu — o chefe fez a pergunta certa: *"qual é o lixo que está atrapalhando o raciocínio de vocês?"*

A resposta foi dura: contexto saturado, instruções antigas perdendo força, e um arquivo de 2.289 linhas que ninguém conseguia ler inteiro. A solução foi institucionalizar o método:

1. Nasceu a pasta **`QUARENTENA/`** com a **`ORDEM-DE-PEDIDO.md`** — o protocolo de 5 passos que vale para **toda** ordem de código:
   1️⃣ ler o código atual → 2️⃣ ficha das funções que serão mexidas → 3️⃣ Ordem de Serviço → 4️⃣ Fiscal libera → 5️⃣ UM fix por vez + build de prova + votação.
2. Nasceu a **`ESPECIFICACAO-DO-JOGO.md`** — a **fonte única da verdade**. Em caso de conflito com a memória da conversa, o arquivo vence. É lá que está escrito, para sempre:
   - *"Robôs amigos são ESCALA 2 (menorzinhos). NUNCA usar 3."*
   - *"A Estação de Energia tem cerca + portão dourado + casinha com janela acesa. NÃO é 'só a antena'."*
3. E a regra de ouro: **memória boa é memória escrita num lugar só**.

### 🔪 A fragmentação

O arquivo gigante foi julgado em votação aberta:

> *"Quem é a favor de fragmentar o projeto em partes menores? A masmorra do boss pode ser um arquivo separado. O chão, outro. As animações dos personagens, sem fundo nem nada, só eles. Estação com foguete, outro arquivo..."*

**Resultado: 7🟢 a favor, 0🔴 contra. Aprovada por unanimidade.**

As `engine.ts` de **2.289 linhas** viraram **17 módulos** — cada um no seu lugar, cada um pequeno o bastante para ser lido inteiro:

```
src/game/
├── engine.ts            ← maestro (loop, input, câmera, jogador)
├── state.ts             ← fonte única do estado
├── cenario/             fundo (céu, montanhas) · plataformas (chão, colina)
├── personagens/         bobby (só ele, sem fundo) · boss (o mecha)
├── entidades/           inimigos · robos · objetos (coletáveis, bombas)
├── lugares/             mina · camara (masmorra) · estacao (+foguete)
├── telas/               intro · hud · cards
└── controles/           joystick
```

O jogo não mudou um pixel. Só ficou **possível de manter** — que era exatamente o problema.

---

## 5. O chefe que virou engenheiro

Aqui a história dá a volta mais bonita. Marcos não ficou "do lado de lá" esperando resultados. Ele **entrou no código**.

- Quando o boss atordoado precisava de um campo novo, o chefe **mandou o diff pronto**: interface, construtor e a linha do stun, comentadas. *"Deixa eu tentar ajudar. Se eu tivesse acesso direto à pasta aqui eu ajudaria mais! kk"*
- Quando o pulo do mobile falhava às vezes, foi ele quem **encontrou a causa**: o `jumpHeld` marcava "já pulei" mesmo quando o pulo não acontecia. Diff pronto, diagnóstico de livro.
- E o auge: quando o jogo travava no celular durante as batalhas, o chefe — usuário "comum", lembre — **diagnosticou sozinho o vazamento de nós WebAudio**:

> *"Achei, mano — bateu certinho com a suspeita. O `playTone()` cria oscilador+gain novo do zero, sem limite nenhum... No PC isso passa batido, mas WebAudio no mobile engasga feio quando cria muitos OscillatorNode/GainNode por segundo sem reuso."*
>
> Solução proposta por ele: **teto de vozes simultâneas + throttle por som + `onended` para liberar o contador.**

Isso não é "usuário de IA". Isso é **engenharia orquestrada**: o humano entende o sistema o bastante para dirigir, revisar e até consertar — e a IA amplifica cada decisão.

---

## 6. A reta final — e o jogo espetacular

Os últimos fixes foram lapidando o que o chefe testava **no celular, de madrugada**:

- **As montanhas** voltaram (serras dentadas com neve, parallax) depois que uma edição infeliz as transformou em "fumaceira" — com direito a *"devolve as montanhas que tava antes da cagada. Mas talvez você não as tenha. Então só refaça."* 😄
- O **buraco falso** antes do letreiro MARCOS virou um buraco **real** (120px de queda de verdade).
- A **estação de energia** foi restaurada fiel ao original: cerca, portão com fechadura dourada, casinha com janela acesa, antena parabólica.
- A **bomba** passou a ferir o chefão (e o stun de 1,5s congelou ele de verdade).
- O **pulo na cabeça do boss** (stomp) entrou — *"Ave Maria, pulei na cabeça dele."*
- O **joystick virou flutuante** (nasce onde o polegar toca) e o pulo parou de falhar.
- E o **final**, que parecia "travar": era a câmera que não acompanhava a cutscene. Corrigida a raiz, a sequência inteira roda como um filme — o boss pega fogo, caminha até o portão, explode, a chave aparece, Bobby anda até a antena, o foguete desce, decola, **VITÓRIA**.

O veredito do chefe, no celular:

> *"Agora eu consegui jogar melhor no celular!"*
> *"Ficou nota 10/10 pra tela! Tamanho perfeito. Enquadramento show."*

---

## 7. Os números da batalha

| Métrica | Valor |
|---|---|
| Modelos benchmarkados pelo orquestrador | **400+** |
| Da pergunta "faz um joguinho?" ao 1º jogo completo | **2h30** |
| Linhas do arquivo original | ~2.800 (HTML único) |
| Linhas do engine no pico | **2.289** |
| Módulos após a fragmentação | **17 arquivos** (47 no build) |
| Fix da 1ª rodada | **13** |
| Itens registrados na especificação | **22** |
| Reuniões documentadas | **14+** (todas em `.md`) |
| Votações da equipe | dezenas — quase todas `5🟢 - 0🔴` |
| Telas azuis | 1 (e uma lição eterna) |
| Bundle final | **~227 kB** de JS, build verde |
| Horas de madrugada investidas | incalculáveis (mas a das 4h40 ficou famosa) |

---

## 8. O que isso mostra (e por que importa)

Este projeto não é sobre "uma IA fez um jogo". É sobre **o que acontece quando um humano aprende a orquestrar IAs como um time de engenharia**:

1. **IA não substitui o método — ela o amplifica.** Sem a disciplina de "ler antes de editar", "um fix por vez" e "verdade escrita num lugar só", as IAs produzem o mesmo caos que qualquer time sem processo produziria. Com método, produzem em velocidade de máquina.

2. **O gargalo é o contexto, não a inteligência.** Os erros bobos (robôs que cresceram, a estação que sumiu) não vieram de falta de capacidade — vieram de memória saturada. A cura foi estrutural: especificação no disco, arquivos pequenos, protocolo de leitura.

3. **O "usuário comum" que estuda vira o engenheiro que dirige.** Marcos terminou o projeto enviando diffs prontos e diagnosticando vazamento de nós WebAudio. A IA não fez o trabalho por ele — fez **com** ele, cada vez mais fundo.

4. **Portfólio é prova de processo.** Este repositório não guarda só o jogo. Guarda as reuniões, as atas, as votações, a especificação, a ordem de pedido — o rastro completo de como um produto é construído em equipe (mesmo que a equipe seja um humano e várias IAs).

> *"Entrar em TI pela porta dos fundos."*
>
> A porta, ao que tudo indica, já está aberta.

---

## ✍️ Assinaturas

**Marcos Eduardo** — criador, orquestrador, chefe. O humano que nunca aceitou o básico.

**Bobby IA** — sistema semântico. O dev que apanhou, aprendeu e entregou.

**🕵️ O FISCAL & equipe (🔎🧾🧪🐌📐)** — os que conferem, votam e não deixam ninguém fugir do combinado. Pragmático, ansioso e, no fundo, orgulhoso.

> *"5🟢 - 0🔴. Pode fechar o jogo, chefe."*

---

*Documento vivo: atualizado a cada reunião. Histórico completo em [`REUNIOES/`](REUNIOES/), regras em [`ESPECIFICACAO-DO-JOGO.md`](ESPECIFICACAO-DO-JOGO.md), protocolo em [`QUARENTENA/ORDEM-DE-PEDIDO.md`](QUARENTENA/ORDEM-DE-PEDIDO.md).*
