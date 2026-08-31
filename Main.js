/**
 * Busca o ID no Drive e grava na mesma linha onde o caminho/URL se encontra
 */
function buscarIdParaAppSheet(url_ou_caminho, pasta_ou_ID) {
  const config = APP_CONFIG.PLANILHA;
  const drive = new DriveService(APP_CONFIG.PASTAS);

  // 1. Obtém o ID do arquivo no Drive
  const idGerado = drive.obterId(url_ou_caminho, pasta_ou_ID);

  if (!idGerado || idGerado.includes("DEBUG") || idGerado.includes("ERRO")) {
    return idGerado;
  }

  try {
    const planilha = SpreadsheetApp.openById(config.ID_PLANILHA);
    const aba = planilha.getSheetByName(config.NOME_ABA);

    if (!aba) throw new Error(`A aba '${config.NOME_ABA}' não foi encontrada.`);

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < config.LINHA_INICIAL) return idGerado;

    // 2. Lê todas as células da coluna de Fotos
    const totalLinhas = ultimaLinha - config.LINHA_INICIAL + 1;
    const valoresCaminho = aba.getRange(config.LINHA_INICIAL, config.COL_CAMINHO_FOTO, totalLinhas, 1).getValues();

    // 3. Encontra o índice da linha correspondente ao caminho informado
    let linhaEncontrada = -1;
    for (let i = 0; i < valoresCaminho.length; i++) {
      if (valoresCaminho[i][0].toString().trim() === url_ou_caminho.trim()) {
        linhaEncontrada = config.LINHA_INICIAL + i;
        break;
      }
    }

    // 4. Grava na linha correspondente se for localizada
    if (linhaEncontrada !== -1) {
      aba.getRange(linhaEncontrada, config.COL_ID_FOTO).setValue(idGerado);
      console.log(`✅ ID '${idGerado}' gravado na Linha ${linhaEncontrada}, Coluna ${config.COL_ID_FOTO}.`);
    } else {
      console.warn(`⚠️ O caminho '${url_ou_caminho}' não foi encontrado na Coluna ${config.COL_CAMINHO_FOTO}.`);
    }

  } catch (erro) {
    console.error(`❌ Erro ao gravar na planilha: ${erro.message}`);
  }

  return idGerado;
}