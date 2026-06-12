(function(){
  
  let isApplying = false; // Prevent recursive calls
  
  // Main styling function
  function applyCustomStyling() {
    if(isApplying) return; // Already running, skip
    isApplying = true;
    
    // Temporarily disconnect observer while we make changes
    if(window._wavedromObserver) {
      window._wavedromObserver.disconnect();
    }
    
    document.querySelectorAll('svg text.info').forEach(el=>el.style.fontSize='16px');
    document.querySelectorAll('svg text.info').forEach(el=>el.style.fontWeight='normal');
    document.querySelectorAll('svg text[y="15"][text-anchor="middle"]').forEach(el=>{
      el.style.fontSize='14px';
      el.style.fontWeight='normal';
    });
    document.querySelectorAll('#wavearcs_0 > g > text').forEach(el=>{
      if(el.textContent.length>1) el.style.fontSize='14px';
    });
    document.querySelectorAll('g[id^="wavelane_"] text[text-anchor="middle"]').forEach(el=>{
      if(el.textContent.trim().length===1) el.style.fontSize='4px';
    });
    
    setTimeout(()=>{
      const wavearcs = document.getElementById('wavearcs_0');
      if(!wavearcs) {
        isApplying = false;
        reconnectObserver();
        return;
      }
      
      // Separate groups into those with lines/paths vs those with text
      const groups = Array.from(wavearcs.children);
      const lineGroups = [];
      const textGroups = [];
      
      groups.forEach(group => {
        if(group.querySelector('text')) {
          textGroups.push(group);
        } else {
          lineGroups.push(group);
        }
      });
      
      // Reorder: lines first, then text groups
      lineGroups.forEach(g => wavearcs.appendChild(g));
      textGroups.forEach(g => wavearcs.appendChild(g));
      
      // Now add boxes to text groups
      document.querySelectorAll('#wavearcs_0 > g > text').forEach(el=>{
        const originalText = el.textContent;
        
        const leadingWhitespace = (originalText.match(/^\s+/) || [''])[0];
        const trailingWhitespace = (originalText.match(/\s+$/) || [''])[0];
        const trimmedText = originalText.trim();
        
        if(trimmedText.length > 1){
          const parent = el.parentNode;
          
          // Remove any existing rectangles
          parent.querySelectorAll('rect').forEach(r => r.remove());
          
          // Count control chars in TRIMMED text
          const leadingChars = (trimmedText.match(/^[\.\+]+/) || [''])[0];
          const leadingDots = (leadingChars.match(/\./g) || []).length;
          const leadingPlus = (leadingChars.match(/\+/g) || []).length;
          
          const trailingChars = (trimmedText.match(/[\.\+]+$/) || [''])[0];
          const trailingDots = (trailingChars.match(/\./g) || []).length;
          const trailingPlus = (trailingChars.match(/\+/g) || []).length;
          
          // Calculate shifts
          const pixelsPerDot = 8;
          const pixelsPerPlus = 6;
          const xShift = (leadingDots - trailingDots) * pixelsPerDot;
          const yShift = (leadingPlus - trailingPlus) * pixelsPerPlus;
          
          // Remove control characters
          let cleanText = trimmedText;
          cleanText = cleanText.replace(/^[\.\+]+/, '');
          cleanText = cleanText.replace(/[\.\+]+$/, '');
          
          // Restore whitespace
          el.textContent = leadingWhitespace + cleanText + trailingWhitespace;
          // After setting el.textContent, add:
          el.style.fill = 'green';  // or 'red', 'blue', '#333333', etc.
          
          // Get bbox of clean text
          let bbox = el.getBBox();
          
          // Create styled box
          let rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('class', 'label-box');
          let paddingX=4;
          let paddingY=2;
          let baseYOffset=3;
          
          rect.setAttribute('x', bbox.x + xShift - paddingX);
          rect.setAttribute('y', bbox.y - paddingY + baseYOffset - yShift);
          rect.setAttribute('width', bbox.width + paddingX*2);
          rect.setAttribute('height', bbox.height + paddingY*2);
          rect.setAttribute('fill','white');
          rect.setAttribute('fill-opacity','1.0');
          rect.setAttribute('rx','1');
          rect.setAttribute('ry','1');
          
          parent.insertBefore(rect,el);
          
          // Apply shifts to text ONLY if not already shifted
          if(!el.hasAttribute('data-custom-styled')) {
            const currentX = parseFloat(el.getAttribute('x')) || 0;
            el.setAttribute('x', currentX + xShift);
            
            const currentY = parseFloat(el.getAttribute('y')) || 0;
            el.setAttribute('y', currentY + baseYOffset - yShift);
            
            el.setAttribute('data-custom-styled', 'true'); // Mark as processed
          }
        }
      });
      
      // Cleanup WaveDrom's default white boxes
      setTimeout(() => {
        document.querySelectorAll('#wavearcs_0 > g').forEach(group => {
          const rects = group.querySelectorAll('rect');
          if(rects.length > 1) {
            rects.forEach(rect => {
              if(!rect.classList.contains('label-box')) {
                rect.remove();
              }
            });
          }
        });
        
        // Done applying, reconnect observer
        isApplying = false;
        reconnectObserver();
        
      }, 100);
      
    },600);
  }
  
  // Reconnect the observer
  function reconnectObserver() {
    const target = document.getElementById('WaveDrom_Display_0') || document.querySelector('svg')?.parentNode;
    if(target && window._wavedromObserver) {
      window._wavedromObserver.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Apply styling immediately
  applyCustomStyling();
  
  // Setup observer
  const target = document.getElementById('WaveDrom_Display_0') || document.querySelector('svg')?.parentNode;
  if(target) {
    // Disconnect any previous observer
    if(window._wavedromObserver) {
      window._wavedromObserver.disconnect();
    }
    
    let timeout = null;
    window._wavedromObserver = new MutationObserver((mutations) => {
      // Only trigger if SVG content actually changed (not just our styling)
      const hasRealChanges = mutations.some(m => {
        return Array.from(m.addedNodes).some(n => n.tagName === 'svg' || n.id?.includes('WaveDrom'));
      });
      
      if(hasRealChanges) {
        clearTimeout(timeout);
        timeout = setTimeout(applyCustomStyling, 800);
      }
    });
    
    reconnectObserver();
    
    console.log('✓ WaveDrom auto-styling active (watching for changes)');
  }
  
})();
