/**
 * Cliente para consumir a API football-data.org v4
 * Versão com suporte a proxy para contornar CORS
 */
class FootballDataClient {
    constructor() {
        // Detecta se está rodando em desenvolvimento para usar proxy
        this.isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Configuração de URLs
        if (this.isLocalDev && window.location.port === '3000') {
            // Se estiver rodando no servidor proxy (porta 3000)
            this.baseUrl = '/api';
            this.useProxy = true;
            console.log('🔄 Modo proxy ativado - usando servidor local na porta 3000');
        } else {
            // Tenta usar a API diretamente
            this.baseUrl = 'https://api.football-data.org/v4';
            this.useProxy = false;
            console.log('📡 Modo direto - tentando conectar diretamente à API');
        }
        
        this.token = null;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 segundo entre requisições
        this.requestQueue = [];
        this.isProcessingQueue = false;
        
        // Mapeamento de competições com nomes e códigos
        this.competitions = {
            'PL': { name: 'Premier League', id: 'PL' },
            'PD': { name: 'La Liga', id: 'PD' },
            'BL1': { name: 'Bundesliga', id: 'BL1' },
            'SA': { name: 'Serie A', id: 'SA' },
            'FL1': { name: 'Ligue 1', id: 'FL1' },
            'CL': { name: 'Champions League', id: 'CL' },
            'BSA': { name: 'Brasileirão', id: 'BSA' }
        };
        
        this.init();
    }
    
    /**
     * Inicializa o cliente verificando se o token foi configurado
     */
    init() {
        console.log('🚀 Inicializando FootballDataClient...');
        console.log(`🌐 Ambiente: ${this.isLocalDev ? 'Desenvolvimento' : 'Produção'}`);
        console.log(`🔗 Base URL: ${this.baseUrl}`);
        
        if (typeof FOOTBALL_DATA_CONFIG === 'undefined') {
            console.error('❌ Arquivo config.js não encontrado!');
            console.warn('📝 Crie o arquivo config.js com sua chave da API');
            return false;
        }
        
        if (!FOOTBALL_DATA_CONFIG.apiToken) {
            console.error('❌ Token da API não configurado em config.js');
            console.warn('📝 Adicione seu token no arquivo config.js');
            return false;
        }
        
        this.token = FOOTBALL_DATA_CONFIG.apiToken;
        console.log('✅ Cliente inicializado com sucesso');
        console.log('🔑 Token configurado:', this.token.substring(0, 8) + '...');
        
        // Testa conectividade na inicialização
        if (this.isLocalDev) {
            this.testConnectionOnInit();
        }
        
        return true;
    }
    
    /**
     * Testa conectividade na inicialização (apenas em desenvolvimento)
     */
    async testConnectionOnInit() {
        try {
            console.log('🔍 Testando conectividade inicial...');
            const result = await this.testConnection();
            if (!result.success) {
                console.warn('⚠️ Problemas de conectividade detectados');
                console.warn('💡 Dica: Use o servidor proxy se houver problemas de CORS');
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível testar conectividade inicial:', error.message);
        }
    }
    
    /**
     * Faz requisição HTTP com rate limiting e tratamento de erros
     */
    async makeRequest(endpoint, params = {}) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                endpoint,
                params,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }
    
    /**
     * Processa a fila de requisições respeitando o rate limiting
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            
            // Aguarda o tempo mínimo entre requisições
            if (timeSinceLastRequest < this.minRequestInterval) {
                const waitTime = this.minRequestInterval - timeSinceLastRequest;
                console.log(`⏳ Aguardando ${waitTime}ms para próxima requisição...`);
                await this.sleep(waitTime);
            }
            
            try {
                const result = await this.executeRequest(request.endpoint, request.params);
                request.resolve(result);
                this.lastRequestTime = Date.now();
            } catch (error) {
                request.reject(error);
            }
        }
        
        this.isProcessingQueue = false;
    }
    
    /**
     * Executa uma requisição HTTP
     */
    async executeRequest(endpoint, params) {
        if (!this.token) {
            throw new Error('Token da API não configurado. Verifique o arquivo config.js');
        }
        
        const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
        
        // Adiciona parâmetros à URL
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });
        
        console.log('📡 Fazendo requisição para:', url.toString());
        console.log('📋 Parâmetros:', params);
        console.log('🔄 Usando proxy:', this.useProxy);
        
        const headers = {
            'X-Auth-Token': this.token,
            'Accept': 'application/json'
            // Removido Content-Type que causa problema de CORS
        };
        
        console.log('🔐 Headers:', { ...headers, 'X-Auth-Token': headers['X-Auth-Token'].substring(0, 8) + '...' });
        
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: headers,
                mode: this.useProxy ? 'same-origin' : 'cors'
            });
            
            console.log('📊 Status da resposta:', response.status);
            console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }
            
            const data = await response.json();
            console.log('✅ Dados recebidos:', data);
            
            return data;
            
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            
            // Se for erro de CORS, sugere usar proxy
            if (error.message.includes('CORS') || error.message.includes('cors')) {
                const corsError = new FootballDataError(
                    'Erro de CORS detectado. Use o servidor proxy ou acesse via http://localhost (porta 80)',
                    'CORS_ERROR'
                );
                corsError.originalError = error;
                corsError.suggestion = this.getCORSSuggestion();
                throw corsError;
            }
            
            throw this.createErrorFromException(error);
        }
    }
    
    /**
     * Retorna sugestão para resolver CORS
     */
    getCORSSuggestion() {
        return {
            title: 'Como resolver erro de CORS:',
            options: [
                '1. Use o servidor proxy: node proxy-server.js e acesse http://localhost:3000',
                '2. Execute na porta 80: sudo python -m http.server 80 e acesse http://localhost',
                '3. Use uma extensão de navegador para desabilitar CORS (apenas desenvolvimento)'
            ]
        };
    }
    
    /**
     * Trata erros HTTP da API
     */
    async handleErrorResponse(response) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        let errorType = 'API_ERROR';
        
        try {
            const errorData = await response.json();
            console.error('❌ Dados do erro:', errorData);
            
            if (errorData.message) {
                errorMessage = errorData.message;
            }
            
            if (errorData.errorCode) {
                errorType = errorData.errorCode;
            }
        } catch (jsonError) {
            console.error('❌ Erro ao parsear JSON do erro:', jsonError);
        }
        
        // Mapeamento de erros específicos
        const errorMappings = {
            400: { type: 'INVALID_REQUEST', message: 'Parâmetros inválidos na requisição' },
            401: { type: 'INVALID_TOKEN', message: 'Token de autenticação inválido ou expirado' },
            403: { type: 'FORBIDDEN', message: 'Acesso negado. Verifique as permissões do token' },
            404: { type: 'NOT_FOUND', message: 'Recurso não encontrado' },
            429: { type: 'RATE_LIMIT', message: 'Limite de requisições excedido. Tente novamente em alguns minutos' },
            500: { type: 'SERVER_ERROR', message: 'Erro interno do servidor' },
            503: { type: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível' }
        };
        
        if (errorMappings[response.status]) {
            errorType = errorMappings[response.status].type;
            errorMessage = errorMappings[response.status].message;
        }
        
        throw new FootballDataError(errorMessage, errorType, response.status);
    }
    
    /**
     * Cria erro customizado a partir de exceção
     */
    createErrorFromException(error) {
        if (error instanceof FootballDataError) {
            return error;
        }
        
        let errorMessage = 'Erro de conexão com a API';
        let errorType = 'CONNECTION_ERROR';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente';
            errorType = 'NETWORK_ERROR';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Requisição cancelada por timeout';
            errorType = 'TIMEOUT_ERROR';
        }
        
        return new FootballDataError(errorMessage, errorType, null, error);
    }
    
    /**
     * Busca partidas de uma competição específica
     */
    async getMatchesByCompetition(competitionCode, options = {}) {
        console.log(`⚽ Buscando partidas da competição: ${competitionCode}`);
        console.log('🔧 Opções:', options);
        
        if (!this.competitions[competitionCode]) {
            throw new FootballDataError(`Competição '${competitionCode}' não suportada`, 'INVALID_COMPETITION');
        }
        
        const params = {};
        
        // Adiciona filtros se fornecidos
        if (options.season) {
            params.season = options.season;
        }
        
        if (options.status) {
            params.status = options.status;
        }
        
        if (options.dateFrom) {
            params.dateFrom = options.dateFrom;
        }
        
        if (options.dateTo) {
            params.dateTo = options.dateTo;
        }
        
        if (options.limit) {
            params.limit = options.limit;
        } else {
            params.limit = 100; // Limite padrão
        }
        
        try {
            const data = await this.makeRequest(`/competitions/${competitionCode}/matches`, params);
            
            if (!data.matches || data.matches.length === 0) {
                console.log('ℹ️ Nenhuma partida encontrada para os filtros especificados');
                return {
                    matches: [],
                    count: 0,
                    competition: this.competitions[competitionCode]
                };
            }
            
            console.log(`✅ Encontradas ${data.matches.length} partidas`);
            
            return {
                matches: data.matches,
                count: data.count || data.matches.length,
                competition: this.competitions[competitionCode],
                filters: data.filters || {}
            };
            
        } catch (error) {
            console.error(`❌ Erro ao buscar partidas da competição ${competitionCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Busca partidas com filtros globais
     */
    async getMatches(options = {}) {
        console.log('⚽ Buscando partidas com filtros globais');
        console.log('🔧 Opções:', options);
        
        const params = {};
        
        // Adiciona filtros
        if (options.competitions) {
            params.competitions = Array.isArray(options.competitions) 
                ? options.competitions.join(',') 
                : options.competitions;
        }
        
        if (options.season) {
            params.season = options.season;
        }
        
        if (options.status) {
            params.status = options.status;
        }
        
        if (options.dateFrom) {
            params.dateFrom = options.dateFrom;
        }
        
        if (options.dateTo) {
            params.dateTo = options.dateTo;
        }
        
        if (options.limit) {
            params.limit = options.limit;
        } else {
            params.limit = 100; // Limite padrão
        }
        
        try {
            const data = await this.makeRequest('/matches', params);
            
            if (!data.matches || data.matches.length === 0) {
                console.log('ℹ️ Nenhuma partida encontrada para os filtros especificados');
                return {
                    matches: [],
                    count: 0
                };
            }
            
            console.log(`✅ Encontradas ${data.matches.length} partidas`);
            
            return {
                matches: data.matches,
                count: data.count || data.matches.length,
                filters: data.filters || {}
            };
            
        } catch (error) {
            console.error('❌ Erro ao buscar partidas:', error);
            throw error;
        }
    }
    
    /**
     * Lista todas as competições disponíveis
     */
    async getCompetitions() {
        console.log('🏆 Buscando lista de competições...');
        
        try {
            const data = await this.makeRequest('/competitions');
            console.log(`✅ Encontradas ${data.competitions.length} competições`);
            return data.competitions;
            
        } catch (error) {
            console.error('❌ Erro ao buscar competições:', error);
            throw error;
        }
    }
    
    /**
     * Testa a conectividade com a API
     */
    async testConnection() {
        console.log('🔍 Testando conectividade com a API...');
        
        try {
            // Faz uma requisição simples para testar
            const data = await this.makeRequest('/competitions', { limit: 1 });
            
            console.log('✅ Teste de conectividade bem-sucedido');
            
            return {
                success: true,
                message: 'Conectividade OK',
                mode: this.useProxy ? 'proxy' : 'direct',
                data: data
            };
            
        } catch (error) {
            console.error('❌ Teste de conectividade falhou:', error);
            return {
                success: false,
                error: error.message,
                type: error.type,
                mode: this.useProxy ? 'proxy' : 'direct',
                suggestion: error.suggestion
            };
        }
    }
    
    /**
     * Obtém informações sobre uma competição específica
     */
    async getCompetitionInfo(competitionCode) {
        console.log(`🏆 Buscando informações da competição: ${competitionCode}`);
        
        if (!this.competitions[competitionCode]) {
            throw new FootballDataError(`Competição '${competitionCode}' não suportada`, 'INVALID_COMPETITION');
        }
        
        try {
            const data = await this.makeRequest(`/competitions/${competitionCode}`);
            console.log('✅ Informações da competição obtidas');
            return data;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar informações da competição ${competitionCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Função utilitária para aguardar um tempo específico
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Obtém nome amigável de uma competição
     */
    getCompetitionName(code) {
        return this.competitions[code]?.name || code;
    }
    
    /**
     * Verifica se uma competição é suportada
     */
    isCompetitionSupported(code) {
        return !!this.competitions[code];
    }
    
    /**
     * Obtém lista de competições suportadas
     */
    getSupportedCompetitions() {
        return Object.entries(this.competitions).map(([code, info]) => ({
            code,
            name: info.name,
            id: info.id
        }));
    }
}

/**
 * Classe de erro customizada para a API Football Data
 */
class FootballDataError extends Error {
    constructor(message, type = 'UNKNOWN_ERROR', statusCode = null, originalError = null) {
        super(message);
        this.name = 'FootballDataError';
        this.type = type;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
        this.suggestion = null;
        
        // Mantém o stack trace original se disponível
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }
    
    /**
     * Retorna uma representação JSON do erro
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            suggestion: this.suggestion
        };
    }
    
    /**
     * Retorna uma mensagem amigável para o usuário
     */
    getUserFriendlyMessage() {
        const friendlyMessages = {
            'INVALID_TOKEN': 'Token de acesso inválido. Verifique suas credenciais.',
            'RATE_LIMIT': 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.',
            'NOT_FOUND': 'Dados não encontrados para os filtros especificados.',
            'NETWORK_ERROR': 'Problema de conexão. Verifique sua internet.',
            'INVALID_COMPETITION': 'Liga/competição não suportada.',
            'SERVER_ERROR': 'Erro no servidor. Tente novamente mais tarde.',
            'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível.',
            'CORS_ERROR': 'Erro de CORS. Use o servidor proxy ou execute na porta 80 com localhost.'
        };
        
        return friendlyMessages[this.type] || this.message;
    }
}

// Exporta as classes para uso global
window.FootballDataClient = FootballDataClient;
window.FootballDataError = FootballDataError;