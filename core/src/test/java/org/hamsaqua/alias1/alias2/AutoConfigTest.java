package org.hamsaqua.<alias1>.<alias2>;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.springframework.boot.autoconfigure.AutoConfigurations.*;

class AutoConfigTest {
    private final ApplicationContextRunner baseRunner =
            new ApplicationContextRunner().withConfiguration(of(AutoConfig.class));
}
