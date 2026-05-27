// ============================================================================
// MÓDULO 4: SLIDES.GS (Manipulação Avançada de Slides com Tratamento de Erros)
// ============================================================================
const SlidesProcessor = {
  blobCache: {}, 

  getBlobCached: function(fileId) {
    if (!this.blobCache[fileId]) {
      this.blobCache[fileId] = DriveApp.getFileById(fileId).getBlob();
    }
    return this.blobCache[fileId];
  },

  processElementsSinglePass: function(slide, imagesMap, linksMap) {
    const hasImages = Object.keys(imagesMap).length > 0;
    const hasLinks = Object.keys(linksMap).length > 0;
    if (!hasImages && !hasLinks) return;

    const elements = slide.getPageElements();
    for (const element of elements) {
      this._traverseElement(slide, element, imagesMap, linksMap, hasImages, hasLinks);
    }
  },

  _traverseElement: function(slide, element, imagesMap, linksMap, hasImages, hasLinks) {
    const type = element.getPageElementType();

    if (type === SlidesApp.PageElementType.GROUP) {
      for (const child of element.asGroup().getChildren()) {
        this._traverseElement(slide, child, imagesMap, linksMap, hasImages, hasLinks);
      }
    } else if (type === SlidesApp.PageElementType.TABLE) {
      const table = element.asTable();
      for (let r = 0; r < table.getNumRows(); r++) {
        for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
          const cell = table.getCell(r, c);
          try {
            // Tenta pegar o texto da célula. Se a célula for estranha/vazia, o catch ignora.
            const textRange = cell.getText();
            if (textRange) {
              this._processTextRange(slide, element, textRange, imagesMap, linksMap, hasImages, hasLinks);
            }
          } catch (e) { /* Ignora silenciosamente células sem suporte a texto */ }
        }
      }
    } else if (type === SlidesApp.PageElementType.SHAPE) {
      const shape = element.asShape();
      try {
        // Tenta pegar o texto da forma. Se for uma linha/seta que não suporta texto, o catch ignora o erro e a vida segue!
        const textRange = shape.getText();
        if (textRange) {
          this._processTextRange(slide, shape, textRange, imagesMap, linksMap, hasImages, hasLinks);
        }
      } catch (e) { /* Ignora silenciosamente formas que não suportam texto */ }
    }
  },

  _processTextRange: function(slide, shapeOrElement, textRange, imagesMap, linksMap, checkImages, checkLinks) {
    const text = textRange.asString();
    if (!text) return;

    if (checkImages) {
      for (const [key, imageId] of Object.entries(imagesMap)) {
        const placeholder = `{{${key}}}`;
        const trimmed = text.trim();
        
        if (trimmed === placeholder || trimmed === imageId || text.match(/^[a-zA-Z0-9_-]{15,}$/)) {
          try {
            const blob = this.getBlobCached(imageId);
            const left = shapeOrElement.getLeft();
            const top = shapeOrElement.getTop();
            const width = shapeOrElement.getWidth();
            const height = shapeOrElement.getHeight();
            
            shapeOrElement.remove(); 
            const img = slide.insertImage(blob);
            img.setLeft(left).setTop(top).setWidth(width).setHeight(height);
            return; 
          } catch (err) {
            Logger.log(`Falha ao inserir imagem ${imageId}: ${err}`);
          }
        } else if (text.includes(placeholder)) {
           try {
             textRange.replaceText(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "");
             const blob = this.getBlobCached(imageId);
             const img = slide.insertImage(blob);
             img.setLeft(shapeOrElement.getLeft() + shapeOrElement.getWidth() + 8).setTop(shapeOrElement.getTop());
           } catch(e) {}
        }
      }
    }

    if (checkLinks) {
      for (const [placeholder, linkData] of Object.entries(linksMap)) {
        const escapedPattern = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let matches = textRange.find(escapedPattern);

        while (matches && matches.length > 0) {
          const linkRange = matches[0];
          linkRange.setText(linkData.config.label);

          const style = linkRange.getTextStyle();
          style.setLinkUrl(linkData.url);
          style.setFontSize(LinkModule.VisualDefaults.fontSize);
          style.setForegroundColor(LinkModule.VisualDefaults.color);
          style.setUnderline(true);
          try { style.setFontFamily(LinkModule.VisualDefaults.fontFamily); } catch (e) {}

          matches = textRange.find(escapedPattern);
        }
      }
    }
  }
};