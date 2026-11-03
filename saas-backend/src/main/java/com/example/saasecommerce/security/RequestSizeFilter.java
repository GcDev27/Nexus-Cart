package com.example.saasecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Recusa corpos de requisição grandes demais (HTTP 413). Checa o Content-Length e também conta
 * os bytes lidos, para pegar envios "chunked" que não informam o tamanho.
 * O limite padrão comporta uma imagem de 3 MB em base64 com folga.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RequestSizeFilter extends OncePerRequestFilter {

    private final long maxBytes;

    public RequestSizeFilter(@Value("${app.max-request-bytes:5242880}") long maxBytes) {
        this.maxBytes = maxBytes;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBytes) {
            reject(response);
            return;
        }
        try {
            chain.doFilter(new LimitedRequest(request, maxBytes), response);
        } catch (PayloadTooLargeException e) {
            if (!response.isCommitted()) reject(response);
        }
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(413);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":413,\"error\":\"Envio grande demais. Use uma imagem menor.\"}");
    }

    public static class PayloadTooLargeException extends IOException {
        public PayloadTooLargeException() {
            super("Corpo da requisição acima do limite");
        }
    }

    private static class LimitedRequest extends HttpServletRequestWrapper {
        private final long maxBytes;
        private ServletInputStream stream;

        LimitedRequest(HttpServletRequest request, long maxBytes) {
            super(request);
            this.maxBytes = maxBytes;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (stream == null) {
                ServletInputStream original = super.getInputStream();
                stream = new ServletInputStream() {
                    private long count = 0;

                    @Override
                    public int read() throws IOException {
                        int b = original.read();
                        if (b != -1 && ++count > maxBytes) throw new PayloadTooLargeException();
                        return b;
                    }

                    @Override
                    public int read(byte[] buf, int off, int len) throws IOException {
                        int n = original.read(buf, off, len);
                        if (n > 0 && (count += n) > maxBytes) throw new PayloadTooLargeException();
                        return n;
                    }

                    @Override public boolean isFinished() { return original.isFinished(); }
                    @Override public boolean isReady() { return original.isReady(); }
                    @Override public void setReadListener(ReadListener listener) { original.setReadListener(listener); }
                };
            }
            return stream;
        }
    }
}
