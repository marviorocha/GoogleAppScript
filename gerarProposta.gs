/**
 * Script para substituir tags (placeholders) em uma apresentação Google Slides
 * - Substitui em toda a apresentação ou apenas em um slide específico
 * - Expõe doPost para integração com AppSheet (recebe JSON com chaves/valores)
 *
 * Como usar:
 * - Defina const presentationId com o ID da sua apresentação
 * - Chame replaceAllPlaceholders(replacements) para substituir em toda a apresentação
 * - Ou chame replacePlaceholdersInSlide(slideObjectId, replacements) para um slide específico
 * - Para AppSheet: publique como Web App (Executar como: você; Quem tem acesso: anyone, even anonymous)
 *   e aponte o webhook do AppSheet para a URL do Web App. Envie JSON { "presentationId": "...", "slideObjectId": "...", "replacements": {"<<Nome do Cliente>>": "ACME"} }
 */

const presentationId = "1wu4MwGLykUJ-4O7B8srZLVrsKguzxPQf"; // substitua pelo seu ID quando necessário

/**
 * Substitui todos os placeholders na apresentação por seus valores correspondentes.
 * @param {Object} replacements - mapa chave->valor, por exemplo {"<<Nome do Cliente>>":"ACME"}
 * @returns {Object} resumo com contagem de substituições
 */
function replaceAllPlaceholders(replacements) {
    if (!replacements || typeof replacements !== 'object') {
        throw new Error('replacements deve ser um objeto com pares chave:valor');
    }
    const presentation = SlidesApp.openById(presentationId);
    const slides = presentation.getSlides();
    let totalReplaced = 0;
    slides.forEach(function (slide) {
        totalReplaced += replacePlaceholdersInSlideObject(slide, replacements);
    });
    presentation.saveAndClose();
    return { presentationId: presentationId, slidesProcessed: slides.length, replacements: Object.keys(replacements).length, totalReplaced: totalReplaced };
}

/**
 * Substitui placeholders em um slide identificado pelo seu objectId.
 * @param {string} slideObjectId - objectId do slide (pode ser obtido via API ou logs)
 * @param {Object} replacements - mapa chave->valor
 * @returns {Object} resumo
 */
function replacePlaceholdersInSlide(slideObjectId, replacements) {
    if (!slideObjectId) throw new Error('slideObjectId é obrigatório');
    if (!replacements || typeof replacements !== 'object') {
        throw new Error('replacements deve ser um objeto com pares chave:valor');
    }
    const presentation = SlidesApp.openById(presentationId);
    const slide = presentation.getSlideById(slideObjectId);
    if (!slide) throw new Error('Slide não encontrado: ' + slideObjectId);
    const replaced = replacePlaceholdersInSlideObject(slide, replacements);
    presentation.saveAndClose();
    return { presentationId: presentationId, slideObjectId: slideObjectId, replaced: replaced };
}

/**
 * Faz a substituição em um objeto Slide (SlidesApp.Slide)
 * Retorna número de substituições realizadas no slide.
 */
function replacePlaceholdersInSlideObject(slide, replacements) {
    let count = 0;
    // Substitui em todos os shapes de texto
    const pageElements = slide.getPageElements();
    pageElements.forEach(function (el) {
        if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
            try {
                const shape = el.asShape();
                if (shape.getText) {
                    const textRange = shape.getText();
                    Object.keys(replacements).forEach(function (key) {
                        const value = String(replacements[key]);
                        while (textRange.asString().indexOf(key) !== -1) {
                            textRange.replaceAllText(key, value);
                            count++;
                        }
                    });
                }
            } catch (e) {
                // ignore shapes que não tem texto
            }
        }
        // Também tentar em caixas de texto simples (table cells, etc) - getText() segura
        if (el.getPageElementType() === SlidesApp.PageElementType.TABLE) {
            const table = el.asTable();
            const rows = table.getNumRows();
            const cols = table.getNumColumns();
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = table.getCell(r, c);
                    const txt = cell.getText();
                    Object.keys(replacements).forEach(function (key) {
                        const value = String(replacements[key]);
                        while (txt.asString().indexOf(key) !== -1) {
                            txt.replaceAllText(key, value);
                            count++;
                        }
                    });
                }
            }
        }
    });
    return count;
}

/**
 * Endpoint para AppSheet / Webhooks.
 * Aceita POST JSON com os campos:
 * - presentationId (opcional) - se não fornecido usará a constante acima
 * - slideObjectId (opcional) - se fornecido substitui apenas neste slide
 * - replacements (obrigatório) - objeto chave->valor
 *
 * Exemplo de payload:
 * { "presentationId": "ID..", "slideObjectId": "g12345", "replacements": {"<<Nome do Cliente>>":"ACME", "<<Mês / Ano>>":"10/2025"} }
 */
function doPost(e) {
    try {
        const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
        const usePresentationId = body.presentationId || presentationId;
        if (!usePresentationId) throw new Error('presentationId não fornecido');
        const reps = body.replacements;
        if (!reps || typeof reps !== 'object') {
            return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'replacements é obrigatório e deve ser um objeto' })).setMimeType(ContentService.MimeType.JSON);
        }
        // Abrir apresentação dinâmica
        const oldId = presentationId;
        // Temporariamente sobrescrevemos a constante localmente abrindo o ID solicitado
        // (não alteramos a variável const, apenas usamos o ID diretamente)
        let result;
        if (body.slideObjectId) {
            const presentation = SlidesApp.openById(usePresentationId);
            const slide = presentation.getSlideById(body.slideObjectId);
            if (!slide) throw new Error('slideObjectId não encontrado: ' + body.slideObjectId);
            const replaced = replacePlaceholdersInSlideObject(slide, reps);
            presentation.saveAndClose();
            result = { status: 'success', presentationId: usePresentationId, slideObjectId: body.slideObjectId, replaced: replaced };
        } else {
            const presentation = SlidesApp.openById(usePresentationId);
            const slides = presentation.getSlides();
            let total = 0;
            slides.forEach(function (slide) { total += replacePlaceholdersInSlideObject(slide, reps); });
            presentation.saveAndClose();
            result = { status: 'success', presentationId: usePresentationId, slidesProcessed: slides.length, totalReplaced: total };
        }
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Função de teste local (executar dentro do editor Apps Script)
 */
function testReplace() {
    const reps = {
        '<<[Nome do Cliente]>>': 'Empresa XYZ',
        '<<[Mês / Ano]>>': '10/2025',
        '<<Nome do Cliente>>': 'Empresa XYZ',
        '<<Mês / Ano>>': '10/2025'
    };
    const res = replaceAllPlaceholders(reps);
    Logger.log(res);
}

