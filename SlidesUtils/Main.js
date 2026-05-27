// ============================================================================
// MÓDULO 5: MAIN.GS (Função Principal da Biblioteca)
// ============================================================================

/**
 * Função principal exposta pela biblioteca.
 * @param {Object} detalhes_proposta Dados dinâmicos para preencher a apresentação
 * @param {Object} config Configurações injetadas pelo script chamador (modeloId, baseFolderId)
 */
function gerarApresentacaoDoModelo(detalhes_proposta = null, config = {}) {
  // Se não receber dados de fora, usa o payload de teste (Fallback)
  if (!detalhes_proposta) {
    Logger.log("Aviso: Nenhum payload recebido. Usando payload de teste interno.");
    detalhes_proposta = {
      nome: "Cliente para Testar",
      endereco: "Rua Amaro Antônio de Araújo, 170 - Jardim Umarizal, São Paulo - SP",
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
      observacao: "Edifício em fase final de construção. Espaço de casa de máquinas pronto.",
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
      link_catalogo_1: "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link",
      link_catalogo_2: "https://drive.google.com/drive/folders/1hVUEKI9mM-ELSJMAECOwS8g90iopZxAK?usp=drive_link",
      link_catalogo_3: "https://drive.google.com/drive/folders/1OUp-2mORToiirl0sLIStictxAaO6s5f4?usp=drive_link"
    };
  }


  if (!config || !config.modeloId) {
    Logger.log("Aviso: Configuração 'modeloId' ausente. Usando ID de teste padrão.");
    config = {
      modeloId: "1gt6u879U2olNMnhK1SOrja1y5HA0lOk53_Cn5v91hng",
      baseFolderId: null
    };
  }

  const modeloId = config.modeloId;
  const dataAtual = Utils.todayDateString();

  // Definição do nome do arquivo
  const nomeClienteOriginal = detalhes_proposta.nome || detalhes_proposta.nome_cliente_sanitizado || "Cliente";
  const nomeClienteSanitizado = Utils.sanitizeDriveFolderName(nomeClienteOriginal);
  const filename = `Apresentação Gerada - ${nomeClienteSanitizado} - ${dataAtual}`;

  // Resolução da Pasta de Destino
  const clientFolderId = detalhes_proposta.pasta_cliente_id;
  let pastaDestino;

  if (clientFolderId) {
    pastaDestino = DriveManager.getOrCreateFolder(clientFolderId);
  } else if (config.baseFolderId) {
    pastaDestino = DriveManager.getOrCreateFolder(config.baseFolderId);
  } else {
    pastaDestino = DriveApp.getRootFolder();
  }

  // Criação da cópia do modelo
  const existing = pastaDestino.getFilesByName(filename);
  const copiaFile = existing.hasNext() ? existing.next() : DriveApp.getFileById(modeloId).makeCopy(filename, pastaDestino);

  Utilities.sleep(1000);

  const presentation = SlidesApp.openById(copiaFile.getId());
  const slides = presentation.getSlides();

  // Separação lógica de dados para substituição
  const dynamicImagesMap = {};
  const textReplacements = [{ placeholder: "{{DATA}}", value: dataAtual }];
  const isImageKey = (key) => /(imagem|image|foto)/i.test(key);

  // Criamos uma cópia dos detalhes para filtrar links vazios antes do processamento de links
  const detalhesFiltrados = { ...detalhes_proposta };

  for (const [chave, valor] of Object.entries(detalhes_proposta)) {
    const isLink = /link/i.test(chave);
    const rawVal = (valor == null || valor === "null") ? "" : String(valor).trim();

    if (isLink) {
      if (rawVal === "") {
        // Se o link está vazio, garantimos que o placeholder seja removido do texto
        textReplacements.push({ placeholder: `{{${chave.toUpperCase()}}}`, value: "" });
        delete detalhesFiltrados[chave];
      }
      continue;
    }

    if (isImageKey(chave)) {
      const extracted = DriveManager.extractId(valor);
      if (extracted.id) dynamicImagesMap[chave.toUpperCase()] = extracted.id;
    } else {
      const finalVal = /^preco/i.test(chave) ? Utils.formatCurrencyBR(rawVal) : rawVal;
      textReplacements.push({ placeholder: `{{${chave.toUpperCase()}}}`, value: finalVal });
    }
  }

  const linksToProcess = LinkModule.processAll(detalhesFiltrados);

  // Processamento massivo slide a slide
  for (const slide of slides) {
    for (const replacement of textReplacements) {
      slide.replaceAllText(replacement.placeholder, replacement.value);
    }
    SlidesProcessor.processElementsSinglePass(slide, dynamicImagesMap, linksToProcess);
  }

  presentation.saveAndClose();

  Logger.log(`Apresentação gerada com sucesso: ${copiaFile.getUrl()}`);
  return copiaFile.getUrl();
}
