package com.example.saasecommerce.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Properties;

/** Envio de e-mail por SMTP. Sem MAIL_HOST (desenvolvimento), o conteúdo vai para o log. */
@Service
@Slf4j
public class MailService {

    private final JavaMailSenderImpl sender;
    private final String from;

    public MailService(
            @Value("${app.mail.host:}") String host,
            @Value("${app.mail.port:587}") int port,
            @Value("${app.mail.username:}") String username,
            @Value("${app.mail.password:}") String password,
            @Value("${app.mail.from}") String from) {
        this.from = from;
        if (host == null || host.isBlank()) {
            this.sender = null;
            return;
        }
        JavaMailSenderImpl s = new JavaMailSenderImpl();
        s.setHost(host);
        s.setPort(port);
        s.setUsername(username);
        s.setPassword(password);
        Properties props = s.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(!username.isBlank()));
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        this.sender = s;
    }

    public void send(String to, String subject, String text) {
        if (sender == null) {
            log.info("E-mail não configurado (MAIL_HOST). Para {}: {}\n{}", to, subject, text);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(new InternetAddress(from));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, false);
            sender.send(message);
        } catch (Exception e) {
            // Não revela ao usuário se o envio falhou (evita descobrir quais e-mails existem)
            log.error("Falha ao enviar e-mail para {}: {}", to, e.getMessage());
        }
    }
}
