/**
 * Aplicação principal para exibir resultados de futebol
 * Gerencia a interface e integra com o FootballDataClient
 */
class FootballApp {
    constructor() {
        this.client = null;
        this.currentMatches = [];
        this.isLoading = false;
        
        // Elementos DOM
        this.elements = {};
        
        this.init();
    }
    
    /**
     * Inicializa a aplicação
     */
    init() {
        console.log('🚀 Inicializando Aplicação Football...');
        
        // Aguarda o DOM estar carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }
    
    /**
     * Configura a aplicação após DOM carregado
     */
    setupApp() {
        try {
            this.initializeElements();
            this.initializeClient();
            this.bindEvents();
            this.setupDefaults();
            
            console.log('✅ Aplicação inicializada com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação:', error);
            this.showError('Erro ao inicializar aplicação: ' + error.message);
        }
    }
    
    /**
     * Inicializa referências aos elementos DOM
     */
    initializeElements() {
        console.log('🔍 Inicializando elementos DOM...');
        
        this.elements = {
            // Filtros
            competition: document.getElementById('competition'),
            season: document.getElementById('season'),
            status: document.getElementById('status'),
            date: document.getElementById('date'),
            
            // Botões
            searchBtn: document.getElementById('searchBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // Seções
            statsSection: document.getElementById('statsSection'),
            messagesSection: document.getElementById('messagesSection'),
            resultsSection: document.getElementById('resultsSection'),
            loadingSection: document.getElementById('loadingSection'),
            
            // Containers
            matchesContainer: document.getElementById('matchesContainer'),
            
            // Stats
            totalMatches: document.getElementById('totalMatches'),
            finishedMatches: document.getElementById('finishedMatches'),
            scheduledMatches: document.getElementById('scheduledMatches'),
            avgGoals: document.getElementById('avgGoals'),
            
            // Mensagens
            errorMessage: document.getElementById('errorMessage'),
            infoMessage: document.getElementById('infoMessage'),
            errorText: document.getElementById('errorText'),
            infoText: document.getElementById('infoText'),
            
            // Loading no botão
            btnText: document.querySelector('.btn-text'),
            btnLoading: document.querySelector('.btn-loading')
        };
        
        // Verifica se todos os elementos foram encontrados
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
            
        if (missingElements.length > 0) {
            throw new Error(`Elementos DOM não encontrados: ${missingElements.join(', ')}`);
        }
        
        console.log('✅ Todos os elementos DOM inicializados');
    }
    
    /**
     * Inicializa o cliente da API
     */
    initializeClient() {
        console.log('🔧 Inicializando cliente da API...');
        
        this.client = new FootballDataClient();
        
        if (!this.client.token) {
            this.showError('Token da API não configurado. Verifique o arquivo config.js');
            this.elements.searchBtn.disabled = true;
            return;
        }
        
        console.log('✅ Cliente da API inicializado');
    }
    
    /**
     * Vincula eventos aos elementos
     */
    bindEvents() {
        console.log('🔗 Vinculando eventos...');
        
        // Botão de busca
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        
        // Botão de limpar
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        
        // Enter nos campos de filtro
        [this.elements.competition, this.elements.season, this.elements.status, this.elements.date]
            .forEach(element => {
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });
            });
        
        // Mudança na competição para definir temporada padrão
        this.elements.competition.addEventListener('change', () => {
            this.updateSeasonOptions();
        });
        
        console.log('✅ Eventos vinculados');
    }
    
    /**
     * Define configurações padrão
     */
    setupDefaults() {
        console.log('⚙️ Configurando valores padrão...');
        
        // Define temporada atual como padrão
        const currentYear = new Date().getFullYear();
        if (this.elements.season.querySelector(`option[value="${currentYear}"]`)) {
            this.elements.season.value = currentYear.toString();
        }
        
        // Define status padrão como "Finalizadas"
        this.elements.status.value = 'FINISHED';
        
        console.log('✅ Valores padrão configurados');
        
        // Faz uma busca inicial se possível
        this.showInfo('Selecione uma liga e clique em "Buscar Partidas" para ver os resultados.');
    }
    
    /**
     * Atualiza opções de temporada baseado na competição
     */
    updateSeasonOptions() {
        const competition = this.elements.competition.value;
        const currentYear = new Date().getFullYear();
        
        // Reset das opções
        this.elements.season.innerHTML = '';
        
        // Adiciona opções de temporada (últimos 3 anos)
        for (let year = currentYear; year >= currentYear - 2; year--) {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            
            if (year === currentYear) {
                option.selected = true;
            }
            
            this.elements.season.appendChild(option);
        }
    }
    
    /**
     * Manipula busca de partidas
     */
    async handleSearch() {
        if (this.isLoading) {
            console.log('⏳ Busca já em andamento...');
            return;
        }
        
        try {
            this.setLoading(true);
            this.hideMessages();
            
            const filters = this.getFilters();
            console.log('🔍 Iniciando busca com filtros:', filters);
            
            if (!filters.competition) {
                throw new Error('Selecione uma liga/competição');
            }
            
            let result;
            
            if (filters.competition) {
                // Busca por competição específica
                const options = {
                    season: filters.season,
                    status: filters.status,
                    limit: 100
                };
                
                if (filters.date) {
                    // Se uma data específica foi selecionada, busca partidas desse dia
                    options.dateFrom = filters.date;
                    options.dateTo = filters.date;
                }
                
                result = await this.client.getMatchesByCompetition(filters.competition, options);
            } else {
                // Busca global
                const options = {
                    season: filters.season,
                    status: filters.status,
                    limit: 100
                };
                
                if (filters.date) {
                    options.dateFrom = filters.date;
                    options.dateTo = filters.date;
                }
                
                result = await this.client.getMatches(options);
            }
            
            this.currentMatches = result.matches || [];
            this.displayResults(result);
            
            if (this.currentMatches.length === 0) {
                this.showInfo('Nenhuma partida encontrada para os filtros selecionados. Tente outros critérios de busca.');
            } else {
                console.log(`✅ Busca concluída: ${this.currentMatches.length} partidas encontradas`);
            }
            
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            this.showError(error.getUserFriendlyMessage ? error.getUserFriendlyMessage() : error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Limpa filtros e resultados
     */
    handleClear() {
        console.log('🧹 Limpando filtros e resultados...');
        
        // Limpa filtros
        this.elements.competition.value = '';
        this.elements.season.value = new Date().getFullYear().toString();
        this.elements.status.value = 'FINISHED';
        this.elements.date.value = '';
        
        // Limpa resultados
        this.currentMatches = [];
        this.elements.matchesContainer.innerHTML = '';
        
        // Esconde seções
        this.elements.statsSection.style.display = 'none';
        this.hideMessages();
        
        // Atualiza opções de temporada
        this.updateSeasonOptions();
        
        this.showInfo('Filtros limpos. Selecione uma liga e clique em "Buscar Partidas".');
        
        console.log('✅ Filtros e resultados limpos');
    }
    
    /**
     * Obtém filtros do formulário
     */
    getFilters() {
        return {
            competition: this.elements.competition.value,
            season: this.elements.season.value,
            status: this.elements.status.value,
            date: this.elements.date.value || null
        };
    }
    
    /**
     * Exibe resultados da busca
     */
    displayResults(result) {
        console.log('📊 Exibindo resultados:', result);
        
        // Atualiza estatísticas
        this.updateStats(result.matches || []);
        
        // Exibe partidas
        this.renderMatches(result.matches || []);
        
        // Mostra seção de estatísticas
        this.elements.statsSection.style.display = 'block';
    }
    
    /**
     * Atualiza estatísticas
     */
    updateStats(matches) {
        console.log('📈 Atualizando estatísticas...');
        
        const stats = {
            total: matches.length,
            finished: matches.filter(m => m.status === 'FINISHED').length,
            scheduled: matches.filter(m => m.status === 'SCHEDULED').length,
            avgGoals: 0
        };
        
        // Calcula média de gols das partidas finalizadas
        const finishedMatches = matches.filter(m => 
            m.status === 'FINISHED' && 
            m.score && 
            m.score.fullTime && 
            m.score.fullTime.home !== null && 
            m.score.fullTime.away !== null
        );
        
        if (finishedMatches.length > 0) {
            const totalGoals = finishedMatches.reduce((sum, match) => {
                return sum + (match.score.fullTime.home || 0) + (match.score.fullTime.away || 0);
            }, 0);
            
            stats.avgGoals = (totalGoals / finishedMatches.length).toFixed(1);
        }
        
        // Atualiza elementos
        this.elements.totalMatches.textContent = stats.total;
        this.elements.finishedMatches.textContent = stats.finished;
        this.elements.scheduledMatches.textContent = stats.scheduled;
        this.elements.avgGoals.textContent = stats.avgGoals;
        
        console.log('✅ Estatísticas atualizadas:', stats);
    }
    
    /**
     * Renderiza lista de partidas
     */
    renderMatches(matches) {
        console.log('🎨 Renderizando partidas...');
        
        if (!matches || matches.length === 0) {
            this.elements.matchesContainer.innerHTML = `
                <div class="no-matches" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #7f8c8d;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚽</div>
                    <h3>Nenhuma partida encontrada</h3>
                    <p>Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }
        
        // Limpa container
        this.elements.matchesContainer.innerHTML = '';
        
        // Renderiza cada partida
        matches.forEach((match, index) => {
            const matchElement = this.createMatchCard(match);
            matchElement.style.animationDelay = `${index * 0.1}s`;
            this.elements.matchesContainer.appendChild(matchElement);
        });
        
        console.log(`✅ ${matches.length} partidas renderizadas`);
    }
    
    /**
     * Cria card de uma partida
     */
    createMatchCard(match) {
        const card = document.createElement('div');
        card.className = 'match-card';
        
        // Formata data
        const matchDate = new Date(match.utcDate);
        const dateStr = matchDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const timeStr = matchDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Score display
        let scoreDisplay = '';
        if (match.status === 'FINISHED' && match.score && match.score.fullTime) {
            const homeScore = match.score.fullTime.home ?? '-';
            const awayScore = match.score.fullTime.away ?? '-';
            scoreDisplay = `
                <div class="match-score">
                    <span class="score">${homeScore}</span>
                    <span class="score-separator">×</span>
                    <span class="score">${awayScore}</span>
                </div>
            `;
        } else if (match.status === 'IN_PLAY') {
            scoreDisplay = `
                <div class="match-score">
                    <span class="score live">AO VIVO</span>
                </div>
            `;
        } else {
            scoreDisplay = `
                <div class="match-score">
                    <span class="score-separator">vs</span>
                </div>
            `;
        }
        
        // Status badge
        const statusClass = {
            'FINISHED': 'status-finished',
            'SCHEDULED': 'status-scheduled',
            'IN_PLAY': 'status-live',
            'PAUSED': 'status-live',
            'POSTPONED': 'status-scheduled',
            'CANCELLED': 'status-scheduled'
        };
        
        const statusText = {
            'FINISHED': 'Finalizada',
            'SCHEDULED': 'Programada',
            'IN_PLAY': 'Ao Vivo',
            'PAUSED': 'Pausada',
            'POSTPONED': 'Adiada',
            'CANCELLED': 'Cancelada'
        };
        
        // HTML do card
        card.innerHTML = `
            <div class="match-header">
                <span class="match-competition">${match.competition?.name || 'N/A'}</span>
                <span class="match-date">${dateStr} - ${timeStr}</span>
            </div>
            
            <div class="match-teams">
                <div class="team team-home">
                    <img src="${this.getTeamLogo(match.homeTeam)}" 
                         alt="${match.homeTeam?.name || 'N/A'}" 
                         class="team-logo"
                         onerror="this.src='${this.getDefaultLogo()}';this.onerror=null;">
                    <span class="team-name">${match.homeTeam?.name || 'N/A'}</span>
                </div>
                
                ${scoreDisplay}
                
                <div class="team team-away">
                    <span class="team-name">${match.awayTeam?.name || 'N/A'}</span>
                    <img src="${this.getTeamLogo(match.awayTeam)}" 
                         alt="${match.awayTeam?.name || 'N/A'}" 
                         class="team-logo"
                         onerror="this.src='${this.getDefaultLogo()}';this.onerror=null;">
                </div>
            </div>
            
            <div class="match-status">
                <span class="status-badge ${statusClass[match.status] || 'status-scheduled'}">
                    ${statusText[match.status] || match.status}
                </span>
            </div>
            
            ${match.matchday ? `<div class="match-details">Rodada ${match.matchday}</div>` : ''}
        `;
        
        return card;
    }
    
    /**
     * Obtém URL do logo de um time com fallback
     */
    getTeamLogo(team) {
        if (!team) return this.getDefaultLogo();
        
        // Tenta crest primeiro, depois possíveis alternativas
        return team.crest || team.crestUrl || this.getDefaultLogo();
    }
    
    /**
     * Retorna logo padrão em SVG
     */
    getDefaultLogo() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNmOGY5ZmEiLz4KPHRleHQgeD0iMTYiIHk9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY3ZWVhIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0iQXJpYWwiPuKaoO+4jzwvdGV4dD4KPC9zdmc+';
    }
    
    /**
     * Define estado de carregamento
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            // Mostra loading no botão
            this.elements.btnText.style.display = 'none';
            this.elements.btnLoading.style.display = 'flex';
            this.elements.searchBtn.disabled = true;
            
            // Mostra seção de loading
            this.elements.loadingSection.style.display = 'block';
            this.elements.resultsSection.style.display = 'none';
        } else {
            // Esconde loading no botão
            this.elements.btnText.style.display = 'block';
            this.elements.btnLoading.style.display = 'none';
            this.elements.searchBtn.disabled = false;
            
            // Esconde seção de loading
            this.elements.loadingSection.style.display = 'none';
            this.elements.resultsSection.style.display = 'block';
        }
    }
    
    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        console.error('❌ Exibindo erro:', message);
        
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'flex';
        this.elements.infoMessage.style.display = 'none';
        
        // Auto-hide após 10 segundos
        setTimeout(() => {
            this.elements.errorMessage.style.display = 'none';
        }, 10000);
    }
    
    /**
     * Exibe mensagem informativa
     */
    showInfo(message) {
        console.log('ℹ️ Exibindo info:', message);
        
        this.elements.infoText.textContent = message;
        this.elements.infoMessage.style.display = 'flex';
        this.elements.errorMessage.style.display = 'none';
        
        // Auto-hide após 8 segundos
        setTimeout(() => {
            this.elements.infoMessage.style.display = 'none';
        }, 8000);
    }
    
    /**
     * Esconde todas as mensagens
     */
    hideMessages() {
        this.elements.errorMessage.style.display = 'none';
        this.elements.infoMessage.style.display = 'none';
    }
    
    /**
     * Testa conectividade com a API
     */
    async testConnection() {
        console.log('🔍 Testando conectividade...');
        
        try {
            if (!this.client) {
                throw new Error('Cliente não inicializado');
            }
            
            const result = await this.client.testConnection();
            
            if (result.success) {
                this.showInfo('✅ Conectividade com a API testada com sucesso!');
                return true;
            } else {
                this.showError(`❌ Falha no teste de conectividade: ${result.error}`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Erro no teste de conectividade:', error);
            this.showError('Erro ao testar conectividade: ' + error.message);
            return false;
        }
    }
    
    /**
     * Obtém estatísticas da aplicação
     */
    getAppStats() {
        return {
            currentMatches: this.currentMatches.length,
            isLoading: this.isLoading,
            hasClient: !!this.client,
            hasToken: !!(this.client && this.client.token),
            supportedCompetitions: this.client ? this.client.getSupportedCompetitions().length : 0
        };
    }
    
    /**
     * Função para debug - exibe informações no console
     */
    debug() {
        console.group('🐛 Debug da Aplicação Football');
        console.log('Stats:', this.getAppStats());
        console.log('Filtros atuais:', this.getFilters());
        console.log('Partidas carregadas:', this.currentMatches.length);
        console.log('Elementos DOM:', this.elements);
        
        if (this.client) {
            console.log('Competições suportadas:', this.client.getSupportedCompetitions());
        }
        
        console.groupEnd();
    }
}

/**
 * Utilitários globais
 */
window.FootballUtils = {
    /**
     * Formata data para exibição
     */
    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleString('pt-BR', { ...defaultOptions, ...options });
    },
    
    /**
     * Calcula diferença de tempo
     */
    getTimeDifference(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = Math.abs(now - date);
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
        } else if (diffHours > 0) {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
        } else {
            return 'Há poucos minutos';
        }
    },
    
    /**
     * Valida filtros
     */
    validateFilters(filters) {
        const errors = [];
        
        if (!filters.competition) {
            errors.push('Selecione uma competição');
        }
        
        if (filters.date && new Date(filters.date) > new Date()) {
            errors.push('Data não pode ser no futuro');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Gera cores aleatórias para times
     */
    generateTeamColor(teamName) {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
        ];
        
        let hash = 0;
        for (let i = 0; i < teamName.length; i++) {
            hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }
};

// Inicializa a aplicação quando a página carregar
let footballApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM carregado, inicializando aplicação...');
    footballApp = new FootballApp();
});

// Exporta para escopo global para debug
window.footballApp = footballApp;

// Adiciona atalhos de teclado úteis
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter = Buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (footballApp && !footballApp.isLoading) {
            footballApp.handleSearch();
        }
    }
    
    // Ctrl/Cmd + K = Limpar
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (footballApp) {
            footballApp.handleClear();
        }
    }
    
    // F5 = Debug (substitui refresh)
    if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        if (footballApp) {
            footballApp.debug();
        }
    }
});

// Tratamento de erros globais
window.addEventListener('error', (e) => {
    console.error('❌ Erro global capturado:', e.error);
    
    if (footballApp) {
        footballApp.showError('Ocorreu um erro inesperado. Verifique o console para detalhes.');
    }
});

// Tratamento de promises rejeitadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rejeitada não tratada:', e.reason);
    
    if (footballApp) {
        footballApp.showError('Erro de conectividade ou processamento. Tente novamente.');
    }
    
    // Previne que o erro apareça no console do browser
    e.preventDefault();
});