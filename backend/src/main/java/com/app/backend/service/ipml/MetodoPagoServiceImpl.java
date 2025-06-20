package com.app.backend.service.ipml;

import com.app.backend.model.MetodoPago;
import com.app.backend.repository.MetodoPagoRepository;
import com.app.backend.service.MetodoPagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetodoPagoServiceImpl implements MetodoPagoService {
    private final MetodoPagoRepository metodoPagoRepository;

    @Override
    public List<MetodoPago> listarTodos() {
        return metodoPagoRepository.findAll();
    }
}
