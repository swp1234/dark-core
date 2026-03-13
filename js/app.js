/* ========================================
   Dark Core - Moral Dilemma Scales
   10 trolley-style dilemmas, balance scale UI
   4 traits: N, M, P, S — radar chart result
   ======================================== */

(function() {
    'use strict';

    // --- i18n helpers ---
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

    // --- Dilemma data ---
    // Each has left (lighter) and right (darker) choice
    // scores: [N, M, P, S] added when dark side chosen
    var dilemmas = [
        { key: 'd1', scores: [2, 1, 0, 0] },
        { key: 'd2', scores: [0, 2, 1, 0] },
        { key: 'd3', scores: [0, 0, 2, 1] },
        { key: 'd4', scores: [1, 2, 0, 0] },
        { key: 'd5', scores: [0, 1, 0, 2] },
        { key: 'd6', scores: [2, 0, 1, 0] },
        { key: 'd7', scores: [0, 1, 2, 0] },
        { key: 'd8', scores: [0, 0, 1, 2] },
        { key: 'd9', scores: [1, 0, 0, 2] },
        { key: 'd10', scores: [1, 2, 1, 1] }
    ];

    // Max possible per trait (sum all dilemma scores for that trait index)
    var maxTraitScores = [0, 0, 0, 0];
    dilemmas.forEach(function(d) {
        for (var i = 0; i < 4; i++) maxTraitScores[i] += d.scores[i];
    });

    // --- Tier definitions ---
    var tiers = [
        { key: 'light',  color: '#22c55e', min: 0,   max: 19 },
        { key: 'grey',   color: '#94a3b8', min: 20,  max: 39 },
        { key: 'shadow', color: '#7c3aed', min: 40,  max: 59 },
        { key: 'dark',   color: '#dc2626', min: 60,  max: 79 },
        { key: 'abyss',  color: '#1a1a1a', min: 80,  max: 100 }
    ];

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
    var currentDilemma = 0;
    var traitScores = [0, 0, 0, 0]; // N, M, P, S
    var choices = [];
    var isTransitioning = false;

    // --- DOM ---
    var startScreen = $('startScreen');
    var dilemmaScreen = $('dilemmaScreen');
    var resultScreen = $('resultScreen');
    var startBtn = $('startBtn');
    var progressFill = $('progressFill');
    var progressText = $('progressText');
    var dilemmaNumber = $('dilemmaNumber');
    var dilemmaScenario = $('dilemmaScenario');
    var dilemmaCard = $('dilemmaCard');
    var scaleLeft = $('scaleLeft');
    var scaleRight = $('scaleRight');
    var leftText = $('leftText');
    var rightText = $('rightText');
    var scaleBeam = $('scaleBeam');
    var barN = $('barN');
    var barM = $('barM');
    var barP = $('barP');
    var barS = $('barS');
    var tierBadge = $('tierBadge');
    var ringFill = $('ringFill');
    var darknessPct = $('darknessPct');
    var tierName = $('tierName');
    var tierDesc = $('tierDesc');
    var radarShape = $('radarShape');
    var traitList = $('traitList');
    var retakeBtn = $('retakeBtn');
    var shareTwitterBtn = $('shareTwitter');
    var shareCopyBtn = $('shareCopy');
    var themeToggle = $('themeToggle');
    var themeIcon = $('themeIcon');
    var langBtn = $('langBtn');
    var langDropdown = $('langDropdown');
    var currentLangLabel = $('currentLang');

    var langNames = {
        ko: '\uD55C\uAD6D\uC5B4', en: 'English', zh: '\u4E2D\u6587',
        hi: '\u0939\u093F\u0928\u094D\u0926\u0940', ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
        ja: '\u65E5\u672C\u8A9E', es: 'Espa\u00F1ol', pt: 'Portugu\u00EAs',
        id: 'Indonesia', tr: 'T\u00FCrk\u00E7e', de: 'Deutsch', fr: 'Fran\u00E7ais'
    };

    // --- Tier from percentage ---
    function getTier(pct) {
        for (var i = tiers.length - 1; i >= 0; i--) {
            if (pct >= tiers[i].min) return tiers[i];
        }
        return tiers[0];
    }

    // --- Screen management ---
    function showScreen(screen) {
        startScreen.style.display = 'none';
        dilemmaScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        startScreen.classList.remove('active');
        dilemmaScreen.classList.remove('active');
        resultScreen.classList.remove('active');
        screen.style.display = '';
        screen.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Theme ---
    function initTheme() {
        var saved = localStorage.getItem('theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        var current = document.documentElement.getAttribute('data-theme');
        if (themeIcon) themeIcon.textContent = current === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F';
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
                        if (currentLangLabel) currentLangLabel.textContent = langNames[lang] || lang;
                        refreshCurrentView();
                    }).catch(function() {});
                }
            });
        });
        var inst = getI18n();
        if (inst && currentLangLabel) {
            currentLangLabel.textContent = langNames[inst.currentLang] || inst.currentLang;
        }
    }

    function refreshCurrentView() {
        if (dilemmaScreen.classList.contains('active')) {
            renderDilemma();
            updateLiveBars();
        } else if (resultScreen.classList.contains('active')) {
            renderResult();
        }
    }

    // --- Start ---
    function startTest() {
        currentDilemma = 0;
        traitScores = [0, 0, 0, 0];
        choices = [];
        isTransitioning = false;
        updateLiveBars();
        showScreen(dilemmaScreen);
        renderDilemma();

        if (typeof gtag === 'function') {
            gtag('event', 'quiz_start', { event_category: 'dark-core' });
        }
    }

    // --- Render dilemma ---
    function renderDilemma() {
        var d = dilemmas[currentDilemma];
        var num = currentDilemma + 1;
        var total = dilemmas.length;

        // Progress
        var pct = (currentDilemma / total) * 100;
        progressFill.style.width = pct + '%';
        progressText.textContent = num + ' / ' + total;
        dilemmaNumber.textContent = t('dilemma.number', 'DILEMMA') + ' ' + num + ' / ' + total;

        // Scenario text
        dilemmaScenario.textContent = t('dilemmas.' + d.key + '.scenario', 'Scenario ' + num);

        // Choices
        leftText.textContent = t('dilemmas.' + d.key + '.left', 'Option A');
        rightText.textContent = t('dilemmas.' + d.key + '.right', 'Option B');

        // Reset scale visual
        scaleLeft.className = 'scale-pan scale-left';
        scaleRight.className = 'scale-pan scale-right';
        scaleBeam.className = 'scale-beam tilt-none';
    }

    // --- Choose side ---
    function chooseSide(side) {
        if (isTransitioning) return;
        isTransitioning = true;

        var d = dilemmas[currentDilemma];

        // side: 'left' = virtuous, 'right' = dark
        choices.push({ dilemma: currentDilemma, side: side });

        if (side === 'right') {
            // Add dark scores
            for (var i = 0; i < 4; i++) {
                traitScores[i] += d.scores[i];
            }
            // Visual: tilt right (dark side heavier)
            scaleBeam.className = 'scale-beam tilt-right';
            scaleRight.classList.add('chosen-dark');
            scaleLeft.classList.add('unchosen');
        } else {
            // Virtuous: no score added
            scaleBeam.className = 'scale-beam tilt-left';
            scaleLeft.classList.add('chosen-light');
            scaleRight.classList.add('unchosen');
        }

        // Update live bars
        updateLiveBars();

        // Advance
        setTimeout(function() {
            if (currentDilemma < dilemmas.length - 1) {
                currentDilemma++;
                if (dilemmaCard) {
                    dilemmaCard.style.animation = 'none';
                    dilemmaCard.offsetHeight;
                    dilemmaCard.style.animation = 'cardSlideIn 0.4s ease';
                }
                renderDilemma();
                isTransitioning = false;
            } else {
                progressFill.style.width = '100%';
                showScreen(resultScreen);
                renderResult();
                isTransitioning = false;
            }
        }, 900);
    }

    // --- Update live trait bars ---
    function updateLiveBars() {
        var bars = [barN, barM, barP, barS];
        for (var i = 0; i < 4; i++) {
            var maxVal = maxTraitScores[i];
            var pct = maxVal > 0 ? Math.round((traitScores[i] / maxVal) * 100) : 0;
            if (bars[i]) bars[i].style.width = pct + '%';
        }
    }

    // --- Render result ---
    function renderResult() {
        // Calculate total darkness percentage
        var totalMax = 0;
        var totalScore = 0;
        for (var i = 0; i < 4; i++) {
            totalMax += maxTraitScores[i];
            totalScore += traitScores[i];
        }
        var pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        var tier = getTier(pct);

        // Tier class
        var resultCard = document.querySelector('.result-card');
        resultCard.className = 'card result-card tier-' + tier.key;

        // Badge
        tierBadge.textContent = t('tiers.' + tier.key + '.badge', tier.key.toUpperCase());

        // Darkness ring
        var circumference = 326.7;
        var offset = circumference - (circumference * pct / 100);
        if (ringFill) {
            ringFill.style.strokeDashoffset = circumference;
            setTimeout(function() {
                ringFill.style.strokeDashoffset = offset;
            }, 100);
        }

        // Count-up percentage
        darknessPct.textContent = '0%';
        setTimeout(function() {
            animateCounter(darknessPct, 0, pct, '%');
        }, 300);

        // Tier name & desc
        tierName.textContent = t('tiers.' + tier.key + '.name', tier.key);
        tierName.style.color = tier.color;
        if (tier.key === 'abyss') tierName.style.color = '';
        tierDesc.textContent = t('tiers.' + tier.key + '.desc', '');

        // Radar chart
        renderRadar();

        // Trait breakdown
        renderTraitBreakdown();

        // Percentile stat
        var pStat = $('percentile-stat');
        if (pStat) {
            var pctVal = 5 + Math.floor(Math.random() * 18);
            var tmpl = t('result.percentileStat', 'Only <strong>{percent}%</strong> share your dark profile');
            pStat.innerHTML = tmpl.replace('{percent}', pctVal);
        }

        // GA4
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
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // --- Radar chart ---
    function renderRadar() {
        // Calculate trait percentages
        var pcts = [];
        for (var i = 0; i < 4; i++) {
            var maxVal = maxTraitScores[i];
            pcts.push(maxVal > 0 ? traitScores[i] / maxVal : 0);
        }

        // Map to CSS clip-path polygon (top=N, right=M, bottom=P, left=S)
        // Center is 50%, radius is 50% (full = 100%)
        var minR = 5; // minimum radius %
        var points = [
            '50% ' + (50 - Math.max(pcts[0], 0.05) * 50) + '%',    // top (N)
            (50 + Math.max(pcts[1], 0.05) * 50) + '% 50%',         // right (M)
            '50% ' + (50 + Math.max(pcts[2], 0.05) * 50) + '%',    // bottom (P)
            (50 - Math.max(pcts[3], 0.05) * 50) + '% 50%'          // left (S)
        ];

        if (radarShape) {
            // Start collapsed
            radarShape.style.clipPath = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)';
            setTimeout(function() {
                radarShape.style.clipPath = 'polygon(' + points.join(', ') + ')';
            }, 400);
        }
    }

    // --- Trait breakdown bars ---
    function renderTraitBreakdown() {
        traitList.innerHTML = '';
        var traitCssClasses = ['t-n', 't-m', 't-p', 't-s'];

        traitKeys.forEach(function(trait, idx) {
            var score = traitScores[idx];
            var maxVal = maxTraitScores[idx];
            var pct = maxVal > 0 ? Math.round((score / maxVal) * 100) : 0;

            var item = document.createElement('div');
            item.className = 'trait-item';

            var header = document.createElement('div');
            header.className = 'trait-header';

            var name = document.createElement('span');
            name.className = 'trait-name';
            name.textContent = t(traitI18nKeys[trait], traitFallbacks[trait]);

            var scoreSpan = document.createElement('span');
            scoreSpan.className = 'trait-score';
            scoreSpan.textContent = pct + '%';

            header.appendChild(name);
            header.appendChild(scoreSpan);

            var barContainer = document.createElement('div');
            barContainer.className = 'trait-bar';

            var barFill = document.createElement('div');
            barFill.className = 'trait-bar-fill ' + traitCssClasses[idx];
            barContainer.appendChild(barFill);

            item.appendChild(header);
            item.appendChild(barContainer);
            traitList.appendChild(item);

            setTimeout(function() {
                barFill.style.width = pct + '%';
            }, 600);
        });
    }

    // --- Share ---
    function shareTwitter() {
        var totalMax = 0, totalScore = 0;
        for (var i = 0; i < 4; i++) { totalMax += maxTraitScores[i]; totalScore += traitScores[i]; }
        var pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        var tier = getTier(pct);
        var tierLabel = t('tiers.' + tier.key + '.name', tier.key);
        var text = fmt(t('share.text', 'My Dark Core score is {score}%! I\'m a \'{tier}\' Find out yours:'), {
            score: pct, tier: tierLabel
        });
        var url = 'https://dopabrain.com/dark-core/';
        window.open(
            'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
            '_blank', 'noopener'
        );
        if (typeof gtag === 'function') {
            gtag('event', 'share', { method: 'twitter', content_type: 'quiz_result' });
        }
    }

    function copyUrl() {
        var url = 'https://dopabrain.com/dark-core/';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
                showCopiedFeedback();
            }).catch(function() { fallbackCopy(url); });
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

    // --- Loader ---
    function hideLoader() {
        var loader = $('app-loader');
        if (loader) loader.classList.add('hidden');
    }

    // --- Events ---
    function bindEvents() {
        if (startBtn) startBtn.addEventListener('click', startTest);

        if (scaleLeft) {
            scaleLeft.addEventListener('click', function() { chooseSide('left'); });
        }
        if (scaleRight) {
            scaleRight.addEventListener('click', function() { chooseSide('right'); });
        }

        if (retakeBtn) {
            retakeBtn.addEventListener('click', function() {
                showScreen(startScreen);
                if (ringFill) ringFill.style.strokeDashoffset = 326.7;
                if (darknessPct) darknessPct.textContent = '0%';
            });
        }

        if (shareTwitterBtn) shareTwitterBtn.addEventListener('click', shareTwitter);
        if (shareCopyBtn) shareCopyBtn.addEventListener('click', copyUrl);
    }

    // --- Init ---
    function init() {
        initTheme();
        initLangSelector();
        bindEvents();

        var inst = getI18n();
        if (inst && typeof inst.loadTranslations === 'function') {
            inst.loadTranslations(inst.currentLang).then(function() {
                if (typeof inst.updateUI === 'function') inst.updateUI();
                if (currentLangLabel) currentLangLabel.textContent = langNames[inst.currentLang] || inst.currentLang;
                hideLoader();
            }).catch(function() { hideLoader(); });
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
