/**
 * Classe responsável pela validação dos dados em lote (Batch Processing).
 * Altamente otimizada para evitar lentidão no Google Sheets.
 */
class SheetValidator {
  constructor(config) {
    this.config = config;
    // Conecta na planilha por ID ou pega a planilha ativa se não houver ID.
    this.ss = config.SPREADSHEET_ID
      ? SpreadsheetApp.openById(config.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
  }

  execute() {
    const sourceSheet = this.ss.getSheetByName(this.config.SOURCE.SHEET_NAME);
    const targetSheet = this.ss.getSheetByName(this.config.TARGET.SHEET_NAME);

    if (!sourceSheet || !targetSheet) {
      throw new Error(
        `Aba não encontrada! Verifique os nomes: '${this.config.SOURCE.SHEET_NAME}' ou '${this.config.TARGET.SHEET_NAME}'.`
      );
    }

    // 1. Coletar todos os valores de origem e criar um "Set" (Para buscas super rápidas de existência)
    const sourceValues = this.getColumnData(
      sourceSheet,
      this.config.SOURCE.COMPARE_COLUMN,
      this.config.SOURCE.START_ROW
    );

    // Filtra linhas vazias e força string para evitar falso-negativo por tipo de dado
    const validSourceSet = new Set(
      sourceValues
        .map((row) => String(row[0]).trim())
        .filter((val) => val !== "")
    );

    // 2. Coletar os valores do destino que precisam ser validados
    const targetValues = this.getColumnData(
      targetSheet,
      this.config.TARGET.COMPARE_COLUMN,
      this.config.TARGET.START_ROW
    );

    // 3. Cruzamento de dados: Gera um Array (Matriz) com os '✅' ou '❌'
    const statusOutput = targetValues.map((row) => {
      const targetItem = String(row[0]).trim();

      // Se a célula alvo estiver vazia, não coloca nada
      if (targetItem === "") {
        return [""];
      }

      // Checa a existência da imagem no Set e retorna o emoji correto
      if (validSourceSet.has(targetItem)) {
        return [this.config.SYMBOLS.FOUND];
      } else {
        return [this.config.SYMBOLS.NOT_FOUND];
      }
    });

    // 4. Gravação Otimizada: Escreve a matriz inteira de uma só vez (Performance 100x mais rápida)
    if (statusOutput.length > 0) {
      targetSheet
        .getRange(
          this.config.TARGET.START_ROW,
          this.config.TARGET.STATUS_COLUMN,
          statusOutput.length,
          1
        )
        .setValues(statusOutput);
    }
  }

  /**
   * Função auxiliar para coletar colunas inteiras ignorando espaço em branco no final
   */
  getColumnData(sheet, colIndex, startRow) {
    const lastRow = sheet.getLastRow();
    if (lastRow < startRow) return [];
    return sheet
      .getRange(startRow, colIndex, lastRow - startRow + 1, 1)
      .getValues();
  }
}
