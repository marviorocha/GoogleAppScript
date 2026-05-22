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

/**
 * Processa um slide uma única vez para substituir múltiplos links, melhorando significativamente a performance.
 */
function replaceAllLinksInSlide(slide, linksMap, label) {
  const elements = slide.getPageElements();
  elements.forEach((element) => {
    recursiveProcessElementForLinks(element, linksMap, label);
  });
}

function recursiveProcessElementForLinks(element, linksMap, label) {
  try {
    const type = element.getPageElementType();
    if (type === SlidesApp.PageElementType.GROUP) {
      element
        .asGroup()
        .getChildren()
        .forEach((child) => {
          recursiveProcessElementForLinks(child, linksMap, label);
        });
    } else if (type === SlidesApp.PageElementType.TABLE) {
      const table = element.asTable();
      for (let r = 0; r < table.getNumRows(); r++) {
        for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
          const cellText = table.getCell(r, c).getText();
          if (cellText) {
            processTextRangeForMultipleLinks(cellText, linksMap, label);
          }
        }
      }
    } else if (type === SlidesApp.PageElementType.SHAPE) {
      const shape = element.asShape();
      const textRange = shape.getText();
      if (textRange) {
        processTextRangeForMultipleLinks(textRange, linksMap, label);
      }
    }
  } catch (err) {
    // Ignora elementos que não permitem acesso ao texto (como linhas ou conectores)
  }
}

function processTextRangeForMultipleLinks(textRange, linksMap, label) {
  for (const [placeholder, url] of Object.entries(linksMap)) {
    // Escapa caracteres especiais para busca exata via Regex
    const escapedPattern = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let matches = textRange.find(escapedPattern);

    while (matches && matches.length > 0) {
      // Substitui o placeholder pelo texto amigável
      let linkRange = matches[0].setText(label);

      // Aplica o link e a formatação visual (Azul e Sublinhado)
      const style = linkRange.getTextStyle();
      style.setLinkUrl(url);
      style.getForegroundColor().setOpaqueColor("#FFFFFF");
      style.setUnderline(true);

      matches = textRange.find(escapedPattern);
    }
  }
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

  const isImageKey = (key) => /(imagem|image|foto)/i.test(key);
  const extractDriveIdFromValue = (value) => {
    if (!value || typeof value !== "string") return null;
    const quotedIdMatch = value.match(/text\(\"([a-zA-Z0-9_-]{15,})\"\)/);
    if (quotedIdMatch && quotedIdMatch[1]) return quotedIdMatch[1];
    const urlIdMatch = value.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (urlIdMatch && urlIdMatch[1]) return urlIdMatch[1];
    const rawIdMatch = value.match(/^[a-zA-Z0-9_-]{15,}$/);
    if (rawIdMatch) return value;
    return null;
  };

  for (const slide of slides) {
    slide.replaceAllText("{{DATA}}", data);

    const dynamicImagesMap = {};
    for (const [chave, valor] of Object.entries(detalhes_proposta)) {
      if (!isImageKey(chave)) continue;
      const id = extractDriveIdFromValue(valor);
      if (id) dynamicImagesMap[chave.toUpperCase()] = id;
    }
    if (Object.keys(dynamicImagesMap).length > 0) {
      replaceImagePlaceholdersInSlide(slide, dynamicImagesMap);
    }

    const linksToProcess = {};
    for (const [chave, valor] of Object.entries(detalhes_proposta)) {
      if (isImageKey(chave)) continue;
      const rawVal = valor === null || valor === undefined ? "" : String(valor);

      if (/link/i.test(chave) && rawVal) {
        const driveId = extractDriveIdFromValue(rawVal);
        if (driveId) {
          const url = `https://drive.google.com/file/d/${driveId}/view`;
          linksToProcess[`{{${chave.toUpperCase()}}}`] = url;
          continue;
        }
      }

      const placeholder = `{{${chave.toUpperCase()}}}`;
      // Removido o prefixo Formatters que causava erro de referência
      const finalVal = /^preco/i.test(chave)
        ? formatCurrencyBR(rawVal)
        : rawVal;
      slide.replaceAllText(placeholder, finalVal);
    }

    // Executa a substituição de todos os links de uma só vez para este slide
    if (Object.keys(linksToProcess).length > 0) {
      replaceAllLinksInSlide(slide, linksToProcess, "LINK PROPOSTA");
    }
  }

  Logger.log("Apresentação gerada com sucesso " + presentation.getUrl());
  Logger.log("DataJSON " + JSON.stringify(detalhes_proposta));

  return presentation.getUrl();
}
