package com.app.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class VentaRequest {
    private Integer clienteId;
    private Integer metodoPagoId;
    private String tipoPago;
    private String numeroComprobante;
    private BigDecimal descuento;
    private String estado;
    private String formaEntrega;
    private List<DetalleVentaRequest> items;
}
