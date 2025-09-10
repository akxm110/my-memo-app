document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 요소 가져오기 ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const youtubeMemoForm = document.getElementById('youtube-memo-form');
    const youtubeTableBody = document.getElementById('youtube-table-body'); // ID 수정
    const titleInput = document.getElementById('title-input');
    const urlInput = document.getElementById('url-input');
    const youtubeMemoInput = document.getElementById('youtube-memo-input');

    const memoForm = document.getElementById('memo-form');
    const memoTableBody = document.getElementById('memo-table-body');
    const memoInput = document.getElementById('memo-input');

    const combinedMemoForm = document.getElementById('combined-memo-form');
    const combinedTitleInput = document.getElementById('combined-title-input'); // 새로 추가
    const combinedUrlInput = document.getElementById('combined-url-input');   // 새로 추가
    const combinedMemoInput = document.getElementById('combined-memo-input');
    const combinedResultsContainer = document.getElementById('combined-results-container');

    // --- 애플리케이션 상태 (State) ---
    let state = {
        youtubeMemos: [],
        generalMemos: [],
        combinedMemos: [] // 새로 추가
    };

    // --- 데이터 관리 (localStorage) ---
    function loadState() {
        try {
            const savedYoutubeMemos = localStorage.getItem('youtubeMemos');
            const savedGeneralMemos = localStorage.getItem('generalMemos');
            const savedCombinedMemos = localStorage.getItem('combinedMemos'); // 새로 추가
            
            state.youtubeMemos = savedYoutubeMemos ? JSON.parse(savedYoutubeMemos) : [];
            state.generalMemos = savedGeneralMemos ? JSON.parse(savedGeneralMemos) : [];
            state.combinedMemos = savedCombinedMemos ? JSON.parse(savedCombinedMemos) : []; // 새로 추가
        } catch (e) {
            console.error("localStorage에서 데이터를 불러오는 중 오류 발생:", e);
            state.youtubeMemos = [];
            state.generalMemos = [];
            state.combinedMemos = []; // 새로 추가
        }
    }

    function saveYoutubeMemos() {
        localStorage.setItem('youtubeMemos', JSON.stringify(state.youtubeMemos));
    }

    function saveGeneralMemos() {
        localStorage.setItem('generalMemos', JSON.stringify(state.generalMemos));
    }

    function saveCombinedMemos() { // 새로 추가
        localStorage.setItem('combinedMemos', JSON.stringify(state.combinedMemos));
    }

    // --- 렌더링 (UI 그리기) ---
    function render() {
        // 유튜브 메모 테이블 렌더링
        youtubeTableBody.innerHTML = '';
        state.youtubeMemos.forEach((memo, index) => {
            const row = document.createElement('tr');
            row.dataset.id = memo.id;
            
            const videoId = extractVideoInfo(memo.url)?.videoId;
            const thumbnailUrl_hq = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''; // 기본 화질 변경
            const thumbnailUrl_mq = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''; // 비상용 화질

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${memo.title}</td>
                <td><a href="${memo.url}" target="_blank">${memo.url}</a></td>
                <td><span class="platform-badge platform-${memo.platform.toLowerCase()}">${memo.platform}</span></td>
                <td><img class="youtube-table-thumbnail" src="${thumbnailUrl_hq}" alt="${memo.title}" onerror="this.onerror=null;this.src='${thumbnailUrl_mq}';"></td>
                <td>${memo.memo}</td>
                <td>
                    <div class="actions-container">
                        <button class="action-btn edit-btn">수정</button>
                        <button class="action-btn delete-btn">삭제</button>
                    </div>
                </td>
            `;
            youtubeTableBody.appendChild(row);
        });

        // 일반 메모 테이블 렌더링
        memoTableBody.innerHTML = '';
        state.generalMemos.forEach((memo, index) => {
            const row = document.createElement('tr');
            row.dataset.id = memo.id;
            let displayTimestamp = memo.timestamp.includes('오') ? memo.timestamp.split('오')[0].trim() : memo.timestamp;
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${memo.text}</td>
                <td>${displayTimestamp}</td>
                <td>
                    <div class="actions-container">
                        <button class="action-btn edit-btn">수정</button>
                        <button class="action-btn delete-btn">삭제</button>
                    </div>
                </td>
            `;
            memoTableBody.appendChild(row);
        });

        // 종합 메모 탭 렌더링 (로직 변경)
        combinedResultsContainer.innerHTML = '';
        
        state.combinedMemos.sort((a, b) => b.id - a.id); // 최신순 정렬

        state.combinedMemos.forEach(memo => {
            const card = document.createElement('div');
            card.classList.add('combined-card');
            card.dataset.id = memo.id;

            const videoInfo = memo.url ? extractVideoInfo(memo.url) : null;
            
            let contentHTML = '';

            if (videoInfo) { // 유튜브 링크가 포함된 경우 (가로 레이아웃)
                const thumbnailUrl_hq = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
                const thumbnailUrl_mq = `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`;
                contentHTML += `
                    <div class="card-youtube-content">
                        <div class="text-content">
                            <h3>${memo.title || '제목 없음'}</h3>
                            <a href="${videoInfo.url}" target="_blank">${videoInfo.url}</a>
                        </div>
                        <a href="${videoInfo.url}" target="_blank">
                             <img class="youtube-thumbnail" src="${thumbnailUrl_hq}" alt="썸네일" onerror="this.onerror=null;this.src='${thumbnailUrl_mq}';">
                        </a>
                    </div>
                `;
            } else { // 링크 없는 메모
                contentHTML += `<h3>${memo.title || '메모'}</h3>`;
            }
            
            if(memo.memo) {
                contentHTML += `<p class="memo-content">${memo.memo}</p>`;
            }

            card.innerHTML = `
                ${contentHTML}
                <div class="timestamp">${memo.timestamp}</div>
                <div class="actions-container">
                    <button class="action-btn edit-btn">수정</button>
                    <button class="action-btn delete-btn">삭제</button>
                </div>
            `;
            combinedResultsContainer.appendChild(card);
        });
    }

    // --- 이벤트 처리 ---

    // 탭 전환
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === targetTab);
            });
        });
    });

    // 유튜브 메모 추가
    youtubeMemoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const memoText = youtubeMemoInput.value.trim();

        if (!url) return alert('유튜브 링크를 입력해주세요.');
        const videoInfo = extractVideoInfo(url);
        if (!videoInfo) return alert('유효하지 않은 유튜브 링크입니다.');

        const newMemo = {
            id: Date.now(),
            title,
            url,
            memo: memoText,
            platform: videoInfo.platform
        };

        state.youtubeMemos.unshift(newMemo);
        saveYoutubeMemos();
        render();
        youtubeMemoForm.reset();
    });

    // 일반 메모 추가
    memoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const memoText = memoInput.value.trim();
        if (!memoText) return alert('메모를 입력해주세요.');

        const newMemo = {
            id: Date.now(),
            text: memoText,
            timestamp: new Date().toLocaleDateString('ko-KR')
        };
        
        state.generalMemos.unshift(newMemo);
        saveGeneralMemos();
        render();
        memoForm.reset();
    });
    
    // 종합 메모 추가 (로직 변경)
    combinedMemoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = combinedTitleInput.value.trim();
        const url = combinedUrlInput.value.trim();
        const memoText = combinedMemoInput.value.trim();

        if (!title && !memoText && !url) return alert('제목, 링크, 메모 중 하나 이상을 입력해주세요.');

        // URL이 있는데 유효하지 않은 경우, 경고
        if (url && !extractVideoInfo(url)) {
            return alert('유효하지 않은 유튜브 링크입니다. 링크를 확인하시거나 비워주세요.');
        }

        const newMemo = {
            id: Date.now(),
            title: title,
            url: url,
            memo: memoText,
            timestamp: new Date().toLocaleDateString('ko-KR')
        };
        
        state.combinedMemos.unshift(newMemo);
        saveCombinedMemos();
        render();
        combinedMemoForm.reset();
    });

    // 이벤트 위임: 수정 및 삭제 버튼 처리
    function handleActions(e, memoTypeFromListener) {
        const target = e.target;
        const item = target.closest('tr, .combined-card');
        if (!item) return;
        
        const id = Number(item.dataset.id);
        const isCombinedTab = item.parentElement.id === 'combined-results-container';

        let memoArray, saveFunction, memoType;

        if (isCombinedTab) {
            memoType = 'combined';
            memoArray = state.combinedMemos;
            saveFunction = saveCombinedMemos;
        } else {
            memoType = memoTypeFromListener;
            memoArray = memoType === 'youtube' ? state.youtubeMemos : state.generalMemos;
            saveFunction = memoType === 'youtube' ? saveYoutubeMemos : saveGeneralMemos;
        }

        // 삭제 처리
        if (target.classList.contains('delete-btn')) {
            if (confirm('정말로 삭제하시겠습니까?')) {
                const memoIndex = memoArray.findIndex(m => m.id === id);
                if (memoIndex > -1) {
                    memoArray.splice(memoIndex, 1);
                    saveFunction();
                    render();
                }
            }
        }
        
        // 수정 처리
        if (target.classList.contains('edit-btn')) {
            const isEditing = target.textContent === '저장';
            
            if (isEditing) {
                // 저장 로직
                const memoIndex = memoArray.findIndex(m => m.id === id);
                if (memoIndex > -1) {
                    if (memoType === 'youtube') {
                        // 종합 탭 (카드) 인지 유튜브 탭 (테이블) 인지 확인
                        if (item.classList.contains('combined-card')) {
                            const newUrl = item.querySelector('.edit-url-input').value;
                            const videoInfo = extractVideoInfo(newUrl);
                             if (!videoInfo) return alert('유효하지 않은 유튜브 링크입니다.');
                            
                            memoArray[memoIndex].title = item.querySelector('.edit-title-input').value;
                            memoArray[memoIndex].url = newUrl;
                            memoArray[memoIndex].platform = videoInfo.platform;
                            memoArray[memoIndex].memo = item.querySelector('.edit-memo-textarea').value;
                        } else { // 테이블
                            const newUrl = item.cells[2].querySelector('input').value;
                            const videoInfo = extractVideoInfo(newUrl);
                            if (!videoInfo) return alert('유효하지 않은 유튜브 링크입니다.');
    
                            memoArray[memoIndex].title = item.cells[1].querySelector('input').value;
                            memoArray[memoIndex].url = newUrl;
                            memoArray[memoIndex].platform = videoInfo.platform;
                            memoArray[memoIndex].memo = item.cells[5].querySelector('textarea').value;
                        }
                    } else if (memoType === 'general') {
                        memoArray[memoIndex].text = item.querySelector('textarea').value;
                    } else { // combined
                        memoArray[memoIndex].text = item.querySelector('textarea').value;
                    }
                    saveFunction();
                    render();
                }
            } else {
                // 수정 모드 진입
                if (memoType === 'youtube') {
                     if (item.classList.contains('combined-card')) {
                        const h3 = item.querySelector('h3');
                        const urlLink = item.querySelector('a');
                        const memoP = item.querySelector('.memo-content');
                        
                        h3.style.display = 'none';
                        memoP.style.display = 'none';
                        
                        const titleInput = document.createElement('input');
                        titleInput.type = 'text';
                        titleInput.value = h3.textContent;
                        titleInput.className = 'edit-title-input';

                        const urlInput = document.createElement('input');
                        urlInput.type = 'url';
                        urlInput.value = urlLink.href;
                        urlInput.className = 'edit-url-input';

                        const memoTextarea = document.createElement('textarea');
                        memoTextarea.value = memoP.textContent;
                        memoTextarea.className = 'edit-memo-textarea';

                        item.insertBefore(titleInput, urlLink);
                        item.insertBefore(urlInput, urlLink);
                        item.appendChild(memoTextarea);

                     } else { // 테이블
                        const titleCell = item.cells[1];
                        const linkCell = item.cells[2];
                        const memoCell = item.cells[5];
                        const currentUrl = linkCell.querySelector('a').href;
    
                        titleCell.innerHTML = `<input type="text" value="${titleCell.textContent}" style="width: 95%;">`;
                        linkCell.innerHTML = `<input type="url" value="${currentUrl}" style="width: 95%;">`;
                        memoCell.innerHTML = `<textarea style="width: 95%; min-height: 40px;">${memoCell.textContent}</textarea>`;
                     }
                } else if (memoType === 'general') {
                    if (item.classList.contains('combined-card')) {
                        const contentP = item.querySelector('.memo-content');
                        contentP.innerHTML = `<textarea style="width: 95%; min-height: 80px;">${contentP.textContent}</textarea>`;
                    } else { // 테이블
                        const contentCell = item.cells[1];
                        contentCell.innerHTML = `<textarea style="width: 95%; min-height: 60px;">${contentCell.textContent}</textarea>`;
                    }
                } else { // combined
                    const currentText = memoArray.find(m => m.id === id).text;
                    item.innerHTML = `
                        <textarea style="width: 100%; min-height: 120px;">${currentText}</textarea>
                        <div class="actions-container">
                             <button class="action-btn edit-btn">저장</button>
                             <button class="action-btn delete-btn">삭제</button>
                        </div>
                    `;
                    // textarea에 포커스 주기
                    item.querySelector('textarea').focus();
                }
            }
        }
    }

    youtubeTableBody.addEventListener('click', (e) => handleActions(e, 'youtube'));
    memoTableBody.addEventListener('click', (e) => handleActions(e, 'general'));
    combinedResultsContainer.addEventListener('click', (e) => handleActions(e, null));
    
    // --- 유틸리티 함수 ---
    function extractVideoInfo(url) { // url -> text 로 변경해도 호환됨
        const patterns = [
            { pattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^& \n<>"'/]+)/, platform: 'YouTube' },
            { pattern: /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?& \n<>"'/]+)/, platform: 'YouTube' },
            { pattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^& \n<>"'/]+)/, platform: 'YouTube' },
            { pattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?& \n<>"'/]+)/, platform: 'Shorts' }
        ];
        for (const { pattern, platform } of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return { videoId: match[1], platform, url: match[0] }; // 전체 URL도 반환
            }
        }
        return null;
    }

    // --- 초기화 ---
    loadState();
    render();
});
