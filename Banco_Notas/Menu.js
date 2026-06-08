/**
 * INICIALIZADOR DE INTERFACE DO GOOGLE SHEETS
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("Notas")
    .addItem("Importar da API", "rodarImportacao")
    .addItem("Sincronizar Alterações", "rodarSincronizacao")
    .addSeparator()
    .addItem("Sincronizar Tudo", "rodarSincronizarTudo")
    .addToUi();
}
