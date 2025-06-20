package com.app.backend.service;

import com.app.backend.model.Producto;
import java.util.List;

public interface ProductoService {
    List<Producto> listarTodos();
    List<Producto> listarPorCategoria(Integer categoriaId);
}
