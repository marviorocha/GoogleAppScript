function todayDateString() {
  const date = new Date();
  // const day = String(date.getDate()).padStart(2, '0');
  const month = getMonthName(String(date.getMonth() + 1).padStart(2, "0"));
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  const data_month = date.toLocaleString("pt-BR", { month: "long" });
  return (
    String(data_month).charAt(0).toUpperCase() + String(data_month).slice(1)
  );
}

function sanitizeDriveFolderName(name) {
  if (!name || typeof name !== "string") return "Cliente";
  const trimmed = name.trim();
  if (!trimmed) return "Cliente";

  return trimmed
    .replace(/[\\/:*?"<>|#%]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getOrCreateDriveFolderFromIdAndPath(folderId, path) {
  if (!folderId) {
    throw new Error(
      "folderId inválido para getOrCreateDriveFolderFromIdAndPath"
    );
  }

  let currentFolder;
  try {
    currentFolder = DriveApp.getFolderById(folderId);
  } catch (err) {
    throw new Error(
      "Não foi possível acessar a pasta principal Drive ID=" +
        folderId +
        ": " +
        err
    );
  }

  if (!path) return currentFolder;

  const parts = path
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const folders = currentFolder.getFoldersByName(part);
    if (folders.hasNext()) {
      currentFolder = folders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  return currentFolder;
}

function formatCurrencyBR(input) {
  if (input === null || input === undefined) return "";
  let s = String(input).trim();
  if (!s) return "";

  s = s.replace(/\s/g, "").replace(/[^\d.,-]/g, "");

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  let normalized = s;
  if (lastDot > -1 && lastComma > -1) {
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    const countComma = (s.match(/,/g) || []).length;

    if (countComma === 1 && s.length - lastComma - 1 <= 2) {
      normalized = s.replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else {
    normalized = s;
  }

  normalized = normalized.replace(/[^\d.-]/g, "");
  const num = parseFloat(normalized);
  if (isNaN(num)) return input;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function replaceImagePlaceholdersInSlide(slide, imagesMap) {
  const processTextRangeShape = (shape, textRange, text) => {
    const tryReplaceById = (candidateId) => {
      const left = shape.getLeft();
      const top = shape.getTop();
      const width = shape.getWidth();
      const height = shape.getHeight();
      shape.remove();
      try {
        const blob = DriveApp.getFileById(candidateId).getBlob();
        const img = slide.insertImage(blob);
        img.setLeft(left);
        img.setTop(top);
        img.setWidth(width);
        img.setHeight(height);
        return true;
      } catch (err) {
        Logger.log(
          "Falha ao inserir imagem por ID=" + candidateId + " -> " + err
        );
        return false;
      }
    };

    for (const [key, imageId] of Object.entries(imagesMap)) {
      const placeholder = `{{${key}}}`;
      const trimmed = text.trim();
      const isExactPlaceholder = trimmed === placeholder;
      const isExactId = trimmed === imageId;

      if (isExactPlaceholder || isExactId) {
        tryReplaceById(imageId);
        return true;
      } else if (text.indexOf(placeholder) !== -1) {
        try {
          const escapedPlaceholder = placeholder.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          textRange.replaceText(escapedPlaceholder, "");
        } catch (err) {
          Logger.log("Erro ao remover placeholder do texto: " + err);
        }
        try {
          const blob = DriveApp.getFileById(imageId).getBlob();
          const img = slide.insertImage(blob);
          const left = shape.getLeft() + shape.getWidth() + 8;
          const top = shape.getTop();
          img.setLeft(left);
          img.setTop(top);
        } catch (err) {
          Logger.log(
            "Erro ao inserir imagem embutida id=" + imageId + " -> " + err
          );
        }
        return true;
      }
    }

    const idMatch = text.trim().match(/^[a-zA-Z0-9_-]{15,}$/);
    if (idMatch) {
      const ok = tryReplaceById(idMatch[0]);
      if (ok) return true;
    }
    return false;
  };

  const shapes = slide.getShapes();
  for (const shape of shapes) {
    try {
      const textRange = shape.getText();
      if (textRange) {
        const text = textRange.asString();
        if (text) {
          const done = processTextRangeShape(shape, textRange, text);
          if (done) continue;
        }
      }
    } catch (e) {}

    try {
      const table = shape.getTable();
      if (table) {
        for (let r = 0; r < table.getNumRows(); r++) {
          for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
            const cell = table.getCell(r, c);
            const cellText = cell.getText();
            const text = cellText ? cellText.asString() : "";
            if (!text) continue;
            const done = processTextRangeShape(shape, cellText, text);
            if (done) break;
          }
        }
      }
    } catch (e2) {}
  }
}

// ============================================================================
// LINK REGISTRY - Configuração centralizada de tipos de links
// ============================================================================

/**
 * Registry centralizado que define como cada tipo de link deve ser processado.
 * Escalável para novos tipos sem modificar o código existente.
 *
 * @type {Object<string, {type: string, label: string, color: string}>}
 */
const LinkRegistry = {
  // Proposta - abre arquivo do Google Drive
  PROPOSTA: {
    type: "file",
    label: "Proposta",
    color: "#1F8FE6",
    description: "Link para proposta em PDF",
  },

  // Catálogo - abre pasta do Google Drive
  CATALOGO: {
    type: "folder",
    label: "Catálogo",
    color: "#34A853",
    description: "Link para pasta de catálogo",
  },

  // Vídeo - abre vídeo (extensível para YouTube, Google Drive, etc)
  VIDEO: {
    type: "file",
    label: "Vídeo",
    color: "#D33427",
    description: "Link para vídeo",
  },

  // Manual - abre manual técnico
  MANUAL: {
    type: "file",
    label: "Manual Técnico",
    color: "#F57C00",
    description: "Link para manual",
  },

  // Link genérico do Drive
  DRIVE: {
    type: "file",
    label: "Arquivo",
    color: "#1F8FE6",
    description: "Link para arquivo",
  },
};

// Visual defaults para links (fonte, tamanho e cor)
const LinkVisualDefaults = {
  fontFamily: "Ubuntu",
  fontSize: 10,
  color: "#FFFFFF",
};

// ============================================================================
// DRIVE ID EXTRACTOR - Extrator universal robusto de IDs do Drive
// ============================================================================

/**
 * Extrator universal de IDs do Google Drive com suporte a múltiplos formatos.
 * Reconhece:
 * - URLs de arquivo: https://drive.google.com/file/d/ID/view
 * - URLs de pasta: https://drive.google.com/drive/folders/ID
 * - URLs compartilhadas com query params
 * - IDs puros
 */
class DriveIdExtractor {
  /**
   * Retorna cache de regex compiladas para performance
   * Compatível com Google Apps Script
   */
  static getRegexCache() {
    return {
      // Arquivo: /file/d/ID
      file: /\/file\/d\/([a-zA-Z0-9_-]{20,})/,

      // Pasta: /folders/ID
      folder: /\/folders\/([a-zA-Z0-9_-]{20,})/,

      // ID puro: 20+ caracteres alfanuméricos, underscores, hífens
      pure: /^([a-zA-Z0-9_-]{20,})$/,

      // text("ID") - formato especial do Google Apps Script
      textFunction: /text\("([a-zA-Z0-9_-]{20,})"\)/,
    };
  }

  /**
   * Extrai o ID do Google Drive de um valor em qualquer formato
   * @param {string|null|undefined} value - Valor a extrair
   * @returns {{id: string, type: 'file'|'folder'|null} - ID e tipo identificado
   */
  static extract(value) {
    if (!value || typeof value !== "string") {
      return { id: null, type: null };
    }

    const trimmed = value.trim();
    const regexCache = this.getRegexCache();

    // 1. Tenta formato text("ID")
    const textMatch = trimmed.match(regexCache.textFunction);
    if (textMatch && textMatch[1]) {
      return { id: textMatch[1], type: "file" };
    }

    // 2. Tenta URL de pasta (procura antes de arquivo)
    const folderMatch = trimmed.match(regexCache.folder);
    if (folderMatch && folderMatch[1]) {
      return { id: folderMatch[1], type: "folder" };
    }

    // 3. Tenta URL de arquivo
    const fileMatch = trimmed.match(regexCache.file);
    if (fileMatch && fileMatch[1]) {
      return { id: fileMatch[1], type: "file" };
    }

    // 4. Tenta ID puro (sem URL)
    const pureMatch = trimmed.match(regexCache.pure);
    if (pureMatch && pureMatch[1]) {
      return { id: pureMatch[1], type: "file" };
    }

    return { id: null, type: null };
  }

  /**
   * Alias para compatibilidade com código legado
   * @deprecated Use extract() em vez disso
   */
  static extractId(value) {
    const result = this.extract(value);
    return result.id;
  }
}

// ============================================================================
// DRIVE URL BUILDER - Factory para construir URLs corretas
// ============================================================================

/**
 * Constrói URLs do Google Drive no formato correto baseado no tipo.
 * Responsável único: construir URLs válidas.
 */
class DriveUrlBuilder {
  /**
   * Constrói URL do Google Drive para arquivo ou pasta
   * @param {string} id - ID do Drive
   * @param {'file'|'folder'} type - Tipo de recurso
   * @returns {string} URL válida do Google Drive
   */
  static build(id, type = "file") {
    if (!id || typeof id !== "string") {
      throw new Error("ID do Drive inválido");
    }

    const cleanId = id.trim();

    if (type === "folder") {
      return `https://drive.google.com/drive/folders/${cleanId}`;
    }

    // Padrão para arquivos
    return `https://drive.google.com/file/d/${cleanId}/view`;
  }

  /**
   * Inteligente: constrói URL com tipo auto-detectado
   * @param {string} id - ID do Drive
   * @param {string|null} detectedType - Tipo detectado (file|folder|null)
   * @returns {string} URL válida
   */
  static buildAuto(id, detectedType) {
    return this.build(id, detectedType || "file");
  }
}

// ============================================================================
// LINK TYPE DETECTOR - Identifica o tipo de link baseado no nome da chave
// ============================================================================

/**
 * Detecta o tipo de link baseado no nome da chave do placeholder.
 * Estratégia: matcher pattern-based que permite adicionar novos tipos
 * sem modificar código existente.
 */
class LinkTypeDetector {
  /**
   * Retorna padrões de mapeamento de chave para tipo de link
   * Compatível com Google Apps Script
   */
  static getPatterns() {
    return [
      { regex: /link_proposta/i, linkType: "PROPOSTA" },
      { regex: /link_catalogo/i, linkType: "CATALOGO" },
      { regex: /link_video/i, linkType: "VIDEO" },
      { regex: /link_manual/i, linkType: "MANUAL" },
      { regex: /link_drive/i, linkType: "DRIVE" },
      // Padrão fallback para qualquer link_*
      { regex: /link_/i, linkType: "DRIVE" },
    ];
  }

  /**
   * Detecta o tipo de link baseado na chave
   * @param {string} key - Nome da chave (ex: link_proposta_1)
   * @returns {string} Tipo de link (ex: PROPOSTA)
   */
  static detect(key) {
    const keyUpper = String(key).toUpperCase();
    const patterns = this.getPatterns();

    for (const pattern of patterns) {
      if (pattern.regex.test(keyUpper)) {
        return pattern.linkType;
      }
    }

    return "DRIVE"; // Fallback
  }
}

// ============================================================================
// LINK PROCESSOR - Processa e identifica links
// ============================================================================

/**
 * Processa valores de proposta para criar objetos de link
 * com ID, tipo e metadados.
 */
class LinkProcessor {
  /**
   * Processa um campo de proposta e retorna informações de link
   *
   * @param {string} key - Nome da chave
   * @param {*} value - Valor do campo
   * @returns {Object|null} {placeholder, url, linkType, config} ou null
   */
  static processField(key, value) {
    // Ignora valores vazios
    if (!value || typeof value !== "string") {
      return null;
    }

    // Verifica se é um campo de link
    if (!/link/i.test(key)) {
      return null;
    }

    // Extrai ID e tipo de recurso
    const extracted = DriveIdExtractor.extract(value);
    if (!extracted.id) {
      return null;
    }

    // Detecta tipo de link pela chave
    const linkType = LinkTypeDetector.detect(key);
    const linkConfig = LinkRegistry[linkType];

    if (!linkConfig) {
      console.warn(`LinkType desconhecido: ${linkType}`);
      return null;
    }

    // Determina tipo de recurso (file ou folder)
    const resourceType = extracted.type || linkConfig.type;

    // Constrói URL
    const url = DriveUrlBuilder.buildAuto(extracted.id, resourceType);

    return {
      placeholder: `{{${key.toUpperCase()}}}`,
      url,
      linkType,
      config: linkConfig,
      id: extracted.id,
      resourceType,
    };
  }

  /**
   * Processa todos os campos de uma proposta e retorna links
   * @param {Object} detalhes_proposta - Dados da proposta
   * @returns {Object<string, {url, config}>} Mapa de links processados
   */
  static processAll(detalhes_proposta) {
    const links = {};

    for (const [key, value] of Object.entries(detalhes_proposta)) {
      const link = this.processField(key, value);
      if (link) {
        links[link.placeholder] = {
          url: link.url,
          config: link.config,
          linkType: link.linkType,
        };
      }
    }

    return links;
  }
}

// ============================================================================
// IMPROVED LINK REPLACER - Substitui links em slides com configuração
// ============================================================================

/**
 * Substitui placeholders de link por hyperlinks formatados.
 * Suporta diferentes tipos de links com configurações distintas.
 */
class ImprovedLinkReplacer {
  /**
   * Processa um slide inteiro para substituir links.
   * Passa uma única vez pelos elementos para melhor performance.
   *
   * @param {SlidesApp.Slide} slide - Slide a processar
   * @param {Object<string, {url, config}>} linksMap - Mapa de links
   */
  static replaceAllInSlide(slide, linksMap) {
    if (!linksMap || Object.keys(linksMap).length === 0) {
      return;
    }

    const elements = slide.getPageElements();
    for (const element of elements) {
      this.processElement(element, linksMap);
    }
  }

  /**
   * Processa um elemento recursivamente
   * @private
   */
  static processElement(element, linksMap) {
    try {
      const type = element.getPageElementType();

      if (type === SlidesApp.PageElementType.GROUP) {
        for (const child of element.asGroup().getChildren()) {
          this.processElement(child, linksMap);
        }
      } else if (type === SlidesApp.PageElementType.TABLE) {
        const table = element.asTable();
        for (let r = 0; r < table.getNumRows(); r++) {
          for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
            const cellText = table.getCell(r, c).getText();
            if (cellText) {
              this.processTextRange(cellText, linksMap);
            }
          }
        }
      } else if (type === SlidesApp.PageElementType.SHAPE) {
        const shape = element.asShape();
        const textRange = shape.getText();
        if (textRange) {
          this.processTextRange(textRange, linksMap);
        }
      }
    } catch (err) {
      // Silenciosamente ignora elementos que não permitem acesso ao texto
    }
  }

  /**
   * Processa um TextRange para substituir links
   * @private
   */
  static processTextRange(textRange, linksMap) {
    for (const [placeholder, linkData] of Object.entries(linksMap)) {
      const escapedPattern = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let matches = textRange.find(escapedPattern);

      while (matches && matches.length > 0) {
        const linkRange = matches[0];
        const config = linkData.config;

        // Define texto do link
        linkRange.setText(config.label);

        // Aplica formatação
        const style = linkRange.getTextStyle();
        // Aplica URL
        style.setLinkUrl(linkData.url);
        // Força visual solicitado: fonte Ubuntu, maior e cor branca
        try {
          style.setFontFamily(LinkVisualDefaults.fontFamily);
        } catch (e) {
          // Alguns ambientes do Slides podem não suportar a fonte; fallback silencioso
        }
        style.setFontSize(LinkVisualDefaults.fontSize);
        style.setForegroundColor(LinkVisualDefaults.color);
        style.setUnderline(true);

        // Busca próxima ocorrência
        matches = textRange.find(escapedPattern);
      }
    }
  }
}

// Agrupa e exporta módulos/classes para facilitar uso modular
var SlideUtils = {
  LinkRegistry: LinkRegistry,
  LinkVisualDefaults: LinkVisualDefaults,
  DriveIdExtractor: DriveIdExtractor,
  DriveUrlBuilder: DriveUrlBuilder,
  LinkTypeDetector: LinkTypeDetector,
  LinkProcessor: LinkProcessor,
  ImprovedLinkReplacer: ImprovedLinkReplacer,
};

// ============================================================================
// COMPATIBILITY LAYER - Funções legadas para retrocompatibilidade
// ============================================================================

/**
 * Função legada - mantida para compatibilidade com código existente
 * @deprecated Use LinkProcessor.processAll() em vez disso
 */
function extractDriveIdFromValue(value) {
  return DriveIdExtractor.extractId(value);
}

/**
 * Função legada - mantida para compatibilidade com código existente
 * @deprecated Use ImprovedLinkReplacer.replaceAllInSlide() em vez disso
 */
function replaceAllLinksInSlide(slide, linksMap, label) {
  // Converte o formato legado para o novo
  const newLinksMap = {};

  for (const [placeholder, url] of Object.entries(linksMap)) {
    newLinksMap[placeholder] = {
      url,
      config: {
        label: label || "Link",
        color: "#1F8FE6",
      },
    };
  }

  ImprovedLinkReplacer.replaceAllInSlide(slide, newLinksMap);
}

/**
 * Função legada - compatibilidade
 * @deprecated
 */
function recursiveProcessElementForLinks(element, linksMap, label) {
  const newLinksMap = {};
  for (const [placeholder, url] of Object.entries(linksMap)) {
    newLinksMap[placeholder] = {
      url,
      config: { label: label || "Link", color: "#1F8FE6" },
    };
  }
  ImprovedLinkReplacer.processElement(element, newLinksMap);
}

/**
 * Função legada - compatibilidade
 * @deprecated
 */
function processTextRangeForMultipleLinks(textRange, linksMap, label) {
  const newLinksMap = {};
  for (const [placeholder, url] of Object.entries(linksMap)) {
    newLinksMap[placeholder] = {
      url,
      config: { label: label || "Link", color: "#1F8FE6" },
    };
  }
  ImprovedLinkReplacer.processTextRange(textRange, newLinksMap);
}

function gerarApresentacaoDoModelo(detalhes_proposta = null) {
  if (!detalhes_proposta) {
    detalhes_proposta = {
      nome: "Cliente para Testar",
      endereco:
        "Rua Amaro Antônio de Araújo, 170 - Jardim Umarizal, São Paulo - SP",
      tipo_imovel: "Residencial",
      numero_elevadores: 2,
      numero_pavimentos: 8,
      data_previsao_instalacao: "2025-03-15",
      imagem_imovel: "1ff9T9zokoXboJRic1CLXo51LHoqtGZUi",
      rede_eletrica: "Trifásica 220V",
      statusCaixaCorrida: "Concluída",
      largura_caixa: "1.60 m",
      profundidade_caixa: "1.80 m",
      percurso: "18.5 m",
      pe_direito_pavimentos: "2.6 m",
      profundidade_poco: "1.4 m",
      ultima_altura: "2.8 m",
      equipamento_step: "STEP 5500",
      tipo_equipamento: "Elétrico com casa de máquinas",
      capacidade: "8 pessoas / 600 kg",
      velocidade: "1.0 m/s",
      acabamento_da_cabine: "Aço inox escovado",
      porta_da_cabine: "Automática em aço inox",
      porta_de_pavimento: "Aço pintado com visor de vidro",
      entradas: "Frontal única",
      acabamento_das_portas: "Inox escovado",
      panoramico: "Não",
      observacao:
        "Edifício em fase final de construção. Espaço de casa de máquinas pronto.",
      empresa_equipamento_1: "Atlas Schindler",
      capacidade_1: "8 pessoas / 630 kg",
      velocidade_1: "1.0 m/s",
      preco_1: "$ 198.500,00",
      preco_2: "$ 54.500,00",
      preco_3: "$ 85.500,00",
      preco_4: "$ 95.500,00",
      preco_5: "$ 96.500,00",
      preco_6: "$ 55.500,00",
      maquinario_1: "Sem casa de máquinas (MRL)",
      acabamento_cabine_1: "Inox escovado com espelho lateral",
      barreira_eletronica_1: "Inclusa",
      medida_interna_cabine_1: "1.10 x 1.40 m",
      botao_chamada_1: "Botão touch com display LCD",
      porta_de_pavimento_1: "Automática 2 folhas de correr",
      acabamento_porta_de_pavimento_1: "Pintura epóxi branca",
      medida_caixa_1: "1.70 x 1.90 m",
      ultima_altura_1: "2.8 m",
      poco_1: "1.4 m",
      garantia_1: "24 meses",
      frete_1: "Incluído",
      prazo_1: "120 dias após pedido",
      forma_de_pagamento_1: "30% na assinatura + saldo em 4x mensais",
      titulo_curto_equipamento_1: "Elevador Schindler S5500",
      modelo_do_produto_1: "S5500 ComfortLine",
      tipo_de_equipamento_1: "MRL - Elétrico sem casa de máquinas",
      resgate_automatico_1: "Sim, com bateria de emergência",
      alimentacao_1: "Trifásica 220V",
      porta_cabine_1: "Automática de 2 folhas",
      imagem_1_equipamento_1: "16Xh8lll8iLAU_81uvAi26TiRFjGAh2rw",
      imagem_2_equipamento_1: "1kuL22jwBXus7-hJ7775mfT3gnxOuhv3g",
      ano_cliente: "2026",
      nome_cliente_sanitizado: "Usuário de Testes (SP)",
      pasta_cliente_id: "19-a60FGVWrZI_E4K98qqZLi3rwRKRac_",
      link_proposta_1: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel",
      link_proposta_2: "1_another_drive_id_for_proposal_2",
      link_proposta_3: "1_yet_another_drive_id_for_proposal_3",
      link_catalogo_1:
        "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link",
      link_catalogo_2:
        "https://drive.google.com/drive/folders/1hVUEKI9mM-ELSJMAECOwS8g90iopZxAK?usp=drive_link",
      link_catalogo_3:
        "https://drive.google.com/drive/folders/1OUp-2mORToiirl0sLIStictxAaO6s5f4?usp=drive_link",
    };
  }

  const data = todayDateString();
  const modeloId = "1gt6u879U2olNMnhK1SOrja1y5HA0lOk53_Cn5v91hng";

  const nomeCliente =
    detalhes_proposta.nome ||
    detalhes_proposta.name ||
    detalhes_proposta.client ||
    detalhes_proposta.endereco ||
    "Cliente";
  // Removido o prefixo DriveUtils que causava erro de referência
  const nomeClienteSanitizado = sanitizeDriveFolderName(
    detalhes_proposta.nome_cliente_sanitizado
  );
  const filename =
    "Apresentação Gerada - " + nomeClienteSanitizado + " - " + data;

  const clientFolderId = detalhes_proposta.pasta_cliente_id;

  let pastaDestino;
  if (clientFolderId) {
    pastaDestino = getOrCreateDriveFolderFromIdAndPath(clientFolderId);
    Logger.log("Usando pasta do cliente por ID: " + clientFolderId);
  } else {
    pastaDestino = DriveApp.getRootFolder();
  }

  let copiaFile;
  const existing = pastaDestino.getFilesByName(filename);
  if (existing.hasNext()) {
    copiaFile = existing.next();
    // Logger.log('Reutilizando cópia existente em ' + caminhoClient + ': ' + filename);
  } else {
    copiaFile = DriveApp.getFileById(modeloId).makeCopy(filename, pastaDestino);
    // Logger.log('Criando nova cópia em ' + caminhoClient + ': ' + filename);
  }

  Utilities.sleep(1000);

  const presentation = SlidesApp.openById(copiaFile.getId());
  const slides = presentation.getSlides();

  // ========================================================================
  // PROCESSAMENTO OTIMIZADO EM PASS ÚNICO
  // ========================================================================

  const isImageKey = (key) => /(imagem|image|foto)/i.test(key);

  // Pré-calcula dados que não mudam entre slides para evitar retrabalho.
  const dynamicImagesMap = {};
  const textReplacements = [];

  for (const [chave, valor] of Object.entries(detalhes_proposta)) {
    if (isImageKey(chave)) {
      const extracted = DriveIdExtractor.extract(valor);
      if (extracted.id) {
        dynamicImagesMap[chave.toUpperCase()] = extracted.id;
      }
      continue;
    }

    if (/link/i.test(chave)) {
      continue;
    }

    const rawVal = valor === null || valor === undefined ? "" : String(valor);
    const finalVal = /^preco/i.test(chave) ? formatCurrencyBR(rawVal) : rawVal;
    textReplacements.push({
      placeholder: `{{${chave.toUpperCase()}}}`,
      value: finalVal,
    });
  }

  const linksToProcess = LinkProcessor.processAll(detalhes_proposta);
  const hasImages = Object.keys(dynamicImagesMap).length > 0;
  const hasLinks = Object.keys(linksToProcess).length > 0;

  for (const slide of slides) {
    slide.replaceAllText("{{DATA}}", data);

    if (hasImages) {
      replaceImagePlaceholdersInSlide(slide, dynamicImagesMap);
    }

    for (let i = 0; i < textReplacements.length; i++) {
      const replacement = textReplacements[i];
      slide.replaceAllText(replacement.placeholder, replacement.value);
    }

    if (hasLinks) {
      ImprovedLinkReplacer.replaceAllInSlide(slide, linksToProcess);
    }
  }

  Logger.log("Apresentação gerada com sucesso " + presentation.getUrl());
  Logger.log("DataJSON " + JSON.stringify(detalhes_proposta));

  return presentation.getUrl();
}
