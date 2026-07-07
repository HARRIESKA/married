(function() {
    const chatMessages = document.getElementById('chatMessages');
    const guestNameInput = document.getElementById('guestName');
    const guestResponseSelect = document.getElementById('guestResponse');
    const plusOneRadios = document.getElementsByName('plusOne');
    const companionInput = document.getElementById('companionName');
    const btnSend = document.getElementById('btnSend');
    const guestsList = document.getElementById('guestsList');
    const guestsCounter = document.getElementById('guestsCounter');
    const infoBlocksContainer = document.getElementById('infoBlocksContainer');
    const btnAddBlock = document.getElementById('btnAddBlock');
    const modalOverlay = document.getElementById('modalOverlay');
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');
    const blockIconInput = document.getElementById('blockIcon');
    const blockTitleInput = document.getElementById('blockTitle');
    const blockContentInput = document.getElementById('blockContent');
    const toast = document.getElementById('toast');
    const photoFrame = document.getElementById('photoFrame');
    const btnExport = document.getElementById('btnExport');

    let guests = [];
    let guestIdCounter = 0;
    let infoBlocks = [];          // текущий массив блоков
    let blockIdCounter = 0;
    let editingBlockId = null;

    const STORAGE_KEY_BLOCKS = 'wedding_info_blocks';

    // ========== ИНИЦИАЛИЗАЦИЯ БЛОКОВ ==========
    function loadBlocksFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY_BLOCKS);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    infoBlocks = parsed;
                    blockIdCounter = Math.max(...infoBlocks.map(b => b.id), 0);
                    return;
                }
            } catch (e) {}
        }
        // Дефолтные блоки
        infoBlocks = [
            { id: 1, icon: '📍', title: 'Место проведения', content: 'Ресторан «Розовый сад»\nг. Москва, ул. Цветочная, д. 15\nТерритория с летней верандой и фонтаном.' },
            { id: 2, icon: '👗', title: 'Дресс-код', content: 'Мы будем рады видеть вас в нарядах нежных тонов:\nДля дам — пастельные платья, для мужчин — светлые костюмы.\nОсновной цвет торжества — пыльно-розовый.' },
            { id: 3, icon: '🍽️', title: 'Меню и напитки', content: 'Изысканный банкет от шеф-повара:\n— Фуршет и шампанское с 10:30\n— Трёхразовое меню с десертной станцией\n— Открытый бар с авторскими коктейлями' },
            { id: 4, icon: '🎵', title: 'Музыкальная программа', content: '— Живой струнный квартет на церемонии\n— DJ-сет и танцы до утра\n— Сюрприз от молодожёнов в 21:00' }
        ];
        blockIdCounter = 4;
        saveBlocksToStorage();
    }

    function saveBlocksToStorage() {
        localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(infoBlocks));
    }

    function addInfoBlock(icon, title, content) {
        blockIdCounter++;
        const block = { id: blockIdCounter, icon, title, content };
        infoBlocks.push(block);
        saveBlocksToStorage();
        renderInfoBlocks();
    }

    function updateInfoBlock(id, icon, title, content) {
        const block = infoBlocks.find(b => b.id === id);
        if (block) {
            block.icon = icon;
            block.title = title;
            block.content = content;
            saveBlocksToStorage();
            renderInfoBlocks();
        }
    }

    function removeInfoBlock(id) {
        infoBlocks = infoBlocks.filter(b => b.id !== id);
        saveBlocksToStorage();
        renderInfoBlocks();
        showToast('Блок удалён');
    }

    function openEditModal(block) {
        editingBlockId = block.id;
        blockIconInput.value = block.icon;
        blockTitleInput.value = block.title;
        blockContentInput.value = block.content;
        modalOverlay.classList.remove('hidden');
        setTimeout(() => blockTitleInput.focus(), 150);
    }

    function renderInfoBlocks() {
        infoBlocksContainer.innerHTML = '';
        infoBlocks.forEach(block => {
            const div = document.createElement('div');
            div.className = 'info-block';
            div.setAttribute('data-block-id', block.id);
            div.innerHTML = `
                <div class="block-actions">
                    <button class="btn-edit-block" title="Редактировать">✎</button>
                    <button class="btn-remove-block" title="Удалить">✕</button>
                </div>
                <div class="info-block-header">
                    <span class="info-block-icon">${escapeHTML(block.icon)}</span>
                    <span class="info-block-title">${escapeHTML(block.title)}</span>
                </div>
                <div class="info-block-content">
                    <p>${escapeHTML(block.content).replace(/\n/g, '<br>')}</p>
                </div>
            `;
            infoBlocksContainer.appendChild(div);

            div.querySelector('.btn-edit-block').addEventListener('click', () => openEditModal(block));
            div.querySelector('.btn-remove-block').addEventListener('click', () => removeInfoBlock(block.id));
        });
    }

    // ========== ГОСТИ (без изменений) ==========
    function initChat() {
        if (chatMessages.children.length > 0) return;
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
        const initialMessages = [
            { type: 'incoming', text: '💌 <strong>Дорогие друзья!</strong><br>Мы с радостью приглашаем вас разделить с нами самый важный день — нашу свадьбу!', time: timeStr },
            { type: 'incoming', text: '📅 <strong>Дата:</strong> 11 августа 2025 года<br>⏰ <strong>Сбор гостей:</strong> 10:30<br>🎉 <strong>Начало церемонии:</strong> 11:00', time: timeStr },
            { type: 'incoming', text: 'Будем очень рады, если вы подтвердите своё присутствие. Просто заполните форму и нажмите «Отправить» 💕', time: timeStr },
        ];
        initialMessages.forEach((msg,i) => {
            setTimeout(() => addChatBubble(msg.type, msg.text, msg.time), i*500);
        });
    }

    function addChatBubble(type, text, time) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.innerHTML = `${text}<span class="bubble-time">${time}</span>`;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getPlusOneCount() {
        for (let radio of plusOneRadios) {
            if (radio.checked) return parseInt(radio.value);
        }
        return 1;
    }

    function toggleCompanionInput() {
        if (getPlusOneCount() === 2) {
            companionInput.classList.remove('hidden');
        } else {
            companionInput.classList.add('hidden');
            companionInput.value = '';
        }
    }

    function addGuest(name, response, companion, totalCount) {
        guestIdCounter++;
        const guest = {
            id: guestIdCounter,
            name: name.trim(),
            response: response,
            companion: companion ? companion.trim() : null,
            count: totalCount,
            time: new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }),
        };
        guests.unshift(guest);
        renderGuests();
        updateGuestsCounter();
    }

    function renderGuests() {
        guestsList.innerHTML = '';
        if (guests.length === 0) {
            guestsList.innerHTML = '<span class="no-guests">Пока никто не зарегистрировался. Будьте первым! ✨</span>';
            return;
        }
        guests.forEach(guest => {
            const tag = document.createElement('span');
            tag.className = 'guest-tag';
            const initial = guest.name.charAt(0).toUpperCase();
            let statusClass = '';
            let statusText = '';
            switch (guest.response) {
                case 'confirmed': statusClass='confirmed'; statusText='✓ Будет'; break;
                case 'maybe': statusClass='maybe'; statusText='? Уточнит'; break;
                case 'declined': statusClass='declined'; statusText='✗ Отказ'; break;
            }
            let displayName = guest.name;
            if (guest.companion) {
                displayName += ` & ${guest.companion}`;
            }
            tag.innerHTML = `
                <span class="guest-avatar">${initial}</span>
                <span>${escapeHTML(displayName)}</span>
                <span class="guest-status ${statusClass}">${statusText}</span>
            `;
            guestsList.appendChild(tag);
        });
    }

    function updateGuestsCounter() {
        const totalConfirmed = guests.reduce((sum, g) => sum + (g.response === 'declined' ? 0 : g.count), 0);
        guestsCounter.textContent = `Всего: ${guests.length} (подтверждённых гостей: ${totalConfirmed})`;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function handleGuestSubmit() {
        const name = guestNameInput.value.trim();
        const response = guestResponseSelect.value;
        const totalCount = getPlusOneCount();
        const companion = totalCount === 2 ? companionInput.value.trim() : null;

        if (!name) {
            showToast('Пожалуйста, укажите ваше имя 💕');
            guestNameInput.focus();
            return;
        }
        if (totalCount === 2 && !companion) {
            showToast('Пожалуйста, укажите имя спутника 🌸');
            companionInput.focus();
            return;
        }
        if (guests.some(g => g.name.toLowerCase() === name.toLowerCase())) {
            showToast('Гость с таким именем уже зарегистрирован 🌸');
            return;
        }

        addGuest(name, response, companion, totalCount);

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
        let responseEmoji = response === 'confirmed' ? '✅' : response === 'maybe' ? '🤔' : '💔';
        let responseText = response === 'confirmed' ? 'Буду с радостью!' : response === 'maybe' ? 'Пока не уверен(а)' : 'К сожалению, не смогу';
        const companionText = companion ? ` (вместе с ${escapeHTML(companion)})` : '';
        addChatBubble('outgoing', `${responseEmoji} <strong>${escapeHTML(name)}</strong>: ${responseText}${companionText}`, timeStr);

        setTimeout(() => {
            let autoReply = '';
            if (response === 'confirmed') autoReply = `🎉 <strong>${escapeHTML(name)}, спасибо!</strong> Очень рады, что вы будете с нами! Ждём вас 11 августа 💕`;
            else if (response === 'maybe') autoReply = `🙏 <strong>${escapeHTML(name)},</strong> будем ждать уточнения! Надеемся, у вас получится 🌸`;
            else autoReply = `😢 <strong>${escapeHTML(name)},</strong> очень жаль. Спасибо, что сообщили! 💕`;
            addChatBubble('incoming', autoReply, timeStr);
        }, 800);

        if (response === 'confirmed') {
            showMemeModal('memeYes');
        } else if (response === 'declined') {
            showMemeModal('memeNo');
        }

        guestNameInput.value = '';
        guestResponseSelect.value = 'confirmed';
        companionInput.value = '';
        companionInput.classList.add('hidden');
        document.querySelector('input[name="plusOne"][value="1"]').checked = true;
        guestNameInput.focus();
        showToast('Ответ отправлен! Спасибо 🌸');
    }

    function showMemeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('hidden');

        const closeBtn = modal.querySelector('.meme-close');
        const closeHandler = () => {
            modal.classList.add('hidden');
            clearTimeout(timer);
        };
        closeBtn.addEventListener('click', closeHandler, { once: true });

        const timer = setTimeout(() => {
            modal.classList.add('hidden');
        }, 5000);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
                clearTimeout(timer);
            }
        }, { once: true });
    }

    // ========== МОДАЛКА ДОБАВЛЕНИЯ ==========
    function openAddModal() {
        editingBlockId = null;
        blockIconInput.value = '📍';
        blockTitleInput.value = '';
        blockContentInput.value = '';
        modalOverlay.classList.remove('hidden');
        setTimeout(() => blockTitleInput.focus(), 150);
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        editingBlockId = null;
    }

    function handleModalConfirm() {
        const icon = blockIconInput.value.trim() || '📋';
        const title = blockTitleInput.value.trim();
        const content = blockContentInput.value.trim();
        if (!title) { showToast('Укажите заголовок 📝'); return; }
        if (!content) { showToast('Добавьте содержание ✍️'); return; }

        if (editingBlockId !== null) {
            updateInfoBlock(editingBlockId, icon, title, content);
            showToast('Блок обновлён! ✨');
        } else {
            addInfoBlock(icon, title, content);
            showToast('Блок добавлен! ✨');
        }
        closeModal();
    }

    // ========== ЭКСПОРТ ==========
    function exportPage() {
        // Рендерим текущее состояние блоков в HTML-строку (заменяем контейнер)
        const originalHTML = document.documentElement.outerHTML;
        // Создаём копию документа, чтобы не сломать текущую страницу
        const doctype = '<!DOCTYPE html>\n';
        const html = document.documentElement.cloneNode(true);
        // В клонированном документе заменяем содержимое infoBlocksContainer на текущие блоки
        const clonedContainer = html.querySelector('#infoBlocksContainer');
        if (clonedContainer) {
            clonedContainer.innerHTML = infoBlocksContainer.innerHTML;
        }
        // Убираем обработчики, которые не нужны в экспортированном файле
        // Но проще: сохраняем текущий HTML страницы, а перед этим убедимся, что блоки отрендерены
        const finalHTML = doctype + html.outerHTML;

        const blob = new Blob([finalHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wedding_invitation.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Страница сохранена! Загрузите её на хостинг.');
    }

    // ========== TOAST ==========
    let toastTimeout;
    function showToast(message) {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ========== ОБРАБОТЧИКИ ==========
    btnSend.addEventListener('click', handleGuestSubmit);
    guestNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleGuestSubmit(); } });
    companionInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleGuestSubmit(); } });
    plusOneRadios.forEach(radio => radio.addEventListener('change', toggleCompanionInput));
    btnAddBlock.addEventListener('click', openAddModal);
    btnCancel.addEventListener('click', closeModal);
    btnConfirm.addEventListener('click', handleModalConfirm);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) closeModal(); });
    photoFrame.addEventListener('click', () => showToast('📷 Замените src у #photoImg и скройте placeholder'));
    btnExport.addEventListener('click', exportPage);

    // ========== СТАРТ ==========
    function init() {
        initChat();
        loadBlocksFromStorage();
        renderInfoBlocks();
        renderGuests();
        updateGuestsCounter();
        toggleCompanionInput();
        setTimeout(() => guestNameInput.focus(), 2000);
    }

    document.addEventListener('DOMContentLoaded', init);
    if (document.readyState === 'interactive' || document.readyState === 'complete') init();
})();