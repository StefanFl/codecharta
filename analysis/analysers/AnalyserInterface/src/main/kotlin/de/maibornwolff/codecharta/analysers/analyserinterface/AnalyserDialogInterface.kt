package de.maibornwolff.codecharta.analysers.analyserinterface

import com.varabyte.kotter.foundation.session
import com.varabyte.kotter.runtime.Session

fun interface AnalyserDialogInterface {
    fun collectAnalyserArgs(session: Session): List<String>
}

fun <T> runInTerminalSession(block: Session.() -> T): T {
    var returnValue: T? = null
    session {
        returnValue = block()
    }
    return returnValue ?: throw IllegalStateException("Session did not return a value.")
}
