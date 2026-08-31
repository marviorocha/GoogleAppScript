function testarEGravarNaPlanilha() {
  const urlOuCaminho = "Teste_Images/719444cb.Foto.201608.png";
  const pasta = "1oRCZsscMH02Hh7jGcUnUIQxtN904yU6K"; // ID da pasta do Drive

  const resultado = buscarIdParaAppSheet(urlOuCaminho, pasta);
  console.log("📌 Resultado:", resultado);
}