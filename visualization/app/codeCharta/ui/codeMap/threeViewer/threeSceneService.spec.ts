import { Store, State, StoreModule } from "@ngrx/store"
import {
    CODE_MAP_BUILDING,
    CODE_MAP_BUILDING_TS_NODE,
    CONSTANT_HIGHLIGHT,
    TEST_NODE_LEAF,
    TEST_NODES,
    VALID_FILE_NODE_WITH_ID,
    VALID_NODES_WITH_ID
} from "../../../util/dataMocks"
import { CodeMapBuilding } from "../rendering/codeMapBuilding"
import { ThreeSceneService } from "./threeSceneService"
import { CodeMapMesh } from "../rendering/codeMapMesh"
import { CcState, CodeMapNode, LayoutAlgorithm } from "../../../codeCharta.model"
import { setScaling } from "../../../state/store/appSettings/scaling/scaling.actions"
import { Box3, BufferGeometry, Group, Material, Matrix4, Object3D, Raycaster, Vector3 } from "three"
import { setLayoutAlgorithm } from "../../../state/store/appSettings/layoutAlgorithm/layoutAlgorithm.actions"
import { FloorLabelDrawer } from "./floorLabels/floorLabelDrawer"
import { idToNodeSelector } from "../../../state/selectors/accumulatedData/idToNode.selector"
import { TestBed } from "@angular/core/testing"
import { IdToBuildingService } from "../../../services/idToBuilding/idToBuilding.service"
import { setEnableFloorLabels } from "../../../state/store/appSettings/enableFloorLabels/enableFloorLabels.actions"
import { appReducers, setStateMiddleware } from "../../../state/store/state.manager"

jest.mock("../../../state/selectors/accumulatedData/idToNode.selector", () => ({
    idToNodeSelector: jest.fn()
}))
const mockedIdToNodeSelector = jest.mocked(idToNodeSelector)

describe("ThreeSceneService", () => {
    let threeSceneService: ThreeSceneService
    let state: State<CcState>
    let idToBuildingService: IdToBuildingService
    let store: Store<CcState>

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThreeSceneService],
            imports: [StoreModule.forRoot(appReducers, { metaReducers: [setStateMiddleware] })]
        })

        state = TestBed.inject(State)
        idToBuildingService = TestBed.inject(IdToBuildingService)
        store = TestBed.inject(Store)

        threeSceneService = TestBed.inject(ThreeSceneService)
        threeSceneService["mapMesh"] = new CodeMapMesh(TEST_NODES, state.getValue(), false)
        threeSceneService["highlighted"] = [CODE_MAP_BUILDING]
        threeSceneService["constantHighlight"] = CONSTANT_HIGHLIGHT
    })

    describe("highlightBuildings", () => {
        it("should call highlightBuilding", () => {
            threeSceneService["mapMesh"].highlightBuilding = jest.fn()
            threeSceneService["threeRendererService"].render = jest.fn()

            threeSceneService.applyHighlights()

            expect(threeSceneService["mapMesh"].highlightBuilding).toHaveBeenCalledWith(
                threeSceneService["highlighted"],
                null,
                state.getValue(),
                threeSceneService["constantHighlight"]
            )
            expect(threeSceneService["threeRendererService"].render).toHaveBeenCalled()
        })
    })

    describe("addBuildingToHighlightingList", () => {
        it("should add the given building to the HighlightingList ", () => {
            threeSceneService["highlighted"] = []

            threeSceneService.addBuildingToHighlightingList(CODE_MAP_BUILDING)

            expect(threeSceneService["highlighted"]).toEqual([CODE_MAP_BUILDING])
        })
    })

    describe("addNodeAndChildrenToConstantHighlight", () => {
        beforeEach(() => {
            mockedIdToNodeSelector.mockImplementation(() => {
                const idToNode = new Map<number, CodeMapNode>()
                idToNode.set(VALID_NODES_WITH_ID.id, VALID_NODES_WITH_ID)
                idToNode.set(VALID_FILE_NODE_WITH_ID.id, VALID_FILE_NODE_WITH_ID)
                return idToNode
            })
            idToBuildingService.setIdToBuilding([CODE_MAP_BUILDING, CODE_MAP_BUILDING_TS_NODE])
            threeSceneService["constantHighlight"] = new Map()
        })

        it("should add a node into constant highlight ", () => {
            const result = new Map<number, CodeMapBuilding>()
            result.set(CODE_MAP_BUILDING_TS_NODE.id, CODE_MAP_BUILDING_TS_NODE)

            threeSceneService.addNodeAndChildrenToConstantHighlight(VALID_FILE_NODE_WITH_ID)

            expect(threeSceneService["constantHighlight"]).toEqual(result)
        })

        it("should add the folder and its children into constant highlight", () => {
            const result = new Map<number, CodeMapBuilding>()
            result.set(CODE_MAP_BUILDING.id, CODE_MAP_BUILDING)
            result.set(CODE_MAP_BUILDING_TS_NODE.id, CODE_MAP_BUILDING_TS_NODE)

            threeSceneService.addNodeAndChildrenToConstantHighlight(VALID_NODES_WITH_ID)

            expect(threeSceneService["constantHighlight"]).toEqual(result)
        })
    })

    describe("removeNodeAndChildrenFromConstantHighlight", () => {
        beforeEach(() => {
            mockedIdToNodeSelector.mockImplementation(() => {
                const idToNode = new Map<number, CodeMapNode>()
                idToNode.set(VALID_NODES_WITH_ID.id, VALID_NODES_WITH_ID)
                idToNode.set(VALID_FILE_NODE_WITH_ID.id, VALID_FILE_NODE_WITH_ID)
                return idToNode
            })
            idToBuildingService.setIdToBuilding([CODE_MAP_BUILDING, CODE_MAP_BUILDING_TS_NODE])
        })

        it("should remove the building from constant Highlight ", () => {
            const result = new Map<number, CodeMapBuilding>()
            result.set(CODE_MAP_BUILDING.id, CODE_MAP_BUILDING)

            threeSceneService.removeNodeAndChildrenFromConstantHighlight(VALID_FILE_NODE_WITH_ID)

            expect(threeSceneService["constantHighlight"]).toEqual(result)
        })

        it("should remove the folder and its children from constant Highlight ", () => {
            const result = new Map()

            threeSceneService.removeNodeAndChildrenFromConstantHighlight(VALID_NODES_WITH_ID)

            expect(threeSceneService["constantHighlight"]).toEqual(result)
        })
    })

    describe("getIntersectionDistance", () => {
        let bboxOverlap = null
        let bboxHovered = null
        let bboxMiss = null
        let bboxContain = null
        const overlapDistance = 2

        beforeEach(() => {
            bboxOverlap = new Box3(new Vector3(2, 2, 2), new Vector3(4, 4, 4))
            bboxHovered = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2))
            bboxMiss = new Box3(new Vector3(5, 5, 5), new Vector3(6, 6, 6))
            bboxContain = new Box3(new Vector3(3, 3, 3), new Vector3(4, 4, 4))
            threeSceneService["normedTransformVector"] = new Vector3(1, 1, 1)
        })

        it("should calculate distance if labels partially overlap", () => {
            const getDistance = threeSceneService["getIntersectionDistanceFunction"](bboxHovered, bboxOverlap)
            const distance = getDistance(overlapDistance)
            expect(distance).toEqual(overlapDistance)
        })

        it("should calculate distance if labels fully overlap", () => {
            const getDistance = threeSceneService["getIntersectionDistanceFunction"](bboxHovered, bboxContain)
            const distance = getDistance(overlapDistance)
            expect(distance).toEqual(overlapDistance)
        })

        it("should return 0 if labels dont overlap", () => {
            const getDistance = threeSceneService["getIntersectionDistanceFunction"](bboxHovered, bboxMiss)
            const distance = getDistance(overlapDistance)
            expect(distance).toEqual(0)
        })
    })

    describe("clearConstantHighlight", () => {
        it("should clear all the constant highlighted buildings ", () => {
            threeSceneService["constantHighlight"].set(CODE_MAP_BUILDING.id, CODE_MAP_BUILDING)

            threeSceneService.clearConstantHighlight()

            expect(threeSceneService["constantHighlight"].size).toEqual(0)
        })
    })

    describe("highlightSingleBuilding", () => {
        it("should add a building to the highlighting list and call the highlight function", () => {
            threeSceneService.addBuildingToHighlightingList = jest.fn()
            threeSceneService.applyHighlights = jest.fn()
            threeSceneService["highlighted"] = []

            threeSceneService.highlightSingleBuilding(CODE_MAP_BUILDING)

            expect(threeSceneService.addBuildingToHighlightingList).toHaveBeenCalled()
            expect(threeSceneService.applyHighlights).toHaveBeenCalled()
        })
    })

    describe("getLabelForHoveredNode", () => {
        it("should return null if list empty", () => {
            const labelForHoveredNode = threeSceneService.getLabelForHoveredNode(CODE_MAP_BUILDING_TS_NODE, null)

            expect(labelForHoveredNode).toBe(null)
        })

        it("should return null if label.node is not in list", () => {
            const node = new Object3D()
            const labels = []
            node.userData = CODE_MAP_BUILDING
            labels.push(node)

            const labelForHoveredNode = threeSceneService.getLabelForHoveredNode(CODE_MAP_BUILDING_TS_NODE, labels)

            expect(labelForHoveredNode).toBe(null)
        })

        it("should return label object for a given label.node", () => {
            const labels = []
            const otherNode = new Object3D()
            const labelLine = new Object3D()
            const labeledNode = new Object3D()

            labeledNode.userData = CODE_MAP_BUILDING_TS_NODE
            otherNode.userData = CODE_MAP_BUILDING
            labels.push(otherNode, labelLine, labeledNode, labelLine)

            const labelForHoveredNode = threeSceneService.getLabelForHoveredNode(CODE_MAP_BUILDING_TS_NODE, labels)

            expect(labelForHoveredNode).toBe(labeledNode)
        })
    })

    describe("clearHighlight", () => {
        it("should clear the highlighting list", () => {
            threeSceneService.clearHighlight()

            expect(threeSceneService["highlighted"]).toHaveLength(0)
        })
    })

    describe("applyClearHightlights", () => {
        it("should call clearHightlight and render changes", () => {
            threeSceneService.applyClearHightlights()

            expect(threeSceneService["threeRendererService"].render).toHaveBeenCalled
        })
    })

    describe("animateLabel", () => {
        let labels = null
        let otherNode = null
        let label = null
        let rayCaster = null
        let placeholderLine = null
        let lineGeometry = null

        beforeEach(() => {
            labels = []
            otherNode = new Object3D()
            label = new Object3D()
            placeholderLine = new Object3D()
            lineGeometry = new BufferGeometry()

            rayCaster = new Raycaster(new Vector3(10, 10, 0), new Vector3(1, 1, 1))
            const points = [new Vector3(3, 3, 3), new Vector3(3, 3, 3)]

            lineGeometry = new BufferGeometry().setFromPoints(points)
            placeholderLine["geometry"] = lineGeometry
        })

        it("should animate the label by moving it 20% on the viewRay if it has no intersection", () => {
            otherNode.translateX(-4)
            otherNode.translateY(5)
            const resultPosition = new Vector3(0.5, 0.5, 0)

            labels.push(label, placeholderLine, otherNode, placeholderLine)

            threeSceneService.animateLabel(label, rayCaster, labels)
            expect(threeSceneService["highlightedLabel"]).toEqual(label)
            expect(label.position).toEqual(resultPosition)
        })

        it("should animate the label by moving it 20% on the viewRay if the intersection distance is smaller", () => {
            otherNode.applyMatrix4(new Matrix4().makeTranslation(0.3, 0.3, 0))

            const resultPosition = new Vector3(0.5, 0.5, 0)

            labels.push(label, placeholderLine, otherNode, placeholderLine)

            threeSceneService.animateLabel(label, rayCaster, labels)
            expect(threeSceneService["highlightedLabel"]).toEqual(label)
            expect(label.position).toEqual(resultPosition)
        })

        it("should animate the label by moving it on top of intersecting node", () => {
            const unObstructingNode = new Object3D()
            rayCaster = new Raycaster(new Vector3(10, 10, 0), new Vector3(0, 0, 0))
            unObstructingNode.applyMatrix4(new Matrix4().makeTranslation(0.5, 0.5, 0))

            label.userData = CODE_MAP_BUILDING
            labels.push(label, placeholderLine, otherNode, placeholderLine, unObstructingNode, placeholderLine)

            threeSceneService.animateLabel(label, rayCaster, labels)
            expect(threeSceneService["highlightedLabel"]).toEqual(label)
            expect(label.position).toEqual(unObstructingNode.position)
        })
    })

    describe("resetLineHighlight", () => {
        it("should reset line highlighting", () => {
            threeSceneService["highlightedLineIndex"] = 5
            threeSceneService["highlightedLine"] = new Object3D()

            threeSceneService.resetLineHighlight()

            expect(threeSceneService["highlightedLineIndex"]).toEqual(-1)
            expect(threeSceneService["highlightedLine"]).toEqual(null)
        })
    })

    describe("getHoveredLabelLineIndex", () => {
        it("should return index+1 if found", () => {
            const labels = []
            const label1 = new Object3D()
            const label2 = new Object3D()
            const label3 = new Object3D()
            labels.push(label1, label2, label3)

            const indexIncrement = threeSceneService.getHoveredLabelLineIndex(labels, label2)

            expect(indexIncrement).toEqual(2)
        })
    })

    describe("toggleLineAnimation", () => {
        let highlightedLabel = null
        let hoveredLabel = null
        let highlightedLine = null
        let lineGeometry = null
        let labels = null
        let labelsGroup = null

        beforeEach(() => {
            highlightedLine = new Object3D()
            const points = [new Vector3(3, 3, 3), new Vector3(3, 3, 3)]

            lineGeometry = new BufferGeometry().setFromPoints(points)
            highlightedLine["geometry"] = lineGeometry
            highlightedLine.material = new Material()

            labels = []
            labels.push(new Object3D(), new Object3D(), new Object3D())

            labelsGroup = new Group()
            labelsGroup.children = labels
            threeSceneService.labels = labelsGroup

            hoveredLabel = new Object3D()
            hoveredLabel.position.set(2, 2, 2)

            highlightedLabel = new Object3D()
            highlightedLabel.position.set(1, 1, 1)
            highlightedLabel.material = new Material()

            threeSceneService["highlightedLineIndex"] = 1
            threeSceneService["highlightedLabel"] = highlightedLabel
            threeSceneService["highlightedLine"] = highlightedLine
            threeSceneService["normedTransformVector"] = new Vector3(0, 0, 0)
        })

        it("should set endpoint to given hoveredLabel coordinates if not in reset mode", () => {
            threeSceneService.toggleLineAnimation(hoveredLabel)

            const pointsBufferGeometry = threeSceneService.labels.children[1]["geometry"] as BufferGeometry
            const pointsArray = [...pointsBufferGeometry.attributes.position.array]
            expect(new Vector3(pointsArray[0], pointsArray[1], pointsArray[2])).toEqual(new Vector3(3, 3, 3))
            expect(new Vector3(pointsArray[3], pointsArray[4], pointsArray[5])).toEqual(new Vector3(2, 2, 2))
        })

        it("should set endpoint to highlightedLabel if in reset mode", () => {
            threeSceneService.resetLabel()

            const pointsBufferGeometry = threeSceneService.labels.children[1]["geometry"] as BufferGeometry
            const pointsArray = [...pointsBufferGeometry.attributes.position.array]

            expect(new Vector3(pointsArray[0], pointsArray[1], pointsArray[2])).toEqual(new Vector3(3, 3, 3))
            expect(new Vector3(pointsArray[3], pointsArray[4], pointsArray[5])).toEqual(new Vector3(1, 1, 1))
            expect(threeSceneService["highlightedLabel"]).toEqual(null)
        })
    })

    describe("scaleHeight", () => {
        it("should update mapGeometry scaling to new vector", () => {
            const translateCanvasesMock = jest.fn()
            threeSceneService["floorLabelDrawer"] = {
                translatePlaneCanvases: translateCanvasesMock
            }

            const scaling = new Vector3(1, 2, 3)
            store.dispatch(setScaling({ value: scaling }))

            threeSceneService.scaleHeight()

            const mapGeometry = threeSceneService.mapGeometry

            expect(mapGeometry.scale).toEqual(scaling)
            expect(translateCanvasesMock).toHaveBeenCalledTimes(1)
        })

        it("should call mapMesh.scale and apply the correct scaling to the mesh", () => {
            const translateCanvasesMock = jest.fn()
            threeSceneService["floorLabelDrawer"] = {
                translatePlaneCanvases: translateCanvasesMock
            }

            const scaling = new Vector3(1, 2, 3)
            store.dispatch(setScaling({ value: scaling }))
            threeSceneService["mapMesh"].setScale = jest.fn()

            threeSceneService.scaleHeight()

            expect(threeSceneService["mapMesh"].setScale).toHaveBeenCalledWith(scaling)
            expect(translateCanvasesMock).toHaveBeenCalledTimes(1)
        })
    })

    describe("initFloorLabels", () => {
        const floorLabelDrawerSpy = jest.spyOn(FloorLabelDrawer.prototype, "draw").mockReturnValue([])

        afterEach(() => {
            floorLabelDrawerSpy.mockReset()
        })

        it("should not add floor labels for StreetMap and TreeMapStreet algorithms", () => {
            threeSceneService["notifyMapMeshChanged"] = jest.fn()
            const getRootNodeMock = jest.fn()
            const originalGetRootNode = threeSceneService["getRootNode"]
            threeSceneService["getRootNode"] = getRootNodeMock

            store.dispatch(setLayoutAlgorithm({ value: LayoutAlgorithm.StreetMap }))
            threeSceneService.setMapMesh([], new CodeMapMesh(TEST_NODES, state.getValue(), false))

            store.dispatch(setLayoutAlgorithm({ value: LayoutAlgorithm.TreeMapStreet }))
            threeSceneService.setMapMesh([], new CodeMapMesh(TEST_NODES, state.getValue(), false))

            expect(getRootNodeMock).not.toHaveBeenCalled()
            expect(floorLabelDrawerSpy).not.toHaveBeenCalled()

            threeSceneService["getRootNode"] = originalGetRootNode

            store.dispatch(setLayoutAlgorithm({ value: LayoutAlgorithm.SquarifiedTreeMap }))
            threeSceneService.setMapMesh(TEST_NODES, new CodeMapMesh(TEST_NODES, state.getValue(), false))

            expect(floorLabelDrawerSpy).toHaveBeenCalled()
        })

        it("should not add floor labels if no root node was found", () => {
            threeSceneService["notifyMapMeshChanged"] = jest.fn()
            const floorLabelDrawerSpy = jest.spyOn(FloorLabelDrawer.prototype, "draw").mockReturnValue([])

            store.dispatch(setLayoutAlgorithm({ value: LayoutAlgorithm.SquarifiedTreeMap }))
            threeSceneService.setMapMesh([TEST_NODE_LEAF], new CodeMapMesh(TEST_NODES, state.getValue(), false))

            expect(floorLabelDrawerSpy).not.toHaveBeenCalled()
        })

        it("should not add floor labels if floor labels are disabled", () => {
            threeSceneService["notifyMapMeshChanged"] = jest.fn()
            const floorLabelDrawerSpy = jest.spyOn(FloorLabelDrawer.prototype, "draw").mockReturnValue([])

            store.dispatch(setEnableFloorLabels({ value: false }))
            threeSceneService.setMapMesh([TEST_NODE_LEAF], new CodeMapMesh(TEST_NODES, state.getValue(), false))

            expect(floorLabelDrawerSpy).not.toHaveBeenCalled()
        })
    })
})
