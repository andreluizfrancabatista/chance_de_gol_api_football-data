# ⚽ Chance de Gol - Football Data API

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Football-Data.org](https://img.shields.io/badge/API-Football--Data.org-success?style=for-the-badge)](https://www.football-data.org/)
[![Status](https://img.shields.io/badge/Status-Funcional-brightgreen?style=for-the-badge)](https://github.com/andreluizfrancabatista/chance_de_gol_api_football-data)

Uma aplicação web moderna e responsiva para consultar resultados e placares de futebol em tempo real, consumindo dados da API **football-data.org**. 

**✅ Projeto totalmente funcional e testado com sucesso!**

## 🎯 Funcionalidades

### ⭐ Principais
- ✅ **Busca de partidas** por liga, temporada e status
- ✅ **Resultados em tempo real** com placares atualizados
- ✅ **Interface moderna** com gradientes e animações suaves
- ✅ **Totalmente responsivo** para mobile e desktop
- ✅ **Rate limiting automático** para respeitar limites da API
- ✅ **Tratamento robusto de erros** com mensagens amigáveis
- ✅ **Loading states** e feedback visual em tempo real
- ✅ **Estatísticas automáticas** das consultas realizadas
- ✅ **Logs detalhados** para debug e monitoramento

### 🏆 Ligas Suportadas
- **Premier League**  (PL) - Liga Inglesa
- **La Liga** (PD) - Liga Espanhola  
- **Bundesliga** (BL1) - Liga Alemã
- **Serie A** (SA) - Liga Italiana
- **Ligue 1** (FL1) - Liga Francesa
- **Champions League** (CL) - Liga dos Campeões
- **Brasileirão** (BSA) - Campeonato Brasileiro

### 🔍 Filtros de Busca
- **Liga/Competição**: Selecione entre as 7 ligas principais
- **Temporada**: 2023, 2024, 2025
- **Status**: Finalizadas, Programadas, Ao Vivo
- **Data específica**: Opcional para buscar partidas de um dia específico

## 🚀 Como Usar

### 1. Pré-requisitos
- ✅ Navegador web moderno com suporte a ES6+
- ✅ Conexão com internet estável
- ✅ Token de acesso da API football-data.org (gratuito)

### 2. Obter Token da API
1. Acesse [football-data.org](https://www.football-data.org/)
2. Crie uma conta gratuita (processo rápido)
3. Vá para a seção **"API"** no seu perfil
4. Copie seu **token de acesso**

### 3. Configuração Rápida

#### Clonar o repositório:
```bash
git clone https://github.com/andreluizfrancabatista/chance_de_gol_api_football-data.git
cd chance_de_gol_api_football-data
```

#### Configurar o token:
1. Abra o arquivo `config.js` em qualquer editor de texto
2. Substitua `'SEU_TOKEN_AQUI'` pelo seu token real:

```javascript
const FOOTBALL_DATA_CONFIG = {
    // Substitua pela sua chave real da API
    apiToken: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    
    // Outras configurações (não alterar)
    baseUrl: 'https://api.football-data.org/v4',
    rateLimiting: {
        requestsPerMinute: 10,
        requestsPerDay: 100
    }
};
```

### 4. Executar a Aplicação

#### ⚠️ IMPORTANTE: Use a porta 80 para evitar problemas de CORS

```bash
# Execute na porta 80 (recomendado)
sudo python -m http.server 80

# Ou se não conseguir usar sudo:
python -m http.server 8080  # Pode ter limitações de CORS
```

#### Acesse no navegador:
- **Recomendado**: `http://localhost` (porta 80)
- **Alternativo**: `http://localhost:8080` (pode ter problemas de CORS)

### 5. Usando a Aplicação
1. ✅ Abra a URL no navegador
2. ✅ Selecione uma **liga/competição**
3. ✅ Escolha a **temporada** (2024 é padrão)
4. ✅ Defina o **status** (Finalizadas é padrão)
5. ✅ Clique em **"Buscar Partidas"**
6. ✅ Visualize **resultados** com placares e estatísticas

## 📁 Estrutura do Projeto

```
chance_de_gol_api_football-data/
│
├── 📄 index.html               # Interface principal
├── 🎨 styles.css               # Estilos modernos e responsivos  
├── ⚙️ app.js                   # Lógica da aplicação
├── 🌐 footballDataClient.js    # Cliente da API com CORS corrigido
├── 🔑 config.js                # Configurações do token
├── 🚫 .gitignore               # Proteção de credenciais
├── 📖 README.md                # Esta documentação
└── 🔧 proxy-server.js          # Servidor proxy (opcional)
```
## 📊 Limites da API (Plano Gratuito)

- **10 requisições/minuto** ⏱️
- **100 requisições/dia** 📅
- **Dados históricos limitados** 📈
- **Sem dados ao vivo durante jogos** ⚽

## 🔐 Segurança

- ✅ Token protegido em arquivo separado
- ✅ `config.js` no `.gitignore`
- ✅ Sem exposição de credenciais no código
- ✅ Requisições HTTPS apenas
- ⚠️ **NUNCA** faça commit do token real