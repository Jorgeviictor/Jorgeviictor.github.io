# TEVOX Landing Page — Design Spec

Data: 2026-08-14
Status: Aprovado pelo usuário para implementação

## Contexto

A TEVOX é uma empresa de tecnologia focada em modelo Venture Builder (Fábrica de
Startups) e infraestrutura B2B. Já existe um site estático (HTML/CSS puro) publicado
em `Jorgeviictor.github.io` / domínio `tevox.co` (via `CNAME`), com hero simples,
nav, CTA de WhatsApp e seção "4 pilares". O usuário decidiu **substituir esse site
por completo** por uma nova landing page com identidade visual e mecânica de
animação muito mais avançadas (3D + scroll storytelling), mantendo o mesmo
repositório/remote para preservar o domínio.

## Objetivo

Construir uma landing page institucional de alto impacto visual, com:
- Clima corporativo, tecnológico, "misterioso" — dark mode, azul marinho profundo +
  cinza/grafite industrial, com glow em ciano/verde-elétrico.
- Um elemento 3D abstrato (malha de nós/conexões) rodando em WebGL de fundo,
  reagindo a mouse e velocidade de scroll.
- Um wordmark "TEVOX" que começa centralizado no topo e, ao rolar, se desprende e
  se move lateralmente acompanhando as seções (GSAP ScrollTrigger).
- 4 seções de conteúdo (Hero, Ecossistema, Radar Carioca & Pipeline, Governança e
  Segurança).

## Stack

- **Build**: Vite + React (JavaScript, sem TypeScript — projeto pequeno o
  suficiente para não justificar o overhead de tipos).
- **Estilo**: Tailwind CSS.
- **3D**: Three.js via `@react-three/fiber` + `@react-three/drei` (integração
  declarativa com React, evita gerenciamento manual de cena/render loop).
- **Animação de scroll**: GSAP + plugin `ScrollTrigger`.
- **Deploy**: GitHub Actions, build automático a cada push em `main`, publicado no
  GitHub Pages, preservando o `CNAME` (tevox.co).

## Estrutura de pastas

```
Jorgeviictor.github.io/
  src/
    components/
      Background3D/
        Background3D.jsx      # Canvas R3F, malha de nós/linhas
        NetworkMesh.jsx       # geometria + shader/material dos nós
        useMouseParallax.js   # hook: posição do mouse -> alvo de câmera
        useScrollVelocity.js  # hook: velocidade de scroll -> velocidade de deriva
      Logo/
        Logo.jsx              # wordmark + registro nos ScrollTriggers
      sections/
        Hero.jsx
        Ecossistema.jsx
        RadarPipeline.jsx
        Governanca.jsx
    App.jsx
    main.jsx
    index.css                 # Tailwind + tokens de cor/tipografia
  public/
    CNAME
    favicon.svg (reaproveitado do site atual)
  .github/workflows/deploy.yml
  docs/superpowers/specs/     # este arquivo
```

## Componentes principais

### Background3D
- Montado uma única vez em `App.jsx`, `position: fixed`, inset-0, atrás de todo o
  conteúdo (`z-index` baixo), canvas com fundo transparente para deixar o dark navy
  do body por trás.
- Malha de ~80-120 nós conectados por linhas finas (Points + LineSegments),
  cor ciano/verde-elétrico com leve emissive.
- **Reação ao mouse**: parallax suave da câmera (lerp), proporcional à posição do
  cursor normalizada — nunca movimento brusco.
- **Reação ao scroll**: a *velocidade* de scroll (não a posição) alimenta a
  velocidade de rotação/deriva orgânica dos nós, via hook `useScrollVelocity`
  que decai o valor a cada frame (para não deixar o efeito "travado" quando o
  usuário para de rolar).
- Cuidado de performance: DPR limitado (`Math.min(devicePixelRatio, 2)`),
  geometria instanciada, sem post-processing pesado (bloom é opcional/leve,
  cortado primeiro se performance for um problema em mobile).

### Logo (ScrollTrigger)
- Wordmark centralizado no topo no load.
- Ao rolar: timeline GSAP scrubada (`scrub: true`) que anima `x`/`scale` da logo,
  alternando de lado conforme a seção ativa. Cada seção registra seu próprio
  `ScrollTrigger` (start/end baseados na própria seção) que atualiza o alvo de
  posição da logo — a logo em si é um componente único fora do fluxo de scroll
  normal (`position: fixed`), sincronizado via GSAP.

### Sections
Cada seção é um componente próprio, fundo transparente (para o 3D aparecer atrás),
com o conteúdo já definido no prompt original do usuário:
1. **Hero**: slogan "Tecnologia que Conecta. Soluções que Escalam."
2. **Ecossistema**: modelo Venture Builder, infraestrutura centralizada como
   fundação para produtos ágeis.
3. **Radar Carioca & Pipeline**: showcase do ecossistema, apps de alta performance
   focados em segurança e automação.
4. **Governança e Segurança**: infraestrutura em nuvem, criptografia,
   escalabilidade.

## Identidade visual

- Fundo: dark navy profundo (`#0a0e17`) / grafite (`#1a1f2b`) industrial.
- Acentos/glow: ciano (`#00e5ff`) e verde-elétrico (`#39ff88`).
- Tipografia: títulos em peso pesado (Montserrat/Inter/Satoshi, 700-800),
  parágrafos em peso regular, com foco em legibilidade sobre o fundo escuro.

## Deploy

Workflow do GitHub Actions builda o projeto Vite e publica o `dist/` no GitHub
Pages a cada push em `main`, preservando o `CNAME` (copiado para `public/` para
ser incluído no build).

## Fora de escopo (YAGNI)

- CMS ou painel de conteúdo dinâmico.
- Formulário de contato com backend (fica como link/CTA simples, ex. WhatsApp,
  reaproveitando o padrão do site atual, se fizer sentido).
- Internacionalização (site fica em pt-BR).
- Testes automatizados de regressão visual (fora do escopo desta primeira versão).

## Documentação complementar

Notas de projeto e decisões também documentadas no cofre Obsidian
`Site TEVOX/Tevox` (pasta `TEVOX/`).
