package com.app.backend.controller;

import com.app.backend.model.MetodoPago;
import com.app.backend.service.MetodoPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metodos-pago")
@RequiredArgsConstructor
public class MetodoPagoController {
    private final MetodoPagoService metodoPagoService;

    @GetMapping
    public List<MetodoPago> listarMetodosPago() {
        return metodoPagoService.listarTodos();
    }
}
