/**
 * Google Apps Script: Integração AppSheet -> Google Sheets
 * Objetivo: Extrair o ID real de arquivos do Google Drive a partir de URLs ou caminhos do AppSheet.
 */

// --- CONFIGURAÇÃO ---
const CONFIG = {
  SOURCE_COLUMN: 1, // Coluna onde está o link/caminho (A=1, B=2...)
  TARGET_COLUMN: 2, // Coluna onde o ID será salvo
  SHEET_NAME: "Planilha1" // Nome da aba (altere conforme necessário)
};

/**
 * Função principal para processamento.
 * Pode ser chamada por gatilho onEdit ou via Automação do AppSheet.
 */
function processarExtracaoID(e, rowOverride) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    console.error("Planilha não encontrada: " + CONFIG.SHEET_NAME);
    return;
  }

  let row = rowOverride;

  // Se vier de um gatilho onEdit
  if (e && e.range) {
    const range = e.range;
    if (range.getSheet().getName() !== CONFIG.SHEET_NAME || range.getColumn() !== CONFIG.SOURCE_COLUMN) {
      return;
    }
    row = range.getRow();
  }

  if (!row) return;

  const valorCelula = sheet.getRange(row, CONFIG.SOURCE_COLUMN).getValue().toString().trim();
  if (!valorCelula) return;

  try {
    const fileId = extrairIdDoDrive(valorCelula);

    if (fileId && validarExistenciaArquivo(fileId)) {
      sheet.getRange(row, CONFIG.TARGET_COLUMN).setValue(fileId);
    } else {
      sheet.getRange(row, CONFIG.TARGET_COLUMN).setValue("Erro: ID inválido ou arquivo inacessível");
    }
  } catch (err) {
    sheet.getRange(row, CONFIG.TARGET_COLUMN).setValue("Erro: " + err.message);
  }
}

/**
 * Extrai o ID do arquivo utilizando Regex otimizada.
 * @param {string} entrada - URL completa ou caminho relativo.
 * @return {string|null} - O ID extraído ou null.
 */
function extrairIdDoDrive(entrada) {
  // Regex para capturar IDs de 25 a 100 caracteres (padrão Drive)
  // Captura após /d/, id=, ou em strings isoladas
  const regexId = /[-\w]{25,100}/;

  // 1. Verificar se é uma URL conhecida
  if (entrada.includes("http")) {
    const matches = entrada.match(regexId);
    return matches ? matches[0] : null;
  }

  // 2. Se for caminho relativo do AppSheet (ex: Tabela_Imagens/foto.jpg)
  if (entrada.includes("/")) {
    return buscarIdPorCaminhoRelativo(entrada);
  }

  // 3. Tentar regex genérica no que sobrar
  const genericMatch = entrada.match(regexId);
  return genericMatch ? genericMatch[0] : null;
}

/**
 * Busca o arquivo no Drive pelo nome quando o AppSheet fornece apenas o caminho.
 * @param {string} caminho - Caminho relativo (ex: "Pasta/Arquivo.pdf").
 */
function buscarIdPorCaminhoRelativo(caminho) {
  const partes = caminho.split("/");
  const nomeArquivo = partes[partes.length - 1];

  // Busca por nome exato no Drive do usuário
  const arquivos = DriveApp.getFilesByName(nomeArquivo);

  if (arquivos.hasNext()) {
    return arquivos.next().getId();
  }

  throw new Error("Arquivo não localizado no Drive pelo nome");
}

/**
 * Valida se o ID pertence a um arquivo existente e acessível.
 */
function validarExistenciaArquivo(id) {
  try {
    DriveApp.getFileById(id);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * GATILHO: Executa ao editar a planilha manualmente.
 */
function onEdit(e) {
  processarExtracaoID(e);
}

/**
 * INTEGRAÇÃO APPSHEET: Chamar esta função via Automação (Call a Script).
 * @param {number} rowNumber - Passar o número da linha como parâmetro.
 */
function gatilhoAppSheet(rowNumber) {
  processarExtracaoID(null, rowNumber);
}
