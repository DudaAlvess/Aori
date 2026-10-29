# Aori

## Estado do projeto

Primeira prévia local da Aori, feita em HTML, CSS e JavaScript, sem dependências
de execução adicionais ao Node.js. Inclui apresentação da marca, catálogo
demonstrativo de hospedagens em Santa Catarina, busca, filtros, favoritos,
detalhes de cada lugar, menu mobile e perguntas frequentes.

O desenvolvimento está em `C:\a3\code`. Esta versão foi aprovada pelo usuário
para envio ao GitHub. A aplicação continua sendo uma prévia local, com catálogo
fictício e simulação de datas, sem reservas ou pagamentos reais.

O [planejamento acadêmico original](docs/planejamento-academico.md), que já
estava no repositório remoto, foi preservado integralmente como referência.
Ele descreve o escopo acadêmico planejado; a implementação atual corresponde
à prévia de interface e interações documentada abaixo.

## Abrir a prévia local

Requisito: Node.js 20 ou superior. No PowerShell:

```powershell
Set-Location -LiteralPath 'C:\a3\code'
node scripts/serve.mjs
```

Abra [http://localhost:4173](http://localhost:4173). O servidor atende apenas
no computador local. Encerre com `Ctrl+C` no terminal que iniciou a prévia.
Se o npm estiver disponível, `npm run dev` executa o mesmo servidor.
Não é necessário instalar pacotes nem executar build.

## Organização

- `C:\a3\code\public`: HTML, CSS, JavaScript, manifest e assets do site.
- `C:\a3\code\scripts\serve.mjs`: servidor estático da prévia local.
- `public/stays.js`: catálogo demonstrativo compartilhado pela página inicial
  e pela página completa de cada estadia.
- `public/estadia.html`, `public/estadia.css` e `public/estadia.js`: página
  completa, aberta em nova aba pelo link “Ver disponibilidade”.
- `C:\a3\code\README.md` e `AGENTS.md`: documentação e orientações do projeto.
- As pastas e arquivos preexistentes de `C:\a3`, fora de `code`, permanecem
  como materiais originais de design e referências. Nenhum foi movido ou alterado.
- Os assets incorporados foram copiados para dentro de `public/assets` e são
  referenciados por URLs internas. Nenhum endereço de imagem do navegador usa
  o caminho de origem do Windows.

## Materiais existentes e referência aprovada

Origem local: `C:\a3`. Foram identificados 38 arquivos nas pastas `public`,
`styles`, `examples`, `reference` e `metadata`, além dos arquivos da raiz.
Os hashes SHA-256 dos 37 arquivos relacionados em `metadata/assets.json`
conferem com os arquivos disponíveis. Os originais foram preservados.

Os caminhos da tabela abaixo são relativos à pasta de origem e descrevem os
materiais encontrados na inspeção. A seção de incorporação registra quais
foram copiados e usados na prévia.

| Material | Arquivo de origem | Finalidade |
| --- | --- | --- |
| Logo principal transparente | `public/brand/logo/aori-logo-original.svg` | Marca completa, nome e símbolo à direita; 817 × 256 |
| Logo com base creme | `public/brand/logo/aori-logo-base-creme.svg` | Aplicação sobre fundo escuro ou fotografia; 889 × 304 |
| Símbolo transparente | `public/brand/symbol/aori-symbol-original.svg` | Símbolo isolado aprovado; 227 × 212 |
| PNG e WebP da marca | Mesmos nomes das logos e do símbolo, com extensões `.png` e `.webp` | Alternativas da mesma arte; há também PNGs reduzidos |
| Favicons | `public/favicon.svg`, `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon-48x48.png`, `public/favicon-64x64.png`, `public/favicon-96x96.png` | Identidade do navegador |
| Ícone Apple | `public/apple-touch-icon.png` | Ícone de 180 × 180 |
| Ícones de aplicativo | `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-192.png`, `public/icon-maskable-512.png` | Aplicativo e recorte seguro |
| Manifest | `public/site.webmanifest` | Referência a adaptar à rota real da aplicação |
| Tokens e tipografia | `styles/aori-brand.css` | Paleta, famílias tipográficas e escala |
| Exemplos de integração | `examples/AoriLogo.tsx`, `examples/head-and-logo.html` | Referência técnica para implementação |
| Prancha aprovada | `reference/aori-approved-board.png` | Referência visual e de identidade |
| Recorte sem tratamento | `reference/aori-approved-logo-crop.png` | Rastreabilidade da extração da marca |
| Prévia técnica | `preview.html`, `preview.png` | Demonstração dos materiais; não é uma interface comercial aprovada |
| Documentação de origem | `README.md`, `metadata/assets.json`, `metadata/quality-check.json` | Aprovação, dimensões, hashes e verificações anteriores do pacote |

O README de origem identifica a logo principal como a arte aprovada, sem
recriação ou substituição pelos símbolos de estudos posteriores. Não foram
encontrados arquivos separados desses estudos. As aplicações e a composição
monocromática na prancha não substituem a logo principal entregue.

Os SVGs são autossuficientes e contêm PNG incorporado. Preservam a arte, mas
não são vetores editáveis em curvas nem oferecem resolução infinita.

## Regras para implementação

- Preferir o SVG aprovado e manter a logo completa: cores, textura, proporções,
  transparência, espaçamento e símbolo à direita.
- Não redesenhar, digitar a marca com fonte, recortar, recolorir, aplicar filtros
  ou substituir o símbolo. O slogan deve permanecer como texto separado.
- Usar a variante com base creme quando a superfície exigir essa proteção.
- Copiar somente os materiais necessários para a pasta pública/de assets da
  aplicação; nunca mover, excluir ou sobrescrever a origem.
- Usar imports ou URLs internos da aplicação no navegador. O caminho de origem
  do Windows deve aparecer apenas na documentação de procedência.
- Verificar o carregamento dos arquivos na aplicação e registrar abaixo os
  caminhos efetivamente incorporados e a validação realizada.

Paleta aprovada: ameixa `#3E202D`, creme `#F8F3EF`, argila `#BE8B83`,
sálvia `#929581` e areia `#D9C1B4`.

Tipografia especificada: DM Serif Display 400 para títulos e Manrope
400/500/600 para interface. Essas fontes não substituem a arte da logo.

Slogan: **Encontre um lugar para estar. Um lugar que fica com você.**

## Arquivos incorporados à aplicação

As cópias abaixo preservam os bytes dos materiais existentes em `C:\a3`.
Os destinos são relativos a `C:\a3\code`.

| Origem relativa a `C:\a3` | Destino no projeto | Uso nesta versão |
| --- | --- | --- |
| `public/brand/logo/aori-logo-original.svg` | `public/assets/brand/logo/aori-logo-original.svg` | Cabeçalho e rodapé, com marca completa e proporções preservadas |
| `public/brand/logo/aori-logo-base-creme.svg` | `public/assets/brand/logo/aori-logo-base-creme.svg` | Cópia disponível para fundos escuros; ainda não aplicada na interface |
| `public/brand/symbol/aori-symbol-original.svg` | `public/assets/brand/symbol/aori-symbol-original.svg` | Símbolo na seção da essência Aori |
| `public/favicon.svg` | `public/assets/brand/icons/favicon.svg` | Favicon SVG do navegador |
| `public/favicon.ico` | `public/assets/brand/icons/favicon.ico` | Favicon tradicional do navegador |
| `public/apple-touch-icon.png` | `public/assets/brand/icons/apple-touch-icon.png` | Ícone Apple no cabeçalho HTML |
| `public/icon-192.png` | `public/assets/brand/icons/icon-192.png` | Ícone referenciado pelo manifest |
| `public/icon-512.png` | `public/assets/brand/icons/icon-512.png` | Ícone referenciado pelo manifest |
| `public/icon-maskable-192.png` | `public/assets/brand/icons/icon-maskable-192.png` | Ícone recortável referenciado pelo manifest |
| `public/icon-maskable-512.png` | `public/assets/brand/icons/icon-maskable-512.png` | Ícone recortável referenciado pelo manifest |
| `styles/aori-brand.css` | `public/assets/styles/aori-brand.css` | Tokens e escala tipográfica da identidade aprovada |

`public/site.webmanifest` do projeto é um manifest novo, adaptado da referência
de origem para os caminhos internos dos ícones. Ele não é uma cópia idêntica
ao manifest de `C:\a3\public` e não oferece funcionamento offline.

### Fontes locais

O pacote original não distribuía arquivos de fonte. Para esta prévia, as
famílias especificadas pela identidade foram obtidas do Google Fonts e são
servidas localmente por `public/assets/fonts/fonts.css`:

- `public/assets/fonts/dm-serif-display-400.ttf`;
- `public/assets/fonts/manrope-400.ttf`;
- `public/assets/fonts/manrope-500.ttf`;
- `public/assets/fonts/manrope-600.ttf`.

As licenças estão em `public/assets/fonts/DM-Serif-Display-OFL.txt` e
`public/assets/fonts/Manrope-OFL.txt`. A logo continua sendo a imagem original,
sem reconstrução tipográfica.

### Fotografias complementares

As fotos foram obtidas do Unsplash porque o pacote de origem não continha
fotografias independentes de produção. São autohospedadas e ilustrativas;
não representam uma parceria ou comprovação de uma hospedagem anunciada.

| Arquivo relativo a `public/assets/photos` | Estado |
| --- | --- |
| `hero-retreat.jpg` | Usado no destaque principal |
| `stay-bedroom.jpg` | Usado no catálogo e nos detalhes demonstrativos |
| `stay-villa.jpg` | Usado no catálogo e nos detalhes demonstrativos |
| `stay-cabin.jpg` | Usado no catálogo e nos detalhes demonstrativos |
| `hero-pool.jpg` | Usado na interface e no catálogo demonstrativo |
| `brazil-coast.jpg` | Usado nas galerias ilustrativas das estadias do litoral |
| `brazil-mountains.jpg` | Usado nas galerias ilustrativas das estadias de serra e campo |

`public/assets/SOURCES.json` registra a procedência das fotos e fontes,
incluindo URLs, autores, licenças, dimensões, tamanhos e hashes SHA-256.

## Escopo da demonstração

Nomes, valores e descrições das acomodações são conteúdo demonstrativo para
avaliação da experiência. A prévia não possui backend de reservas, pagamentos,
autenticação ou catálogo conectado a disponibilidade real.

A busca e os filtros operam sobre os dados locais do JavaScript. Os favoritos
ficam apenas no navegador, por meio de `localStorage`; não há sincronização
de conta ou envio desses favoritos a um serviço.

Todas as seis estadias fictícias estão em Santa Catarina: Urubici e São Joaquim
(serra), Bombinhas e Praia do Rosa/Imbituba (litoral), Rancho Queimado e Alfredo
Wagner (campo). As fotos continuam sendo referências ilustrativas; não são
fotografias comprovadas de imóveis nesses locais.

O link “Ver disponibilidade” abre `/estadia.html?id=...` em nova aba. A página
completa apresenta galeria, descrição, comodidades, região, regras e seleção
de chegada, saída e hóspedes. Datas válidas escolhidas na busca acompanham o
link. O resumo calcula o número de noites e o total ilustrativo, sem efetuar
reservas ou pagamentos e sem consultar disponibilidade real.

## Verificações

- A nova conferência dos 37 hashes documentados dos materiais originais não
  encontrou divergências. Os originais permanecem preservados.
- A verificação de sintaxe de `public/app.js`, `public/stays.js`,
  `public/estadia.js` e `scripts/serve.mjs` passou.
- A página raiz respondeu com HTTP 200 no servidor local.
- As fotos complementares foram abertas para inspeção visual e decodificadas;
  os arquivos TTF tiveram seus cabeçalhos conferidos.
- Os 34 arquivos públicos responderam com HTTP 200, incluindo fotos, fontes,
  logos e arquivos de configuração. As fontes TTF usam o tipo `font/ttf`.
- A interface foi conferida em desktop (1440 px) e mobile (390 px), sem
  transbordamento horizontal da página ou imagens quebradas observadas.
- Foram testados: busca por região e quantidade de hóspedes, combinação com
  filtros de interesse, validação de saída anterior à chegada, favoritos e sua
  persistência após recarregar, estado vazio e reinício da busca, abertura e
  fechamento dos detalhes e menu
  mobile com retorno de foco ao pressionar Escape.
- Na atualização para Santa Catarina, os seis locais foram conferidos na
  interface. O clique em “Ver disponibilidade” abriu uma nova aba e preservou
  as datas de chegada/saída e a quantidade de hóspedes.
- A página completa foi conferida em 1254 px e 390 px, sem transbordamento
  horizontal observado. A escolha de 30/11/2026 a 02/12/2026 calculou duas
  noites e R$ 1.480 para a Casa do Horizonte. Datas impossíveis na URL foram
  descartadas; uma estadia inexistente exibiu o estado de não encontrado.
- Os favoritos foram testados entre as duas abas, sem perda de itens salvos.
- Não foram registrados erros no console do navegador durante a conferência.
- A captura de revisão fica em `.qa/preview-desktop.jpg`, ignorada pelo Git.
- A captura da página completa com calendário fica em `.qa/estadia-sc.jpg`.

## Fluxo de aprovação e GitHub

Cada conjunto de mudanças será implementado e verificado localmente para
revisão do usuário. Após a aprovação, as alterações aprovadas serão registradas
em commit e enviadas ao GitHub. Não haverá envio antes dessa aprovação.
Repositório: [DudaAlvess/Aori](https://github.com/DudaAlvess/Aori).
A conta conectada `DudaAlvess` tem permissão de escrita confirmada em 29/10/2026.
O repositório remoto estava vazio nessa conferência, com `main` como branch padrão.
O remoto local `origin` aponta para `https://github.com/DudaAlvess/Aori.git`.
As orientações para agentes estão em `AGENTS.md`.

## Pendências identificadas

- Definir e fornecer o catálogo real, as fotografias das acomodações e os
  requisitos de negócio antes de transformar a demonstração em serviço real.
- A matriz vetorial editável está pendente no pacote de origem. Os SVGs
  existentes permitem integrar a arte aprovada sem recriá-la.
