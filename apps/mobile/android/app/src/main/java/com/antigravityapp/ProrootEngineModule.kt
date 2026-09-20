package com.antigravityapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.BufferedReader
import java.io.InputStreamReader

class ProrootEngineModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ProrootEngineModule"

    private fun sendEvent(eventName: String, data: String, stream: String = "stdout") {
        val params = Arguments.createMap().apply {
            putString("stream", stream)
            putString("data", data)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun runLinuxCommand(bashCommand: String, promise: Promise) {
        Thread {
            try {
                val appBaseDir = reactApplicationContext.filesDir.absolutePath
                val guestRootfs = "$appBaseDir/ubuntu-rootfs"
                val nativeLibDir = reactApplicationContext.applicationInfo.nativeLibraryDir

                val processBuilder = ProcessBuilder()
                val rootDir = File(guestRootfs)
                if (!rootDir.exists()) {
                    rootDir.mkdirs()
                }
                processBuilder.directory(rootDir)

                val env = processBuilder.environment()
                env["PROROOT_TMP_DIR"] = appBaseDir
                env["PROROOT_VERBOSE"] = "1"
                env["HOME"] = "/root"
                env["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
                env["TERM"] = "xterm-256color"

                val prorootBinary = File(nativeLibDir, "libproroot.so")
                val commandList = if (prorootBinary.exists()) {
                    listOf(
                        prorootBinary.absolutePath,
                        "-r", guestRootfs,
                        "-0",
                        "--link2symlink",
                        "-w", "/root",
                        "/bin/sh", "-c", bashCommand
                    )
                } else {
                    // Fallback to direct process builder inside guest rootfs directory
                    listOf("/bin/sh", "-c", bashCommand)
                }

                processBuilder.command(commandList)

                val process = processBuilder.start()
                val stdoutReader = BufferedReader(InputStreamReader(process.inputStream))
                val stderrReader = BufferedReader(InputStreamReader(process.errorStream))
                val terminalOutput = StringBuilder()
                var line: String?

                while (stdoutReader.readLine().also { line = it } != null) {
                    terminalOutput.append(line).append("\n")
                    line?.let { sendEvent("onProrootOutput", it, "stdout") }
                }
                while (stderrReader.readLine().also { line = it } != null) {
                    terminalOutput.append("[Linux Err] ").append(line).append("\n")
                    line?.let { sendEvent("onProrootOutput", it, "stderr") }
                }

                val exitCode = process.waitFor()
                if (exitCode == 0) {
                    promise.resolve(terminalOutput.toString())
                } else {
                    promise.resolve(terminalOutput.toString())
                }
            } catch (e: Exception) {
                promise.reject("SANDBOX_EXECUTION_ERROR", e.message, e)
            }
        }.start()
    }
}
