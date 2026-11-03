package com.example.saasecommerce;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SaasEcommerceApplicationTests extends IntegrationTest {

    @Test
    void sobeComAsMigrationsAplicadas() {
        Integer applied = jdbc.queryForObject(
                "select count(*) from flyway_schema_history where success", Integer.class);
        assertThat(applied).isGreaterThanOrEqualTo(2);
    }
}
