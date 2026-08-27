/**
 * Classe responsável pela validação dos dados em lote.
 */
class SheetValidator {
  constructor(config) {
    this.config = config;
    this.ss = config.SPREADSHEET_ID
      ? SpreadsheetApp.openById(config.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
  }

  execute() {
    const sourceSheet = this.ss.getSheetByName(this.config.SOURCE.SHEET_NAME);
    const targetSheet = this.ss.getSheetByName(this.config.TARGET.SHEET_NAME);

    if (!sourceSheet || !targetSheet) {
      throw new Error(
        `Aba não encontrada! Verifique os nomes nas configurações.`
      );
    }

    // 1. Coleta a lista oficial de fotos (Aba Imagens_Equipamentos, Coluna G) apenas UMA VEZ
    const sourceValues = this.getColumnData(
      sourceSheet,
      this.config.SOURCE.COMPARE_COLUMN,
      this.config.SOURCE.START_ROW
    );

    // 2. Cria um banco de dados rápido em memória
    const validSourceSet = new Set(
      sourceValues
        .map((row) => String(row[0]).trim())
        .filter((val) => val !== "")
    );

    // 3. Passa pelas colunas que queremos validar (ex: 4, 6 e 8)
    this.config.TARGET.COLUMNS_MAP.forEach((mapping) => {
      // Pega os dados da coluna atual (ex: coluna D)
      const targetValues = this.getColumnData(
        targetSheet,
        mapping.CHECK,
        this.config.TARGET.START_ROW
      );

      // Cruza os dados: Se a foto existir no nosso banco de dados, ganha ✅
      const statusOutput = targetValues.map((row) => {
        const targetItem = String(row[0]).trim();

        if (targetItem === "") return [""]; // Ignora se a célula estiver em branco

        return validSourceSet.has(targetItem)
          ? [this.config.SYMBOLS.FOUND]
          : [this.config.SYMBOLS.NOT_FOUND];
      });

      // 4. Grava tudo de uma vez na coluna de Status correspondente (ex: Coluna 10)
      if (statusOutput.length > 0) {
        targetSheet
          .getRange(
            this.config.TARGET.START_ROW,
            mapping.STATUS,
            statusOutput.length,
            1
          )
          .setValues(statusOutput);
      }
    });
  }

  /**
   * Função auxiliar para coletar colunas inteiras
   */
  getColumnData(sheet, colIndex, startRow) {
    const lastRow = sheet.getLastRow();
    if (lastRow < startRow) return [];
    return sheet
      .getRange(startRow, colIndex, lastRow - startRow + 1, 1)
      .getValues();
  }
}
