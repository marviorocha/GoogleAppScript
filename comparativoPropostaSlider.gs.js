function todayDateString() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


function replaceImagePlaceholdersInSlide(slide, imagesMap) {
  const shapes = slide.getShapes();
  for (const shape of shapes) {
    let textRange;
    try {
      textRange = shape.getText();
    } catch (e) {
      continue;
    }
    if (!textRange) continue;

    const text = textRange.asString();
    if (!text) continue;

    for (const [key, imageId] of Object.entries(imagesMap)) {
      const placeholder = `{{${key}}}`;
      if (text.trim() === placeholder) {
        const left = shape.getLeft();
        const top = shape.getTop();
        const width = shape.getWidth();
        const height = shape.getHeight();
        shape.remove();
        try {
          const blob = DriveApp.getFileById(imageId).getBlob();
          const img = slide.insertImage(blob);
          img.setLeft(left);
          img.setTop(top);
          img.setWidth(width);
          img.setHeight(height);
        } catch (err) {
          Logger.log('Erro ao inserir imagem id=' + imageId + ' -> ' + err);
        }
        break;
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
        break;
      }
    }
  }
}

function gerarApresentacaoDoModelo(detalhes_proposta = null) {
  if (!detalhes_proposta) {
    detalhes_proposta = {
      nome: "Marvio de Siqueira Rocha",
      endereco: "Rua Amaro Antônio de Araújo, 170 - Jardim Umarizal, São Paulo - SP",
      tipoImovel: "Residencial",
      numElevadores: "1",
      numPavimentos: "3",
      dataPrevisaoInstalacao: "A definir",
      imagemImovel: "https://placehold.co/600x600",
      redeEletrica: "220V",
      caixaCorridaStep: "Alvenaria",
      statusCaixaCorrida: "Pronto",
      larguraCaixa: "1400 mm",
      profundidadeCaixa: "1900 mm",
      percurso: "6000 mm",
      peDireitoPavimentos: "2500 mm",
      profundidadePoco: "1000 mm",
      ultimaAltura: "2900 mm",
      equipamentoStep: "Ascensor",
      tipoEquipamento: "Ascensor Hidráulico",
      capacidade: "4 pessoas ou 300 kg",
      velocidade: "21 metros/minuto (0,35 metros/segundo)",
      acabamentoCabine: "Inox escovado (fundo e laterais)",
      medidaCabine: "800 mm (largura) x 1.250 mm (profundidade) x 2.150 mm (altura)",
      resgateAutomatico: "Resgate Automático",
      alimentacao: "Monofásico 220V",
      medidaCaixaCorrida: "1.400 mm (largura) x 1.900 mm (profundidade)",
      ultimaAltura: "aproximadamente 2.900 mm",
      poco: "Profundidade do poço 1.000 mm",
      garantia: "12 meses (3 meses legais + 9 meses fabricante), cobertura total contra defeitos de fabricação e montagem",
      frete: "Incluso",
      prazo: "A combinar",
      pagamento: "Entrada de 35% na assinatura, restante parcelado a combinar até a entrega",
      preco: "R$ 144.000,00 (portas inox ou epóxi branca/preta) ou R$ 138.000,00 (epóxi bege)"
    };
  }

  const data = todayDateString();
  const modeloId = '1gt6u879U2olNMnhK1SOrja1y5HA0lOk53_Cn5v91hng';
  const copia = DriveApp.getFileById(modeloId).makeCopy('Apresentação Gerada' + data + " " + detalhes_proposta.name);



  Utilities.sleep(1000);

  const presentation = SlidesApp.openById(copia.getId());
  const slides = presentation.getSlides();

  for (const slide of slides) {
    slide.replaceAllText('{{DATA}}', data);


    for (const [chave, valor] of Object.entries(detalhes_proposta)) {
      const placeholder = `{{${chave.toUpperCase()}}}`;
      slide.replaceAllText(placeholder, valor);
    }

    const imagesMap = {
      'IMAGE1': '16Xh8lll8iLAU_81uvAi26TiRFjGAh2rw',
      'IMAGE2': '1gSK2KelR9o41v1uVsgpABnfryiozT2G3'
    };

    replaceImagePlaceholdersInSlide(slide, imagesMap);
  }

  Logger.log('Apresentação gerada com sucesso ' + presentation.getUrl());
  Logger.log('DataJSON' + detalhes_proposta);
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

    gerarApresentacaoDoModelo(detalhes_proposta);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
