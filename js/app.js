/* ========================================
   Dark Core Personality Test - App Logic
   12 questions measuring 4 dark traits:
   Narcissism, Machiavellianism, Psychopathy, Sadism
   Score 0-36, percentage display, 5 tiers
   ======================================== */

(function() {
    'use strict';

    // --- i18n helpers (try-catch) ---
    function getI18n() {
        try {
            if (typeof i18n !== 'undefined' && i18n) return i18n;
        } catch (e) { /* ignore */ }
        return null;
    }

    function t(key, fallback) {
        try {
            var inst = getI18n();
            if (inst && typeof inst.t === 'function') {
                var val = inst.t(key);
                if (val && val !== key) return val;
            }
        } catch (e) { /* ignore */ }
        return fallback || key;
    }

    function fmt(template, values) {
        var result = template;
        for (var k in values) {
            if (values.hasOwnProperty(k)) {
                result = result.replace(new RegExp('\\{' + k + '\\}', 'g'), values[k]);
            }
        }
        return result;
    }

    function $(id) { return document.getElementById(id); }

    // --- Questions data ---
    // trait: N=Narcissism, M=Machiavellianism, P=Psychopathy, S=Sadism
    var questions = [
        {
            key: 'q1', emoji: '\uD83C\uDFC6', trait: 'N',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q2', emoji: '\uD83E\uDE9E', trait: 'N',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q3', emoji: '\uD83D\uDDE3\uFE0F', trait: 'N',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q4', emoji: '\uD83E\uDD2B', trait: 'M',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q5', emoji: '\uD83D\uDC51', trait: 'M',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q6', emoji: '\uD83D\uDCDC', trait: 'M',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q7', emoji: '\uD83D\uDE21', trait: 'P',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q8', emoji: '\uD83D\uDCB0', trait: 'P',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q9', emoji: '\uD83D\uDECD\uFE0F', trait: 'P',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q10', emoji: '\uD83D\uDE08', trait: 'S',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q11', emoji: '\uD83C\uDFAE', trait: 'S',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        },
        {
            key: 'q12', emoji: '\uD83C\uDFAC', trait: 'S',
            options: [
                { key: 'a', points: 0 },
                { key: 'b', points: 1 },
                { key: 'c', points: 2 },
                { key: 'd', points: 3 }
            ]
        }
    ];

    // --- Tier definitions ---
    var tiers = [
        { key: 'light',  emoji: '\uD83D\uDCAB', color: '#22c55e', min: 0,  max: 7  },
        { key: 'grey',   emoji: '\u2696\uFE0F',  color: '#94a3b8', min: 8,  max: 14 },
        { key: 'shadow', emoji: '\uD83C\uDF11',   color: '#7c3aed', min: 15, max: 21 },
        { key: 'dark',   emoji: '\uD83D\uDDA4',   color: '#dc2626', min: 22, max: 28 },
        { key: 'abyss',  emoji: '\uD83D\uDC41\uFE0F', color: '#1a1a1a', min: 29, max: 36 }
    ];

    // --- Trait keys ---
    var traitKeys = ['N', 'M', 'P', 'S'];
    var traitI18nKeys = {
        N: 'traits.narcissism',
        M: 'traits.machiavellianism',
        P: 'traits.psychopathy',
        S: 'traits.sadism'
    };
    var traitFallbacks = {
        N: 'Narcissism',
        M: 'Machiavellianism',
        P: 'Psychopathy',
        S: 'Sadism'
    };

    // --- State ---
    var currentQuestion = 0;
    var totalScore = 0;
    var traitScores = { N: 0, M: 0, P: 0, S: 0 };
    var answers = [];
    var isTransitioning = false;

    // --- DOM caching ---
    var startScreen = $('startScreen');
    var quizScreen = $('quizScreen');
    var resultScreen = $('resultScreen');
    var startBtn = $('startBtn');
    var progressFill = $('progressFill');
    var progressText = $('progressText');
    var darkValue = $('darkValue');
    var scenarioEmoji = $('scenarioEmoji');
    var questionText = $('questionText');
    var optionsContainer = $('optionsContainer');
    var questionCard = $('questionCard');
    var tierBadge = $('tierBadge');
    var darkMeterFill = $('darkMeterFill');
    var darkMeterGlow = $('darkMeterGlow');
    var darkScoreDisplay = $('darkScoreDisplay');
    var tierName = $('tierName');
    var tierDesc = $('tierDesc');
    var traitList = $('traitList');
    var retakeBtn = $('retakeBtn');
    var shareTwitterBtn = $('shareTwitter');
    var shareCopyBtn = $('shareCopy');
    var themeToggle = $('themeToggle');
    var themeIcon = $('themeIcon');
    var langBtn = $('langBtn');
    var langDropdown = $('langDropdown');
    var currentLangLabel = $('currentLang');

    // --- Language name map ---
    var langNames = {
        ko: '\uD55C\uAD6D\uC5B4', en: 'English', zh: '\u4E2D\u6587',
        hi: '\u0939\u093F\u0928\u094D\u0926\u0940', ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
        ja: '\u65E5\u672C\u8A9E', es: 'Espa\u00F1ol', pt: 'Portugu\u00EAs',
        id: 'Indonesia', tr: 'T\u00FCrk\u00E7e', de: 'Deutsch', fr: 'Fran\u00E7ais'
    };

    // --- Get tier from score ---
    function getTier(score) {
        for (var i = tiers.length - 1; i >= 0; i--) {
            if (score >= tiers[i].min) return tiers[i];
        }
        return tiers[0];
    }

    // --- Calculate percentage ---
    function getPercentage(score) {
        return Math.round((score / 36) * 100);
    }

    // --- Screen management ---
    function showScreen(screen) {
        startScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        startScreen.classList.remove('active');
        quizScreen.classList.remove('active');
        resultScreen.classList.remove('active');
        screen.style.display = '';
        screen.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Theme toggle ---
    function initTheme() {
        var saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        }
        updateThemeIcon();
    }

    function updateThemeIcon() {
        var current = document.documentElement.getAttribute('data-theme');
        if (themeIcon) {
            themeIcon.textContent = current === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon();
        });
    }

    // --- Language selector ---
    function initLangSelector() {
        if (!langBtn || !langDropdown) return;

        langBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!langDropdown.contains(e.target) && e.target !== langBtn) {
                langDropdown.classList.remove('active');
            }
        });

        var langOptions = langDropdown.querySelectorAll('.lang-option');
        langOptions.forEach(function(option) {
            option.addEventListener('click', function() {
                var lang = this.getAttribute('data-lang');
                langDropdown.classList.remove('active');

                var inst = getI18n();
                if (inst && typeof inst.setLanguage === 'function') {
                    inst.setLanguage(lang).then(function() {
                        if (currentLangLabel) {
                            currentLangLabel.textContent = langNames[lang] || lang;
                        }
                        refreshCurrentView();
                    }).catch(function() {});
                }
            });
        });

        // Set initial label
        var inst = getI18n();
        if (inst && currentLangLabel) {
            currentLangLabel.textContent = langNames[inst.currentLang] || inst.currentLang;
        }
    }

    // --- Refresh current view after language change ---
    function refreshCurrentView() {
        if (quizScreen.classList.contains('active')) {
            renderQuestion();
            darkValue.textContent = totalScore;
        } else if (resultScreen.classList.contains('active')) {
            renderResult();
        }
    }

    // --- Start quiz ---
    function startQuiz() {
        currentQuestion = 0;
        totalScore = 0;
        traitScores = { N: 0, M: 0, P: 0, S: 0 };
        answers = [];
        isTransitioning = false;
        darkValue.textContent = '0';
        showScreen(quizScreen);
        renderQuestion();

        if (typeof gtag === 'function') {
            gtag('event', 'quiz_start', { event_category: 'dark-core' });
        }
    }

    // --- Render question ---
    function renderQuestion() {
        var q = questions[currentQuestion];
        var qNum = currentQuestion + 1;
        var total = questions.length;

        // Update progress
        var pct = (currentQuestion / total) * 100;
        progressFill.style.width = pct + '%';
        progressText.textContent = qNum + ' / ' + total;

        // Scenario emoji
        scenarioEmoji.textContent = q.emoji;

        // Question text via i18n
        questionText.textContent = t('questions.' + q.key + '.text', 'Question ' + qNum);

        // Render options
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('answered');
        q.options.forEach(function(opt, idx) {
            var btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = t('questions.' + q.key + '.' + opt.key, 'Option ' + (idx + 1));
            btn.addEventListener('click', function() {
                if (!isTransitioning) {
                    selectOption(idx);
                }
            });
            optionsContainer.appendChild(btn);
        });
    }

    // --- Select option ---
    function selectOption(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        var q = questions[currentQuestion];
        var opt = q.options[index];
        var points = opt.points;

        // Store answer
        answers.push({
            questionIndex: currentQuestion,
            optionIndex: index,
            points: points,
            trait: q.trait
        });

        // Update totals
        totalScore += points;
        traitScores[q.trait] += points;

        // Visual feedback
        var buttons = optionsContainer.querySelectorAll('.option-btn');
        optionsContainer.classList.add('answered');

        var selectedClass = 'selected-light';
        if (points >= 2) selectedClass = 'selected-dark';
        else if (points >= 1) selectedClass = 'selected-mid';

        buttons[index].classList.add(selectedClass);

        // Show floating points
        showFloatingPoints(points, buttons[index]);

        // Animate counter
        darkValue.textContent = totalScore;
        darkValue.classList.add('bump');
        setTimeout(function() {
            darkValue.classList.remove('bump');
        }, 400);

        // Advance after delay
        setTimeout(function() {
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                if (questionCard) {
                    questionCard.style.animation = 'none';
                    questionCard.offsetHeight; // trigger reflow
                    questionCard.style.animation = 'cardSlideIn 0.4s ease';
                }
                renderQuestion();
                isTransitioning = false;
            } else {
                // Quiz complete
                progressFill.style.width = '100%';
                showScreen(resultScreen);
                renderResult();
                isTransitioning = false;
            }
        }, 700);
    }

    // --- Floating points indicator ---
    function showFloatingPoints(points, targetBtn) {
        var floater = document.createElement('div');
        floater.className = 'floating-points';

        if (points >= 2) {
            floater.classList.add('dark');
            floater.textContent = '+' + points;
        } else if (points >= 1) {
            floater.classList.add('mid');
            floater.textContent = '+' + points;
        } else {
            floater.classList.add('light');
            floater.textContent = '0';
        }

        if (targetBtn && targetBtn.parentNode) {
            targetBtn.style.position = 'relative';
            floater.style.top = '-10px';
            floater.style.right = '10px';
            floater.style.pointerEvents = 'none';
            targetBtn.appendChild(floater);
        }

        setTimeout(function() {
            if (floater.parentNode) {
                floater.parentNode.removeChild(floater);
            }
        }, 1000);
    }

    // --- Render result ---
    function renderResult() {
        var tier = getTier(totalScore);
        var pct = getPercentage(totalScore);

        // Remove old tier classes
        var resultCard = document.querySelector('.result-card');
        resultCard.className = 'card result-card tier-' + tier.key;

        // Tier badge
        tierBadge.textContent = tier.emoji + ' ' + t('tiers.' + tier.key + '.badge', tier.key.toUpperCase());

        // Score display with count-up animation
        darkScoreDisplay.textContent = '0%';
        setTimeout(function() {
            animateCounter(darkScoreDisplay, 0, pct, '%');
        }, 300);

        // Dark meter fill animation
        if (darkMeterFill) {
            darkMeterFill.style.width = '0%';
        }

        setTimeout(function() {
            if (darkMeterFill) {
                darkMeterFill.style.width = pct + '%';
            }
            var meter = $('darkMeter');
            if (meter) {
                meter.classList.add('filled');
            }
        }, 500);

        // Tier name
        tierName.textContent = t('tiers.' + tier.key + '.name', tier.key);
        tierName.style.color = tier.color;
        if (tier.key === 'abyss') {
            tierName.style.color = '';
        }

        // Tier description
        tierDesc.textContent = t('tiers.' + tier.key + '.desc', '');

        // Trait breakdown bars
        renderTraitBreakdown();

        // GA4 event
        if (typeof gtag === 'function') {
            gtag('event', 'quiz_complete', {
                event_category: 'dark-core',
                event_label: tier.key,
                value: pct
            });
        }
    }

    // --- Count-up animation ---
    function animateCounter(element, from, to, suffix) {
        var duration = 1200;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(from + (to - from) * eased);
            element.textContent = current + (suffix || '');
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    // --- Render trait breakdown ---
    function renderTraitBreakdown() {
        traitList.innerHTML = '';

        traitKeys.forEach(function(trait) {
            var score = traitScores[trait];
            var maxScore = 9;
            var pct = Math.round((score / maxScore) * 100);

            var item = document.createElement('div');
            item.className = 'trait-item';

            var header = document.createElement('div');
            header.className = 'trait-header';

            var name = document.createElement('span');
            name.className = 'trait-name';
            name.textContent = t(traitI18nKeys[trait], traitFallbacks[trait]);

            var scoreSpan = document.createElement('span');
            scoreSpan.className = 'trait-score';
            scoreSpan.textContent = score + ' / ' + maxScore;

            header.appendChild(name);
            header.appendChild(scoreSpan);

            var barContainer = document.createElement('div');
            barContainer.className = 'trait-bar';

            var barFill = document.createElement('div');
            barFill.className = 'trait-bar-fill';

            // Color based on score level
            if (pct <= 25) barFill.classList.add('low');
            else if (pct <= 55) barFill.classList.add('mid');
            else if (pct <= 77) barFill.classList.add('high');
            else barFill.classList.add('max');

            barContainer.appendChild(barFill);
            item.appendChild(header);
            item.appendChild(barContainer);
            traitList.appendChild(item);

            // Animate bar fill after a small delay
            setTimeout(function() {
                barFill.style.width = pct + '%';
            }, 600);
        });
    }

    // --- Share: Twitter ---
    function shareTwitter() {
        var tier = getTier(totalScore);
        var pct = getPercentage(totalScore);
        var tierLabel = t('tiers.' + tier.key + '.name', tier.key);
        var text = fmt(t('share.text', 'My Dark Core score is {score}%! I\'m a \'{tier}\' \uD83D\uDDA4 Find out yours:'), {
            score: pct,
            tier: tierLabel
        });
        var url = 'https://dopabrain.com/dark-core/';
        window.open(
            'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
            '_blank',
            'noopener'
        );
        if (typeof gtag === 'function') {
            gtag('event', 'share', { method: 'twitter', content_type: 'quiz_result' });
        }
    }

    // --- Share: Copy URL ---
    function copyUrl() {
        var url = 'https://dopabrain.com/dark-core/';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
                showCopiedFeedback();
            }).catch(function() {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
        if (typeof gtag === 'function') {
            gtag('event', 'share', { method: 'copy', content_type: 'quiz_result' });
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopiedFeedback(); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    function showCopiedFeedback() {
        if (!shareCopyBtn) return;
        var original = shareCopyBtn.textContent;
        shareCopyBtn.textContent = t('share.copied', 'Copied!');
        shareCopyBtn.classList.add('copied');
        setTimeout(function() {
            shareCopyBtn.textContent = t('share.copyUrl', 'Copy Link');
            shareCopyBtn.classList.remove('copied');
        }, 2000);
    }

    // --- Hide loader ---
    function hideLoader() {
        var loader = $('app-loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    // --- Bind events ---
    function bindEvents() {
        if (startBtn) {
            startBtn.addEventListener('click', startQuiz);
        }

        if (retakeBtn) {
            retakeBtn.addEventListener('click', function() {
                showScreen(startScreen);
                if (darkMeterFill) darkMeterFill.style.width = '0%';
                if (darkScoreDisplay) darkScoreDisplay.textContent = '0%';
                var meter = $('darkMeter');
                if (meter) meter.classList.remove('filled');
            });
        }

        if (shareTwitterBtn) {
            shareTwitterBtn.addEventListener('click', shareTwitter);
        }

        if (shareCopyBtn) {
            shareCopyBtn.addEventListener('click', copyUrl);
        }
    }

    // --- Init ---
    function init() {
        initTheme();
        initLangSelector();
        bindEvents();

        var inst = getI18n();
        if (inst && typeof inst.loadTranslations === 'function') {
            inst.loadTranslations(inst.currentLang).then(function() {
                if (typeof inst.updateUI === 'function') {
                    inst.updateUI();
                }
                if (currentLangLabel) {
                    currentLangLabel.textContent = langNames[inst.currentLang] || inst.currentLang;
                }
                hideLoader();
            }).catch(function() {
                hideLoader();
            });
        } else {
            hideLoader();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
