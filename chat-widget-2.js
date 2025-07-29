{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww29740\viewh18600\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Enhanced Interactive Chat Widget for n8n\
(function() \{\
    'use strict';\
    \
    // Initialize widget only once\
    if (window.N8nChatWidgetLoaded) return;\
    window.N8nChatWidgetLoaded = true;\
\
    // Configuration with internationalization support\
    const defaultTranslations = \{\
        en: \{\
            startChat: 'Start Chat',\
            needHelp: 'Need Help?',\
            enterDetails: 'Enter your details to start chatting',\
            name: 'Name',\
            email: 'Email',\
            namePlaceholder: 'Your name',\
            emailPlaceholder: 'Your email address',\
            continueChat: 'Continue to Chat',\
            messagePlaceholder: 'Type a message...',\
            nameRequired: 'Please enter your name',\
            emailRequired: 'Please enter your email',\
            emailInvalid: 'Please enter a valid email address',\
            connectionError: "Sorry, I couldn't connect to the server. Please try again later.",\
            sendError: "Sorry, I couldn't send your message. Please try again.",\
            retryButton: 'Retry',\
            close: '\'d7'\
        \},\
        sl: \{\
            startChat: 'Za\uc0\u269 ni klepet',\
            needHelp: 'Rabi\'9a pomo\uc0\u269 ?',\
            enterDetails: 'Vnesite podatke za za\uc0\u269 etek klepeta',\
            name: 'Ime',\
            email: 'Email',\
            namePlaceholder: 'Va\'9ae ime',\
            emailPlaceholder: 'Va\'9a email naslov',\
            continueChat: 'Nadaljuj s klepetom',\
            messagePlaceholder: 'Vnesite sporo\uc0\u269 ilo...',\
            nameRequired: 'Prosimo vnesite va\'9ae ime',\
            emailRequired: 'Prosimo vnesite va\'9a email',\
            emailInvalid: 'Prosimo vnesite veljaven email naslov',\
            connectionError: "Oprostite, povezava s stre\'9enikom ni uspe\'9ana. Poskusite kasneje.",\
            sendError: "Oprostite, sporo\uc0\u269 ila ni bilo mogo\u269 e poslati. Poskusite znova.",\
            retryButton: 'Poskusi znova',\
            close: '\'d7'\
        \}\
    \};\
\
    // Default configuration\
    const defaultSettings = \{\
        webhook: \{\
            url: '',\
            route: ''\
        \},\
        style: \{\
            primaryColor: '#10b981',\
            secondaryColor: '#059669',\
            position: 'right',\
            backgroundColor: '#ffffff',\
            fontColor: '#1f2937'\
        \},\
        branding: \{\
            name: 'Chat Assistant',\
            logo: '',\
            welcomeText: 'How can we help you today?',\
            responseTimeText: 'We typically reply instantly'\
        \},\
        suggestedQuestions: [],\
        language: 'en',\
        timeout: 30000,\
        retryAttempts: 3,\
        enableXSSProtection: true\
    \};\
\
    // Merge user settings with defaults\
    const settings = window.ChatWidgetConfig ? \
        mergeDeep(defaultSettings, window.ChatWidgetConfig) : defaultSettings;\
\
    // Get translations for current language\
    const t = defaultTranslations[settings.language] || defaultTranslations.en;\
\
    // Utility functions\
    function mergeDeep(target, source) \{\
        const output = Object.assign(\{\}, target);\
        if (isObject(target) && isObject(source)) \{\
            Object.keys(source).forEach(key => \{\
                if (isObject(source[key])) \{\
                    if (!(key in target))\
                        Object.assign(output, \{ [key]: source[key] \});\
                    else\
                        output[key] = mergeDeep(target[key], source[key]);\
                \} else \{\
                    Object.assign(output, \{ [key]: source[key] \});\
                \}\
            \});\
        \}\
        return output;\
    \}\
\
    function isObject(item) \{\
        return item && typeof item === 'object' && !Array.isArray(item);\
    \}\
\
    // Enhanced XSS protection\
    function sanitizeHTML(str) \{\
        if (!settings.enableXSSProtection) return str;\
        \
        const temp = document.createElement('div');\
        temp.textContent = str;\
        return temp.innerHTML;\
    \}\
\
    // Enhanced URL detection and linkification\
    function linkifyText(text) \{\
        if (!text) return '';\
        \
        // More comprehensive URL pattern\
        const urlPattern = /(https?:\\/\\/(?:[-\\w.])+(?:\\:[0-9]+)?(?:\\/(?:[\\w\\/_.])*(?:\\?(?:[\\w&=%.])*)?(?:\\#(?:[\\w.])*)?)?)/gi;\
        \
        // Sanitize text first, then apply linkification\
        const sanitized = sanitizeHTML(text);\
        \
        return sanitized.replace(urlPattern, function(url) \{\
            // Additional URL validation\
            try \{\
                new URL(url);\
                return `<a href="$\{url\}" target="_blank" rel="noopener noreferrer" class="chat-link">$\{url\}</a>`;\
            \} catch \{\
                return url; // Return original if invalid URL\
            \}\
        \});\
    \}\
\
    // Enhanced email validation\
    function isValidEmail(email) \{\
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`\{|\}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]\{0,61\}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]\{0,61\}[a-zA-Z0-9])?)*$/;\
        return emailRegex.test(email) && email.length <= 254;\
    \}\
\
    // Retry mechanism with exponential backoff\
    async function fetchWithRetry(url, options, attempt = 1) \{\
        try \{\
            const controller = new AbortController();\
            const timeoutId = setTimeout(() => controller.abort(), settings.timeout);\
            \
            const response = await fetch(url, \{\
                ...options,\
                signal: controller.signal\
            \});\
            \
            clearTimeout(timeoutId);\
            \
            if (!response.ok) \{\
                throw new Error(`HTTP error! status: $\{response.status\}`);\
            \}\
            \
            return await response.json();\
        \} catch (error) \{\
            if (attempt < settings.retryAttempts && !error.name === 'AbortError') \{\
                // Exponential backoff: 1s, 2s, 4s\
                const delay = Math.pow(2, attempt - 1) * 1000;\
                await new Promise(resolve => setTimeout(resolve, delay));\
                return fetchWithRetry(url, options, attempt + 1);\
            \}\
            throw error;\
        \}\
    \}\
\
    // Load external resources with error handling\
    function loadFont() \{\
        return new Promise((resolve) => \{\
            const fontElement = document.createElement('link');\
            fontElement.rel = 'stylesheet';\
            fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';\
            fontElement.onload = resolve;\
            fontElement.onerror = resolve; // Continue even if font fails to load\
            document.head.appendChild(fontElement);\
        \});\
    \}\
\
    // Modular CSS generation\
    function generateCSS() \{\
        return `\
            $\{generateBaseStyles()\}\
            $\{generateLayoutStyles()\}\
            $\{generateComponentStyles()\}\
            $\{generateAnimationStyles()\}\
            $\{generateResponsiveStyles()\}\
        `;\
    \}\
\
    function generateBaseStyles() \{\
        return `\
            .chat-assist-widget \{\
                --chat-color-primary: var(--chat-widget-primary, $\{settings.style.primaryColor\});\
                --chat-color-secondary: var(--chat-widget-secondary, $\{settings.style.secondaryColor\});\
                --chat-color-surface: var(--chat-widget-surface, $\{settings.style.backgroundColor\});\
                --chat-color-text: var(--chat-widget-text, $\{settings.style.fontColor\});\
                --chat-color-text-light: #6b7280;\
                --chat-color-border: #e5e7eb;\
                --chat-color-light: #d1fae5;\
                --chat-color-error: #ef4444;\
                --chat-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);\
                --chat-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.15);\
                --chat-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);\
                --chat-radius-sm: 8px;\
                --chat-radius-md: 12px;\
                --chat-radius-lg: 20px;\
                --chat-radius-full: 9999px;\
                --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\
                font-size: 14px;\
                line-height: 1.5;\
            \}\
        `;\
    \}\
\
    function generateLayoutStyles() \{\
        return `\
            .chat-assist-widget .chat-window \{\
                position: fixed;\
                bottom: 90px;\
                z-index: 1000;\
                width: min(380px, calc(100vw - 40px));\
                height: min(580px, calc(100vh - 120px));\
                background: var(--chat-color-surface);\
                border-radius: var(--chat-radius-lg);\
                box-shadow: var(--chat-shadow-lg);\
                border: 1px solid var(--chat-color-light);\
                overflow: hidden;\
                display: none;\
                flex-direction: column;\
                transition: var(--chat-transition);\
                opacity: 0;\
                transform: translateY(20px) scale(0.95);\
            \}\
\
            .chat-assist-widget .chat-window.right-side \{\
                right: 20px;\
            \}\
\
            .chat-assist-widget .chat-window.left-side \{\
                left: 20px;\
            \}\
\
            .chat-assist-widget .chat-window.visible \{\
                display: flex;\
                opacity: 1;\
                transform: translateY(0) scale(1);\
            \}\
        `;\
    \}\
\
    function generateComponentStyles() \{\
        return `\
            .chat-assist-widget .chat-header \{\
                padding: 16px;\
                display: flex;\
                align-items: center;\
                gap: 12px;\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                position: relative;\
                flex-shrink: 0;\
            \}\
\
            .chat-assist-widget .chat-header-logo \{\
                width: 32px;\
                height: 32px;\
                border-radius: var(--chat-radius-sm);\
                object-fit: contain;\
                background: transparent;\
                padding: 4px;\
            \}\
\
            .chat-assist-widget .chat-header-title \{\
                font-size: 16px;\
                font-weight: 600;\
                color: white;\
                flex: 1;\
            \}\
\
            .chat-assist-widget .chat-close-btn \{\
                background: rgba(255, 255, 255, 0.2);\
                border: none;\
                color: white;\
                cursor: pointer;\
                padding: 4px;\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                transition: var(--chat-transition);\
                font-size: 18px;\
                border-radius: var(--chat-radius-full);\
                width: 28px;\
                height: 28px;\
                flex-shrink: 0;\
            \}\
\
            .chat-assist-widget .chat-close-btn:hover \{\
                background: rgba(255, 255, 255, 0.3);\
                transform: scale(1.1);\
            \}\
\
            .chat-assist-widget .chat-bubble \{\
                padding: 14px 18px;\
                border-radius: var(--chat-radius-md);\
                max-width: 85%;\
                word-wrap: break-word;\
                font-size: 14px;\
                line-height: 1.6;\
                position: relative;\
                white-space: pre-line;\
            \}\
\
            .chat-assist-widget .chat-bubble.user-bubble \{\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                align-self: flex-end;\
                border-bottom-right-radius: 4px;\
                box-shadow: var(--chat-shadow-sm);\
            \}\
\
            .chat-assist-widget .chat-bubble.bot-bubble \{\
                background: white;\
                color: var(--chat-color-text);\
                align-self: flex-start;\
                border-bottom-left-radius: 4px;\
                box-shadow: var(--chat-shadow-sm);\
                border: 1px solid var(--chat-color-light);\
            \}\
\
            .chat-assist-widget .chat-bubble.error-bubble \{\
                background: #fef2f2;\
                color: var(--chat-color-error);\
                border: 1px solid #fecaca;\
            \}\
\
            .chat-assist-widget .retry-btn \{\
                background: var(--chat-color-error);\
                color: white;\
                border: none;\
                padding: 8px 16px;\
                border-radius: var(--chat-radius-sm);\
                cursor: pointer;\
                font-size: 12px;\
                margin-top: 8px;\
                transition: var(--chat-transition);\
            \}\
\
            .chat-assist-widget .retry-btn:hover \{\
                background: #dc2626;\
            \}\
\
            .chat-assist-widget .chat-link \{\
                color: var(--chat-color-primary);\
                text-decoration: underline;\
                word-break: break-all;\
                transition: var(--chat-transition);\
            \}\
\
            .chat-assist-widget .chat-link:hover \{\
                color: var(--chat-color-secondary);\
            \}\
\
            .chat-assist-widget .form-input.error \{\
                border-color: var(--chat-color-error);\
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);\
            \}\
\
            .chat-assist-widget .error-text \{\
                font-size: 12px;\
                color: var(--chat-color-error);\
                margin-top: 2px;\
            \}\
        `;\
    \}\
\
    function generateAnimationStyles() \{\
        return `\
            .chat-assist-widget .typing-indicator \{\
                display: flex;\
                align-items: center;\
                gap: 4px;\
                padding: 14px 18px;\
                background: white;\
                border-radius: var(--chat-radius-md);\
                border-bottom-left-radius: 4px;\
                max-width: 80px;\
                align-self: flex-start;\
                box-shadow: var(--chat-shadow-sm);\
                border: 1px solid var(--chat-color-light);\
            \}\
\
            .chat-assist-widget .typing-dot \{\
                width: 8px;\
                height: 8px;\
                background: var(--chat-color-primary);\
                border-radius: var(--chat-radius-full);\
                opacity: 0.7;\
                animation: typingAnimation 1.4s infinite ease-in-out;\
            \}\
\
            .chat-assist-widget .typing-dot:nth-child(1) \{\
                animation-delay: 0s;\
            \}\
\
            .chat-assist-widget .typing-dot:nth-child(2) \{\
                animation-delay: 0.2s;\
            \}\
\
            .chat-assist-widget .typing-dot:nth-child(3) \{\
                animation-delay: 0.4s;\
            \}\
\
            @keyframes typingAnimation \{\
                0%, 60%, 100% \{\
                    transform: translateY(0);\
                    opacity: 0.7;\
                \}\
                30% \{\
                    transform: translateY(-4px);\
                    opacity: 1;\
                \}\
            \}\
\
            .chat-assist-widget .slide-in \{\
                animation: slideIn 0.3s ease-out forwards;\
            \}\
\
            @keyframes slideIn \{\
                from \{\
                    opacity: 0;\
                    transform: translateY(20px);\
                \}\
                to \{\
                    opacity: 1;\
                    transform: translateY(0);\
                \}\
            \}\
        `;\
    \}\
\
    function generateResponsiveStyles() \{\
        return `\
            @media (max-width: 480px) \{\
                .chat-assist-widget .chat-window \{\
                    width: calc(100vw - 20px);\
                    height: calc(100vh - 100px);\
                    bottom: 80px;\
                    left: 10px !important;\
                    right: 10px !important;\
                \}\
\
                .chat-assist-widget .chat-launcher \{\
                    left: 20px !important;\
                    right: 20px !important;\
                    width: calc(100% - 40px);\
                    justify-content: center;\
                \}\
\
                .chat-assist-widget .chat-bubble \{\
                    max-width: 90%;\
                \}\
            \}\
\
            @media (prefers-reduced-motion: reduce) \{\
                .chat-assist-widget * \{\
                    animation-duration: 0.01ms !important;\
                    animation-iteration-count: 1 !important;\
                    transition-duration: 0.01ms !important;\
                \}\
            \}\
        `;\
    \}\
\
    // Enhanced session management\
    class SessionManager \{\
        constructor() \{\
            this.conversationId = '';\
            this.isWaitingForResponse = false;\
            this.userData = \{\};\
        \}\
\
        createSessionId() \{\
            return crypto.randomUUID();\
        \}\
\
        setUserData(name, email) \{\
            this.userData = \{ name, email \};\
        \}\
\
        isInitialized() \{\
            return !!this.conversationId;\
        \}\
\
        initialize() \{\
            this.conversationId = this.createSessionId();\
        \}\
    \}\
\
    // Enhanced UI Controller\
    class UIController \{\
        constructor(widgetRoot, sessionManager) \{\
            this.widgetRoot = widgetRoot;\
            this.sessionManager = sessionManager;\
            this.elements = \{\};\
            this.setupElements();\
            this.setupEventListeners();\
        \}\
\
        setupElements() \{\
            this.elements = \{\
                chatWindow: this.widgetRoot.querySelector('.chat-window'),\
                launchButton: this.widgetRoot.querySelector('.chat-launcher'),\
                startChatButton: this.widgetRoot.querySelector('.chat-start-btn'),\
                chatBody: this.widgetRoot.querySelector('.chat-body'),\
                messagesContainer: this.widgetRoot.querySelector('.chat-messages'),\
                messageTextarea: this.widgetRoot.querySelector('.chat-textarea'),\
                sendButton: this.widgetRoot.querySelector('.chat-submit'),\
                registrationForm: this.widgetRoot.querySelector('.registration-form'),\
                userRegistration: this.widgetRoot.querySelector('.user-registration'),\
                chatWelcome: this.widgetRoot.querySelector('.chat-welcome'),\
                nameInput: this.widgetRoot.querySelector('#chat-user-name'),\
                emailInput: this.widgetRoot.querySelector('#chat-user-email'),\
                nameError: this.widgetRoot.querySelector('#name-error'),\
                emailError: this.widgetRoot.querySelector('#email-error'),\
                closeButton: this.widgetRoot.querySelector('.chat-close-btn')\
            \};\
        \}\
\
        setupEventListeners() \{\
            this.elements.launchButton.addEventListener('click', () => this.toggleChat());\
            this.elements.closeButton.addEventListener('click', () => this.closeChat());\
            this.elements.startChatButton.addEventListener('click', () => this.showRegistrationForm());\
            this.elements.registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));\
            this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());\
            this.elements.messageTextarea.addEventListener('input', () => this.autoResizeTextarea());\
            this.elements.messageTextarea.addEventListener('keypress', (e) => this.handleKeyPress(e));\
        \}\
\
        toggleChat() \{\
            this.elements.chatWindow.classList.toggle('visible');\
            if (this.elements.chatWindow.classList.contains('visible')) \{\
                this.elements.messageTextarea.focus();\
            \}\
        \}\
\
        closeChat() \{\
            this.elements.chatWindow.classList.remove('visible');\
        \}\
\
        showRegistrationForm() \{\
            this.elements.chatWelcome.style.display = 'none';\
            this.elements.userRegistration.classList.add('active');\
            this.elements.nameInput.focus();\
        \}\
\
        autoResizeTextarea() \{\
            const textarea = this.elements.messageTextarea;\
            textarea.style.height = 'auto';\
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';\
        \}\
\
        handleKeyPress(event) \{\
            if (event.key === 'Enter' && !event.shiftKey) \{\
                event.preventDefault();\
                this.handleSendMessage();\
            \}\
        \}\
\
        async handleRegistration(event) \{\
            event.preventDefault();\
            \
            this.clearErrors();\
            \
            const name = this.elements.nameInput.value.trim();\
            const email = this.elements.emailInput.value.trim();\
            \
            if (!this.validateRegistration(name, email)) return;\
            \
            try \{\
                this.sessionManager.setUserData(name, email);\
                this.sessionManager.initialize();\
                \
                await this.initializeChat();\
                \
                this.elements.userRegistration.classList.remove('active');\
                this.elements.chatBody.classList.add('active');\
                \
            \} catch (error) \{\
                this.showError(t.connectionError);\
            \}\
        \}\
\
        validateRegistration(name, email) \{\
            let isValid = true;\
            \
            if (!name) \{\
                this.showFieldError('name', t.nameRequired);\
                isValid = false;\
            \}\
            \
            if (!email) \{\
                this.showFieldError('email', t.emailRequired);\
                isValid = false;\
            \} else if (!isValidEmail(email)) \{\
                this.showFieldError('email', t.emailInvalid);\
                isValid = false;\
            \}\
            \
            return isValid;\
        \}\
\
        clearErrors() \{\
            this.elements.nameError.textContent = '';\
            this.elements.emailError.textContent = '';\
            this.elements.nameInput.classList.remove('error');\
            this.elements.emailInput.classList.remove('error');\
        \}\
\
        showFieldError(field, message) \{\
            const errorElement = this.elements[`$\{field\}Error`];\
            const inputElement = this.elements[`$\{field\}Input`];\
            \
            errorElement.textContent = message;\
            inputElement.classList.add('error');\
        \}\
\
        async handleSendMessage() \{\
            const messageText = this.elements.messageTextarea.value.trim();\
            if (!messageText || this.sessionManager.isWaitingForResponse) return;\
            \
            try \{\
                await this.sendMessage(messageText);\
                this.elements.messageTextarea.value = '';\
                this.autoResizeTextarea();\
            \} catch (error) \{\
                this.showError(t.sendError, true);\
            \}\
        \}\
\
        async sendMessage(message) \{\
            this.sessionManager.isWaitingForResponse = true;\
            \
            this.addMessage(message, 'user');\
            const typingIndicator = this.showTypingIndicator();\
            \
            try \{\
                const response = await this.sendToWebhook(message);\
                this.removeTypingIndicator(typingIndicator);\
                \
                const responseText = Array.isArray(response) ? response[0].output : response.output;\
                this.addMessage(responseText, 'bot');\
                \
            \} catch (error) \{\
                this.removeTypingIndicator(typingIndicator);\
                this.showError(t.sendError, true, () => this.sendMessage(message));\
                throw error;\
            \} finally \{\
                this.sessionManager.isWaitingForResponse = false;\
            \}\
        \}\
\
        async sendToWebhook(message) \{\
            const requestData = \{\
                action: "sendMessage",\
                sessionId: this.sessionManager.conversationId,\
                route: settings.webhook.route,\
                chatInput: message,\
                metadata: \{\
                    userId: this.sessionManager.userData.email,\
                    userName: this.sessionManager.userData.name\
                \}\
            \};\
\
            return await fetchWithRetry(settings.webhook.url, \{\
                method: 'POST',\
                headers: \{\
                    'Content-Type': 'application/json'\
                \},\
                body: JSON.stringify(requestData)\
            \});\
        \}\
\
        addMessage(text, type) \{\
            const message = document.createElement('div');\
            message.className = `chat-bubble $\{type\}-bubble slide-in`;\
            \
            if (type === 'bot') \{\
                message.innerHTML = linkifyText(text);\
            \} else \{\
                message.textContent = text;\
            \}\
            \
            this.elements.messagesContainer.appendChild(message);\
            this.scrollToBottom();\
        \}\
\
        showError(message, showRetry = false, retryCallback = null) \{\
            const errorMessage = document.createElement('div');\
            errorMessage.className = 'chat-bubble bot-bubble error-bubble slide-in';\
            errorMessage.textContent = message;\
            \
            if (showRetry && retryCallback) \{\
                const retryButton = document.createElement('button');\
                retryButton.className = 'retry-btn';\
                retryButton.textContent = t.retryButton;\
                retryButton.onclick = retryCallback;\
                errorMessage.appendChild(retryButton);\
            \}\
            \
            this.elements.messagesContainer.appendChild(errorMessage);\
            this.scrollToBottom();\
        \}\
\
        showTypingIndicator() \{\
            const indicator = document.createElement('div');\
            indicator.className = 'typing-indicator slide-in';\
            indicator.innerHTML = `\
                <div class="typing-dot"></div>\
                <div class="typing-dot"></div>\
                <div class="typing-dot"></div>\
            `;\
            this.elements.messagesContainer.appendChild(indicator);\
            this.scrollToBottom();\
            return indicator;\
        \}\
\
        removeTypingIndicator(indicator) \{\
            if (indicator && indicator.parentNode) \{\
                indicator.parentNode.removeChild(indicator);\
            \}\
        \}\
\
        scrollToBottom() \{\
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;\
        \}\
\
        async initializeChat() \{\
            const typingIndicator = this.showTypingIndicator();\
            \
            try \{\
                // Load session\
                await this.loadSession();\
                \
                // Send user info\
                const userInfoMessage = `Name: $\{this.sessionManager.userData.name\}\\nEmail: $\{this.sessionManager.userData.email\}`;\
                const response = await this.sendToWebhook(userInfoMessage);\
                \
                this.removeTypingIndicator(typingIndicator);\
                \
                const responseText = Array.isArray(response) ? response[0].output : response.output;\
                this.addMessage(responseText, 'bot');\
                \
                this.addSuggestedQuestions();\
                \
            \} catch (error) \{\
                this.removeTypingIndicator(typingIndicator);\
                throw error;\
            \}\
        \}\
\
        async loadSession() \{\
            const sessionData = [\{\
                action: "loadPreviousSession",\
                sessionId: this.sessionManager.conversationId,\
                route: settings.webhook.route,\
                metadata: \{\
                    userId: this.sessionManager.userData.email,\
                    userName: this.sessionManager.userData.name\
                \}\
            \}];\
\
            return await fetchWithRetry(settings.webhook.url, \{\
                method: 'POST',\
                headers: \{\
                    'Content-Type': 'application/json'\
                \},\
                body: JSON.stringify(sessionData)\
            \});\
        \}\
\
        addSuggestedQuestions() \{\
            if (!settings.suggestedQuestions || !Array.isArray(settings.suggestedQuestions) || settings.suggestedQuestions.length === 0) \{\
                return;\
            \}\
\
            const container = document.createElement('div');\
            container.className = 'suggested-questions slide-in';\
            \
            settings.suggestedQuestions.forEach(question => \{\
                const button = document.createElement('button');\
                button.className = 'suggested-question-btn';\
                button.textContent = question;\
                button.addEventListener('click', () => \{\
                    this.sendMessage(question);\
                    if (container.parentNode) \{\
                        container.parentNode.removeChild(container);\
                    \}\
                \});\
                container.appendChild(button);\
            \});\
            \
            this.elements.messagesContainer.appendChild(container);\
            this.scrollToBottom();\
        \}\
    \}\
\
    // Generate HTML structure\
    function generateHTML() \{\
        return `\
            <div class="chat-window $\{settings.style.position === 'left' ? 'left-side' : 'right-side'\}">\
                <div class="chat-header">\
                    $\{settings.branding.logo ? `<img class="chat-header-logo" src="$\{settings.branding.logo\}" alt="$\{settings.branding.name\}">` : ''\}\
                    <span class="chat-header-title">$\{settings.branding.name\}</span>\
                    <button class="chat-close-btn" aria-label="$\{t.close\}">$\{t.close\}</button>\
                </div>\
                <div class="chat-welcome">\
                    <h2 class="chat-welcome-title">$\{settings.branding.welcomeText\}</h2>\
                    <button class="chat-start-btn">\
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>\
                        </svg>\
                        $\{t.startChat\}\
                    </button>\
                    <p class="chat-response-time">$\{settings.branding.responseTimeText\}</p>\
                </div>\
                <div class="user-registration">\
                    <h2 class="registration-title">$\{t.enterDetails\}</h2>\
                    <form class="registration-form">\
                        <div class="form-field">\
                            <label class="form-label" for="chat-user-name">$\{t.name\}</label>\
                            <input type="text" id="chat-user-name" class="form-input" placeholder="$\{t.namePlaceholder\}" required>\
                            <div class="error-text" id="name-error"></div>\
                        </div>\
                        <div class="form-field">\
                            <label class="form-label" for="chat-user-email">$\{t.email\}</label>\
                            <input type="email" id="chat-user-email" class="form-input" placeholder="$\{t.emailPlaceholder\}" required>\
                            <div class="error-text" id="email-error"></div>\
                        </div>\
                        <button type="submit" class="submit-registration">$\{t.continueChat\}</button>\
                    </form>\
                </div>\
                <div class="chat-body">\
                    <div class="chat-messages"></div>\
                    <div class="chat-controls">\
                        <textarea class="chat-textarea" placeholder="$\{t.messagePlaceholder\}" rows="1"></textarea>\
                        <button class="chat-submit" aria-label="Send message">\
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                                <path d="M22 2L11 13"></path>\
                                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>\
                            </svg>\
                        </button>\
                    </div>\
                    <div class="chat-footer"></div>\
                </div>\
            </div>\
            <button class="chat-launcher $\{settings.style.position === 'left' ? 'left-side' : 'right-side'\}" aria-label="$\{t.needHelp\}">\
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>\
                </svg>\
                <span class="chat-launcher-text">$\{t.needHelp\}</span>\
            </button>\
        `;\
    \}\
\
    // Missing CSS for additional components\
    function generateAdditionalCSS() \{\
        return `\
            .chat-assist-widget .chat-welcome \{\
                position: absolute;\
                top: 50%;\
                left: 50%;\
                transform: translate(-50%, -50%);\
                padding: 24px;\
                text-align: center;\
                width: 100%;\
                max-width: 320px;\
            \}\
\
            .chat-assist-widget .chat-welcome-title \{\
                font-size: 22px;\
                font-weight: 700;\
                color: var(--chat-color-text);\
                margin-bottom: 24px;\
                line-height: 1.3;\
            \}\
\
            .chat-assist-widget .chat-start-btn \{\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                gap: 10px;\
                width: 100%;\
                padding: 14px 20px;\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                border: none;\
                border-radius: var(--chat-radius-md);\
                cursor: pointer;\
                font-size: 15px;\
                transition: var(--chat-transition);\
                font-weight: 600;\
                font-family: inherit;\
                margin-bottom: 16px;\
                box-shadow: var(--chat-shadow-md);\
            \}\
\
            .chat-assist-widget .chat-start-btn:hover \{\
                transform: translateY(-2px);\
                box-shadow: var(--chat-shadow-lg);\
            \}\
\
            .chat-assist-widget .chat-response-time \{\
                font-size: 14px;\
                color: var(--chat-color-text-light);\
                margin: 0;\
            \}\
\
            .chat-assist-widget .chat-body \{\
                display: none;\
                flex-direction: column;\
                height: 100%;\
            \}\
\
            .chat-assist-widget .chat-body.active \{\
                display: flex;\
            \}\
\
            .chat-assist-widget .chat-messages \{\
                flex: 1;\
                overflow-y: auto;\
                padding: 20px;\
                background: #f9fafb;\
                display: flex;\
                flex-direction: column;\
                gap: 12px;\
            \}\
\
            .chat-assist-widget .chat-messages::-webkit-scrollbar \{\
                width: 6px;\
            \}\
\
            .chat-assist-widget .chat-messages::-webkit-scrollbar-track \{\
                background: transparent;\
            \}\
\
            .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb \{\
                background-color: rgba(16, 185, 129, 0.3);\
                border-radius: var(--chat-radius-full);\
            \}\
\
            .chat-assist-widget .chat-controls \{\
                padding: 16px;\
                background: var(--chat-color-surface);\
                border-top: 1px solid var(--chat-color-border);\
                display: flex;\
                gap: 10px;\
                flex-shrink: 0;\
            \}\
\
            .chat-assist-widget .chat-textarea \{\
                flex: 1;\
                padding: 14px 16px;\
                border: 1px solid var(--chat-color-border);\
                border-radius: var(--chat-radius-md);\
                background: var(--chat-color-surface);\
                color: var(--chat-color-text);\
                resize: none;\
                font-family: inherit;\
                font-size: 14px;\
                line-height: 1.5;\
                max-height: 120px;\
                min-height: 48px;\
                transition: var(--chat-transition);\
            \}\
\
            .chat-assist-widget .chat-textarea:focus \{\
                outline: none;\
                border-color: var(--chat-color-primary);\
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);\
            \}\
\
            .chat-assist-widget .chat-textarea::placeholder \{\
                color: var(--chat-color-text-light);\
            \}\
\
            .chat-assist-widget .chat-submit \{\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                border: none;\
                border-radius: var(--chat-radius-md);\
                width: 48px;\
                height: 48px;\
                cursor: pointer;\
                transition: var(--chat-transition);\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                flex-shrink: 0;\
                box-shadow: var(--chat-shadow-sm);\
            \}\
\
            .chat-assist-widget .chat-submit:hover \{\
                transform: scale(1.05);\
                box-shadow: var(--chat-shadow-md);\
            \}\
\
            .chat-assist-widget .chat-submit svg \{\
                width: 22px;\
                height: 22px;\
            \}\
\
            .chat-assist-widget .chat-launcher \{\
                position: fixed;\
                bottom: 20px;\
                height: 56px;\
                border-radius: var(--chat-radius-full);\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                border: none;\
                cursor: pointer;\
                box-shadow: var(--chat-shadow-md);\
                z-index: 999;\
                transition: var(--chat-transition);\
                display: flex;\
                align-items: center;\
                padding: 0 20px 0 16px;\
                gap: 8px;\
            \}\
\
            .chat-assist-widget .chat-launcher.right-side \{\
                right: 20px;\
            \}\
\
            .chat-assist-widget .chat-launcher.left-side \{\
                left: 20px;\
            \}\
\
            .chat-assist-widget .chat-launcher:hover \{\
                transform: scale(1.05);\
                box-shadow: var(--chat-shadow-lg);\
            \}\
\
            .chat-assist-widget .chat-launcher svg \{\
                width: 24px;\
                height: 24px;\
            \}\
            \
            .chat-assist-widget .chat-launcher-text \{\
                font-weight: 600;\
                font-size: 15px;\
                white-space: nowrap;\
            \}\
\
            .chat-assist-widget .chat-footer \{\
                padding: 10px;\
                text-align: center;\
                background: var(--chat-color-surface);\
                border-top: 1px solid var(--chat-color-border);\
                flex-shrink: 0;\
            \}\
\
            .chat-assist-widget .user-registration \{\
                position: absolute;\
                top: 50%;\
                left: 50%;\
                transform: translate(-50%, -50%);\
                padding: 24px;\
                text-align: center;\
                width: 100%;\
                max-width: 320px;\
                display: none;\
            \}\
\
            .chat-assist-widget .user-registration.active \{\
                display: block;\
            \}\
\
            .chat-assist-widget .registration-title \{\
                font-size: 18px;\
                font-weight: 600;\
                color: var(--chat-color-text);\
                margin-bottom: 16px;\
                line-height: 1.3;\
            \}\
\
            .chat-assist-widget .registration-form \{\
                display: flex;\
                flex-direction: column;\
                gap: 12px;\
                margin-bottom: 16px;\
            \}\
\
            .chat-assist-widget .form-field \{\
                display: flex;\
                flex-direction: column;\
                gap: 4px;\
                text-align: left;\
            \}\
\
            .chat-assist-widget .form-label \{\
                font-size: 14px;\
                font-weight: 500;\
                color: var(--chat-color-text);\
            \}\
\
            .chat-assist-widget .form-input \{\
                padding: 12px 14px;\
                border: 1px solid var(--chat-color-border);\
                border-radius: var(--chat-radius-md);\
                font-family: inherit;\
                font-size: 14px;\
                transition: var(--chat-transition);\
            \}\
\
            .chat-assist-widget .form-input:focus \{\
                outline: none;\
                border-color: var(--chat-color-primary);\
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);\
            \}\
\
            .chat-assist-widget .submit-registration \{\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                width: 100%;\
                padding: 14px 20px;\
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);\
                color: white;\
                border: none;\
                border-radius: var(--chat-radius-md);\
                cursor: pointer;\
                font-size: 15px;\
                transition: var(--chat-transition);\
                font-weight: 600;\
                font-family: inherit;\
                box-shadow: var(--chat-shadow-md);\
            \}\
\
            .chat-assist-widget .submit-registration:hover \{\
                transform: translateY(-2px);\
                box-shadow: var(--chat-shadow-lg);\
            \}\
\
            .chat-assist-widget .submit-registration:disabled \{\
                opacity: 0.7;\
                cursor: not-allowed;\
                transform: none;\
            \}\
\
            .chat-assist-widget .suggested-questions \{\
                display: flex;\
                flex-direction: column;\
                gap: 8px;\
                margin: 12px 0;\
                align-self: flex-start;\
                max-width: 85%;\
            \}\
\
            .chat-assist-widget .suggested-question-btn \{\
                background: #f3f4f6;\
                border: 1px solid var(--chat-color-border);\
                border-radius: var(--chat-radius-md);\
                padding: 10px 14px;\
                text-align: left;\
                font-size: 13px;\
                color: var(--chat-color-text);\
                cursor: pointer;\
                transition: var(--chat-transition);\
                font-family: inherit;\
                line-height: 1.4;\
            \}\
\
            .chat-assist-widget .suggested-question-btn:hover \{\
                background: var(--chat-color-light);\
                border-color: var(--chat-color-primary);\
            \}\
        `;\
    \}\
\
    // Initialize the widget\
    async function initializeWidget() \{\
        try \{\
            // Load font asynchronously\
            await loadFont();\
            \
            // Create and inject styles\
            const widgetStyles = document.createElement('style');\
            widgetStyles.textContent = generateCSS() + generateAdditionalCSS();\
            document.head.appendChild(widgetStyles);\
            \
            // Create widget root\
            const widgetRoot = document.createElement('div');\
            widgetRoot.className = 'chat-assist-widget';\
            \
            // Apply custom colors\
            widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);\
            widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);\
            widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);\
            widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);\
            \
            // Generate and inject HTML\
            widgetRoot.innerHTML = generateHTML();\
            document.body.appendChild(widgetRoot);\
            \
            // Initialize session manager and UI controller\
            const sessionManager = new SessionManager();\
            const uiController = new UIController(widgetRoot, sessionManager);\
            \
            // Make session manager globally available for debugging\
            if (window.ChatWidgetConfig && window.ChatWidgetConfig.debug) \{\
                window.chatWidgetDebug = \{ sessionManager, uiController \};\
            \}\
            \
        \} catch (error) \{\
            console.error('Failed to initialize chat widget:', error);\
        \}\
    \}\
\
    // Start initialization\
    initializeWidget();\
\
\})();}