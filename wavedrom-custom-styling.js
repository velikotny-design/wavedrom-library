(function(){
  
  let isApplying = false;
  
  function applyCustomStyling() {
    if(isApplying) return;
    isApplying = true;
    
    if(window._wavedromObserver) {
      window._wavedromObserver.disconnect();
    }
    
    document.querySelectorAll('svg text.info').forEach(function(el){el.style.fontSize='16px'});
    document.querySelectorAll('svg text.info').forEach(function(el){el.style.fontWeight='normal'});
    document.querySelectorAll('svg text[y="15"][text-anchor="middle"]').forEach(function(el){
      el.style.fontSize='14px';
      el.style.fontWeight='normal';
    });
    document.querySelectorAll('#wavearcs_0 > g > text').forEach(function(el){
      if(el.textContent.length>1) el.style.fontSize='13px';
    });
    document.querySelectorAll('g[id^="wavelane_"] text[text-anchor="middle"]').forEach(function(el){
      if(el.textContent.trim().length===1) el.style.fontSize='4px';
    });
    
    setTimeout(function(){
      var wavearcs = document.getElementById('wavearcs_0');
      if(!wavearcs) {
        isApplying = false;
        reconnectObserver();
        return;
      }
      
      var groups = Array.from(wavearcs.children);
      var lineGroups = [];
      var textGroups = [];
      
      groups.forEach(function(group) {
        if(group.querySelector('text')) {
          textGroups.push(group);
        } else {
          lineGroups.push(group);
        }
      });
      
      lineGroups.forEach(function(g){ wavearcs.appendChild(g); });
      textGroups.forEach(function(g){ wavearcs.appendChild(g); });

      // Move single-character node labels to the BACK (render first)
      document.querySelectorAll('#wavearcs_0 > g').forEach(function(group) {
        var textEl = group.querySelector('text');
        if(textEl && textEl.textContent.trim().length === 1) {
          // Move this group to the beginning (renders first = behind)
          wavearcs.insertBefore(group, wavearcs.firstChild);
        }
      });      
      
      document.querySelectorAll('#wavearcs_0 > g > text').forEach(function(el){
        var originalText = el.textContent;
        
        var leadingWhitespace = (originalText.match(/^\s+/) || [''])[0];
        var trailingWhitespace = (originalText.match(/\s+$/) || [''])[0];
        var trimmedText = originalText.trim();
        
        if(trimmedText.length > 1){
          var parent = el.parentNode;
          parent.querySelectorAll('rect').forEach(function(r){ r.remove(); });
          
          var leadingChars = (trimmedText.match(/^[\.\+]+/) || [''])[0];
          var leadingDots = (leadingChars.match(/\./g) || []).length;
          var leadingPlus = (leadingChars.match(/\+/g) || []).length;
          
          var trailingChars = (trimmedText.match(/[\.\+]+$/) || [''])[0];
          var trailingDots = (trailingChars.match(/\./g) || []).length;
          var trailingPlus = (trailingChars.match(/\+/g) || []).length;
          
          var pixelsPerDot = 7;
          var pixelsPerPlus = 5;
          var xShift = (leadingDots - trailingDots) * pixelsPerDot;
          var yShift = (leadingPlus - trailingPlus) * pixelsPerPlus;
          
          var cleanText = trimmedText;
          cleanText = cleanText.replace(/^[\.\+]+/, '');
          cleanText = cleanText.replace(/[\.\+]+$/, '');
          
          el.textContent = leadingWhitespace + cleanText + trailingWhitespace;
          el.style.fill = 'green';
          
          var bbox = el.getBBox();
          
          var rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('class', 'label-box');
          var paddingX = 4;
          var paddingY = 2;
          var baseYOffset = 3;
          
          rect.setAttribute('x', bbox.x + xShift - paddingX);
          rect.setAttribute('y', bbox.y - paddingY + baseYOffset - yShift);
          rect.setAttribute('width', bbox.width + paddingX*2);
          rect.setAttribute('height', bbox.height + paddingY*2);
          rect.setAttribute('fill','white');
          rect.setAttribute('fill-opacity','1.0');
          rect.setAttribute('rx','1');
          rect.setAttribute('ry','1');
          
          parent.insertBefore(rect,el);
          
          if(!el.hasAttribute('data-custom-styled')) {
            var currentX = parseFloat(el.getAttribute('x')) || 0;
            el.setAttribute('x', currentX + xShift);
            
            var currentY = parseFloat(el.getAttribute('y')) || 0;
            el.setAttribute('y', currentY + baseYOffset - yShift);
            
            el.setAttribute('data-custom-styled', 'true');
          }
        }
      });
      
      setTimeout(function() {
        document.querySelectorAll('#wavearcs_0 > g').forEach(function(group) {
          var rects = group.querySelectorAll('rect');
          if(rects.length > 1) {
            rects.forEach(function(rect) {
              if(!rect.classList.contains('label-box')) {
                rect.remove();
              }
            });
          }
        });
        
        isApplying = false;
        reconnectObserver();
        
      }, 100);
      
    }, 600);
  }
  
  function reconnectObserver() {
    var target = document.getElementById('diagram-output');
    if(target && window._wavedromObserver) {
      window._wavedromObserver.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }
  
  function setupAutoStyling() {
    var target = document.getElementById('diagram-output');
    if(!target) return;
    
    if(window._wavedromObserver) {
      window._wavedromObserver.disconnect();
    }
    
    var timeout = null;
    window._wavedromObserver = new MutationObserver(function(mutations) {
      var hasRealChanges = mutations.some(function(m) {
        return Array.from(m.addedNodes).some(function(n) {
          return n.tagName === 'svg' || n.tagName === 'SCRIPT';
        });
      });
      
      if(hasRealChanges && !isApplying) {
        clearTimeout(timeout);
        timeout = setTimeout(applyCustomStyling, 800);
      }
    });
    
    reconnectObserver();
    console.log('✓ Auto-styling monitor active');
  }
  
  // Export functions to global scope
  window.applyCustomStyling = applyCustomStyling;
  window.setupAutoStyling = setupAutoStyling;
  
})();
