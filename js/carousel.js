// Carousel scroll animation for Selected Works
// Replicates Framer's scroll-based 3D carousel with counter-scrolling rows

(function() {
    // Find carousel containers
    const desktopCarousel = document.querySelector('.framer-nG6c5.framer-v-9k1efc');
    const tabletCarousel = document.querySelector('.framer-nG6c5.framer-v-192f8x6');
    
    // Select whichever carousel is visible
    function getActiveCarousel() {
        // Desktop variant
        const desktop = document.querySelector('.framer-nG6c5.framer-v-9k1efc');
        if (desktop && desktop.offsetParent !== null) return desktop;
        // Tablet variant
        const tablet = document.querySelector('.framer-nG6c5.framer-v-192f8x6');
        if (tablet && tablet.offsetParent !== null) return tablet;
        return null;
    }

    // The carousel wrapper (framer-1podjsj or equivalent)
    function getCarouselWrapper() {
        // These are the carousel containers that have the perspective/scroll effects
        const wrappers = document.querySelectorAll('[data-framer-name="Desktop"], [data-framer-name="Tablet"]');
        for (const w of wrappers) {
            if (w.offsetParent !== null || getComputedStyle(w.parentElement).display !== 'none') {
                return w;
            }
        }
        return null;
    }

    // Find the "Content" div inside the carousel
    function getContentDiv(carousel) {
        if (!carousel) return null;
        return carousel.querySelector('[data-framer-name="Content"]');
    }

    // Find the three rows
    function getRows(carousel) {
        if (!carousel) return [];
        return [
            carousel.querySelector('[data-framer-name="Rows 1"]'),
            carousel.querySelector('[data-framer-name="Rows 2"]'),
            carousel.querySelector('[data-framer-name="Rows 3"]')
        ].filter(Boolean);
    }

    // Find the sticky carousel container
    function getStickyContainer() {
        return document.querySelector('.framer-12be78h-container') || 
               document.querySelector('.framer-1bp2y0g-container') ||
               document.querySelector('.framer-1jq939w-container');
    }

    function init() {
        const carousel = getCarouselWrapper();
        if (!carousel) {
            console.log('Carousel not found, retrying...');
            setTimeout(init, 500);
            return;
        }

        const content = getContentDiv(carousel);
        const rows = getRows(carousel);
        
        console.log('Carousel found:', carousel);
        console.log('Content:', content);
        console.log('Rows:', rows.length);

        // The mask container (framer-7b33o9) clips the carousel
        const maskContainer = carousel.closest('.framer-7b33o9') || carousel.parentElement;
        
        // Find the sticky parent
        const stickyParent = carousel.closest('[style*="sticky"]') || carousel.closest('.framer-12be78h-container');

        let ticking = false;

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }

        function update() {
            ticking = false;

            const scrollY = window.scrollY || window.pageYOffset;
            const vh = window.innerHeight;

            // Find the carousel's position in the document
            const rect = carousel.getBoundingClientRect();
            const docTop = rect.top + scrollY;
            const carouselHeight = rect.height;

            // Calculate scroll progress through the carousel section
            // Start when carousel enters viewport, end when it leaves
            const startScroll = docTop - vh;
            const endScroll = docTop + carouselHeight;
            const totalScroll = endScroll - startScroll;
            
            let progress = (scrollY - startScroll) / totalScroll;
            progress = Math.max(0, Math.min(1, progress));

            // Apply 3D perspective scale to content
            // Original: starts at scale(1.6) and zooms to scale(1) as you scroll
            if (content) {
                const scale = 1.6 - (0.6 * progress);
                const perspective = 1200;
                // Smooth easing
                const eased = easeOutCubic(progress);
                const finalScale = 1.6 - (0.6 * eased);
                content.style.transform = `perspective(${perspective}px) scale(${finalScale})`;
                content.style.willChange = 'transform';
            }

            // Apply counter-scroll to rows
            // Row 1: moves down (translateY positive -> negative)
            // Row 2: moves opposite
            // Row 3: moves same as row 1
            const eased2 = easeInOutCubic(progress);
            const perspective = 1200;

            if (rows.length >= 3) {
                // Row 1: translateY from 100 to 0
                const y1 = 100 - (100 * eased2);
                rows[0].style.transform = `perspective(${perspective}px) translateY(${y1}px)`;
                rows[0].style.willChange = 'transform';

                // Row 2: translateY from -50 to 0 (counter direction)
                const y2 = -50 + (50 * eased2);
                rows[1].style.transform = `perspective(${perspective}px) translateY(${y2}px)`;
                rows[1].style.willChange = 'transform';

                // Row 3: translateY from 100 to 0
                const y3 = 100 - (100 * eased2);
                rows[2].style.transform = `perspective(${perspective}px) translateY(${y3}px)`;
                rows[2].style.willChange = 'transform';
            }

            // Also handle appear animations for other elements
            animateAppearElements();
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        // Appear animations for elements with data-framer-appear-id
        const appearElements = [];
        function collectAppearElements() {
            document.querySelectorAll('[data-framer-appear-id]').forEach(el => {
                appearElements.push({
                    el: el,
                    id: el.getAttribute('data-framer-appear-id'),
                    animated: false
                });
            });
        }

        function animateAppearElements() {
            const vh = window.innerHeight;
            appearElements.forEach(item => {
                if (item.animated) return;
                const rect = item.el.getBoundingClientRect();
                // Trigger when element is in viewport
                if (rect.top < vh * 0.85 && rect.bottom > 0) {
                    item.animated = true;
                    // Get initial transform values and animate to final
                    const style = item.el.style;
                    // Animate opacity
                    if (parseFloat(style.opacity) < 1) {
                        animateValue(item.el, 'opacity', parseFloat(style.opacity) || 0, 1, 900, easeOutCubic, 1300);
                    }
                    // Animate translateY
                    const currentTransform = style.transform || '';
                    const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);
                    if (translateYMatch) {
                        const currentY = parseFloat(translateYMatch[1]);
                        if (Math.abs(currentY) > 1) {
                            // Delay based on appear id
                            const delays = {
                                'hphohq': 1300, '1lzeosy': 1400, 'w7p1nk': 1500,
                                '1q0kjms': 1600, 'wt4mtr': 1700, '1s5k87z': 1300,
                                '1alsuev': 1300, 'bwp448': 1300, 'hkshok': 1100,
                                'drs2iq': 1900, '5v2dpo': 2100, 'k8yokz': 2300,
                                '12be78h': 1000, 'rwe71q': 1000
                            };
                            const delay = delays[item.id] || 1000;
                            setTimeout(() => {
                                const t = item.el.style.transform;
                                item.el.style.transform = t.replace(/translateY\([^)]+\)/, 'translateY(0px)');
                                item.el.style.transition = `transform 0.9s cubic-bezier(0, 0.24, 0, 1)`;
                            }, delay);
                        }
                    }
                }
            });
        }

        function animateValue(el, prop, from, to, duration, ease, delay) {
            if (delay) {
                setTimeout(() => runAnim(), delay);
            } else {
                runAnim();
            }
            function runAnim() {
                const start = performance.now();
                function step(now) {
                    const elapsed = now - start;
                    const t = Math.min(elapsed / duration, 1);
                    const val = from + (to - from) * ease(t);
                    el.style[prop] = val;
                    if (t < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }
        }

        // Initial setup
        collectAppearElements();
        
        // Set initial states for carousel rows
        if (content) {
            content.style.transform = 'perspective(1200px) scale(1.6)';
        }
        if (rows.length >= 3) {
            rows[0].style.transform = 'perspective(1200px) translateY(100px)';
            rows[1].style.transform = 'perspective(1200px) translateY(-50px)';
            rows[2].style.transform = 'perspective(1200px) translateY(100px)';
        }

        // Listen for scroll
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Also listen for resize
        window.addEventListener('resize', onScroll, { passive: true });
        
        // Initial update
        onScroll();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
