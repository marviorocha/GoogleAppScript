/**
 * Recebe a requisição POST vinda do Webhook do AppSheet
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return construirRespostaJSON({ status: "error", message: "Payload vazio ou inválido." });
    }

    // 1. Parseia os dados enviados pelo AppSheet
    const payload = JSON.parse(e.postData.contents);
    Logger.log("Payload recebido do AppSheet: " + JSON.stringify(payload));

    // 2. Extrai as informações chaves enviadas pelo Webhook
    // Certifique-se de enviar esses parâmetros no corpo do Webhook no AppSheet
    const caminhoRelativo = payload.caminho_arquivo; // Ex: "Especificacao_Images/f1ccf75d.Imagem.png"
    const idLinha = payload.id_linha;               // A chave primária (Key) da linha para sabermos onde gravar
    const nomeAba = payload.nome_aba || "Propostas Importadas"; // Nome da aba a ser atualizada
    
    if (!caminhoRelativo || !idLinha) {
      return construirRespostaJSON({ status: "error", message: "Parâmetros 'caminho_arquivo' ou 'id_linha' ausentes." });
    }

    // 3. Executa o motor de busca do arquivo no Drive
    const idDriveDetectado = AppSheetDriveResolver.resolverIdPorCaminho(caminhoRelativo);

    if (!idDriveDetectado) {
      return construirRespostaJSON({ status: "not_found", message: "Arquivo não localizado no Drive ainda." });
    }

    // 4. Grava o ID de volta na planilha na coluna correta
    const planilhaId = "1YIU_nYTFMN0RS5zaXwtD2Wj9I-rshaD3QiHu2C6m0k0"; // Seu ID de planilha padrão
    const gravou = PlanilhaManager.atualizarIdNaLinha(planilhaId, nomeAba, idLinha, idDriveDetectado);

    if (gravou) {
      return construirRespostaJSON({ status: "success", id_drive: idDriveDetectado });
    } else {
      return construirRespostaJSON({ status: "error", message: "Arquivo achado, mas falhou ao gravar na planilha. Chave não encontrada." });
    }

  } catch (err) {
    Logger.log("Erro crítico no doPost: " + err.toString());
    return construirRespostaJSON({ status: "error", message: err.toString() });
  }
}

/**
 * Auxiliar para estruturar o retorno do Webhook em JSON correto
 */
function construirRespostaJSON(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}