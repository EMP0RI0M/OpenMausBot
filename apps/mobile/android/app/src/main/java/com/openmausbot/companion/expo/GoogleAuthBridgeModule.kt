package com.openmausbot.companion.expo

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.File

class GoogleAuthBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "GoogleAuthBridgeModule"

    @ReactMethod
    fun injectAntigravityCredentials(accessToken: String, refreshToken: String, promise: Promise) {
        Thread {
            try {
                val appBaseDir = reactApplicationContext.filesDir.absolutePath
                val agyConfigDir = File("$appBaseDir/ubuntu-rootfs/root/.config/antigravity")
                
                if (!agyConfigDir.exists()) {
                    agyConfigDir.mkdirs()
                }

                val credentialsJson = """
                {
                    "token_type": "Bearer",
                    "access_token": "$accessToken",
                    "refresh_token": "$refreshToken",
                    "expiry": ${System.currentTimeMillis() + 3600 * 1000}
                }
                """.trimIndent()

                File(agyConfigDir, "credentials.json").writeText(credentialsJson)
                promise.resolve("CREDENTIALS_INJECTED_SUCCESSFULLY")
            } catch (e: Exception) {
                promise.reject("AUTH_INJECTION_FAILED", e.message)
            }
        }.start()
    }
}
