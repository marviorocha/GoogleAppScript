function doGet(e) {
  return ContentService.createTextOutput("ok");
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  // seu processamento aqui
  return ContentService
     .createTextOutput(JSON.stringify({ status:"OK", recebido: data }))
     .setMimeType(ContentService.MimeType.JSON);
}
function testarDoPost() {
  const url = ScriptApp.getService().getUrl(); // Obtém a URL de implantação do seu script
  const payload = {
    "nome": "João Silva",
    "idade": 30,
    "cidade": "São Paulo"
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const jsonResponse = JSON.parse(response.getContentText());
    Logger.log("Resposta do doPost: " + JSON.stringify(jsonResponse));
  } catch (e) {
    Logger.log("Erro ao testar doPost: " + e.toString());
  }
}
