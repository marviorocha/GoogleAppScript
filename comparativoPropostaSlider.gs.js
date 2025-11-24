function todayDateString() {
  const date = new Date();
  // const day = String(date.getDate()).padStart(2, '0');
  const month = getMonthName(String(date.getMonth() + 1).padStart(2, '0'));
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  const data_month = date.toLocaleString('pt-BR', { month: 'long' });
  return String(data_month).charAt(0).toUpperCase() + String(data_month).slice(1)
}

// Função para normalizar e formatar valores monetários para pt-BR (R$ 1.234,56)
function formatCurrencyBR(input) {
  if (input === null || input === undefined) return '';
  let s = String(input).trim();
  if (!s) return '';
  // remove espaços e símbolos (letras, $ etc.), mantendo dígitos, vírgulas, pontos e sinal negativo
  s = s.replace(/\s/g, '').replace(/[^\d.,-]/g, '');

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  let normalized = s;
  if (lastDot > -1 && lastComma > -1) {
    // ambos presentes: o último deles é o separador decimal
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = s.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    const countComma = (s.match(/,/g) || []).length;
    // se houver uma vírgula e 2 dígitos depois, tratamos como decimal; caso contrário, removemos vírgulas como milhares
    if (countComma === 1 && (s.length - lastComma - 1) <= 2) {
      normalized = s.replace(',', '.');
    } else {
      normalized = s.replace(/,/g, '');
    }
  } else {
    // só ponto ou nenhum separador: removemos possíveis milhares (nenhuma ação especial aqui)
    normalized = s;
  }

  normalized = normalized.replace(/[^\d.-]/g, '');
  const num = parseFloat(normalized);
  if (isNaN(num)) return input; // se não conseguir parsear, retorna original

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}



function doPost(e) {
  try {
    if (!e) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'No event object' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let body = null;
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON in body', detail: err.toString() }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else if (e.parameter) {
      body = e.parameter;
    }

    let detalhes_proposta = null;
    if (body) {
      detalhes_proposta = body.data || body;
    }

    const presentationUrl = gerarApresentacaoDoModelo(detalhes_proposta);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', url: presentationUrl }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
        Logger.log('Falha ao inserir imagem por ID=' + candidateId + ' -> ' + err);
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
          textRange.replaceText(placeholder, '');
        } catch (err) {
          Logger.log('Erro ao remover placeholder do texto: ' + err);
        }
        try {
          const blob = DriveApp.getFileById(imageId).getBlob();
          const img = slide.insertImage(blob);
          const left = shape.getLeft() + shape.getWidth() + 8;
          const top = shape.getTop();
          img.setLeft(left);
          img.setTop(top);
        } catch (err) {
          Logger.log('Erro ao inserir imagem embutida id=' + imageId + ' -> ' + err);
        }
        return true;
      }
    }

    // Fallback: detectar um possível ID "cru" no texto e tentar substituir
    const idMatch = text.trim().match(/^[a-zA-Z0-9_-]{15,}$/);
    if (idMatch) {
      const ok = tryReplaceById(idMatch[0]);
      if (ok) return true;
    }
    return false;
  };

  const shapes = slide.getShapes();
  for (const shape of shapes) {
    // Tenta processar como texto simples
    try {
      const textRange = shape.getText();
      if (textRange) {
        const text = textRange.asString();
        if (text) {
          const done = processTextRangeShape(shape, textRange, text);
          if (done) continue;
        }
      }
    } catch (e) {
      // Ignora, pode ser tabela
    }

    // Se for tabela, percorre células
    try {
      const table = shape.getTable();
      if (table) {
        for (let r = 0; r < table.getNumRows(); r++) {
          for (let c = 0; c < table.getRow(r).getNumCells(); c++) {
            const cell = table.getCell(r, c);
            const cellText = cell.getText();
            const text = cellText ? cellText.asString() : '';
            if (!text) continue;
            const done = processTextRangeShape(shape, cellText, text);
            if (done) break;
          }
        }
      }
    } catch (e2) {
      // Sem suporte a tabela nesta shape
    }
  }
}

function gerarApresentacaoDoModelo(detalhes_proposta = null) {

  if (!detalhes_proposta) {
    detalhes_proposta = {
      "nome": "Ubiratan Ferreira das Flores",
      "endereco": "Rua Amaro Antônio de Araújo, 170 - Jardim Umarizal, São Paulo - SP",
      "tipo_imovel": "Residencial",
      "numero_elevadores": 2,
      "numero_pavimentos": 8,
      "data_previsao_instalacao": "2025-03-15",
      "imagem_imovel": "1ff9T9zokoXboJRic1CLXo51LHoqtGZUi",
      "rede_eletrica": "Trifásica 220V",
      "statusCaixaCorrida": "Concluída",
      "largura_caixa": "1.60 m",
      "profundidade_caixa": "1.80 m",
      "percurso": "18.5 m",
      "pe_direito_pavimentos": "2.6 m",
      "profundidade_poco": "1.4 m",
      "ultima_altura": "2.8 m",
      "equipamento_step": "STEP 5500",
      "tipo_equipamento": "Elétrico com casa de máquinas",
      "capacidade": "8 pessoas / 600 kg",
      "velocidade": "1.0 m/s",
      "acabamento_da_cabine": "Aço inox escovado",
      "porta_da_cabine": "Automática em aço inox",
      "porta_de_pavimento": "Aço pintado com visor de vidro",
      "entradas": "Frontal única",
      "acabamento_das_portas": "Inox escovado",
      "panoramico": "Não",
      "observacao": "Edifício em fase final de construção. Espaço de casa de máquinas pronto.",
      "empresa_equipamento_1": "Atlas Schindler",
      "capacidade_1": "8 pessoas / 630 kg",
      "velocidade_1": "1.0 m/s",
      "preco_1": "$ 198.500,00",
      "preco_2": "$ 54.500,00",
      "preco_3": "$ 85.500,00",
      "preco_4": "$ 95.500,00",
      "preco_5": "$ 96.500,00",
      "preco_6": "$ 55.500,00",
      "maquinario_1": "Sem casa de máquinas (MRL)",
      "acabamento_cabine_1": "Inox escovado com espelho lateral",
      "barreira_eletronica_1": "Inclusa",
      "medida_interna_cabine_1": "1.10 x 1.40 m",
      "botao_chamada_1": "Botão touch com display LCD",
      "porta_de_pavimento_1": "Automática 2 folhas de correr",
      "acabamento_porta_de_pavimento_1": "Pintura epóxi branca",
      "medida_caixa_1": "1.70 x 1.90 m",
      "ultima_altura_1": "2.8 m",
      "poco_1": "1.4 m",
      "garantia_1": "24 meses",
      "frete_1": "Incluído",
      "prazo_1": "120 dias após pedido",
      "forma_de_pagamento_1": "30% na assinatura + saldo em 4x mensais",
      "titulo_curto_equipamento_1": "Elevador Schindler S5500",
      "modelo_do_produto_1": "S5500 ComfortLine",
      "tipo_de_equipamento_1": "MRL - Elétrico sem casa de máquinas",
      "resgate_automatico_1": "Sim, com bateria de emergência",
      "alimentacao_1": "Trifásica 220V",
      "porta_cabine_1": "Automática de 2 folhas",
      "imagem_1_equipamento_1": "16Xh8lll8iLAU_81uvAi26TiRFjGAh2rw",
      "imagem_2_equipamento_1": "1kuL22jwBXus7-hJ7775mfT3gnxOuhv3g",
    };
  }

  const data = todayDateString();
  const modeloId = '1gt6u879U2olNMnhK1SOrja1y5HA0lOk53_Cn5v91hng';

  const nomeCliente = detalhes_proposta.nome || detalhes_proposta.name || detalhes_proposta.client || detalhes_proposta.endereco || 'Cliente';
  const filename = 'Apresentação Gerada - ' + nomeCliente + ' - ' + data;

  let copiaFile;
  const existing = DriveApp.getFilesByName(filename);
  if (existing.hasNext()) {
    copiaFile = existing.next();
    Logger.log('Reutilizando cópia existente: ' + filename);
  } else {
    copiaFile = DriveApp.getFileById(modeloId).makeCopy(filename);
    Logger.log('Criando nova cópia: ' + filename);
  }

  Utilities.sleep(1000);

  const presentation = SlidesApp.openById(copiaFile.getId());
  const slides = presentation.getSlides();

  const isImageKey = (key) => /(imagem|image|foto)/i.test(key);
  const extractDriveIdFromValue = (value) => {
    if (!value || typeof value !== 'string') return null;
    const quotedIdMatch = value.match(/text\(\"([a-zA-Z0-9_-]{15,})\"\)/);
    if (quotedIdMatch && quotedIdMatch[1]) return quotedIdMatch[1];
    const urlIdMatch = value.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (urlIdMatch && urlIdMatch[1]) return urlIdMatch[1];
    const rawIdMatch = value.match(/^[a-zA-Z0-9_-]{15,}$/);
    if (rawIdMatch) return value;
    return null;
  };



  for (const slide of slides) {
    slide.replaceAllText('{{DATA}}', data);

    const dynamicImagesMap = {};
    for (const [chave, valor] of Object.entries(detalhes_proposta)) {
      if (!isImageKey(chave)) continue;
      const id = extractDriveIdFromValue(valor);
      if (id) dynamicImagesMap[chave.toUpperCase()] = id;
    }
    if (Object.keys(dynamicImagesMap).length > 0) {
      replaceImagePlaceholdersInSlide(slide, dynamicImagesMap);
    }

    for (const [chave, valor] of Object.entries(detalhes_proposta)) {
      if (isImageKey(chave)) continue;
      const placeholder = `{{${chave.toUpperCase()}}}`;
      const rawVal = (valor === null || valor === undefined) ? '' : String(valor);
      // aplica formatação de moeda para chaves que começam com "preco"
      const finalVal = (/^preco/i.test(chave)) ? formatCurrencyBR(rawVal) : rawVal;
      slide.replaceAllText(placeholder, finalVal);
    }
  }

  Logger.log('Apresentação gerada com sucesso ' + presentation.getUrl());
  Logger.log('DataJSON ' + JSON.stringify(detalhes_proposta));

  // Retorna a URL da apresentação gerada/recuperada
  return presentation.getUrl();
}
