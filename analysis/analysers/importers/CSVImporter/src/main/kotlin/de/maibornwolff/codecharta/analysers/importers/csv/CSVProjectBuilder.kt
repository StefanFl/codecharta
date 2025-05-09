package de.maibornwolff.codecharta.analysers.importers.csv

import com.univocity.parsers.csv.CsvParser
import com.univocity.parsers.csv.CsvParserSettings
import de.maibornwolff.codecharta.model.AttributeDescriptor
import de.maibornwolff.codecharta.model.Project
import de.maibornwolff.codecharta.model.ProjectBuilder
import de.maibornwolff.codecharta.translator.MetricNameTranslator
import de.maibornwolff.codecharta.util.Logger
import java.io.InputStream
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class CSVProjectBuilder(
    private val pathSeparator: Char,
    private val csvDelimiter: Char,
    private val pathColumnName: String = "path",
    private val metricNameTranslator: MetricNameTranslator = MetricNameTranslator.TRIVIAL,
    private val attributeDescriptors: Map<String, AttributeDescriptor> = mapOf()
) {
    private val includeRows: (Array<String>) -> Boolean = { true }
    private val projectBuilder = ProjectBuilder().withMetricTranslator(metricNameTranslator)

    fun parseCSVStream(inStream: InputStream): ProjectBuilder {
        val parser = createParser(inStream)
        val header = CSVHeader(parser.parseNext(), pathColumnName = pathColumnName)
        parseContent(parser, header)
        parser.stopParsing()
        return projectBuilder
    }

    fun build(cleanAttributeDescriptors: Boolean = false): Project {
        return projectBuilder.addAttributeDescriptions(this.attributeDescriptors).build(cleanAttributeDescriptors)
    }

    private fun parseContent(parser: CsvParser, header: CSVHeader) {
        var row = parser.parseNext()
        while (row != null) {
            if (includeRows(row)) {
                insertRowInProject(row, header)
            }
            row = parser.parseNext()
        }
    }

    private fun createParser(inStream: InputStream): CsvParser {
        val parserSettings = CsvParserSettings()
        parserSettings.format.delimiter = csvDelimiter
        parserSettings.isLineSeparatorDetectionEnabled = true

        val parser = CsvParser(parserSettings)
        parser.beginParsing(InputStreamReader(inStream, StandardCharsets.UTF_8))
        return parser
    }

    private fun insertRowInProject(rawRow: Array<String?>, header: CSVHeader) {
        try {
            val row = CSVRow(rawRow, header, pathSeparator)
            projectBuilder.insertByPath(row.pathInTree(), row.asNode())
        } catch (e: IllegalArgumentException) {
            Logger.warn { "Ignoring row ${rawRow.contentToString()} due to: ${e.message}" }
        }
    }
}
