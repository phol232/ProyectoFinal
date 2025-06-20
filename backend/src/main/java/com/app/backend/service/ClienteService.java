package com.app.backend.service;

import com.app.backend.dto.AuthResponse;
import com.app.backend.dto.LoginRequest;
import com.app.backend.dto.RegisterRequest;

public interface ClienteService {
    AuthResponse register(RegisterRequest dto);
    AuthResponse login(LoginRequest dto);
}