package com.openmausbot.companion.expo

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.ConcurrentHashMap

class ProrootEngineModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ProrootEngineModule"

    private val runningProcesses = ConcurrentHashMap<String, Process>()
    private var deviceBridge: DeviceBridgeServer? = null

    init {
        try {
            deviceBridge = DeviceBridgeServer(reactContext)
            deviceBridge?.start()
        } catch (_: Throwable) {
        }
    }

    private fun sendEvent(eventName: String, data: String, stream: String = "stdout") {
        val params = Arguments.createMap().apply {
            putString("stream", stream)
            putString("data", data)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun getGuestRootfsDir(): File {
        val appBaseDir = reactApplicationContext.filesDir
        val linuxDir = File(appBaseDir, "linux")
        val rootfsDir = File(linuxDir, "ubuntu")
        if (!rootfsDir.exists()) {
            rootfsDir.mkdirs()
        }
        return rootfsDir
    }

    private fun getTmpDir(): File {
        val tmp = File(reactApplicationContext.filesDir, "linux/tmp")
        if (!tmp.exists()) tmp.mkdirs()
        return tmp
    }

    private fun getShmDir(): File {
        val shm = File(reactApplicationContext.cacheDir, "shm")
        if (!shm.exists()) shm.mkdirs()
        return shm
    }

    @ReactMethod
    fun getEnvironmentStatus(promise: Promise) {
        try {
            val nativeLibDir = File(reactApplicationContext.applicationInfo.nativeLibraryDir)
            val proroot = File(nativeLibDir, "libproroot.so")
            val proot = File(nativeLibDir, "libproot.so")
            val rootfs = getGuestRootfsDir()

            val map: WritableMap = Arguments.createMap().apply {
                putBoolean("hasProroot", proroot.exists())
                putBoolean("hasProot", proot.exists())
                putBoolean("isRootfsExtracted", rootfs.exists() && rootfs.list()?.isNotEmpty() == true)
                putString("rootfsPath", rootfs.absolutePath)
                putString("nativeLibDir", nativeLibDir.absolutePath)
                putBoolean("isDeviceBridgeRunning", deviceBridge != null)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STATUS_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startHarnessService(promise: Promise) {
        try {
            HarnessKeepAliveService.start(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HARNESS_START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopHarnessService(promise: Promise) {
        try {
            HarnessKeepAliveService.stop(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HARNESS_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun runLinuxCommand(bashCommand: String, promise: Promise) {
        Thread {
            try {
                val rootfs = getGuestRootfsDir()
                val nativeLibDir = File(reactApplicationContext.applicationInfo.nativeLibraryDir)
                val tmpDir = getTmpDir()
                val shmDir = getShmDir()

                val prorootBinary = File(nativeLibDir, "libproroot.so")
                val prootBinary = File(nativeLibDir, "libproot.so")

                val processBuilder = ProcessBuilder()
                processBuilder.directory(rootfs)

                val env = processBuilder.environment()
                env["HOME"] = "/root"
                env["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
                env["TERM"] = "xterm-256color"
                env["LANG"] = "C.UTF-8"

                val commandList = ArrayList<String>()

                if (prorootBinary.exists() && File(nativeLibDir, "libproroot-runtime.so").exists()) {
                    // CoderRedLab Proroot engine (zero ptrace overhead)
                    env["PROROOT_TMP_DIR"] = tmpDir.absolutePath
                    env["PROROOT_LIB_PATH"] = File(nativeLibDir, "libproroot-runtime.so").absolutePath
                    env["PROROOT_LINKER_PATH"] = File(nativeLibDir, "libproroot-linker.so").absolutePath
                    env["PROROOT_STUB_LOADER"] = File(nativeLibDir, "libproroot-stub-loader.so").absolutePath

                    commandList.add(prorootBinary.absolutePath)
                    commandList.add("-r")
                    commandList.add(rootfs.absolutePath)
                    commandList.add("-0")
                    commandList.add("-w")
                    commandList.add("/root")

                    val standardBinds = arrayOf("/dev", "/proc", "/sys", "/system", "/sdcard")
                    for (b in standardBinds) {
                        if (File(b).exists()) {
                            commandList.add("-b")
                            commandList.add("$b:$b")
                        }
                    }
                    commandList.add("-b")
                    commandList.add("${shmDir.absolutePath}:/dev/shm")
                    commandList.add("--link2symlink")
                    commandList.add("/bin/sh")
                    commandList.add("-c")
                    commandList.add(bashCommand)
                } else if (prootBinary.exists()) {
                    // Standard Termux proot fallback
                    val prootLoader = File(nativeLibDir, "libprootloader.so")
                    if (prootLoader.exists()) {
                        env["PROOT_LOADER"] = prootLoader.absolutePath
                    }
                    env["PROOT_TMP_DIR"] = tmpDir.absolutePath

                    commandList.add(prootBinary.absolutePath)
                    commandList.add("--link2symlink")
                    commandList.add("-L")
                    commandList.add("--kill-on-exit")
                    commandList.add("-0")
                    commandList.add("--rootfs=${rootfs.absolutePath}")
                    commandList.add("--cwd=/root")

                    val standardBinds = arrayOf("/dev", "/proc", "/sys", "/system", "/sdcard")
                    for (b in standardBinds) {
                        if (File(b).exists()) {
                            commandList.add("-b")
                            commandList.add("$b:$b")
                        }
                    }
                    commandList.add("/bin/sh")
                    commandList.add("-c")
                    commandList.add(bashCommand)
                } else {
                    // Host fallback
                    commandList.add("/bin/sh")
                    commandList.add("-c")
                    commandList.add(bashCommand)
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
                    terminalOutput.append(line).append("\n")
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
