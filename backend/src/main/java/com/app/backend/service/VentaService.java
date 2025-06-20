package com.app.backend.service;

import com.app.backend.dto.VentaRequest;
import com.app.backend.model.Venta;

public interface VentaService {
    Venta crearVenta(VentaRequest request);
}
