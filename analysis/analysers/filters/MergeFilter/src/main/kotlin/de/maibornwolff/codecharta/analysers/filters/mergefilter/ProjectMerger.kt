package de.maibornwolff.codecharta.analysers.filters.mergefilter

import de.maibornwolff.codecharta.model.AttributeDescriptor
import de.maibornwolff.codecharta.model.AttributeType
import de.maibornwolff.codecharta.model.BlacklistItem
import de.maibornwolff.codecharta.model.Edge
import de.maibornwolff.codecharta.model.MutableNode
import de.maibornwolff.codecharta.model.Project
import de.maibornwolff.codecharta.model.ProjectBuilder
import de.maibornwolff.codecharta.util.Logger

class ProjectMerger(
    private val projects: List<Project>,
    private val nodeMerger: NodeMergerStrategy
) {
    fun merge(): Project {
        return when {
            areAllAPIVersionsCompatible() ->
                ProjectBuilder(
                    mergeProjectNodes(),
                    mergeEdges(),
                    mergeAttributeTypes(),
                    mergeAttributeDescriptors(),
                    mergeBlacklist()
                ).build()

            else -> throw MergeException("API versions not supported.")
        }
    }

    private fun areAllAPIVersionsCompatible(): Boolean {
        val unsupportedAPIVersions =
            projects.map {
                it.apiVersion
            }.filter {
                !Project.isAPIVersionCompatible(it)
            }

        return unsupportedAPIVersions.isEmpty()
    }

    private fun mergeProjectNodes(): List<MutableNode> {
        val mergedNodes =
            nodeMerger.mergeNodeLists(
                projects.map {
                    listOf(it.rootNode.toMutableNode())
                }
            )
        nodeMerger.logMergeStats()
        return mergedNodes
    }

    private fun mergeEdges(): MutableList<Edge> {
        return if (nodeMerger.javaClass.simpleName == "RecursiveNodeMergerStrategy") {
            getMergedEdges()
        } else {
            getEdgesOfMainAndWarnIfDiscards()
        }
    }

    private fun getEdgesOfMainAndWarnIfDiscards(): MutableList<Edge> {
        projects.forEachIndexed { i, project ->
            if (project.edges.isNotEmpty() && i > 0) {
                Logger.warn {
                    "Edges were not merged. Use recursive strategy to merge edges."
                }
            }
        }
        return projects.first().edges.toMutableList()
    }

    private fun getMergedEdges(): MutableList<Edge> {
        val mergedEdges = mutableListOf<Edge>()
        projects.forEach {
            it.edges.forEach {
                mergedEdges.add(it)
            }
        }
        return mergedEdges.distinctBy {
            listOf(it.fromNodeName, it.toNodeName)
        }.toMutableList()
    }

    private fun mergeAttributeTypes(): MutableMap<String, MutableMap<String, AttributeType>> {
        val mergedAttributeTypes: MutableMap<String, MutableMap<String, AttributeType>> = mutableMapOf()

        projects.forEach {
            it.attributeTypes.forEach { attributeTypes ->
                val key: String = attributeTypes.key
                val mergedAttributeType = mergedAttributeTypes[key]
                if (mergedAttributeType != null) {
                    attributeTypes.value.forEach { attribute ->
                        if (!mergedAttributeType.containsKey(attribute.key)) {
                            mergedAttributeType[attribute.key] = attribute.value
                        }
                    }
                } else {
                    mergedAttributeTypes[key] = attributeTypes.value
                }
            }
        }
        return mergedAttributeTypes
    }

    private fun mergeAttributeDescriptors(): MutableMap<String, AttributeDescriptor> {
        val mergedAttributeDescriptors: MutableMap<String, AttributeDescriptor> = mutableMapOf()
        projects.forEach {
            mergedAttributeDescriptors.putAll(it.attributeDescriptors)
        }
        return mergedAttributeDescriptors
    }

    private fun mergeBlacklist(): MutableList<BlacklistItem> {
        val mergedBlacklist = mutableListOf<BlacklistItem>()
        projects.forEach { project ->
            project.blacklist.forEach {
                mergedBlacklist.add(it)
            }
        }
        return mergedBlacklist.distinctBy {
            it.toString()
        }.toMutableList()
    }
}
