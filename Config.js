/**
 * Configurações globais do validador.
 */
const CONFIG = {
  SPREADSHEET_ID: "1YIU_nYTFMN0RS5zaXwtD2Wj9I-rshaD3QiHu2C6m0k0",

  SOURCE: {
    SHEET_NAME: "Imagens_Equipamentos",
    COMPARE_COLUMN: 7, // Coluna G (Onde estão os nomes originais)
    START_ROW: 2,
  },

  // ==========================================================
  // DESTINO: Onde vamos checar as fotos e desenhar os ✅ / ❌
  // Aba: "Fotos Equipamentos" (Print 1)
  // ==========================================================
  TARGET: {
    SHEET_NAME: "Fotos Equipamentos",
    START_ROW: 2,

    // MAPA DE COLUNAS
    // CHECK = Coluna da foto a ser validada | STATUS = Onde desenhar o ✅/❌
    COLUMNS_MAP: [
      { CHECK: 4, STATUS: 10 }, // Checa a Foto 1 (D) e marca na Coluna J (10)
      { CHECK: 6, STATUS: 11 }, // Checa a Foto 2 (F) e marca na Coluna K (11)
      { CHECK: 8, STATUS: 12 }, // Checa a Foto 3 (H) e marca na Coluna L (12)
    ],
  },

  SYMBOLS: {
    FOUND: "✅",
    NOT_FOUND: "❌",
  },
};
