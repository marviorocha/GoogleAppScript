/**
 * Configurações globais do validador.
 * Concentramos as variáveis aqui para reaproveitar em qualquer projeto.
 */
const CONFIG = {
  
  SPREADSHEET_ID: "", 
  
  // ORIGEM (Onde está a lista original/correta de fotos que você quer usar como base)
  SOURCE: {
    SHEET_NAME: "Foto Equipamento",
    COMPARE_COLUMN: 7, // Coluna G (A=1, B=2, ..., G=7)
    START_ROW: 2       // Ignora o cabeçalho (começa da linha 2)
  },
  
  // DESTINO (A aba que será verificada e onde o ✅ ou ❌ será inserido)
  TARGET: {
    SHEET_NAME: "Imagem Equipamento",
    COMPARE_COLUMN: 3, // EX: Coluna C (MUDE para o número da coluna onde o nome/link da imagem está nesta aba)
    STATUS_COLUMN: 5,  // EX: Coluna E (MUDE para o número da coluna onde o ✅ ou ❌ deve ser desenhado)
    START_ROW: 2       // Ignora o cabeçalho
  },

  // Configuração dos Símbolos de feedback
  SYMBOLS: {
    FOUND: "✅",
    NOT_FOUND: "❌"
  }
};