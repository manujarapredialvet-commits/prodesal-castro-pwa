// PRODESAL de Castro - Aplicación JavaScript Principal

class PRODESALApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.personalContent = JSON.parse(localStorage.getItem('personalContent')) || [];
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.isModalOpen = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeNavigation();
        this.loadPersonalContent();
        this.loadProductsData();
        this.loadActivitiesData();
        this.initializeWeather();
        this.initializeNews();
        this.checkForUpdates();
    }

    // Configurar Event Listeners
    setupEventListeners() {
        // Navegación por pestañas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.navigateToSection(e.currentTarget.dataset.section);
            });
        });

        // Tarjetas del dashboard
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.navigateToSection(e.currentTarget.dataset.section);
            });
        });

        // Botón FAB
        document.getElementById('fabBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // Botón agregar actividad
        document.getElementById('addActivityBtn')?.addEventListener('click', () => {
            this.openActivityModal();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Formulario de contenido personal
        document.getElementById('personalContentForm')?.addEventListener('submit', (e) => {
            this.handlePersonalContentSubmit(e);
        });

        // Búsqueda global
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // Filtros de noticias
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleNewsFilter(e.target);
            });
        });

        // Botones de acción en contenido personal
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                this.editPersonalItem(e.target.closest('.personal-item'));
            } else if (e.target.closest('.delete-btn')) {
                this.deletePersonalItem(e.target.closest('.personal-item'));
            }
        });

        // Event listeners para productos
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });

        // Event listeners para noticias
        document.getElementById('addNewsBtn')?.addEventListener('click', () => {
            this.showNewsModal();
        });

        // Instalación PWA
        this.setupPWA();
    }

    // Navegación entre secciones
    navigateToSection(sectionName) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.section === sectionName) {
                tab.classList.add('active');
            }
        });

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Ejecutar carga específica de la sección
            this.loadSectionData(sectionName);
        }

        // Scroll al top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Cargar datos específicos de cada sección
    loadSectionData(section) {
        switch(section) {
            case 'weather':
                this.loadActivitiesData();
                break;
            case 'news':
                // Sección vacía, lista para contenido del usuario
                break;
            case 'animals':
            case 'plants':
                this.loadGuidesData(section);
                break;
            case 'tizon':
                // Los datos de monitoreo de tizón son estáticos y se cargan desde HTML
                break;
            case 'products':
                this.loadProductsData();
                break;
            case 'guia-telefonica':
                this.initializeGuiaTelefonica();
                break;
            case 'personal':
                this.loadPersonalContent();
                break;
        }
    }

    // Inicializar navegación
    initializeNavigation() {
        // Mostrar sección inicial
        this.navigateToSection('dashboard');
    }

    // Funcionalidad del Modal
    openModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.classList.add('active');
            this.isModalOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.classList.remove('active');
            this.isModalOpen = false;
            document.body.style.overflow = '';
            
            // Limpiar formulario
            document.getElementById('personalContentForm').reset();
        }
    }

    // Manejar envío del formulario
    handlePersonalContentSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('contentTitle').value;
        const text = document.getElementById('contentText').value;
        const category = document.getElementById('contentCategory').value;

        const newItem = {
            id: Date.now(),
            title,
            text,
            category,
            date: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString()
        };

        this.personalContent.unshift(newItem);
        this.savePersonalContent();
        this.loadPersonalContent();
        this.closeModal();

        // Mostrar notificación de éxito
        this.showNotification('Información guardada exitosamente', 'success');
    }

    // Guardar contenido personal en localStorage
    savePersonalContent() {
        localStorage.setItem('personalContent', JSON.stringify(this.personalContent));
    }

    // Cargar y mostrar contenido personal
    loadPersonalContent() {
        const container = document.querySelector('.personal-items');
        if (!container) return;

        if (this.personalContent.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 48px 24px; color: var(--neutral-500);">
                    <i data-lucide="file-text" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No hay información personal aún.</p>
                    <p style="font-size: 14px; margin-top: 8px;">Agrega tu primer contenido usando el botón azul.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = this.personalContent.map(item => `
            <div class="personal-item" data-id="${item.id}">
                <div class="item-header">
                    <h3>${this.escapeHtml(item.title)}</h3>
                    <span class="item-date">${item.date}</span>
                </div>
                <p>${this.escapeHtml(item.text)}</p>
                <div class="item-actions">
                    <button class="edit-btn">
                        <i data-lucide="edit"></i>
                        Editar
                    </button>
                    <button class="delete-btn">
                        <i data-lucide="trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    // Editar elemento personal
    editPersonalItem(itemElement) {
        const id = parseInt(itemElement.dataset.id);
        const item = this.personalContent.find(i => i.id === id);
        
        if (item) {
            // Poblar formulario con datos existentes
            document.getElementById('contentTitle').value = item.title;
            document.getElementById('contentText').value = item.text;
            document.getElementById('contentCategory').value = item.category;
            
            // Cambiar el modo del formulario
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.textContent = 'Actualizar';
            submitBtn.dataset.editingId = id;
            
            this.openModal();
        }
    }

    // Eliminar elemento personal
    deletePersonalItem(itemElement) {
        const id = parseInt(itemElement.dataset.id);
        
        if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            this.personalContent = this.personalContent.filter(i => i.id !== id);
            this.savePersonalContent();
            this.loadPersonalContent();
            this.showNotification('Elemento eliminado', 'success');
        }
    }

    // Funcionalidad de Clima
    initializeWeather() {
        this.updateWeatherData();
        
        // Actualizar cada 30 minutos
        setInterval(() => {
            this.updateWeatherData();
        }, 30 * 60 * 1000);
    }

    updateWeatherData() {
        // Simular datos de clima (en una app real, aquí iría la llamada a la API)
        const weatherData = {
            temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
            condition: this.getRandomWeatherCondition(),
            humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
            windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
            visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
            pressure: Math.floor(Math.random() * 50) + 1000 // 1000-1050 hPa
        };

        this.renderWeatherData(weatherData);
    }

    getRandomWeatherCondition() {
        const conditions = ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvia ligera'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    renderWeatherData(data) {
        // Actualizar tarjeta del dashboard
        const tempElement = document.querySelector('.weather-card .temperature');
        const conditionElement = document.querySelector('.weather-card .weather-condition');
        
        if (tempElement) tempElement.textContent = `${data.temperature}°C`;
        if (conditionElement) conditionElement.textContent = data.condition;

        // Actualizar sección detallada
        const tempValue = document.querySelector('.weather-temp .temp-value');
        const tempUnit = document.querySelector('.weather-temp .temp-unit');
        const weatherInfo = document.querySelector('.weather-current .weather-info h3');
        const weatherIcon = document.querySelector('.weather-icon-large');

        if (tempValue) tempValue.textContent = data.temperature;
        if (weatherInfo) weatherInfo.textContent = data.condition;
        if (weatherIcon) {
            weatherIcon.setAttribute('data-lucide', this.getWeatherIcon(data.condition));
        }

        // Actualizar detalles meteorológicos
        const details = document.querySelectorAll('.weather-detail strong');
        if (details.length >= 4) {
            details[0].textContent = `${data.humidity}%`;
            details[1].textContent = `${data.windSpeed} km/h`;
            details[2].textContent = `${data.visibility} km`;
            details[3].textContent = `${data.pressure} hPa`;
        }

        // Recrear iconos
        lucide.createIcons();
    }

    getWeatherIcon(condition) {
        switch(condition.toLowerCase()) {
            case 'soleado': return 'sun';
            case 'parcialmente nublado': return 'cloud-sun';
            case 'nublado': return 'cloud';
            case 'lluvia ligera': return 'cloud-rain';
            default: return 'sun';
        }
    }

    // Funcionalidad de Noticias
    initializeNews() {
        this.updateNewsData();
    }

    updateNewsData() {
        // La sección de noticias ahora está vacía, lista para contenido del usuario
        // En una implementación real, aquí se cargarían las noticias guardadas por el usuario
        const newsContainer = document.querySelector('.news-empty');
        if (newsContainer) {
            // La sección ya está configurada como vacía en el HTML
            lucide.createIcons();
        }
    }

    renderNewsData(data) {
        const newsList = document.querySelector('.news-list');
        if (!newsList) return;

        newsList.innerHTML = data.map(article => `
            <article class="news-item">
                <div class="news-image">
                    <i data-lucide="image"></i>
                </div>
                <div class="news-content">
                    <h3>${this.escapeHtml(article.title)}</h3>
                    <p>${this.escapeHtml(article.content)}</p>
                    <div class="news-meta">
                        <span class="news-category" style="background: var(--accent-news);">${article.category}</span>
                        <span class="news-date">${article.time}</span>
                    </div>
                </div>
            </article>
        `).join('');

        lucide.createIcons();
    }

    handleNewsFilter(filterBtn) {
        // Actualizar filtro activo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        filterBtn.classList.add('active');

        const filter = filterBtn.textContent.toLowerCase();
        
        // Filtrar noticias (simulado)
        this.showNotification(`Filtrando noticias por: ${filter}`, 'info');
    }

    // Cargar guías de animales y plantas
    loadGuidesData(section) {
        const guidesData = {
            animals: [
                {
                    title: 'Manual de Vacunación Bovina',
                    description: 'Protocolo completo de vacunación para ganado bovino'
                },
                {
                    title: 'Cuidados de Mascotas',
                    description: 'Guía básica para el cuidado de perros y gatos'
                }
            ],
            plants: [
                {
                    title: 'Manejo Integrado de Plagas',
                    description: 'Estrategias sustentables de control fitosanitario'
                },
                {
                    title: 'Cultivos Orgánicos',
                    description: 'Técnicas de agricultura sin agroquímicos'
                }
            ]
        };

        const guides = guidesData[section];
        if (!guides) return;

        const guideList = document.querySelector(`.${section === 'animals' ? 'animal' : 'plant'}-guides .guide-list`);
        if (!guideList) return;

        guideList.innerHTML = guides.map(guide => `
            <div class="guide-item">
                <i data-lucide="book"></i>
                <div>
                    <h4>${this.escapeHtml(guide.title)}</h4>
                    <p>${this.escapeHtml(guide.description)}</p>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    // Búsqueda global
    handleGlobalSearch(query) {
        if (query.length < 2) return;

        // Simular búsqueda
        const results = this.performGlobalSearch(query);
        
        if (results.length > 0) {
            this.showSearchResults(results, query);
        } else {
            this.showNotification(`No se encontraron resultados para "${query}"`, 'warning');
        }
    }

    performGlobalSearch(query) {
        const searchResults = [];
        const queryLower = query.toLowerCase();

        // Buscar en contenido personal
        this.personalContent.forEach(item => {
            if (item.title.toLowerCase().includes(queryLower) || 
                item.text.toLowerCase().includes(queryLower)) {
                searchResults.push({
                    type: 'personal',
                    title: item.title,
                    content: item.text.substring(0, 100) + '...',
                    section: 'personal'
                });
            }
        });

        // Buscar en guías disponibles
        const guides = [
            { title: 'Manual de Vacunación Bovina', section: 'animals' },
            { title: 'Manejo Integrado de Plagas', section: 'plants' },
            { title: 'Cuidados de Mascotas', section: 'animals' }
        ];

        guides.forEach(guide => {
            if (guide.title.toLowerCase().includes(queryLower)) {
                searchResults.push({
                    type: 'guide',
                    title: guide.title,
                    content: 'Guía técnica disponible',
                    section: guide.section
                });
            }
        });

        return searchResults;
    }

    showSearchResults(results, query) {
        // Crear modal de resultados de búsqueda
        const modal = document.createElement('div');
        modal.className = 'search-results-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Resultados para "${query}"</h3>
                    <button class="modal-close search-close">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="search-results-list">
                        ${results.map(result => `
                            <div class="search-result-item" data-section="${result.section}">
                                <div class="result-type">${result.type === 'personal' ? 'Personal' : 'Guía'}</div>
                                <h4>${this.escapeHtml(result.title)}</h4>
                                <p>${this.escapeHtml(result.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Eventos para cerrar y navegar
        modal.querySelector('.search-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Evento para navegar a resultados
        modal.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.navigateToSection(section);
                document.body.removeChild(modal);
            });
        });

        lucide.createIcons();
    }

    // Sistema de notificaciones
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i data-lucide="${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Estilos de notificación
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 3000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);

        lucide.createIcons();
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'warning': return 'alert-triangle';
            case 'error': return 'x-circle';
            default: return 'info';
        }
    }

    getNotificationColor(type) {
        switch(type) {
            case 'success': return '#10B981';
            case 'warning': return '#F59E0B';
            case 'error': return '#EF4444';
            default: return '#3B82F6';
        }
    }

    // Configuración PWA
    setupPWA() {
        // Prompt de instalación
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Mostrar botón de instalación
            this.showInstallPromotion();
        });

        // Botón de instalación personalizado
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        this.showNotification('Aplicación instalada exitosamente', 'success');
                    }
                    deferredPrompt = null;
                }
            });
        }

        // Notificación de actualización disponible
        this.setupUpdateNotifications();
    }

    showInstallPromotion() {
        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <i data-lucide="download"></i>
                <span>¡Instala PRODESAL de Castro como aplicación!</span>
                <button id="installBtn" class="install-btn">Instalar</button>
                <button class="banner-close">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--primary-500);
            color: white;
            padding: 12px 16px;
            z-index: 2000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(banner);
        document.body.style.paddingTop = '60px';

        // Eventos
        document.querySelector('.banner-close').addEventListener('click', () => {
            document.body.removeChild(banner);
            document.body.style.paddingTop = '';
        });

        document.querySelector('.install-btn').addEventListener('click', () => {
            document.querySelector('.banner-close').click();
        });

        lucide.createIcons();
    }

    setupUpdateNotifications() {
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
            this.showNotification('Actualización disponible. Recarga la página.', 'info');
        });
    }

    // Verificar actualizaciones
    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.addEventListener('updatefound', () => {
                    this.showNotification('Nueva versión disponible', 'info');
                });
            });
        }
    }

    // Utilidades
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Métodos de utilidad para datos
    getCurrentTime() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentDate() {
        return new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Funcionalidad de Productos
    loadProductsData() {
        // Los productos se manejan con localStorage, similar al contenido personal
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.renderProducts();
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="products-empty">
                    <i data-lucide="shopping-cart" class="empty-icon"></i>
                    <h3>No hay productos</h3>
                    <p>Agrega tu primer producto para empezar a vender</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        productsGrid.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${this.escapeHtml(product.name)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">` :
                        `<i data-lucide="image" style="font-size: 48px; color: var(--neutral-400);"></i>`
                    }
                </div>
                <div class="product-info">
                    <h3>${this.escapeHtml(product.name)}</h3>
                    <p class="product-price">$${product.price}</p>
                    <p class="product-description">${this.escapeHtml(product.description)}</p>
                    <div class="product-category">
                        <span class="category-tag">${this.escapeHtml(product.category)}</span>
                    </div>
                    <div class="product-actions">
                        <button class="edit-btn" data-id="${product.id}">
                            <i data-lucide="edit"></i>
                            Editar
                        </button>
                        <button class="delete-btn" data-id="${product.id}">
                            <i data-lucide="trash"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    saveProducts() {
        localStorage.setItem('products', JSON.stringify(this.products));
    }

    // Event listeners para productos
    setupProductEventListeners() {
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showProductModal();
        });

        // Event delegation para editar/eliminar productos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const productId = parseInt(e.target.closest('.edit-btn').dataset.id);
                this.editProduct(productId);
            } else if (e.target.closest('.delete-btn')) {
                const productId = parseInt(e.target.closest('.delete-btn').dataset.id);
                this.deleteProduct(productId);
            }
        });
    }

    showProductModal(product = null) {
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>${product ? 'Editar Producto' : 'Agregar Producto'}</h3>
                    <button class="modal-close">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="productForm">
                        <div class="form-group">
                            <label for="productName">Nombre del producto</label>
                            <input type="text" id="productName" value="${product?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="productPrice">Precio</label>
                            <input type="number" id="productPrice" value="${product?.price || ''}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="productDescription">Descripción</label>
                            <textarea id="productDescription" rows="3" required>${product?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="productCategory">Categoría</label>
                            <select id="productCategory" required>
                                <option value="">Seleccionar categoría</option>
                                <option value="Agricultura" ${product?.category === 'Agricultura' ? 'selected' : ''}>Agricultura</option>
                                <option value="Ganadería" ${product?.category === 'Ganadería' ? 'selected' : ''}>Ganadería</option>
                                <option value="Alimentos" ${product?.category === 'Alimentos' ? 'selected' : ''}>Alimentos</option>
                                <option value="Servicios" ${product?.category === 'Servicios' ? 'selected' : ''}>Servicios</option>
                                <option value="Otro" ${product?.category === 'Otro' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="productImage">Imagen del producto</label>
                            <input type="file" id="productImage" accept="image/*">
                            ${product?.image ? '<p class="current-image">Imagen actual cargada</p>' : ''}
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
                            <button type="submit" class="btn-primary">${product ? 'Actualizar' : 'Agregar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        modal.querySelector('#productForm').addEventListener('submit', (e) => {
            this.handleProductSubmit(e, modal, product);
        });

        lucide.createIcons();
    }

    handleProductSubmit(e, modal, existingProduct = null) {
        e.preventDefault();
        
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const description = document.getElementById('productDescription').value;
        const category = document.getElementById('productCategory').value;
        const imageFile = document.getElementById('productImage').files[0];

        const handleImageUpload = (imageData) => {
            const productData = {
                id: existingProduct ? existingProduct.id : Date.now(),
                name,
                price,
                description,
                category,
                image: imageData || existingProduct?.image || null,
                date: new Date().toLocaleDateString('es-ES')
            };

            if (existingProduct) {
                const index = this.products.findIndex(p => p.id === existingProduct.id);
                if (index !== -1) {
                    this.products[index] = productData;
                }
            } else {
                this.products.push(productData);
            }

            this.saveProducts();
            this.renderProducts();
            document.body.removeChild(modal);
            this.showNotification(existingProduct ? 'Producto actualizado' : 'Producto agregado', 'success');
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                handleImageUpload(e.target.result);
            };
            reader.readAsDataURL(imageFile);
        } else {
            handleImageUpload();
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    deleteProduct(productId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            this.showNotification('Producto eliminado', 'success');
        }
    }

    // Funcionalidad de Noticias (actualizada)
    showNewsModal() {
        const modal = document.createElement('div');
        modal.className = 'news-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Agregar Noticia</h3>
                    <button class="modal-close">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newsForm">
                        <div class="form-group">
                            <label for="newsTitle">Título</label>
                            <input type="text" id="newsTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="newsContent">Contenido</label>
                            <textarea id="newsContent" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="newsCategory">Categoría</label>
                            <select id="newsCategory" required>
                                <option value="">Seleccionar categoría</option>
                                <option value="Local">Local</option>
                                <option value="Agricultura">Agricultura</option>
                                <option value="Ganadería">Ganadería</option>
                                <option value="Tecnología">Tecnología</option>
                                <option value="Ciencia">Ciencia</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
                            <button type="submit" class="btn-primary">Agregar Noticia</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        modal.querySelector('#newsForm').addEventListener('submit', (e) => {
            this.handleNewsSubmit(e, modal);
        });

        lucide.createIcons();
    }

    handleNewsSubmit(e, modal) {
        e.preventDefault();
        
        const title = document.getElementById('newsTitle').value;
        const content = document.getElementById('newsContent').value;
        const category = document.getElementById('newsCategory').value;

        // En una aplicación real, aquí se guardaría en una base de datos
        // Por ahora solo mostramos una notificación
        this.showNotification('Noticia agregada exitosamente', 'success');
        document.body.removeChild(modal);
        
        // Limpiar la sección de noticias
        this.updateNewsData();
    }
}

// Estilos CSS adicionales para notificaciones y búsquedas
const additionalStyles = `
    .search-results-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        padding: 20px;
    }
    
    .search-results-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .search-result-item {
        padding: 16px;
        background: var(--neutral-0);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .search-result-item:hover {
        background: var(--primary-100);
        transform: translateX(4px);
    }
    
    .result-type {
        font-size: 12px;
        color: var(--neutral-500);
        margin-bottom: 8px;
    }
    
    .search-result-item h4 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .search-result-item p {
        font-size: 14px;
        color: var(--neutral-500);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .install-banner .banner-content {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 768px;
        margin: 0 auto;
    }
    
    .install-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .install-btn:hover {
        background: rgba(255,255,255,0.3);
    }
    
    .banner-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: auto;
    }
`;

// Agregar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Método para inicializar la Guía Telefónica
PRODESALApp.prototype.initializeGuiaTelefonica = function() {
    // La guía telefónica es estática, no necesita carga dinámica
    console.log('Guía Telefónica inicializada');
};

// Método para inicializar los filtros de noticias
PRODESALApp.prototype.initializeNews = function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const newsItems = document.querySelectorAll('.news-item');
    
    if (filterBtns.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Actualizar botón activo
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filtrar noticias por categoría
            newsItems.forEach(item => {
                if (filter === 'todas' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
};


// Método para cargar datos de actividades
PRODESALApp.prototype.loadActivitiesData = function() {
    const container = document.querySelector('.activities-container');
    const emptyState = document.querySelector('.activities-container .empty-state');
    
    if (this.activities.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (container) container.innerHTML = container.innerHTML;
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    this.renderActivities();
};

// Método para renderizar actividades
PRODESALApp.prototype.renderActivities = function() {
    const container = document.querySelector('.activities-container');
    if (!container) return;
    
    const activitiesHTML = this.activities.map(activity => `
        <div class="activity-card" data-activity-id="${activity.id}">
            <div class="activity-header">
                <div class="activity-info">
                    <h3>${activity.title}</h3>
                    <span class="activity-date">${activity.date}</span>
                </div>
            </div>
            <div class="activity-description">
                ${activity.description}
            </div>
            <div class="activity-type">
                ${activity.type}
            </div>
            <div class="activity-actions">
                <button class="activity-edit-btn" onclick="app.openActivityModal('${activity.id}')">
                    <i data-lucide="edit"></i>
                    Editar
                </button>
                <button class="activity-delete-btn" onclick="app.deleteActivity('${activity.id}')">
                    <i data-lucide="trash"></i>
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = activitiesHTML;
    
    // Reinicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// Método para abrir modal de actividades
PRODESALApp.prototype.openActivityModal = function(activityId = null) {
    const existingActivity = activityId ? 
        this.activities.find(a => a.id === activityId) : null;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${existingActivity ? 'Editar' : 'Agregar'} Actividad PRODESAL</h2>
                <button class="modal-close">×</button>
            </div>
            <form class="activity-form">
                <div class="form-group">
                    <label>Título de la Actividad *</label>
                    <input type="text" id="activityTitle" required 
                           value="${existingActivity?.title || ''}">
                </div>
                <div class="form-group">
                    <label>Fecha *</label>
                    <input type="date" id="activityDate" required 
                           value="${existingActivity?.date || ''}">
                </div>
                <div class="form-group">
                    <label>Tipo de Actividad *</label>
                    <select id="activityType" required>
                        <option value="Capacitación">Capacitación</option>
                        <option value="Charla">Charla</option>
                        <option value="Taller">Taller</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Visita Técnica">Visita Técnica</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Descripción *</label>
                    <textarea id="activityDescription" rows="4" required 
                              placeholder="Describe los detalles de la actividad...">${existingActivity?.description || ''}</textarea>
                </div>
                <button type="submit" class="btn-primary">
                    ${existingActivity ? 'Actualizar' : 'Agregar'} Actividad
                </button>
            </form>
        </div>
    `;
    
    // Configurar valor del select
    if (existingActivity) {
        modal.querySelector('#activityType').value = existingActivity.type;
    }
    
    // Event listeners para el modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const activityData = {
            id: existingActivity?.id || Date.now().toString(),
            title: modal.querySelector('#activityTitle').value,
            date: modal.querySelector('#activityDate').value,
            type: modal.querySelector('#activityType').value,
            description: modal.querySelector('#activityDescription').value
        };
        
        if (existingActivity) {
            // Editar actividad existente
            const index = this.activities.findIndex(a => a.id === existingActivity.id);
            this.activities[index] = activityData;
        } else {
            // Agregar nueva actividad
            this.activities.push(activityData);
        }
        
        this.saveActivities();
        this.loadActivitiesData();
        document.body.removeChild(modal);
    });
    
    document.body.appendChild(modal);
};

// Método para guardar actividades
PRODESALApp.prototype.saveActivities = function() {
    localStorage.setItem('activities', JSON.stringify(this.activities));
};

// Método para eliminar actividad
PRODESALApp.prototype.deleteActivity = function(activityId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        this.activities = this.activities.filter(a => a.id !== activityId);
        this.saveActivities();
        this.loadActivitiesData();
    }
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new PRODESALApp();
});

// Manejo de errores globales
window.addEventListener('error', (e) => {
    console.error('Error en PRODESAL de Castro:', e.error);
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesa rechazada:', e.reason);
});