import { NodeMetricData, CcState, CodeMapNode, Node, NameDataPair } from "../../../codeCharta.model"
import {
    METRIC_DATA,
    TEST_FILE_WITH_PATHS,
    VALID_NODE_WITH_PATH,
    VALID_EDGES,
    STATE,
    FIXED_FOLDERS_NESTED_MIXED_WITH_DYNAMIC_ONES_MAP_FILE,
    FIXED_FOLDERS_NESTED_MIXED_WITH_A_FILE_MAP_FILE,
    VALID_NODE_WITH_PATH_AND_DELTAS,
    VALID_BIG_NODE_WITH_DELTAS
} from "../../dataMocks"
import { klona } from "klona"
import { NodeDecorator } from "../../nodeDecorator"
import { fileWithFixedFolders } from "../../../resources/fixed-folders/fixed-folders-example"
import { getCCFile } from "../../fileHelper"
import * as SquarifiedLayoutGenerator from "./treeMapGenerator"

describe("treeMapGenerator", () => {
    let map: CodeMapNode
    let state: CcState
    let metricData: NodeMetricData[]
    let codeMapNode: CodeMapNode
    let isDeltaState

    beforeEach(() => {
        map = klona(TEST_FILE_WITH_PATHS.map)
        state = klona(STATE)
        codeMapNode = klona(VALID_NODE_WITH_PATH)
        metricData = klona(METRIC_DATA)
        isDeltaState = false
        state.dynamicSettings.focusedNodePath = []
    })

    describe("create Treemap nodes", () => {
        it("create map with fixed root children which include dynamic folders on the one hand and fixed ones at the other", () => {
            map = klona(FIXED_FOLDERS_NESTED_MIXED_WITH_DYNAMIC_ONES_MAP_FILE.map)

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            const fixedResourcesFolder = {
                x0: nodes[7].x0,
                y0: nodes[7].y0,
                width: nodes[7].width,
                length: nodes[7].length,
                textFiles: {
                    x0: nodes[8].x0,
                    y0: nodes[8].y0,
                    width: nodes[8].width,
                    length: nodes[8].length
                },
                tables: {
                    x0: nodes[10].x0,
                    y0: nodes[10].y0,
                    width: nodes[10].width,
                    length: nodes[10].length
                }
            }

            expect(fixedResourcesFolder.textFiles.x0).toBeGreaterThanOrEqual(fixedResourcesFolder.x0)
            expect(fixedResourcesFolder.textFiles.y0).toBeGreaterThanOrEqual(fixedResourcesFolder.y0)
            expect(fixedResourcesFolder.tables.x0).toBeGreaterThanOrEqual(fixedResourcesFolder.x0)
            expect(fixedResourcesFolder.tables.y0).toBeGreaterThanOrEqual(fixedResourcesFolder.y0)

            expect(fixedResourcesFolder.textFiles.width).toBeLessThanOrEqual(fixedResourcesFolder.width)
            expect(fixedResourcesFolder.textFiles.length).toBeLessThanOrEqual(fixedResourcesFolder.length)
            expect(fixedResourcesFolder.tables.width).toBeLessThanOrEqual(fixedResourcesFolder.width)
            expect(fixedResourcesFolder.tables.length).toBeLessThanOrEqual(fixedResourcesFolder.length)

            expect(nodes).toMatchSnapshot()
        })

        it("create map with fixed root children which include fixed folders on the one hand and a file at the other", () => {
            map = klona(FIXED_FOLDERS_NESTED_MIXED_WITH_A_FILE_MAP_FILE.map)

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes).toMatchSnapshot()
        })

        it("only root node", () => {
            map.children = []

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes).toMatchSnapshot()
        })

        it("root node with two direct children", () => {
            map.children[1].children = []

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes).toMatchSnapshot()
        })

        it("root node with two direct children and some grand children in delta mode", () => {
            const deltaMap = klona(VALID_NODE_WITH_PATH_AND_DELTAS)

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(deltaMap, state, metricData, true)

            expect(nodes).toMatchSnapshot()
        })

        it("root node with set fileCount, delta and attribute values from children", () => {
            // Be aware, that this might need to be updated if the edge behavior changes
            const deltaMap = klona(VALID_BIG_NODE_WITH_DELTAS)

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(deltaMap, state, metricData, true)

            expect(nodes).toMatchSnapshot()
        })

        it("root node with two direct children and some grand children", () => {
            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes).toMatchSnapshot()
        })

        it("should build the tree map with valid coordinates using the fixed folder structure", () => {
            const file: NameDataPair = { fileName: "someFile", fileSize: 42, content: fileWithFixedFolders }
            const ccFile = getCCFile(file)
            NodeDecorator.decorateMapWithPathAttribute(ccFile)
            const nodes = SquarifiedLayoutGenerator.createTreemapNodes(ccFile.map, state, metricData, isDeltaState)

            expect(nodes).toMatchSnapshot()
        })

        it("should disable floor labels if option is toggled and change size", () => {
            const nodesWithFloorLabels: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)
            state.appSettings.enableFloorLabels = false
            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            for (const [index, nodesWithFloorLabel] of nodesWithFloorLabels.entries()) {
                expect(nodesWithFloorLabel.name).toEqual(nodes[index].name)
                expect(nodesWithFloorLabel.width).not.toEqual(nodes[index].width)
            }
            expect(nodes).toMatchSnapshot()
        })
    })

    describe("CodeMap value calculation", () => {
        it("if a node was deleted from previous file it should still be visible and have positive width/length", () => {
            // given map with one node deleted in comparison to previous file
            map.attributes = { myArea: 22, myHeight: 12 }
            map.deltas = {}
            map.children[0].attributes = { myArea: 44, myHeight: 63 }
            map.children[0].deltas = { myArea: 20, myHeight: 0 }
            map.children[1].attributes = { myArea: 0, myHeight: 0 }
            map.children[1].deltas = { myArea: -40, myHeight: -80 }

            state.dynamicSettings.areaMetric = "myArea"
            state.dynamicSettings.heightMetric = "myHeight"
            metricData = [
                { name: "myArea", maxValue: 42, minValue: 1, values: [1, 42] },
                { name: "myHeight", maxValue: 99, minValue: 1, values: [1, 99] }
            ]

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes[2].name).toBe("Parent Leaf")
            expect(nodes[2].width).toBeGreaterThan(0)
            expect(nodes[2].length).toBeGreaterThan(0)
        })

        it("attribute exists, no children", () => {
            map.children = []
            map.attributes = { a: 100 }

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes[0].attributes["a"]).toBe(100)
        })

        it("attribute does not exists, no children", () => {
            map.children = []

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes[0].attributes["b"]).toBe(undefined)
        })

        it("attribute do not exists, multiple children with non existent attributes", () => {
            state.dynamicSettings.heightMetric = "b"
            state.dynamicSettings.areaMetric = "b"
            metricData = [
                { name: "a", maxValue: 42, minValue: 1, values: [1, 42] },
                { name: "b", maxValue: 99, minValue: 1, values: [1, 99] }
            ]

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes[0].attributes["b"]).toBe(undefined)
        })

        it("area should be zero if metric does not exist", () => {
            state.dynamicSettings.areaMetric = "unknown"
            state.dynamicSettings.heightMetric = "unknown"
            state.fileSettings.edges = VALID_EDGES
            metricData = [{ name: "unknown", maxValue: 100, minValue: 1, values: [1, 100] }]

            const nodes: Node[] = SquarifiedLayoutGenerator.createTreemapNodes(map, state, metricData, isDeltaState)

            expect(nodes[2].width * nodes[2].length).toEqual(0)
        })
    })

    describe("calculateAreaValue", () => {
        it("should return 0 if node has children, not blacklisted and not only visible in comparison map", () => {
            const actual = SquarifiedLayoutGenerator.calculateAreaValue(codeMapNode, state, 400, false)

            expect(actual).toBe(0)
        })

        it("should return 0.5 if experimentalFeaturesEnabled is true and node has children, not blacklisted and not only visible in comparison map", () => {
            const actual = SquarifiedLayoutGenerator.calculateAreaValue(codeMapNode, state, 400, true)

            expect(actual).toBe(0.5)
        })

        it("should invert area when areametric indicates a positive direction", () => {
            state.dynamicSettings.areaMetric = "branch_coverage"
            state.fileSettings.attributeDescriptors = {
                branch_coverage: {
                    title: "Branch Coverage",
                    description: "",
                    hintLowValue: "",
                    hintHighValue: "",
                    link: "",
                    direction: 1
                }
            }
            codeMapNode.children[0].attributes = { branch_coverage: 0.9 }
            const actual = SquarifiedLayoutGenerator.calculateAreaValue(codeMapNode.children[0], state, 400, false)

            expect(actual).toBe(400 - 0.9)
        })
    })
})
