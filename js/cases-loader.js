// Cases loader - fetches cases from API and renders them with Framer-compatible HTML structure
async function loadCasesFromAPI() {
  try {
    const res = await fetch('/api/cases');
    if (!res.ok) throw new Error('Failed to load cases');
    const cases = await res.json();
    
    const container = document.getElementById('cases-container');
    if (!container) return;

    const cardIds = ['gam', 'pharsalus', 'tsb', 'expert-insights'];
    const cardWrappers = ['framer-1jq939w-container', 'framer-1bp2y0g-container', 'framer-1jjzqy7-container', 'framer-eff2xb-container'];

    function generateCardHTML(c, variant) {
      const isDesktop = variant === 'desktop';
      const isTablet = variant === 'tablet';
      const isMobile = variant === 'mobile';
      
      const cardClass = isDesktop ? 'framer-v-1i3plvg' : 'framer-v-g46yjt';
      const dataName = isDesktop ? 'Variant 1' : 'Variant 2';
      const style = isDesktop ? 'height:100%;width:100%' : 'width:100%';
      const imageHeight = isDesktop ? '440px' : '730px';
      const iconSize = isDesktop ? '28px' : '32px';
      const titleSize = isDesktop ? '32px' : '28px';
      const descSize = isMobile ? '14px' : '16px';
      const numSize = isMobile ? '12px' : '14px';
      
      return `
        <div class="framer-gpWDC framer-1i3plvg ${cardClass}" data-framer-name="${dataName}" style="${style}">
          <div class="framer-1e4jk1c-container">
            <div class="framer-DwcH3 framer-1nv050x framer-v-1nv050x" data-border="true" data-framer-name="${dataName}" style="--border-bottom-width:1px;--border-color:rgb(227, 227, 227);--border-left-width:1px;--border-right-width:1px;--border-top-width:1px;--border-style:solid;border-bottom-left-radius:7px;border-bottom-right-radius:7px;border-top-left-radius:7px;border-top-right-radius:7px;height:${imageHeight};width:100%">
              <a class="framer-arryzx framer-46ouop" href="./case.html?id=${c.id}" style="border-radius:7px">
                <div style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0" data-framer-background-image-wrapper="true">
                  <img src="${c.imageUrl}" alt="${c.title}" loading="lazy" style="display:block;width:100%;height:100%;border-radius:inherit;object-position:center;object-fit:cover">
                </div>
              </a>
            </div>
          </div>
          <div class="framer-1tdsfgf">
            <div class="framer-hguhp">
              <div class="framer-1w2q2s">
                <div class="framer-h2z35m">
                  <div class="framer-bt144s" style="width:${iconSize};height:${iconSize}">
                    <div style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0" data-framer-background-image-wrapper="true">
                      <img src="${c.imageUrl}" alt="" style="display:block;width:100%;height:100%;border-radius:inherit;object-position:center;object-fit:cover">
                    </div>
                  </div>
                  <div class="framer-1f3zpfj" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-family:'Playfair Display',serif;--framer-text-font-size:${titleSize};--framer-text-font-weight:500">${c.title}</p>
                  </div>
                </div>
                <div class="framer-apwrht">
                  <div class="framer-12ktaaq" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-family:'Inter',sans-serif;--framer-text-font-size:${descSize};--framer-text-font-weight:400">${c.description}</p>
                  </div>
                </div>
              </div>
              <div class="framer-2cj6hh">
                <div class="framer-4q685o" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                  <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-family:'Inter',sans-serif;--framer-text-font-size:${numSize}">(${c.projectNumber})</p>
                </div>
              </div>
            </div>
            <div class="framer-130pt06">
              <div class="framer-e6j4qr">
                <div class="framer-1rr8nhf">
                  <div class="framer-6pzv6u" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-size:12px">Live Site</p>
                  </div>
                  <div class="framer-1v7bed0-container">
                    <div class="framer-ZBjck framer-Js5bH framer-1wrevds framer-v-1jssjdo" data-framer-name="Variant 2">
                      <a class="framer-1cvifhu framer-blugtw" href="${c.liveSiteUrl}" target="_blank" rel="noopener">
                        <div class="framer-1250nfg" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                          <p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-size:12px;font-weight:600;letter-spacing:0.1px;text-decoration:underline">${c.liveSiteUrl.replace(/^https?:\/\//, '').toUpperCase()}</p>
                        </div>
                        <div class="framer-uwahl3-container"><div style="display:contents"></div></div>
                      </a>
                    </div>
                  </div>
                </div>
                <div class="framer-pphtq2-container">
                  <div class="framer-ZBjck framer-Js5bH framer-1wrevds framer-v-1wrevds" data-framer-name="Variant 1">
                    <a class="framer-1cvifhu framer-blugtw" href="./case.html?id=${c.id}">
                      <div class="framer-1lxrqs0-container"><div style="display:contents"></div></div>
                      <div class="framer-1250nfg" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                        <p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-size:12px;font-weight:600;letter-spacing:1px">VIEW PROJECT</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
              <div class="framer-3tgvaf">
                <div class="framer-12qjbex">
                  <div class="framer-158lnd0" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-size:12px">Industry</p>
                  </div>
                  <div class="framer-1uhdc4h" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-size:14px">${c.industry}</p>
                  </div>
                </div>
                <div class="framer-65x2sz">
                  <div class="framer-1tsif1k" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-size:12px">Published</p>
                  </div>
                  <div class="framer-1vwj2aj" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-size:14px">${c.published}</p>
                  </div>
                </div>
              </div>
              <div class="framer-1ppgw4d-container">
                <div class="framer-eZgKL framer-zj5eoi framer-v-ws24d4" data-framer-name="${c.title}">
                  <div class="framer-ugnlwa" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    <p class="framer-text" style="--framer-text-color:rgb(184, 184, 184);--framer-text-font-size:12px">Deliverables</p>
                  </div>
                  <div class="framer-a07mda" style="outline:none;display:flex;flex-direction:column;justify-content:flex-start;flex-shrink:0;transform:none" data-framer-component-type="RichTextContainer">
                    ${(c.deliverables || []).map(d => `<p class="framer-text" style="--framer-text-color:rgb(255, 255, 255);--framer-text-font-size:14px">${d}</p>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = cases.map((c, i) => {
      const cardId = cardIds[i] || `case-${i}`;
      const cardWrapper = cardWrappers[i] || 'framer-gpWDC';
      
      return `
      <div class="ssr-variant hidden-1io69u6 hidden-18haio">
        <div class="${cardWrapper}" id="${cardId}">
          ${generateCardHTML(c, 'desktop')}
        </div>
      </div>
      <div class="ssr-variant hidden-oghk2m hidden-18haio">
        <div class="${cardWrapper}" id="${cardId}-tablet">
          ${generateCardHTML(c, 'tablet')}
        </div>
      </div>
      <div class="ssr-variant hidden-oghk2m hidden-1io69u6">
        <div class="${cardWrapper}" id="${cardId}-mobile">
          ${generateCardHTML(c, 'mobile')}
        </div>
      </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading cases:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadCasesFromAPI);
