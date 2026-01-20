// Concepta - Local AI Study Buddy with Phi-3 Mini
// Final Production Code

class ConceptaApp {
    constructor() {
        // App State
        this.state = {
            currentTab: 'explainer',
            currentDifficulty: 'beginner',
            theme: 'dark',
            flashcards: [],
            currentFlashcardIndex: 0,
            isFlashcardFlipped: false,
            connectionStatus: 'disconnected',
            model: 'phi3:mini',
            apiUrl: 'http://localhost:11434',
            backendUrl: 'http://localhost:8000',
            isPhi3: true
        };
        
        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        this.cacheDOM();
        this.bindEvents();
        this.setupInputListeners();
        this.loadSettings();
        this.setupTheme();
        await this.initializeApp();
    }
    
    cacheDOM() {
        // Cache all elements
        const get = id => document.getElementById(id);
        
        this.elements = {
            // Tabs
            tabs: document.querySelectorAll('.nav-item'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Inputs
            topicInput: get('topicInput'),
            notesInput: get('notesInput'),
            quizInput: get('quizInput'),
            flashcardsInput: get('flashcardsInput'),
            
            // Buttons
            explainBtn: get('explainBtn'),
            summarizeBtn: get('summarizeBtn'),
            generateQuizBtn: get('generateQuizBtn'),
            generateFlashcardsBtn: get('generateFlashcardsBtn'),
            
            // Outputs
            explainOutput: get('explainOutput'),
            summaryOutput: get('summaryOutput'),
            quizOutput: get('quizOutput'),
            
            // Flashcards
            flashcard: get('flashcard'),
            cardQuestion: get('cardQuestion'),
            cardAnswer: get('cardAnswer'),
            prevCard: get('prevCard'),
            nextCard: get('nextCard'),
            currentCard: get('currentCard'),
            totalCards: get('totalCards'),
            flipCard: get('flipCard'),
            flipCardBack: get('flipCardBack'),
            shuffleCards: get('shuffleCards'),
            saveFlashcards: get('saveFlashcards'),
            loadFlashcardsBtn: get('loadFlashcardsBtn'),
            clearFlashcards: get('clearFlashcards'),
            markEasy: get('markEasy'),
            markHard: get('markHard'),
            
            // Settings
            themeToggle: get('themeToggle'),
            settingsBtn: get('settingsBtn'),
            settingsModal: get('settingsModal'),
            closeSettings: get('closeSettings'),
            closeSettingsBtn: get('closeSettingsBtn'),
            modelSelect: get('modelSelect'),
            apiUrl: get('apiUrl'),
            saveSettings: get('saveSettings'),
            themeOptions: document.querySelectorAll('.theme-option'),
            
            // Connection
            connectionStatus: get('connectionStatus'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.connection-status span'),
            modelName: get('modelName'),
            
            // Notifications
            notificationContainer: get('notificationContainer'),
            
            // Loading
            loadingScreen: get('loadingScreen'),
            loadingStatus: get('loadingStatus'),
            
            // Character counters
            topicCharCount: get('topicCharCount'),
            notesCharCount: get('notesCharCount'),
            quizCharCount: get('quizCharCount'),
            flashcardsCharCount: get('flashcardsCharCount')
        };
    }
    
    setupInputListeners() {
        // Character counters
        this.setupCharCounter(this.elements.topicInput, this.elements.topicCharCount, 500);
        this.setupCharCounter(this.elements.notesInput, this.elements.notesCharCount, 2000);
        this.setupCharCounter(this.elements.quizInput, this.elements.quizCharCount, 1000);
        this.setupCharCounter(this.elements.flashcardsInput, this.elements.flashcardsCharCount, 800);
        
        // Input validation
        this.elements.topicInput.addEventListener('input', () => this.validateInput(this.elements.topicInput, 500));
        this.elements.notesInput.addEventListener('input', () => this.validateInput(this.elements.notesInput, 2000));
        this.elements.quizInput.addEventListener('input', () => this.validateInput(this.elements.quizInput, 1000));
        this.elements.flashcardsInput.addEventListener('input', () => this.validateInput(this.elements.flashcardsInput, 800));
    }
    
    setupCharCounter(input, counter, max) {
        const update = () => {
            const length = input.value.length;
            counter.textContent = `${length}/${max}`;
            counter.className = 'char-count';
            
            if (length > max * 0.9) {
                counter.classList.add('error');
            } else if (length > max * 0.7) {
                counter.classList.add('warning');
            }
        };
        
        input.addEventListener('input', update);
        update(); // Initial update
    }
    
    validateInput(input, max) {
        if (input.value.length > max) {
            input.value = input.value.substring(0, max);
            this.showNotification(`Limited to ${max} characters for Phi-3 optimization`, 'warning');
        }
    }
    
    bindEvents() {
        // Tab navigation
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Concept Explainer
        this.elements.explainBtn.addEventListener('click', () => this.generateExplanation());
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDifficulty(e));
        });
        
        // Notes Summarizer
        this.elements.summarizeBtn.addEventListener('click', () => this.summarizeNotes());
        
        // Quiz Generator
        this.elements.generateQuizBtn.addEventListener('click', () => this.generateQuiz());
        
        // Flashcards
        this.elements.generateFlashcardsBtn.addEventListener('click', () => this.generateFlashcards());
        this.elements.loadFlashcardsBtn.addEventListener('click', () => this.loadFlashcards());
        this.elements.prevCard.addEventListener('click', () => this.navigateFlashcard(-1));
        this.elements.nextCard.addEventListener('click', () => this.navigateFlashcard(1));
        this.elements.flipCard.addEventListener('click', () => this.flipFlashcard());
        this.elements.flipCardBack.addEventListener('click', () => this.flipFlashcard());
        this.elements.flashcard.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action')) {
                this.flipFlashcard();
            }
        });
        this.elements.shuffleCards.addEventListener('click', () => this.shuffleFlashcards());
        this.elements.saveFlashcards.addEventListener('click', () => this.saveFlashcards());
        this.elements.clearFlashcards.addEventListener('click', () => this.clearFlashcards());
        this.elements.markEasy.addEventListener('click', () => this.markFlashcardDifficulty('easy'));
        this.elements.markHard.addEventListener('click', () => this.markFlashcardDifficulty('hard'));
        
        // Settings
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectThemeOption(e));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    async initializeApp() {
        // Update loading status
        this.elements.loadingStatus.textContent = 'Checking backend connection...';
        
        // Check backend
        const backendOk = await this.checkBackend();
        if (!backendOk) {
            this.elements.loadingStatus.innerHTML = `
                <strong>Backend not connected!</strong><br>
                Run in terminal: <code>cd backend && python main.py</code>
            `;
            return;
        }
        
        this.elements.loadingStatus.textContent = 'Checking Ollama...';
        const ollamaOk = await this.checkOllama();
        
        if (!ollamaOk) {
            this.elements.loadingStatus.innerHTML = `
                <strong>Ollama not running!</strong><br>
                Run in another terminal: <code>ollama serve</code><br>
                Using mock responses for now...
            `;
        } else {
            this.elements.loadingStatus.textContent = 'Loading Phi-3 Mini...';
        }
        
        // Final initialization
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
            this.elements.loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            this.showNotification(
                ollamaOk 
                    ? 'Concepta ready! Using Phi-3 Mini (3.8B) 🚀' 
                    : 'Concepta ready! Using mock responses (Start Ollama for AI)',
                ollamaOk ? 'success' : 'warning'
            );
        }, 1000);
    }
    
    async checkBackend() {
        try {
            const response = await fetch(`${this.state.backendUrl}/health`, { timeout: 3000 });
            if (response.ok) {
                const data = await response.json();
                this.updateConnectionStatus('connected');
                return true;
            }
        } catch (error) {
            console.error('Backend check failed:', error);
        }
        this.updateConnectionStatus('disconnected');
        return false;
    }
    
    async checkOllama() {
        try {
            const response = await fetch(`${this.state.apiUrl}/api/tags`, { timeout: 3000 });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    updateConnectionStatus(status) {
        this.state.connectionStatus = status;
        
        const dot = this.elements.statusDot;
        const text = this.elements.statusText;
        
        dot.className = 'status-dot';
        dot.classList.add(status);
        
        if (status === 'connected' && this.state.isPhi3) {
            dot.classList.add('phi3-connected');
        }
        
        switch (status) {
            case 'connected':
                text.textContent = this.state.isPhi3 ? 'Phi-3 Ready' : 'Connected';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
        }
    }
    
    // ===== TAB NAVIGATION =====
    switchTab(e) {
        const tabId = e.currentTarget.dataset.tab;
        
        // Update active tab
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show corresponding content
        this.elements.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) content.classList.add('active');
        });
        
        this.state.currentTab = tabId;
        
        // Update flashcards display if needed
        if (tabId === 'flashcards') {
            this.updateFlashcardDisplay();
        }
    }
    
    // ===== CONCEPT EXPLAINER =====
    setDifficulty(e) {
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.state.currentDifficulty = e.currentTarget.dataset.level;
    }
    
    async generateExplanation() {
        const topic = this.elements.topicInput.value.trim();
        if (!topic) {
            this.showNotification('Please enter a topic to explain', 'warning');
            return;
        }
        
        if (topic.length > 500) {
            this.showNotification('Topic too long. Limited to 500 chars for Phi-3.', 'warning');
            this.elements.topicInput.value = topic.substring(0, 500);
            return;
        }
        
        this.showLoading(this.elements.explainOutput, 'Generating with Phi-3 Mini...');
        
        try {
            const response = await fetch(`${this.state.backendUrl}/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    difficulty: this.state.currentDifficulty,
                    model: this.state.model
                })
            });
            
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            
            const data = await response.json();
            this.renderExplanation(data);
            this.showNotification('Explanation generated with Phi-3!', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(this.elements.explainOutput, `
                <h4>Failed to generate explanation</h4>
                <p>Try:</p>
                <ul>
                    <li>Shorter topic (under 500 chars)</li>
                    <li>Check backend is running</li>
                    <li>Ensure Ollama is running</li>
                </ul>
            `);
            this.showNotification('Generation failed. Check console.', 'error');
        }
    }
    
    renderExplanation(data) {
        this.elements.explainOutput.innerHTML = `
            <div class="phi3-output">
                <div class="explanation-header">
                    <h3 style="color: var(--accent-primary);">${data.topic}</h3>
                    <div class="model-badge">${data.difficulty} • Phi-3</div>
                </div>
                
                <div class="section-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Simple Explanation</span>
                </div>
                <p>${data.simple_explanation}</p>
                
                <div class="section-header">
                    <i class="fas fa-list-ol"></i>
                    <span>Step-by-Step</span>
                </div>
                <ol>
                    ${data.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                
                <div class="section-header">
                    <i class="fas fa-lightbulb"></i>
                    <span>Real-World Analogy</span>
                </div>
                <div style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: var(--border-radius); margin: 0.5rem 0;">
                    <p>${data.analogy}</p>
                </div>
                
                <div class="section-header">
                    <i class="fas fa-key"></i>
                    <span>Key Points</span>
                </div>
                <ul>
                    ${data.key_points.map(point => `<li>${point}</li>`).join('')}
                </ul>
                
                <div class="performance-tip" style="margin-top: 1.5rem;">
                    <i class="fas fa-brain"></i>
                    <span>Generated by Phi-3 Mini (3.8B) - Optimized for concise educational content</span>
                </div>
            </div>
        `;
    }
    
    // ===== NOTES SUMMARIZER =====
    async summarizeNotes() {
        const notes = this.elements.notesInput.value.trim();
        if (!notes) {
            this.showNotification('Please enter notes to summarize', 'warning');
            return;
        }
        
        if (notes.length > 2000) {
            this.showNotification('Notes too long. Limited to 2000 chars.', 'info');
            this.elements.notesInput.value = notes.substring(0, 2000);
            return;
        }
        
        this.showLoading(this.elements.summaryOutput, 'Summarizing with Phi-3...');
        
        try {
            const response = await fetch(`${this.state.backendUrl}/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes,
                    length: document.getElementById('summaryLength').value,
                    model: this.state.model
                })
            });
            
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            
            const data = await response.json();
            this.renderSummary(data);
            this.showNotification('Notes summarized!', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(this.elements.summaryOutput, 'Failed to summarize. Try shorter notes.');
            this.showNotification('Summary failed', 'error');
        }
    }
    
    renderSummary(data) {
        this.elements.summaryOutput.innerHTML = `
            <div class="phi3-output">
                <div class="summary-header">
                    <h3 style="color: var(--accent-primary);">Summary</h3>
                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                        <span><i class="fas fa-ruler"></i> ${data.length}</span>
                        <span><i class="fas fa-brain"></i> Phi-3 Mini</span>
                    </div>
                </div>
                
                <div class="section-header">
                    <i class="fas fa-file-contract"></i>
                    <span>Overview</span>
                </div>
                <p>${data.summary}</p>
                
                ${data.key_points.length ? `
                <div class="section-header">
                    <i class="fas fa-key"></i>
                    <span>Key Points</span>
                </div>
                <ul>
                    ${data.key_points.map(point => `<li>${point}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${data.definitions.length ? `
                <div class="section-header">
                    <i class="fas fa-book"></i>
                    <span>Definitions</span>
                </div>
                <ul>
                    ${data.definitions.map(def => `<li><strong>${def.term}:</strong> ${def.definition}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${data.exam_tips.length ? `
                <div class="section-header">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Exam Tips</span>
                </div>
                <ul>
                    ${data.exam_tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
                ` : ''}
                
                <div class="performance-tip" style="margin-top: 1.5rem;">
                    <i class="fas fa-info-circle"></i>
                    <span>Phi-3 summary optimized for quick review and retention</span>
                </div>
            </div>
        `;
    }
    
    // ===== QUIZ GENERATOR =====
    async generateQuiz() {
        const content = this.elements.quizInput.value.trim();
        if (!content) {
            this.showNotification('Please enter content for quiz', 'warning');
            return;
        }
        
        if (content.length > 1000) {
            this.showNotification('Content too long. Limited to 1000 chars.', 'info');
            this.elements.quizInput.value = content.substring(0, 1000);
            return;
        }
        
        this.showLoading(this.elements.quizOutput, 'Creating quiz with Phi-3...');
        
        try {
            const response = await fetch(`${this.state.backendUrl}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type: document.getElementById('quizType').value,
                    difficulty: document.getElementById('quizDifficulty').value,
                    count: parseInt(document.getElementById('questionCount').value),
                    model: this.state.model
                })
            });
            
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            
            const data = await response.json();
            this.renderQuiz(data);
            this.showNotification(`Quiz generated with ${data.questions.length} questions!`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(this.elements.quizOutput, 'Failed to generate quiz. Try more focused content.');
            this.showNotification('Quiz generation failed', 'error');
        }
    }
    
    renderQuiz(data) {
        const questions = data.questions || [];
        
        this.elements.quizOutput.innerHTML = `
            <div class="phi3-output">
                <div class="quiz-header">
                    <h3 style="color: var(--accent-primary);">Generated Quiz</h3>
                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                        <span><i class="fas fa-question-circle"></i> ${questions.length} questions</span>
                        <span><i class="fas fa-tachometer-alt"></i> ${data.difficulty}</span>
                        <span><i class="fas fa-brain"></i> Phi-3</span>
                    </div>
                </div>
                
                ${questions.length === 0 ? `
                    <div class="error-state" style="height: auto; padding: 2rem;">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>No questions generated. Try more specific content.</p>
                    </div>
                ` : `
                    <div class="questions-container">
                        ${questions.map((q, i) => `
                            <div class="question-item" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--border-radius); margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <div style="background: var(--accent-primary); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                        ${i + 1}
                                    </div>
                                    <div style="font-size: 0.9rem; background: var(--bg-tertiary); padding: 0.25rem 0.75rem; border-radius: var(--border-radius);">
                                        ${q.type || 'question'}
                                    </div>
                                </div>
                                
                                <div style="font-size: 1.1rem; margin-bottom: 1rem; line-height: 1.5;">
                                    ${q.question}
                                </div>
                                
                                ${q.options ? `
                                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
                                    ${q.options.map((opt, j) => `
                                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                            <input type="radio" id="q${i}_opt${j}" name="q${i}" value="${j}">
                                            <label for="q${i}_opt${j}" style="flex: 1; cursor: pointer;">${opt}</label>
                                        </div>
                                    `).join('')}
                                </div>
                                ` : ''}
                                
                                <div style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: var(--border-radius); margin-top: 1rem; border-left: 3px solid var(--accent-primary);">
                                    <div><strong>Answer:</strong> ${q.answer}</div>
                                    ${q.explanation ? `<div style="margin-top: 0.5rem;"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="performance-tip" style="margin-top: 1.5rem;">
                        <i class="fas fa-info-circle"></i>
                        <span>Phi-3 generates best with 3-5 focused questions</span>
                    </div>
                `}
            </div>
        `;
    }
    
    // ===== FLASHCARDS =====
    async generateFlashcards() {
        const content = this.elements.flashcardsInput.value.trim();
        if (!content) {
            this.showNotification('Please enter content for flashcards', 'warning');
            return;
        }
        
        if (content.length > 800) {
            this.showNotification('Content too long. Limited to 800 chars.', 'info');
            this.elements.flashcardsInput.value = content.substring(0, 800);
            return;
        }
        
        try {
            const response = await fetch(`${this.state.backendUrl}/flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    count: 6,
                    model: this.state.model
                })
            });
            
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            
            const data = await response.json();
            this.state.flashcards = data.flashcards || [];
            this.state.currentFlashcardIndex = 0;
            this.state.isFlashcardFlipped = false;
            this.updateFlashcardDisplay();
            
            this.showNotification(`Generated ${this.state.flashcards.length} flashcards with Phi-3!`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Failed to generate flashcards', 'error');
        }
    }
    
    loadFlashcards() {
        try {
            const saved = localStorage.getItem('concepta_flashcards');
            if (saved) {
                this.state.flashcards = JSON.parse(saved);
                this.state.currentFlashcardIndex = 0;
                this.state.isFlashcardFlipped = false;
                this.updateFlashcardDisplay();
                this.showNotification(`Loaded ${this.state.flashcards.length} flashcards`, 'success');
            } else {
                this.showNotification('No saved flashcards found', 'info');
            }
        } catch (error) {
            this.showNotification('Failed to load flashcards', 'error');
        }
    }
    
    saveFlashcards() {
        if (this.state.flashcards.length === 0) {
            this.showNotification('No flashcards to save', 'warning');
            return;
        }
        
        try {
            localStorage.setItem('concepta_flashcards', JSON.stringify(this.state.flashcards));
            this.showNotification(`Saved ${this.state.flashcards.length} flashcards`, 'success');
        } catch (error) {
            this.showNotification('Failed to save flashcards', 'error');
        }
    }
    
    clearFlashcards() {
        if (this.state.flashcards.length === 0) return;
        
        if (confirm('Clear all flashcards?')) {
            this.state.flashcards = [];
            this.state.currentFlashcardIndex = 0;
            this.state.isFlashcardFlipped = false;
            this.updateFlashcardDisplay();
            this.showNotification('Flashcards cleared', 'info');
        }
    }
    
    updateFlashcardDisplay() {
        const { flashcards, currentFlashcardIndex, isFlashcardFlipped } = this.state;
        
        if (flashcards.length === 0) {
            this.elements.cardQuestion.innerHTML = '<p>Generate or load flashcards to begin.</p>';
            this.elements.cardAnswer.innerHTML = '<p>Flip to see answer.</p>';
            this.elements.currentCard.textContent = '0';
            this.elements.totalCards.textContent = '0';
            this.elements.flashcard.classList.remove('flipped');
            return;
        }
        
        const card = flashcards[currentFlashcardIndex];
        this.elements.cardQuestion.innerHTML = `<p>${card.question}</p>`;
        this.elements.cardAnswer.innerHTML = `<p>${card.answer}</p>`;
        this.elements.currentCard.textContent = currentFlashcardIndex + 1;
        this.elements.totalCards.textContent = flashcards.length;
        
        if (isFlashcardFlipped) {
            this.elements.flashcard.classList.add('flipped');
        } else {
            this.elements.flashcard.classList.remove('flipped');
        }
    }
    
    navigateFlashcard(direction) {
        if (this.state.flashcards.length === 0) return;
        
        let newIndex = this.state.currentFlashcardIndex + direction;
        if (newIndex < 0) newIndex = this.state.flashcards.length - 1;
        if (newIndex >= this.state.flashcards.length) newIndex = 0;
        
        this.state.currentFlashcardIndex = newIndex;
        this.state.isFlashcardFlipped = false;
        this.updateFlashcardDisplay();
    }
    
    flipFlashcard() {
        this.state.isFlashcardFlipped = !this.state.isFlashcardFlipped;
        this.updateFlashcardDisplay();
    }
    
    shuffleFlashcards() {
        if (this.state.flashcards.length === 0) return;
        
        for (let i = this.state.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.flashcards[i], this.state.flashcards[j]] = [this.state.flashcards[j], this.state.flashcards[i]];
        }
        
        this.state.currentFlashcardIndex = 0;
        this.state.isFlashcardFlipped = false;
        this.updateFlashcardDisplay();
        this.showNotification('Flashcards shuffled!', 'success');
    }
    
    markFlashcardDifficulty(difficulty) {
        if (this.state.flashcards.length === 0) return;
        this.showNotification(`Marked as ${difficulty}`, 'success');
    }
    
    // ===== SETTINGS & THEME =====
    loadSettings() {
        try {
            const saved = localStorage.getItem('concepta_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.state.theme = settings.theme || 'dark';
                this.state.model = settings.model || 'phi3:mini';
                this.state.apiUrl = settings.apiUrl || 'http://localhost:11434';
                this.state.isPhi3 = this.state.model.startsWith('phi3');
                
                this.elements.modelSelect.value = this.state.model;
                this.elements.apiUrl.value = this.state.apiUrl;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    saveSettings() {
        const settings = {
            theme: this.state.theme,
            model: this.elements.modelSelect.value,
            apiUrl: this.elements.apiUrl.value
        };
        
        try {
            localStorage.setItem('concepta_settings', JSON.stringify(settings));
            this.state.model = settings.model;
            this.state.apiUrl = settings.apiUrl;
            this.state.isPhi3 = this.state.model.startsWith('phi3');
            
            this.closeSettings();
            this.showNotification(`Using ${settings.model}`, 'success');
            this.checkOllama();
            
        } catch (error) {
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('concepta_theme') || this.state.theme;
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('concepta_theme', theme);
        
        this.elements.themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) option.classList.add('active');
        });
    }
    
    toggleTheme() {
        this.setTheme(this.state.theme === 'dark' ? 'light' : 'dark');
    }
    
    selectThemeOption(e) {
        this.setTheme(e.currentTarget.dataset.theme);
    }
    
    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }
    
    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }
    
    // ===== UTILITIES =====
    showLoading(element, message) {
        element.innerHTML = `
            <div class="loading-state phi3-optimized">
                <div class="loading-spinner-small"></div>
                <p>${message}</p>
                <p style="font-size: 0.9rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                    Phi-3 Mini (3.8B) • ~2-5 seconds
                </p>
            </div>
        `;
    }
    
    showError(element, message) {
        element.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                ${typeof message === 'string' ? `<p>${message}</p>` : message}
                <button class="secondary-btn" onclick="location.reload()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
    
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    handleKeyboardShortcuts(e) {
        if (e.target.matches('textarea, input, select')) return;
        
        switch (e.key) {
            case '1':
            case '2':
            case '3':
            case '4':
                const index = parseInt(e.key) - 1;
                const tabs = Array.from(this.elements.tabs);
                if (tabs[index]) tabs[index].click();
                break;
            case 't':
                if (e.ctrlKey) {
                    this.toggleTheme();
                    e.preventDefault();
                }
                break;
            case 'Escape':
                this.closeSettings();
                break;
            case 'ArrowLeft':
                if (this.state.currentTab === 'flashcards') this.navigateFlashcard(-1);
                break;
            case 'ArrowRight':
                if (this.state.currentTab === 'flashcards') this.navigateFlashcard(1);
                break;
            case ' ':
                if (this.state.currentTab === 'flashcards') {
                    this.flipFlashcard();
                    e.preventDefault();
                }
                break;
        }
    }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    window.conceptaApp = new ConceptaApp();
});