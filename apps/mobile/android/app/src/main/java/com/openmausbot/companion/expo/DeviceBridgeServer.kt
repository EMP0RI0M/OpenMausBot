package com.openmausbot.companion.expo

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.widget.Toast
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import org.json.JSONObject

/**
 * On-device local RPC server on 127.0.0.1:3090 (ported from DSHA DeviceBridgeService).
 * Allows agents running inside the PRoot / Proroot Linux container (such as Google Antigravity agy)
 * to call phone hardware capabilities:
 *  - GET /device/battery -> Battery level & charging status
 *  - POST /device/haptic -> Trigger device vibration
 *  - POST /device/clipboard -> Get or set clipboard content
 *  - POST /device/toast -> Show toast notification
 */
class DeviceBridgeServer(private val context: Context, private val port: Int = 3090) {

    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private var workerThread: Thread? = null

    fun start() {
        if (isRunning) return
        isRunning = true

        workerThread = Thread {
            try {
                serverSocket = ServerSocket().apply {
                    reuseAddress = true
                    bind(InetSocketAddress("127.0.0.1", port))
                }

                while (isRunning && serverSocket?.isClosed == false) {
                    val client = serverSocket?.accept() ?: break
                    Thread { handleClient(client) }.start()
                }
            } catch (_: Throwable) {
            }
        }.apply {
            isDaemon = true
            start()
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (_: Throwable) {
        }
        serverSocket = null
    }

    private fun handleClient(socket: Socket) {
        try {
            val input = BufferedReader(InputStreamReader(socket.getInputStream()))
            val output = socket.getOutputStream()

            val requestLine = input.readLine() ?: return
            val parts = requestLine.split(" ")
            if (parts.size < 2) return

            val method = parts[0]
            val path = parts[1]

            var contentLength = 0
            var line: String?
            while (input.readLine().also { line = it } != null) {
                if (line.isNullOrEmpty()) break
                if (line!!.startsWith("Content-Length:", ignoreCase = true)) {
                    contentLength = line!!.substring(15).trim().toIntOrNull() ?: 0
                }
            }

            var body = ""
            if (contentLength > 0) {
                val chars = CharArray(contentLength)
                var read = 0
                while (read < contentLength) {
                    val r = input.read(chars, read, contentLength - read)
                    if (r == -1) break
                    read += r
                }
                body = String(chars, 0, read)
            }

            val responseJson = handleRoute(method, path, body)
            val bytes = responseJson.toString().toByteArray(Charsets.UTF_8)

            val header = "HTTP/1.1 200 OK\r\n" +
                    "Content-Type: application/json\r\n" +
                    "Content-Length: ${bytes.size}\r\n" +
                    "Connection: close\r\n\r\n"

            output.write(header.toByteArray(Charsets.UTF_8))
            output.write(bytes)
            output.flush()
        } catch (_: Throwable) {
        } finally {
            try { socket.close() } catch (_: Throwable) {}
        }
    }

    private fun handleRoute(method: String, path: String, body: String): JSONObject {
        val result = JSONObject()
        try {
            when {
                path == "/device/battery" && method == "GET" -> {
                    val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
                    val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
                    val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
                    val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
                    val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
                    val pct = if (level >= 0 && scale > 0) (level * 100) / scale else -1

                    result.put("status", "ok")
                    result.put("batteryLevel", pct)
                    result.put("isCharging", isCharging)
                }

                path == "/device/haptic" && method == "POST" -> {
                    val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                        val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                        manager?.defaultVibrator
                    } else {
                        @Suppress("DEPRECATION")
                        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    }

                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(50)
                    }
                    result.put("status", "ok")
                }

                path == "/device/toast" && method == "POST" -> {
                    val req = if (body.isNotEmpty()) JSONObject(body) else JSONObject()
                    val text = req.optString("text", "OpenMausBot Notification")
                    android.os.Handler(context.mainLooper).post {
                        Toast.makeText(context, text, Toast.LENGTH_SHORT).show()
                    }
                    result.put("status", "ok")
                }

                path == "/device/clipboard" -> {
                    val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                    if (method == "POST") {
                        val req = if (body.isNotEmpty()) JSONObject(body) else JSONObject()
                        val text = req.optString("text", "")
                        android.os.Handler(context.mainLooper).post {
                            cm?.setPrimaryClip(ClipData.newPlainText("OpenMausBot", text))
                        }
                        result.put("status", "ok")
                    } else {
                        val item = cm?.primaryClip?.getItemAt(0)
                        result.put("status", "ok")
                        result.put("text", item?.text?.toString() ?: "")
                    }
                }

                else -> {
                    result.put("status", "ok")
                    result.put("service", "OpenMausBot-DeviceBridge")
                    result.put("version", "1.0.0")
                }
            }
        } catch (e: Exception) {
            result.put("status", "error")
            result.put("message", e.message ?: "Internal error")
        }
        return result
    }
}
