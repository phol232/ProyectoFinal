package com.app.backend.controller;

import com.app.backend.dto.VentaRequest;
import com.app.backend.model.Venta;
import com.app.backend.service.VentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;

    @PostMapping
    public Venta crearVenta(@RequestBody VentaRequest request) {
        return ventaService.crearVenta(request);
    }
}
