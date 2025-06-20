package com.app.backend.service.ipml;

import com.app.backend.dto.VentaRequest;
import com.app.backend.dto.DetalleVentaRequest;
import com.app.backend.model.*;
import com.app.backend.repository.*;
import com.app.backend.service.VentaService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaServiceImpl implements VentaService {

    private final VentaRepository ventaRepository;
    private final ClienteRepository clienteRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional
    public Venta crearVenta(VentaRequest request) {
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
        MetodoPago metodoPago = metodoPagoRepository.findById(request.getMetodoPagoId())
                .orElseThrow(() -> new EntityNotFoundException("Método de pago no encontrado"));

        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setMetodoPago(metodoPago);
        venta.setFecha(LocalDateTime.now());

        venta.setTipoPago(request.getTipoPago());
        venta.setNumeroComprobante(request.getNumeroComprobante());
        venta.setDescuento(request.getDescuento());
        venta.setEstado(request.getEstado());
        venta.setFormaEntrega(request.getFormaEntrega());

        // Mapear items a detalles de venta
        List<DetalleVenta> detalles = request.getItems().stream().map(item -> {
            DetalleVenta detalle = new DetalleVenta();
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado: " + item.getProductoId()));
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(item.getPrecioUnitario());
            detalle.setDescuentoItem(item.getDescuentoItem());
            detalle.setTipoPresentacion(item.getTipoPresentacion());
            detalle.setVenta(venta);
            return detalle;
        }).collect(Collectors.toList());

        venta.setDetalles(detalles);

        BigDecimal subtotalBruto = detalles.stream()
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal descuento = venta.getDescuento() != null ? venta.getDescuento() : BigDecimal.ZERO;
        BigDecimal subtotalNeto = subtotalBruto.subtract(descuento);
        if (subtotalNeto.compareTo(BigDecimal.ZERO) < 0) subtotalNeto = BigDecimal.ZERO;
        subtotalNeto = subtotalNeto.setScale(2, RoundingMode.HALF_UP);

        BigDecimal igv = subtotalNeto.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);

        BigDecimal total = subtotalNeto.add(igv).setScale(2, RoundingMode.HALF_UP);

        venta.setSubtotal(subtotalNeto);
        venta.setIgv(igv);
        venta.setTotal(total);

        return ventaRepository.save(venta);
    }
}
