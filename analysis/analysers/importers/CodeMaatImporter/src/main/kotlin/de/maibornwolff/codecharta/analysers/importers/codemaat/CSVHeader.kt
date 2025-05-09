package de.maibornwolff.codecharta.analysers.importers.codemaat

import de.maibornwolff.codecharta.util.Logger

class CSVHeader(
    header: Array<String?>
) {
    private val headerMap:
        MutableMap<Int, String>

    val columnNumbers:
        Set<Int>
        get() = headerMap.keys

    val pathColumn:
        List<Int>
        get() =
            headerMap.keys.filter { i ->
                headerMap[i].equals("entity", ignoreCase = true) ||
                    headerMap[i].equals("coupled", ignoreCase = true)
            }

    init {
        headerMap = HashMap()
        for (i in header.indices) {
            when {
                header[i].isNullOrEmpty() ->
                    Logger.warn {
                        "Ignoring column number $i (counting from 0) as it has no column name."
                    }

                headerMap.containsValue(header[i]) ->
                    Logger.warn {
                        "Ignoring column number $i (counting from 0) with column name ${header[i]} as it duplicates a previous column."
                    }

                else -> headerMap[i] = header[i]!!
            }
        }

        if (headerMap.isEmpty()) {
            throw IllegalArgumentException("Header is empty.")
        }
    }

    fun getColumnName(i: Int): String {
        return headerMap[i] ?: throw IllegalArgumentException("No " + i + "th column present.")
    }
}
