const LinkModule = {
  Registry: {
    PROPOSTA: { type: "file", label: "Proposta", color: "#ffffff", buttonImageId: "1sC_U_zHeFkoKrcS9eO6bfzrR_lSPh5WJ" },
    CATALOGO: { type: "folder", label: "Catálogo", color: "#4d4d4d", buttonImageId: "1AgqIhrpj516IddIRyyhTJmT9kSPmTn9s" },
    VIDEO: { type: "file", label: "Vídeo", color: "#D33427" },
    MANUAL: { type: "file", label: "Manual Técnico", color: "#F57C00" },
    DRIVE: { type: "file", label: "Arquivo", color: "#1F8FE6" }
  },

  VisualDefaults: { fontFamily: "Ubuntu", fontSize: 10, color: "#FFFFFF" },

  detectType: function(key) {
    // Normaliza a string para remover acentos e facilitar a busca
    const k = String(key).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (k.includes("PROPOSTA")) return "PROPOSTA";
    if (k.includes("CATALOGO")) return "CATALOGO";
    if (k.includes("VIDEO")) return "VIDEO";
    if (k.includes("MANUAL")) return "MANUAL";
    return "DRIVE";
  },

  processAll: function(dadosProposta) {
    const links = {};
    for (const [key, value] of Object.entries(dadosProposta)) {
      if (!value || typeof value !== "string" || !/link/i.test(key)) continue;

      const extracted = DriveManager.extractId(value);
      if (!extracted.id) continue;

      const linkType = this.detectType(key);
      const config = this.Registry[linkType] || this.Registry.DRIVE;
      const resourceType = extracted.type || config.type;

      links[`{{${key.toUpperCase()}}}`] = {
        url_do_link: DriveManager.buildUrl(extracted.id, resourceType),
        config: config,
        id_da_imagem_botao: config.buttonImageId
      };
    }
    return links;
  }
};
