package de.maibornwolff.codecharta.analysers.importers.sonar.model

data class Component(
    val id: String,
    val key: String?,
    val name: String?,
    val path: String?,
    val qualifier: Qualifier?,
    val measures: MutableList<Measure>? = emptyList<Measure>().toMutableList()
)
