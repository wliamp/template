package org.hamsaqua.<alias1>.<alias2>

import io.kotest.core.spec.style.Test
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.testing.*
import kotlin.test.*

@Test
fun testRoot() = testApplication {
    application {
        module()
    }
    val response = client.get("/")
    assertEquals(200, response.status.value)
    assertEquals("Hello World!", response.bodyAsText())
}
