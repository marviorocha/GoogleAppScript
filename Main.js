/**
 * Ponto de entrada do script. Pode ser acionado por gatilho, botão ou menu.
 */
function iniciarValidacaoDeImagens() {
  try {
    Logger.log("Iniciando validação de imagens...");

    // Instancia o validador passando as configurações criadas no Config.js
    const validator = new SheetValidator(CONFIG);
    validator.execute();

    Logger.log("Validação concluída com sucesso!");

    // Opcional: Mostra um balão verde de sucesso no canto inferior da tela
    if (SpreadsheetApp.getActiveSpreadsheet()) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "A validação das fotos foi concluída!",
        "Sucesso ✅"
      );
    }
  } catch (error) {
    Logger.log("ERRO CRÍTICO: " + error.message);

    // Exibe o alerta de erro para o usuário caso algo falhe
    if (SpreadsheetApp.getActiveSpreadsheet()) {
      SpreadsheetApp.getUi().alert("❌ Ocorreu um Erro:\n\n" + error.message);
    }
  }
}

/**
 * Cria um menu customizado na interface do Google Sheets ao abrir o documento (Opcional)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("⚙️ Automações")
    .addItem("1. Validar Fotos de Equipamento", "iniciarValidacaoDeImagens")
    .addToUi();
}
