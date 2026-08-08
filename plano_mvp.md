# Prompt para Claude Code — MVP "QR Memória" (gerador de QR code com vídeo para canecas)

> Copie este documento inteiro e cole como instrução inicial para o Claude Code. Ele foi escrito para ser executado por fases — siga a ordem sugerida no final.

Repositório GitHub: https://github.com/mtsgaldino10-dev/VideoGift.git (remote `origin` já configurado)

Credenciais do Supabase e Cloudflare R2: movidas para `apps/api/.env` e `apps/web/.env.local` (arquivos git-ignorados, nunca commitados). Ver `.env.example` em cada app para a lista de variáveis necessárias.

## 1. Visão geral do produto

Estou construindo um MVP chamado **QR Memória** (nome provisório — pode sugerir alternativas, mas não trave o desenvolvimento nisso).

**O que o produto faz:**
1. Um cliente final (ex: alguém comprando um presente de Dia dos Pais) grava ou envia um vídeo.
2. O sistema gera um link único e um QR code que aponta para esse link.
3. Esse QR code é impresso/estampado em uma caneca física (isso acontece fora do sistema, em uma gráfica).
4. Quando alguém escaneia o QR code com o celular, abre uma página simples e bonita que reproduz o vídeo.

**Quem usa o quê:**
- **Painel administrativo** (protegido por login): onde o cliente/admin faz upload do vídeo, gera o QR, baixa a imagem do QR para mandar pra gráfica, e gerencia (lista, edita, deleta) os vídeos criados.
- **Página pública do player**: acessada por qualquer pessoa que escaneie o QR, sem necessidade de login. Deve carregar rápido e funcionar perfeitamente em celular.

## 2. Stack técnico (obrigatório, não sugerir alternativas)

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript
- **Banco de dados**: Supabase (Postgres) — usar apenas para metadados e autenticação do painel, **nunca para armazenar o arquivo de vídeo em si**
- **Armazenamento de vídeo**: Cloudflare R2 (S3-compatible) — usar upload via presigned URL, o vídeo nunca deve passar pelo backend NestJS (evitar sobrecarregar o servidor com upload de arquivo grande)
- **Geração de QR code**: biblioteca `qrcode` (npm), gerar em SVG para qualidade de impressão
- **Deploy alvo**: Vercel (frontend) + Railway ou Render (backend) — estruturar o projeto para isso, mas não é necessário configurar deploy nesta fase, só deixar pronto para

## 3. Estrutura de pastas sugerida (monorepo)

```
/apps
  /web        -> Next.js (frontend + player público)
  /api        -> NestJS (backend)
/packages
  /shared     -> tipos TypeScript compartilhados (ex: DTOs, schema de vídeo)
```

Use um workspace simples (npm workspaces ou pnpm workspaces — escolha o que for mais estável para o setup).

## 4. Schema do banco (Supabase / Postgres)

```sql
create table videos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  owner_id uuid references auth.users(id) not null,
  r2_object_key text not null,       -- chave do arquivo no bucket R2
  thumbnail_url text,
  status text not null default 'processing', -- processing | ready | error
  duration_seconds int,
  file_size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_videos_slug on videos(slug);
create index idx_videos_owner on videos(owner_id);
```

Habilitar Row Level Security: admin só vê/edita seus próprios vídeos (`owner_id = auth.uid()`). A leitura pública (para o player) deve acontecer via endpoint do backend, não via query direta do Supabase no client, para manter controle sobre o que é exposto.

## 5. Endpoints da API (NestJS)

**Protegidos (requerem sessão do Supabase Auth):**
- `POST /videos` — cria registro do vídeo (recebe título), retorna `slug` gerado + presigned URL do R2 para upload direto
- `POST /videos/:id/complete` — marca vídeo como `ready` depois que o upload no R2 terminou (chamado pelo frontend após sucesso do upload)
- `GET /videos` — lista vídeos do usuário logado
- `DELETE /videos/:id` — remove registro + arquivo no R2
- `GET /videos/:id/qrcode` — retorna o QR code em SVG pronto para download

**Públicos:**
- `GET /public/videos/:slug` — retorna metadados do vídeo (URL de reprodução assinada ou pública do R2, título, thumbnail) para a página do player

## 6. Fluxo de upload (importante, seguir exatamente)

1. Admin escolhe arquivo de vídeo no painel (limite: 100MB, formatos aceitos: mp4, mov, webm)
2. Frontend chama `POST /videos` → backend gera `slug` único (ex: 6-8 caracteres alfanuméricos, curto para caber bem em QR e ser digitável se precisar), cria registro no Supabase com status `processing`, gera presigned URL do R2 e retorna
3. Frontend faz upload direto do arquivo para o R2 usando a presigned URL (sem passar pelo NestJS)
4. Ao concluir, frontend chama `POST /videos/:id/complete` → backend atualiza status para `ready`
5. Painel mostra preview do QR code e permite baixar em SVG/PNG

## 7. Especificação do QR code

- Gerar apontando para `https://[dominio]/v/[slug]`
- Nível de correção de erro: **H (alto)** — importante porque vai numa superfície curva (caneca) e pode ter reflexo/desgaste
- Exportar em SVG (vetor) para não perder qualidade na impressão
- Disponibilizar também PNG em alta resolução (mínimo 1000x1000px) como alternativa, caso a gráfica prefira raster

## 8. Design system (use isso como direção visual)

O produto lida com presentes emocionais (vídeos de família, datas comemorativas), então a estética deve remeter a **algo íntimo e afetivo**, não a um SaaS genérico corporativo.

**Paleta de cores:**
- Fundo principal: `#FAF3E9` (creme quente, como papel)
- Texto principal: `#3D2B24` (marrom café escuro)
- Cor de destaque/ação: `#C96342` (terracota)
- Cor secundária/detalhe: `#D4A24C` (dourado suave)
- Superfícies/cards: branco levemente quente `#FFFDF9`

**Tipografia:**
- Títulos/headings: uma serifada com personalidade — `Fraunces` ou `Playfair Display` (Google Fonts). Passa sensação de cartão/carta escrita à mão.
- Corpo de texto e UI: sans-serif limpa — `Inter` ou `Work Sans`

**Tom visual geral:**
- Cantos arredondados generosos (16-24px) nos cards, como se fossem polaroids/cartões
- Espaçamento generoso, nada apertado
- Evitar gradientes vibrantes ou visual "tech/startup" — priorizar calor e simplicidade

### Página do painel administrativo (`/dashboard`)
- Header simples com logo + nome do produto + botão de logout
- Lista de vídeos em formato de cards (thumbnail, título, data de criação, status, ações: ver QR / baixar QR / copiar link / deletar)
- Botão de destaque "Novo vídeo" no topo, abre modal ou página de upload
- Estado vazio (sem vídeos ainda) com ilustração simples e call-to-action

### Página de upload (`/dashboard/new`)
- Campo de título (opcional)
- Área de drag-and-drop para o vídeo, com preview após seleção
- Barra de progresso durante upload
- Ao concluir: mostra o QR code gerado em destaque, com botões "Baixar SVG", "Baixar PNG", "Copiar link"

### Página pública do player (`/v/[slug]`) — a mais importante do produto
- Mobile-first absoluto (a esmagadora maioria vai acessar via celular, direto da câmera)
- Tela cheia, fundo escuro levemente desfocado (blur do próprio frame do vídeo, se possível) para dar contexto sem distrair
- Player de vídeo centralizado, com cantos arredondados, como se fosse um "cartão-postal" reproduzindo
- Botão de play grande e claro no centro (não usar autoplay silencioso — a pessoa deve escolher assistir, e o áudio importa muito aqui, geralmente é uma mensagem de voz de alguém)
- Sem elementos de navegação, sem menu — a página deve ter um único propósito: reproduzir o vídeo
- Rodapé discreto e pequeno: "Feito com [nome do produto]" (pode linkar para uma landing futura, mas não é prioridade agora)
- Meta tags Open Graph configuradas (título genérico tipo "Você recebeu uma mensagem especial 💌" + thumbnail do vídeo) para quando o link for compartilhado fora do QR

### Página de erro (vídeo não encontrado/removido)
- Mensagem simples e gentil, sem parecer erro técnico: algo como "Este vídeo não está mais disponível"

## 9. Requisitos não-funcionais

- TypeScript estrito em todo o projeto (frontend, backend, tipos compartilhados)
- Página do player deve ter Time to Interactive baixo — evitar JS desnecessário, usar Server Components no Next.js onde fizer sentido
- Tratar erros de upload de forma clara (arquivo muito grande, formato não suportado, falha de rede)
- Variáveis de ambiente nunca hardcoded — usar `.env` com exemplo em `.env.example`

## 10. Variáveis de ambiente necessárias

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# App
NEXT_PUBLIC_APP_URL=
```

## 11. Fases de implementação (siga nesta ordem, uma de cada vez)

1. **Setup do monorepo** — estrutura de pastas, configuração TypeScript compartilhada, lint/format
2. **Backend base** — NestJS com módulo de vídeos, conexão com Supabase, schema aplicado
3. **Integração com R2** — geração de presigned URL, endpoint de conclusão de upload
4. **Geração de QR code** — endpoint que retorna SVG/PNG
5. **Frontend: autenticação e painel** — login via Supabase Auth, listagem e criação de vídeos
6. **Frontend: fluxo de upload completo** — drag-and-drop, progresso, exibição do QR gerado
7. **Frontend: página pública do player** — aplicar o design system descrito acima, testar em mobile
8. **Polimento** — estados de erro, loading, responsividade final, meta tags Open Graph

Vá fase por fase e me avise ao concluir cada uma antes de seguir para a próxima, para eu poder revisar.