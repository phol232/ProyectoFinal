package com.app.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DetalleVentaRequest {
    private Integer productoId;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal descuentoItem;
    private String tipoPresentacion;
}
