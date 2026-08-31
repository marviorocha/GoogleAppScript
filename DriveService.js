class DriveService {
  constructor(mapaDePastas) {
    this.pastas = mapaDePastas || {};
  }

  extrairNomeDoArquivo(urlOuCaminho) {
    if (!urlOuCaminho) return "";
    let semParametros = urlOuCaminho.split("?")[0];
    let partes = semParametros.split("/");
    return partes[partes.length - 1];
  }

  obterId(urlOuCaminho, nomeOuIdDaPasta) {
    if (!urlOuCaminho) return "";

    let nomeDoArquivo = this.extrairNomeDoArquivo(urlOuCaminho);
    let pastaAlvo = nomeOuIdDaPasta;

    if (!pastaAlvo && urlOuCaminho.includes("/")) {
      pastaAlvo = urlOuCaminho.split("/")[0];
    }

    let idPasta = this.pastas[pastaAlvo] || pastaAlvo;

    if (!idPasta) {
      return `DEBUG -> Pasta '${pastaAlvo}' não configurada no Config.gs.`;
    }

    try {
      let pasta = DriveApp.getFolderById(idPasta);
      let arquivos = pasta.getFilesByName(nomeDoArquivo);

      if (arquivos.hasNext()) {
        return arquivos.next().getId();
      } else {
        return `DEBUG -> Arquivo '${nomeDoArquivo}' não encontrado na pasta.`;
      }
    } catch (erro) {
      return `ERRO: ${erro.message}`;
    }
  }
}