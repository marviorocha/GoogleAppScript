/**
 * Google Apps Script Web App for AppSheet Integration.
 * 
 * This script is standalone and does not require Google Sheets.
 * It extracts a Google Drive File ID from an AppSheet upload and returns it as JSON.
 */

/**
 * Handle POST requests from AppSheet Automations.
 * @param {Object} e - The event object from the HTTP request.
 * @return {ContentService.TextOutput} JSON response.
 */
function doPost(e) {
  try {
    // 1. Parse incoming JSON data
    const requestData = JSON.parse(e.postData.contents);
    const fileInput = requestData.arquivo;

    if (!fileInput) {
      return createJsonResponse(false, null, "Campo 'arquivo' não encontrado no payload.");
    }

    // 2. Extract the File ID
    const fileId = extractDriveFileId(fileInput);

    if (!fileId) {
      return createJsonResponse(false, null, "Não foi possível extrair um ID válido da entrada fornecida.");
    }

    // 3. Validate existence in Drive
    if (validateFileExists(fileId)) {
      return createJsonResponse(true, fileId);
    } else {
      return createJsonResponse(false, null, "Arquivo não encontrado ou sem permissão de acesso no Google Drive.");
    }

  } catch (err) {
    return createJsonResponse(false, null, "Erro interno: " + err.message);
  }
}

/**
 * Extracts the Google Drive File ID from URLs or AppSheet relative paths.
 * @param {string} input - The raw value from AppSheet (URL or Path).
 * @return {string|null} The extracted ID or null.
 */
function extractDriveFileId(input) {
  /**
   * REGEX OTIMIZADA:
   * [-\w]{25,100} -> Captura IDs do Drive (25 a 100 caracteres alfanuméricos, - e _).
   */
  const driveIdRegex = /[-\w]{25,100}/;

  // Caso A: URL Completa do Google (Drive, Docs, Sheets, etc)
  if (input.includes("http")) {
    const match = input.match(driveIdRegex);
    return match ? match[0] : null;
  }

  // Caso B: Caminho Relativo (ex: Tabela_Imagens/foto.png)
  if (input.includes("/")) {
    const parts = input.split("/");
    const fileName = parts.pop(); // Nome do arquivo é o último segmento
    
    const files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      return files.next().getId();
    }
  }

  // Caso C: O input já é o ID ou formato desconhecido (tenta regex direta)
  const fallbackMatch = input.match(driveIdRegex);
  return fallbackMatch ? fallbackMatch[0] : null;
}

/**
 * Validates if the file exists and is accessible by the script's owner.
 * @param {string} fileId - The ID to validate.
 * @return {boolean}
 */
function validateFileExists(fileId) {
  try {
    DriveApp.getFileById(fileId);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Helper to create a consistent JSON response.
 * @param {boolean} success - Operation status.
 * @param {string|null} fileId - The extracted ID.
 * @param {string|null} error - Error message if applicable.
 */
function createJsonResponse(success, fileId, error = null) {
  const response = {
    success: success,
    fileId: fileId,
    error: error
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mandatory for Web App deployment.
 */
function doGet() {
  return ContentService.createTextOutput("Endpoint ativo. Utilize POST para enviar dados.");
}
