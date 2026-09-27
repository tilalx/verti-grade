import { describe, expect, it } from 'vitest'
import {
    addShape,
    addWall,
    canResize,
    insertVertex,
    midpoints,
    moveVertex,
    moveWall,
    newFloorPlan,
    readPath,
    removeVertex,
    removeWall,
    snapToVertices,
    translatePoints,
    wallChanges,
    wallProblems,
    withoutRepeats,
    writePath,
    type EditorState,
    type EditorWall,
} from '~/utils/mapEditor'
import type { MapPoint } from '#shared/utils/mapGeometry'

const triangle: MapPoint[] = [
    [0, 0],
    [4, 0],
    [4, 3],
]

const baseState = (): EditorState => ({
    map: newFloorPlan(40, 30),
    walls: [],
})

const wall = (patch: Partial<EditorWall> = {}): EditorWall => ({
    key: 'w1',
    id: 'w1',
    name: 'North',
    outline: triangle,
    edge: [
        [0, 0],
        [4, 0],
    ],
    label: null,
    sort: 1,
    anchorFrom: null,
    anchorTo: null,
    ...patch,
})

describe('shapes and paths', () => {
    it('starts with a floor covering the canvas', () => {
        expect(baseState().map.shapes[0]!.points).toContainEqual([40, 30])
    })

    it('adds a shape and edits it through its path', () => {
        const state = addShape(baseState(), 'mat', triangle)
        const path = { type: 'shape', index: 1 } as const
        expect(readPath(state, path)).toEqual(triangle)
        const moved = writePath(state, path, moveVertex(triangle, 1, [5, 0]))
        expect(readPath(moved, path)[1]).toEqual([5, 0])
        expect(readPath(state, path)[1]).toEqual([4, 0])
    })

    it('reads and writes wall outlines and edges', () => {
        const state = { ...baseState(), walls: [wall()] }
        const edgePath = { type: 'edge', key: 'w1' } as const
        const updated = writePath(state, edgePath, [
            [1, 1],
            [2, 2],
        ])
        expect(readPath(updated, edgePath)).toEqual([
            [1, 1],
            [2, 2],
        ])
    })
})

describe('vertices', () => {
    it('inserts, removes and keeps the minimum', () => {
        expect(insertVertex(triangle, 0, [2, 0])).toEqual([
            [0, 0],
            [2, 0],
            [4, 0],
            [4, 3],
        ])
        expect(removeVertex(triangle, 0, 3)).toBeNull()
        expect(removeVertex(insertVertex(triangle, 0, [2, 0]), 1, 3)).toEqual(
            triangle,
        )
    })

    it('offers midpoints for open and closed paths', () => {
        expect(midpoints(triangle, false)).toHaveLength(2)
        expect(midpoints(triangle, true)[2]!.point).toEqual([2, 1.5])
    })

    it('moves a shape without leaving the canvas', () => {
        const map = newFloorPlan(10, 10)
        expect(translatePoints(triangle, 20, -5, map)).toEqual([
            [6, 0],
            [10, 0],
            [10, 3],
        ])
    })

    it('snaps to a nearby vertex only within tolerance', () => {
        expect(snapToVertices([4.1, 0.1], triangle, 0.5)).toEqual([4, 0])
        expect(snapToVertices([2, 2], triangle, 0.5)).toBeNull()
    })

    it('drops consecutive duplicates from a double click', () => {
        expect(
            withoutRepeats([
                [0, 0],
                [1, 1],
                [1, 1],
            ]),
        ).toEqual([
            [0, 0],
            [1, 1],
        ])
    })
})

describe('walls', () => {
    it('adds walls at the end of the order and reorders them', () => {
        let state = addWall(baseState(), 'a', 'A')
        state = addWall(state, 'b', 'B')
        expect(state.walls.map((w) => w.sort)).toEqual([1, 2])
        state = moveWall(state, 'b', -1)
        const order = [...state.walls]
            .sort((x, y) => x.sort - y.sort)
            .map((w) => w.key)
        expect(order).toEqual(['b', 'a'])
        expect(moveWall(state, 'b', -1)).toBe(state)
    })

    it('lists what is missing before a wall can be saved', () => {
        expect(wallProblems(wall())).toEqual([])
        expect(
            wallProblems(
                wall({
                    name: ' ',
                    outline: [],
                    edge: [
                        [1, 1],
                        [1, 1],
                    ],
                }),
            ),
        ).toEqual(['name', 'outline', 'edge'])
    })

    it('diffs walls into creates, updates and deletes', () => {
        const saved = [wall(), wall({ key: 'w2', id: 'w2', name: 'South' })]
        const current = [
            wall({ name: 'North renamed' }),
            wall({ key: 'tmp1', id: undefined, name: 'New' }),
        ]
        const changes = wallChanges(saved, current)
        expect(changes.create.map((w) => w.name)).toEqual(['New'])
        expect(changes.update.map((w) => w.name)).toEqual(['North renamed'])
        expect(changes.remove).toEqual(['w2'])
        expect(
            removeWall({ ...baseState(), walls: saved }, 'w2').walls,
        ).toHaveLength(1)
    })
})

describe('canvas size', () => {
    it('refuses to shrink below the drawn content', () => {
        const state = {
            ...baseState(),
            walls: [
                wall({
                    outline: [
                        [1, 1],
                        [35, 1],
                        [35, 5],
                    ],
                }),
            ],
        }
        expect(canResize(state, 40, 30)).toBe(true)
        expect(canResize(state, 30, 30)).toBe(false)
        expect(canResize(state, 3, 30)).toBe(false)
    })
})
