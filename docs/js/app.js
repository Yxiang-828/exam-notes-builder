/**
 * Exam Notes Main Application Logic
 * Handles Routing, Rendering, Search, and Theme Toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentChapterId = null;
    let searchResults = [];
    let selectedSearchIdx = -1;

    // --- DOM Elements ---
    const chapterListEl = document.getElementById('chapter-list');
    const contentAreaEl = document.getElementById('content-area');
    const themeToggleBtn = document.getElementById('toggle-theme-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Search Elements
    const globalSearchInput = document.getElementById('global-search');
    const searchOverlay = document.getElementById('search-overlay');
    const modalSearchInput = document.getElementById('modal-search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    const closeSearchBtn = document.getElementById('close-search-btn');

    // --- Initialization ---
    function init() {
        populateSidebar();
        initTheme();

        // Setup Markdown parsing options if marked is loaded
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true,
                breaks: true
            });
        } else {
            console.error("Marked.js is not loaded. Markdown will not be parsed.");
        }

        // Handle URL hash routing
        window.addEventListener('hashchange', handleRouteChange);
        handleRouteChange(); // initial load
    }

    // --- Sidebar & Navigation ---
    function populateSidebar() {
        chapterListEl.innerHTML = '';
        chaptersData.forEach((chapter, index) => {
            const li = document.createElement('li');
            li.dataset.id = chapter.id;

            // Revert active states naturally
            if (currentChapterId === chapter.id) {
                li.classList.add('active');
            }

            // Title span
            const titleSpan = document.createElement('span');
            titleSpan.className = 'chapter-title-text';
            titleSpan.textContent = chapter.title;
            li.appendChild(titleSpan);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chapter-btn';
            deleteBtn.title = 'Remove chapter from session';
            deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent triggering the chapter selection
                if (confirm(`Remove "${chapter.title}" from your current session view?\n\nNote: To permanently delete this chapter from your website, please delete its folder explicitly in the 'staging\\' directory and run 'Publish' again in execute.bat.`)) {
                    // Remove from local memory array
                    chaptersData.splice(index, 1);

                    // Cleanup search results just in case
                    searchResults = [];

                    // Re-render
                    populateSidebar();

                    // If we deleted the one we're looking at, route away
                    if (currentChapterId === chapter.id) {
                        if (chaptersData.length > 0) {
                            window.location.hash = chaptersData[0].id;
                        } else {
                            currentChapterId = null;
                            contentAreaEl.innerHTML = `<div class="welcome-screen"><h2>All chapters removed!</h2><p>Refresh the page to restore them, or delete them in 'staging\' and Publish again to permanently erase them.</p></div>`;
                        }
                    }
                }
            });

            li.appendChild(deleteBtn);

            li.addEventListener('click', () => {
                window.location.hash = chapter.id;
            });

            chapterListEl.appendChild(li);
        });
    }

    function handleRouteChange() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            loadChapter(hash);
        } else if (chaptersData && chaptersData.length > 0) {
            // Default to the first chapter automatically
            window.location.hash = chaptersData[0].id;
        }
    }

    function loadChapter(id, highlightText = null, matchIndex = 0) {
        const chapter = chaptersData.find(c => c.id === id);
        if (!chapter) return;

        currentChapterId = id;

        // Update active state in sidebar
        document.querySelectorAll('#chapter-list li').forEach(li => {
            if (li.dataset.id === id) li.classList.add('active');
            else li.classList.remove('active');
        });

        // Render content
        if (typeof marked !== 'undefined') {
            let htmlContent = marked.parse(chapter.content);

            // Optionally highlight search term
            if (highlightText) {
                const regex = new RegExp(`(${escapeRegExp(highlightText)})`, "gi");
                // Need to carefully highlight without breaking HTML tags
                htmlContent = htmlContent.replace(/(>)([^<]*)(<)/g, function (match, p1, p2, p3) {
                    return p1 + p2.replace(regex, "<mark class='tmp-highlight'>$1</mark>") + p3;
                });
            }

            contentAreaEl.innerHTML = htmlContent;
        } else {
            contentAreaEl.innerHTML = `<pre>${chapter.content}</pre>`;
        }

        // Scroll to highlighted element or to top
        if (highlightText) {
            setTimeout(() => {
                const marks = contentAreaEl.querySelectorAll('mark.tmp-highlight');
                if (marks && marks.length > 0) {
                    const safeIndex = Math.min(matchIndex, marks.length - 1);
                    marks[safeIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    contentAreaEl.scrollTop = 0;
                }
            }, 100);
        } else {
            contentAreaEl.scrollTop = 0;
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^\\$\\{\\}()|[\\]\\\\]/g, '\\\\$&'); // $& means the whole matched string
    }

    // --- Theme Toggling ---
    function initTheme() {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            document.body.className = savedTheme;
        } else if (!prefersDark) {
            document.body.className = 'light-theme';
        }

        updateThemeIcons();
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.className = 'light-theme';
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.className = 'dark-theme';
            localStorage.setItem('theme', 'dark-theme');
        }
        updateThemeIcons();
    });

    function updateThemeIcons() {
        if (document.body.classList.contains('dark-theme')) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    // --- Search Functionality ---
    globalSearchInput.addEventListener('click', openSearchModal);

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }

        if (e.key === 'Escape') {
            closeSearchModal();
        }

        // Search Navigation
        if (!searchOverlay.classList.contains('hidden')) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateSearchResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateSearchResults(-1);
            } else if (e.key === 'Enter' && selectedSearchIdx >= 0 && searchResults[selectedSearchIdx]) {
                e.preventDefault();
                selectSearchResult(searchResults[selectedSearchIdx]);
            }
        }
    });

    closeSearchBtn.addEventListener('click', closeSearchModal);
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) closeSearchModal();
    });

    function openSearchModal() {
        searchOverlay.classList.remove('hidden');
        modalSearchInput.focus();
    }

    function closeSearchModal() {
        searchOverlay.classList.add('hidden');
        globalSearchInput.blur();
    }

    modalSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.trim() === '') {
            searchResultsContainer.innerHTML = '<div class="empty-state">Start typing to search...</div>';
            searchResults = [];
            selectedSearchIdx = -1;
            return;
        }

        // Perform search
        searchResults = [];
        const searchRegex = new RegExp(escapeRegExp(query), "gi");

        chaptersData.forEach(chapter => {
            const content = chapter.content;
            let match;
            let occurrenceCount = 0;

            // Look for multiple instances
            while ((match = searchRegex.exec(content)) !== null) {
                const idx = match.index;

                // Get context snippet
                const start = Math.max(0, idx - 40);
                const end = Math.min(content.length, idx + query.length + 80);
                let snippet = content.substring(start, end);

                if (start > 0) snippet = '...' + snippet;
                if (end < content.length) snippet = snippet + '...';

                // Highlight snippet
                const highlightRegex = new RegExp(`(${escapeRegExp(query)})`, "gi");
                snippet = snippet.replace(highlightRegex, "<mark>$1</mark>");

                searchResults.push({
                    chapterId: chapter.id,
                    chapterTitle: chapter.title + (occurrenceCount > 0 ? ` (Match ${occurrenceCount + 1})` : ''),
                    snippet: snippet,
                    query: query,
                    matchIndex: occurrenceCount
                });

                occurrenceCount++;
                if (occurrenceCount >= 20) break; // performance safety
            }
        });

        renderSearchResults();
    });

    function renderSearchResults() {
        searchResultsContainer.innerHTML = '';
        selectedSearchIdx = -1;

        if (searchResults.length === 0) {
            searchResultsContainer.innerHTML = '<div class="empty-state">No results found.</div>';
            return;
        }

        searchResults.forEach((result, idx) => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.dataset.idx = idx;

            item.innerHTML = `
                <div class="result-chapter-title">${result.chapterTitle}</div>
                <div class="result-snippet">${result.snippet}</div>
            `;

            item.addEventListener('mouseenter', () => {
                selectSearchIndex(idx);
            });

            item.addEventListener('click', () => {
                selectSearchResult(result);
            });

            searchResultsContainer.appendChild(item);
        });

        // Select first item by default
        selectSearchIndex(0);
    }

    function navigateSearchResults(dir) {
        if (searchResults.length === 0) return;
        let newIdx = selectedSearchIdx + dir;
        if (newIdx < 0) newIdx = searchResults.length - 1;
        if (newIdx >= searchResults.length) newIdx = 0;
        selectSearchIndex(newIdx);
    }

    function selectSearchIndex(idx) {
        selectedSearchIdx = idx;
        const items = searchResultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, i) => {
            if (i === idx) {
                item.classList.add('selected');
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function selectSearchResult(result) {
        closeSearchModal();

        // Temporarily detach hashchange to prevent duplicate render without highlights
        window.removeEventListener('hashchange', handleRouteChange);
        window.location.hash = result.chapterId;

        setTimeout(() => {
            window.addEventListener('hashchange', handleRouteChange);
            loadChapter(result.chapterId, result.query, result.matchIndex);
        }, 50);
    }

    // Run Initialization
    init();
});
