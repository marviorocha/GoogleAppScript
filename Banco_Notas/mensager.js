CONCATENATE(
  "https://wa.me/+55",
  [Telefone do Vendedor],
  "?text=Ol%C3%A1%2C%20",

  ENCODEURL(INDEX(SPLIT([Nome do Vendedor], " "), 1)),
  "%2C%20tudo%20joia%3F%0A%0AEstou%20precisando%20de%20uma%20proposta%20de%20um%20%2A",

  ENCODEURL([Nome de Especificacao de Equipamentos]),
  "%2A%20para%20o%20nosso%20cliente%20%2A",
  ENCODEURL([Serviços].[Nome do Cliente]),
  "%2A%0A%0A",

  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Número de Pavimentos")),
  "%20Paradas%0APercurso%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Percurso")),
  "%0A",

  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Capacidade")),
  "%0ACabine%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Acabamento da Cabina")),
  "%0A",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Panorâmico")),
  "%0APavimento%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Acabamento das Portas")),

  "%0AResgate%20Autom%C3%A1tico%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Resgate Automatico")),
  "%0A%0A",

  "Caixa%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Largura Caixa")),
  "%20x%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Profundidade Caixa")),
  "%20mm%0A",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Entradas")),


  "%0A%C3%9Altima%20Altura%3A%20",
  ENCODEURL(CONCATENATE(LOOKUP([Serviços], "Especificacao", "Cliente", "Última Altura"), " mm")),


  "%0APo%C3%A7o%3A%20",
  ENCODEURL(CONCATENATE(LOOKUP([Serviços], "Especificacao", "Cliente", "Profundidade do Poço"), " mm")),

  "%0ARede%20El%C3%A9trica%20Dispon%C3%ADvel%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Rede Elétrica")),
  IF(
    ISNOTBLANK(LOOKUP([Serviços], "Especificacao", "Cliente", "Observação")),
    CONCATENATE(
      "%0AObserva%C3%A7%C3%A3o%3A%20",
      ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Observação")),
      "%0A%0A"
    ),
    "%0A"
  ),
  "Endere%C3%A7o%20de%20Instala%C3%A7%C3%A3o%3A%20",
  ENCODEURL(LOOKUP([Serviços], "Especificacao", "Cliente", "Endereço")),

  "%0APretens%C3%A3o%20de%20Instala%C3%A7%C3%A3o%3A%20",
  ENCODEURL(
    CONCATENATE(
      SWITCH(
        MONTH(LOOKUP([Serviços], "Especificacao", "Cliente", "Data de Previsão para Instalação do Elevador")),
        1, "Janeiro",
        2, "Fevereiro",
        3, "Março",
        4, "Abril",
        5, "Maio",
        6, "Junho",
        7, "Julho",
        8, "Agosto",
        9, "Setembro",
        10, "Outubro",
        11, "Novembro",
        12, "Dezembro",
        ""
      ),
      "/",
      YEAR(LOOKUP([Serviços], "Especificacao", "Cliente", "Data de Previsão para Instalação do Elevador"))
    )
  ),
  "%0ACPF/CNPJ%3A%20",
  ENCODEURL(IF([Serviços].[Tipo de Documento] = "CPF", [Serviços].[cpf], [Serviços].[cnpj])),
  "%0A%0A",

  "Poderia%20me%20encaminhar%20por%20aqui%2C%20por%20favor%2C%20at%C3%A9%20",

  ENCODEURL(
    SWITCH(
      WEEKDAY(TODAY() + SWITCH(WEEKDAY(TODAY()), 4, 5, 5, 5, 6, 5, 7, 4, 3)),
      1, "domingo",
      2, "segunda-feira",
      3, "terça-feira",
      4, "quarta-feira",
      5, "quinta-feira",
      6, "sexta-feira",
      7, "sábado",
      ""
    )
  ),

  "%20dia%20",

  ENCODEURL(TEXT(TODAY() + SWITCH(WEEKDAY(TODAY()), 4, 5, 5, 5, 6, 5, 7, 4, 3), "DD/MM")),
  "%3F"
)
