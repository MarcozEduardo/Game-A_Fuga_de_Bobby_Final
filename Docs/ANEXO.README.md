# ANEXO - A Fuga de Bobby v7

## Documento de handoff, memoria de producao e referencia para o proximo projeto

Este documento registra a visao, as mecanicas, os criterios de qualidade e as principais decisoes tomadas durante a criacao de **A Fuga de Bobby v7 - Covil do Socram**.

O objetivo nao e pedir que a proxima IA continue ou copie este jogo. O objetivo e preservar o aprendizado conquistado durante horas de criacao, testes, correcoes e depuracao, para que um novo projeto possa comecar com uma base de qualidade ainda melhor.

Esta versao foi criada como uma experiencia de portfolio jogavel. Portanto, alem de funcionar como jogo, ela precisa demonstrar cuidado com programacao, narrativa visual, pixel art, animacao, controles, desempenho, acessibilidade mobile e acabamento.

Se alguem encontrar algum bug, pode avisar:

- Pelo repositorio no Git, abrindo uma issue com a descricao do problema.
- Pelo LinkedIn de Marcos Eduardo: <https://www.linkedin.com/in/sir-marcos-eduardo/>

Ao relatar um bug, se possivel informe o dispositivo, navegador, orientacao da tela, etapa do jogo e como reproduzir o problema.

---

## 1. Identidade da versao 7

**A Fuga de Bobby v7** representa uma etapa intermediaria da evolucao visual e tecnica do projeto.

A proposta artistica desta versao e lembrar jogos de plataforma e acao dos anos 1990:

- Pixel art legivel e colorida.
- Sprites construidos manualmente em matrizes de caracteres.
- Animacao quadro a quadro.
- Efeitos de luz, fogo, fumaca, particulas, impacto e tremor de camera.
- Fases que contam uma historia por meio do proprio cenario.
- Chefao com padroes de ataque, pontos fracos e sequencia de morte.
- Interface com aparencia de terminal, arcade e monitor CRT.
- Trilha sonora e efeitos sintetizados com Web Audio.

O projeto anterior representava uma estetica mais proxima dos jogos de 1984. A versao 7 avanca para uma linguagem de anos 1990. A proxima evolucao imaginada pode se aproximar de jogos como Metal Slug, com desenhos em resolucao maior, escala visual menor, mais quadros de animacao, silhuetas detalhadas e cenarios ainda mais vivos.

---

## 2. Principio central de qualidade

Nenhum elemento deve existir apenas para marcar uma tarefa como concluida.

Se houver uma bomba, ela precisa parecer poderosa. Se houver uma explosao, ela precisa ter peso. Se um personagem morrer, a cena precisa comunicar impacto. Se existir uma parede, o tiro precisa colidir com ela. Se houver um buraco, ele precisa continuar visualmente aberto durante o dia. Se uma plataforma cair, o jogador precisa receber sinais visuais antes disso.

Cada acao deve ter:

- Causa clara.
- Resposta visual.
- Resposta sonora.
- Consequencia no gameplay.
- Colisao coerente.
- Animacao correspondente.
- Fallback visual quando algo falhar ou estiver prestes a acontecer.

O acabamento nao e uma camada opcional. Ele faz parte da mecanica.

---

## 3. Estrutura tecnica atual

Os principais arquivos da implementacao sao:

- `src/App.tsx`: interface React, layouts desktop e mobile, controles, placar e modais.
- `src/game/engine.ts`: loop principal, fisica, colisoes, inimigos, chefao, bombas, pontuacao e cutscene final.
- `src/game/story.ts`: cutscene narrativa da guerra contra Socram, executada no proprio mapa.
- `src/game/sprites.ts`: matrizes de pixel art, paletas e quadros de animacao.
- `src/game/audio.ts`: efeitos sonoros sintetizados, limite de vozes e protecao contra excesso de audio.
- `src/index.css`: acabamento visual, CRT, molduras, placar e layouts separados para desktop e mobile.

O jogo usa:

- React.
- TypeScript.
- Vite.
- Tailwind CSS v4.
- Canvas 2D.
- Web Audio API.
- Local Storage para recordes e preferencias.

---

## 4. Desktop e celular sao experiencias separadas

Uma das principais exigencias da versao 7 foi nao tratar desktop e celular como o mesmo layout apenas redimensionado.

### Desktop

O desktop preserva o acabamento completo:

- Canvas em proporcao 16:9.
- Resolucao interna de 800 x 450.
- Cabecalho com o nome do jogo.
- Moldura dourada.
- Brilho externo.
- Efeito CRT e scanlines.
- Instrucoes de teclado.
- Informacoes de portfolio.
- Modal de vitoria e derrota organizado dentro da tela do jogo.

Controles:

- Setas esquerda e direita ou A/D: mover.
- Seta para cima ou W: pular.
- Seta para baixo ou S: agachar.
- Espaco: atirar.
- B: usar bomba.
- P: pausar.
- M: ativar ou desativar o som.

O espaco nao deve fazer o Bobby pular durante o gameplay. Ele serve para atirar.

### Celular

A versao 7 possui suporte funcional para celular.

O mobile utiliza:

- Tela do jogo quadrada, em proporcao 1:1.
- Resolucao interna de 450 x 450.
- Textos maiores e mais legiveis.
- Dois joysticks analogicos.
- Controles fora da area util do jogo sempre que o espaco permitir.
- Botao dedicado para bomba.
- Interface adaptada para orientacao retrato e paisagem.

Joystick esquerdo:

- Movimento horizontal proporcional.
- Movimento para cima aciona o pulo.
- Movimento para baixo aciona o agachamento.

Joystick direito:

- Encostar ja inicia o disparo.
- Arrastar altera a direcao da mira.
- Permite tiro em direcoes diferentes.
- Ao soltar, o disparo para.

Regra importante: alterar o mobile nao deve remover, simplificar ou substituir o acabamento do desktop. Existem dois modos visuais e os dois precisam continuar funcionando.

---

## 5. Movimento e animacao do Bobby

Bobby possui estados visuais diferentes para:

- Parado.
- Correndo.
- Pulando.
- Agachado.
- Atirando parado.
- Atirando em movimento.
- Ferido.
- Com uma vida.
- Protegido por escudo.
- Com supermunicao.
- Durante cutscenes.
- Dentro do foguete de resgate.

Uma regra importante da versao 7 e que Bobby nao pode congelar as pernas ao atirar enquanto anda.

Ao caminhar e atirar ao mesmo tempo:

- As pernas continuam alternando os quadros de corrida.
- A arma permanece visivel.
- O disparo continua funcionando.
- O clarão do cano aparece no momento do tiro.

O agachamento e uma tatica de batalha e nao deve ser proibido durante o combate normal. Ele serve para:

- Reduzir a altura da hitbox.
- Desviar de projeteis.
- Atirar de uma posicao mais baixa.
- Resolver o misterio do tunel da masmorra.

Quando Bobby possui apenas uma vida, ele volta a soltar fumaca. Esse detalhe comunica dano sem depender apenas do HUD.

---

## 6. Fisica e colisoes

A colisao precisa ser tratada como uma parte essencial do design.

O projeto inclui:

- Colisao de plataformas em uma direcao.
- Gravidade e velocidade vertical.
- Coyote time.
- Jump buffer.
- Hitbox diferente ao agachar.
- Colisao com inimigos.
- Dano por projeteis.
- Stomp em inimigos comuns.
- Stomp no chefao.
- Colisao de tiros com paredes, plataformas e rocha.
- Alcance maximo para projeteis.
- Colisao da bomba com solo, inimigos e chefao.
- Checkpoint para queda no abismo.
- Pouso seguro durante a sequencia de vitoria.

Regra de ouro: o jogador nunca deve ser empurrado ou cuspido para fora do tunel por uma resolucao ruim de colisao.

A colisao do tunel resolve pelo menor eixo. A entrada possui uma boca mais alta, permitindo entrar em pe, e depois um teto mais baixo, exigindo que Bobby siga agachado.

Ao atravessar completamente o tunel, ele desmorona atras do jogador. O desmoronamento deve ocorrer sem empurrar Bobby e sem permitir retorno.

---

## 7. Abismos e plataformas

Os buracos do mapa devem permanecer visualmente abertos em todas as condicoes do ceu.

Quando o cenario amanhece:

- O buraco nao pode ficar cinza.
- O buraco nao pode parecer lacrado.
- O fundo deve continuar escuro.
- As paredes laterais do poco devem continuar visiveis.
- A profundidade precisa continuar legivel.

As estrelas do ceu sao deterministicas. Elas podem cintilar suavemente com seno, mas nao podem usar `Math.random()` para mudar de tamanho a cada quadro, pois isso causa tremor e piscadas.

Uma das plataformas proximas ao final do abismo possui uma mecanica de queda:

1. Bobby pisa.
2. A plataforma comeca a tremer.
3. Aparecem alertas visuais.
4. Surgem rachaduras.
5. A plataforma cai.
6. Se Bobby ainda estiver em cima, ele cai junto.
7. Depois de um tempo, a plataforma renasce no lugar.

Essa mecanica nasceu como fallback visual para uma antiga falha de contato fisico. Em vez de uma queda parecer um bug, ela passou a ser uma armadilha anunciada.

---

## 8. Tiros e alcance

Os tiros nao podem atravessar a fase inteira.

Alcances atuais:

- Tiro comum: aproximadamente 300 pixels.
- Bazuca ou supertiro: aproximadamente 460 pixels.
- Tiros inimigos: aproximadamente 330 pixels.

Quando um tiro atinge uma parede:

- Ele para imediatamente.
- Solta uma faisca.
- Gera pequenas particulas.
- Deixa uma marca temporaria de impacto.
- A marca desaparece gradualmente.

Quando o alcance termina sem colisao:

- O projetil se dissipa no ar.
- Ele nao continua viajando fora da camera.
- Ele nao pode atingir o chefao a partir do inicio da fase.

Essa regra impede que o jogador fique parado e acumule pontos atirando de uma area segura.

---

## 9. Bombas e foguetinhos vermelhos

O foguetinho vermelho nao e o foguete de resgate do final.

Sao dois elementos diferentes:

- Foguetinho vermelho: item pequeno, semelhante a um rojao, usado para fabricar bombas.
- Foguete de resgate: nave grande que busca Bobby na cutscene final.

Economia da bomba:

- Cada foguetinho vermelho coletado conta como metade de uma bomba.
- A cada dois foguetinhos, Bobby recebe uma bomba.
- No desktop, a bomba usa a tecla B.
- No celular, existe um botao dedicado.

A explosao da bomba nao pode ser apenas uma bolinha ou um efeito simbolico. Ela inclui:

- Clarao na tela.
- Tremor de camera.
- Bola de fogo em varias camadas.
- Forma irregular para evitar aparencia geometrica simples.
- Anel de choque.
- Estilhacos quentes.
- Particulas.
- Fumaca.
- Som grave.
- Dano em area.
- Marca queimada no chao.
- Chamas residuais temporarias.

O fogo residual pode eliminar inimigos que entrarem na area queimada.

Balanceamento contra o chefao:

- Tres bombas derrotam Socram.
- Cada bomba causa 10 pontos de dano.
- Socram possui 30 pontos de vida.

---

## 10. Inimigos, moedas e risco

O jogo nao deve entregar bonus demais.

Diretrizes de balanceamento:

- Poucas moedas ficam soltas no cenario.
- As moedas fixas devem incentivar pulos ou exploracao.
- A maior parte das moedas vem dos inimigos derrotados.
- A moeda nao entra automaticamente no inventario ao matar o inimigo.
- Ela salta, gira, quica no chao e precisa ser coletada.
- Existe um magnetismo leve apenas quando Bobby se aproxima.

A cada 10 moedas coletadas:

- Bobby recupera um ponto de vida.

Os coracoes devem ser raros:

- Cada coracao recupera um ponto de vida.
- O mapa possui poucos coracoes.
- Se Bobby ja estiver com a vida cheia, o item pode virar pontuacao.

Quando Socram explode o portao:

- Os inimigos restantes entram em fuga.
- Eles correm para longe.
- Soltam fumaca.
- Param de reaparecer.
- A fuga reforca que o chefao caiu e a batalha terminou.

---

## 11. A montanha, a rampa e a entrada da masmorra

A montanha nao e um fundo decorativo. Ela e a entrada fisica do covil de Socram.

Elementos importantes:

- Montanha alta.
- Estrutura de mina e masmorra.
- Roda do moinho no alto.
- Correntes longas e animadas.
- Parede de rocha inicialmente bloqueando a entrada.
- Tunel aberto pela explosao da cutscene.
- Boca inicial alta, permitindo entrada em pe.
- Trecho interno baixo, obrigando o jogador a agachar.

Depois do nome MARCOS existe uma rampa.

Quando Bobby passa pela rampa:

- A passagem desaba atras dele.
- O caminho de volta fica bloqueado.
- O jogador entende que agora precisa continuar em direcao ao covil.

Mais adiante, quando Bobby atravessa o tunel:

- O tunel desmorona atras dele.
- O desmoronamento possui explosao, fumaca, entulho e tremor.
- Bobby nao e empurrado.
- Nao existe retorno.

---

## 12. Cutscene da guerra

A cutscene nao utiliza um novo cenario.

Ela acontece no proprio mapa. A camera se movimenta ate a masmorra, mostra a acao e depois volta para Bobby.

O gatilho funciona por posicao horizontal. Assim, a cena comeca mesmo que Bobby:

- Pise no nome e continue andando.
- Pise no nome e pule.
- Atravesse a area pelo alto.

Depois de cruzar o nome, existe um pequeno atraso de aproximadamente um segundo antes do inicio da apresentacao.

Sequencia narrativa:

1. Um alarme toca.
2. Uma copia laranja de Bobby chega correndo.
3. Ela acena e diz: "Bobby, o caminho e por aqui!".
4. Um robo quebrado chega andando e soltando fumaca.
5. O laranja se vira e pergunta: "O que houve?!".
6. O quebrado responde: "Socram esta nos matando!".
7. O quebrado explode.
8. Sua cabeca apagada, com X nos olhos e antena torta, permanece no mapa.
9. A camera viaja ate a masmorra.
10. Quatro prisioneiros usam o mesmo conjunto de animacoes de Bobby, com cores diferentes.
11. Eles movimentam as pernas e jogam pedras em Socram.
12. As pedras giram, viajam e causam impacto visivel.
13. Socram se move e dispara os proprios projeteis do jogo.
14. Ele mata os tres robos mais proximos.
15. Cada morte usa uma explosao rapida, inspirada na explosao de Bobby.
16. Os corpos permanecem no chao, com oleo e fumaca.
17. O ultimo robo ve os corpos e foge com medo.
18. Ele tenta alcancar a passagem da masmorra.
19. Socram ri.
20. Socram mata o ultimo robo e a explosao abre o buraco na rocha.
21. O robo laranja segue sozinho para o tunel.
22. Ele entra em pe.
23. Dentro da escuridao, aparecem os olhos de Socram.
24. O laranja e morto no interior do tunel.
25. A cena ensina que Bobby precisa entrar e seguir agachado.
26. A camera retorna.
27. Socram percebe mais um robo, mas desta vez Bobby esta armado.

Nao deve existir um fundo artificial cobrindo o covil durante essa cena. Os personagens atuam sobre o cenario real do mapa.

Para evitar que o jogador pule a cutscene sem querer:

- E necessario apertar Espaco ou tocar oito vezes.
- A interface mostra quantos toques faltam.
- Uma barra indica o progresso.
- O contador expira se o jogador parar por tempo suficiente.

---

## 13. Socram, o chefao

Socram precisa ser dificil, mas justo.

Caracteristicas:

- Voa dentro do covil.
- Possui varios padroes de ataque.
- Oscila em uma altura alcancavel.
- Dispara projeteis direcionais e em leque.
- Pode perseguir Bobby.
- Fica mais agressivo com pouca vida.
- Pode ser atingido por tiros, bazuca, bombas e pulos na cabeca.
- Possui visor e propulsores destacados visualmente como pontos de interesse.

Vida e dano:

- Vida total: 30.
- Oito tiros comuns causam a derrota.
- Tres disparos de bazuca causam a derrota.
- Tres bombas causam a derrota.
- Dez pulos na cabeca causam a derrota.

Quando o propulsor e atingido, Socram pode cair e abrir uma janela de ataque. Isso cria uma leitura tatica sem tornar o combate impossivel.

Sequencia de morte:

1. Socram perde o controle.
2. Comeca a pegar fogo.
3. Cai com gravidade.
4. Bate no solo.
5. Continua queimando.
6. Move-se fisicamente em direcao ao portao.
7. Colide com o portao.
8. Uma explosao forte destrói a passagem.
9. Os inimigos restantes fogem.
10. A chave dourada aparece.

Durante a sequencia de morte:

- As balas de Bobby nao congelam.
- A camera continua acompanhando a acao.
- O timer do jogo para.
- Cair no abismo nao quebra a vitoria.

---

## 14. Chave e cutscene final

Depois que Socram explode o portao:

- Bobby precisa coletar a chave dourada.
- A chave flutua e possui brilho.
- Um contador invisivel de 10 segundos comeca.
- Se Bobby nao coletar a chave, ela voa ate a posicao atual dele.
- A chave deixa particulas durante o voo.

Depois da coleta:

- Bobby segue para a base.
- A camera acompanha toda a caminhada.
- A antena envia o sinal.
- O foguete de resgate desce.
- Bobby entra na nave.
- Bobby aparece pela janela.
- O foguete decola com fogo, fumaca e tremor.
- A camera continua filmando ate a conclusao.

O foguete de resgate nao deve ser confundido com o foguetinho vermelho usado para fabricar bombas.

---

## 15. Vitoria, derrota e placar

A tela de derrota utiliza um modal organizado. A tela de vitoria deve seguir o mesmo principio:

- Fundo escurecido.
- Painel central.
- Moldura clara.
- Titulo.
- Mensagem curta.
- Pontuacao.
- Trofeu, quando aplicavel.
- Instrucao para jogar novamente.

O placar nao aparece imediatamente.

Fluxo final:

1. O jogador vence ou perde.
2. A mensagem final aparece.
3. O jogador recebe aproximadamente oito segundos para ler.
4. Depois disso, o placar entra dentro da propria tela do jogo.
5. O placar aparece pelo lado direito.
6. O jogador pode jogar novamente.
7. O botao "Conhecer o Marcos" continua sempre disponivel.

O botao do LinkedIn nunca deve ser desligado ou escondido permanentemente pelo placar.

Registro de nome:

- O nome so pode ser registrado depois de uma vitoria.
- E necessario fazer mais de 1200 pontos.
- O nome aceita ate 12 caracteres.
- O jogo nao pode capturar as teclas enquanto o foco estiver no campo de texto.
- O placar e salvo em Local Storage.
- Os dez melhores resultados permanecem registrados.

O listener global de teclado deve ignorar:

- `input`.
- `textarea`.
- Elementos com `contenteditable`.

Sem essa regra, teclas como A, S, M e Espaco impedem a digitacao do nome.

---

## 16. Trofeu de partida perfeita

Se o jogador concluir o jogo sem sofrer nenhum dano:

- Recebe um trofeu.
- Recebe 1000 pontos extras.
- A conquista aparece no modal de vitoria.
- O placar registra o trofeu junto ao nome.

Perdem a condicao de partida perfeita:

- Dano de inimigo.
- Dano de projetil.
- Colisao com o chefao.
- Queda no abismo.

A verificacao deve cobrir todas as formas de perda de vida, nao apenas `takeDamage()`.

---

## 17. Desempenho e estabilidade

Durante o desenvolvimento, varias fontes de travamento e lentidao foram encontradas.

Solucoes adotadas:

- Limite de 10 vozes simultaneas no sistema de audio.
- Throttle de aproximadamente 35 ms para sons repetidos.
- Audio Context iniciado apenas depois de uma acao do usuario.
- Cache de gradientes.
- Cache de glows.
- Cache de sprites renderizados.
- Pre-renderizacao de plataformas e partes estaticas do cenario.
- Limite para quantidade de particulas.
- Limite para quantidade de fumaca.
- Loop de atualizacao com passo fixo.
- Limite de atualizacoes acumuladas por frame.
- Estrelas deterministicas.
- Evitar redesenhar overlays React a cada quadro do canvas.
- Joystick React atualizado apenas quando o dedo muda de posicao.

Cuidados importantes:

- Nunca duplicar a declaracao de `gameLoop` ou do loop principal.
- Sempre definir `canvas.width` e `canvas.height` no buffer interno.
- Nao depender apenas do tamanho CSS do canvas.
- Desktop deve permanecer em 800 x 450.
- Mobile deve permanecer em 450 x 450.
- O contexto deve permanecer com suavizacao de imagem desativada.
- Toda alteracao de tamanho precisa limpar caches dependentes do canvas.

---

## 18. Bugs importantes que foram transformados em aprendizado

### Canvas com zoom e Bobby invisivel

O canvas chegou a herdar o tamanho padrao 300 x 150. O jogo desenhava em coordenadas 800 x 450, fazendo o CSS esticar apenas uma parte da imagem. Bobby, posicionado abaixo de 150 pixels, desaparecia.

Regra: sempre reaplicar o tamanho real do buffer, mesmo quando a largura logica aparentemente nao mudou.

### Tiro atravessando o mapa

Os projeteis nao tinham alcance maximo e algumas paredes nao participavam da colisao.

Regra: projeteis precisam de distancia restante, colisao com toda geometria solida e resposta visual de impacto.

### Abismo mudando de cor

O gradiente transparente deixava o ceu claro aparecer quando amanhecia.

Regra: o interior do poco precisa ter uma base preta opaca antes dos gradientes de profundidade.

### Cutscene parecendo outro cenario

Um fundo artificial chegou a cobrir o covil real durante a guerra.

Regra: se a historia acontece logo a frente, mova a camera pelo mapa. Nao troque o cenario sem necessidade.

### Personagem andando e atirando com pernas paradas

O frame de tiro tinha prioridade sobre o frame de movimento.

Regra: movimento deve continuar animando as pernas; arma e clarão devem ser camadas ou estados compativeis.

### Campo de nome sem aceitar texto

O listener global de teclado capturava as mesmas teclas usadas para digitar.

Regra: controles do jogo devem respeitar o foco dos elementos de formulario.

### Cutscene pulada sem querer

Um unico toque em Espaco encerrava uma longa sequencia narrativa.

Regra: acoes destrutivas ou irreversiveis precisam de confirmacao, contador ou gesto deliberado.

---

## 19. Checklist de qualidade para a proxima IA

Antes de considerar um novo jogo pronto, conferir:

- O personagem aparece no desktop e no celular?
- O buffer interno do canvas corresponde ao layout?
- Desktop e mobile mantem experiencias independentes?
- Os controles mobile aparecem em dispositivos reais e no preview estreito?
- O joystick começa a responder ao toque?
- O tiro para quando o joystick e solto?
- O personagem anima as pernas enquanto atira em movimento?
- O personagem consegue agachar durante o combate?
- Todas as paredes solidas bloqueiam o jogador?
- Todas as paredes solidas bloqueiam os tiros?
- Os projeteis possuem alcance maximo?
- Existe resposta visual quando um tiro bate?
- Os buracos continuam escuros durante o dia?
- As plataformas moveis ou frageis possuem aviso visual?
- O jogador recebe feedback antes de uma armadilha?
- As explosoes possuem luz, som, impacto, particulas e consequencia?
- Os corpos permanecem quando a narrativa exige?
- A camera acompanha toda a cutscene?
- A cutscene ocorre no mesmo cenario quando a acao esta logo a frente?
- O timer para durante a vitoria?
- Cair durante a vitoria nao quebra o final?
- A tela de vitoria esta organizada em modal?
- A tela de derrota esta organizada em modal?
- O placar espera oito segundos antes de aparecer?
- O campo de nome aceita digitacao normal?
- O LinkedIn continua acessivel no final?
- O placar persiste depois de recarregar a pagina?
- A conquista sem dano considera todas as fontes de dano?
- O audio possui limite de vozes?
- O numero de particulas possui limite?
- O projeto compila sem erros?

---

## 20. Contrato para a proxima IA

A proxima IA nao deve copiar este jogo quadro por quadro nem simplesmente adicionar uma fase.

Ela deve criar um novo projeto que aproveite os principios aprendidos:

1. Entender primeiro a geografia do mapa.
2. Nao inventar um novo cenario se a acao ocorre logo a frente.
3. Preservar tudo que ja foi aprovado.
4. Alterar somente o que foi pedido.
5. Nunca remover acabamento do desktop ao adaptar o mobile.
6. Nunca facilitar ou dificultar o jogo sem uma meta numerica clara.
7. Transformar falhas tecnicas em feedback visual quando isso fizer sentido.
8. Usar animacao para explicar estados.
9. Fazer efeitos com peso, nao efeitos simbolicos.
10. Testar colisao, camera, audio, controles e persistencia separadamente.
11. Ler o codigo existente antes de substituir arquivos inteiros.
12. Preferir correcoes cirurgicas quando o projeto ja estiver funcionando.
13. Manter uma lista numerada de requisitos e validar um por um.
14. Nao declarar uma etapa concluida antes do build.
15. Respeitar o autor, a direcao criativa e a historia do projeto.

O maior aprendizado da versao 7 foi que qualidade nasce de iteracao, mas iterar nao significa apagar o que ja estava bom. Significa observar, preservar, corrigir e evoluir.

---

## 21. Encerramento

Foram horas depurando falhas, revendo colisoes, reconstruindo cenas, ajustando controles, equilibrando o chefao e transformando erros em mecanicas.

Como projeto de portfolio, **A Fuga de Bobby v7** nao tenta apenas mostrar um jogo pronto. Ele mostra o processo de insistir em cada detalhe ate que movimento, combate, narrativa, camera, som, mobile e acabamento consigam trabalhar juntos.

Se voce encontrou um bug, uma ideia de melhoria ou quer conversar sobre o projeto:

- Abra uma issue no Git.
- Entre em contato pelo LinkedIn: <https://www.linkedin.com/in/sir-marcos-eduardo/>

Este documento fica como memoria da versao 7 e como incentivo para a proxima IA construir algo novo, mais detalhado e ainda mais ambicioso.

**Marcos Eduardo + Bobby IA**

**A Fuga de Bobby v7 - Covil do Socram**