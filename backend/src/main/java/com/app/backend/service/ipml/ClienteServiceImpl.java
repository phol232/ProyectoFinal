package com.app.backend.service.ipml;

import com.app.backend.dto.AuthResponse;
import com.app.backend.dto.LoginRequest;
import com.app.backend.dto.RegisterRequest;
import com.app.backend.model.Cliente;
import com.app.backend.repository.ClienteRepository;
import com.app.backend.security.JwtUtil;
import com.app.backend.service.ClienteService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {
    private final ClienteRepository clienteRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse register(RegisterRequest dto) {
        if (clienteRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email ya registrado");
        }
        // Crear y guardar nuevo cliente
        Cliente nuevo = new Cliente();
        nuevo.setNombre(dto.getNombre());
        nuevo.setApellido(dto.getApellido());
        nuevo.setEmail(dto.getEmail());
        nuevo.setPassword(passwordEncoder.encode(dto.getPassword()));
        Cliente guardado = clienteRepo.save(nuevo);

        // Generar token JWT
        String token = jwtUtil.generateToken(guardado.getEmail());
        return new AuthResponse(token, guardado);
    }

    @Override
    public AuthResponse login(LoginRequest dto) {
        // Buscar cliente por email
        Cliente existente = clienteRepo.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado: " + dto.getEmail()));

        // Verificar contraseña
        if (!passwordEncoder.matches(dto.getPassword(), existente.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }

        // Generar token JWT
        String token = jwtUtil.generateToken(existente.getEmail());
        return new AuthResponse(token, existente);
    }
}
