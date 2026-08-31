# 🚀 GUIA DE COMMIT — A FUGA DE BOBBY

> Objetivo: colocar o jogo num **branch novo** do repo `MarcozEduardo/Testando`
> e salvar tudo no GitHub.

---

## ⚠️ ANTES DE TUDO — publique deste chat

As mudanças mais recentes (fumacinha do Bobby, boss, câmera da cutscene, etc.)
estão no workspace DESTE chat. Antes de commitar no outro lado:

1. Clique em **PUBLICAR** no chat onde o jogo está rodando (este).
2. Confirme no navegador que o repo mostra: `index.html`, `package.json`,
   `vite.config.js`, `src/`, `README.md`.

Só depois siga abaixo.

---

## 🖥️ Opção A — No seu terminal (PC)

```bash
# 1. clone o repo (se ainda não tem)
git clone https://github.com/MarcozEduardo/Testando
cd Testando

# 2. crie o branch novo
git checkout -b fuga-de-bobby

# 3. adicione tudo e commite
git add .
git commit -m "feat: A Fuga de Bobby - platformer completo com boss, cutscenes e mobile 1:1"

# 4. suba o branch pro GitHub
git push -u origin fuga-de-bobby
```

Depois, no GitHub, o branch `fuga-de-bobby` aparece e você pode
fazer um **Pull Request** pra juntar na `main` (ou deixar separado, seu call).

---

## 🤖 Opção B — No outro chat (Qwen com terminal)

Cole exatamente isto:

```
O repositório GitHub conectado a este workspace tem um jogo pronto em
React + Vite + Tailwind. Faça exatamente isto, nessa ordem, sem desviar:

git checkout -b fuga-de-bobby
git add .
git commit -m "feat: A Fuga de Bobby - platformer completo com boss, cutscenes e mobile 1:1"
git push -u origin fuga-de-bobby

REGRAS:
- NÃO crie nenhum arquivo novo. NÃO mude nada no código.
- Se `git add` não mostrar arquivos novos, responda só:
  "NADA PRA COMMITAR - já está salvo" e pare.
```

---

## 📝 Mensagem de commit sugerida (copie se quiser mais detalhe)

```
feat: A Fuga de Bobby — platformer completo

- 47 módulos: state, cenario, personagens, entidades, lugares, telas, controles
- Boss mecha com 3 padrões, stun por bomba e stomp na cabeça
- Cutscenes: conquista do MARCOS, mina, morte do boss no portão, foguete
- Música dinâmica em 3 zonas (Aventura/Esperança/Batalha)
- Mobile 1:1 com joystick flutuante + botões de tiro/bomba
- Performance: pré-render do chão, teto de vozes de áudio, overlay com dirty-check
```
