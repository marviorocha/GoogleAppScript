CONCATENATE(
  "https://wa.me/+55",
  [Telefone do Vendedor],
  "?text=",
  ENCODEURL(
    CONCATENATE(
      "Olá ", INDEX(SPLIT([Nome do Vendedor], " "), 1), "! ",
      
      IF(
        COUNT(
          UNIQUE(
            SELECT(
              PROPOSTAS[Nome do Cliente e da Obra],
              AND(
                [Nome do Vendedor] = [_THISROW].[Nome do Vendedor],
                IN([Status], LIST("Proposta Solicitada", "Selecionado para Cotação"))
              )
            )
          )
        ) = 1,
        "Conseguiu emitir a proposta do cliente?
• ",
        "Conseguiu emitir as propostas dos clientes?
• "
      ),

      SUBSTITUTE(
        SUBSTITUTE(
          TEXT(
            UNIQUE(
              SELECT(
                PROPOSTAS[Nome do Cliente e da Obra],
                AND(
                  [Nome do Vendedor] = [_THISROW].[Nome do Vendedor],
                  IN([Status], LIST("Proposta Solicitada", "Selecionado para Cotação"))
                )
              )
            )
          ),
          " , ",
          "
• "
        ),
        ", ",
        "
• "
      )
    )
  )
)
