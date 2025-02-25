import {
  Group,
  Intersection,
  Light,
  MeshBasicMaterial,
  MeshNormalMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLInfo
} from 'three'

import { store } from '@xrengine/client-core/src/store'
import { RethrownError } from '@xrengine/client-core/src/util/errors'
import { SceneJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { GLTFExporter } from '@xrengine/engine/src/assets/loaders/gltf/GLTFExporter'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions } from '@xrengine/engine/src/ecs/classes/EngineService'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { defineQuery, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { createEntity, removeEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { dispatchLocal } from '@xrengine/engine/src/networking/functions/dispatchFrom'
import { accessEngineRendererState, EngineRendererAction } from '@xrengine/engine/src/renderer/EngineRendererState'
import { configureEffectComposer } from '@xrengine/engine/src/renderer/functions/configureEffectComposer'
import { EngineRenderer } from '@xrengine/engine/src/renderer/WebGLRendererSystem'
import TransformGizmo from '@xrengine/engine/src/scene/classes/TransformGizmo'
import { Object3DComponent } from '@xrengine/engine/src/scene/components/Object3DComponent'
import { ScenePreviewCameraTagComponent } from '@xrengine/engine/src/scene/components/ScenePreviewCamera'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { Effects } from '@xrengine/engine/src/scene/constants/PostProcessing'
import { SnapMode } from '@xrengine/engine/src/scene/constants/transformConstants'
import { getAnimationClips } from '@xrengine/engine/src/scene/functions/cloneObject3D'
import { serializeForGLTFExport } from '@xrengine/engine/src/scene/functions/GLTFExportFunctions'
import { deserializeScenePreviewCamera } from '@xrengine/engine/src/scene/functions/loaders/ScenePreviewCameraFunctions'
import { loadSceneFromJSON } from '@xrengine/engine/src/scene/functions/SceneLoading'

import { EditorControlComponent } from '../classes/EditorControlComponent'
import EditorInfiniteGridHelper from '../classes/EditorInfiniteGridHelper'
import MeshCombinationGroup from '../classes/MeshCombinationGroup'
import EditorCommands from '../constants/EditorCommands'
import { RenderModes, RenderModesType } from '../constants/RenderModes'
import { createCameraEntity } from '../functions/createCameraEntity'
import { createEditorEntity } from '../functions/createEditorEntity'
import { createGizmoEntity } from '../functions/createGizmoEntity'
import { getIntersectingNodeOnScreen } from '../functions/getIntersectingNode'
import isEmptyObject from '../functions/isEmptyObject'
import { getCanvasBlob } from '../functions/thumbnails'
import { EditorAction } from '../services/EditorServices'
import { ModeAction } from '../services/ModeServices'
import { CommandManager } from './CommandManager'
import { ControlManager } from './ControlManager'

export type DefaultExportOptionsType = {
  combineMeshes: boolean
  removeUnusedObjects: boolean
}

export class SceneManager {
  static instance: SceneManager = new SceneManager()

  static DefaultExportOptions: DefaultExportOptionsType = {
    combineMeshes: true,
    removeUnusedObjects: true
  }

  isInitialized: boolean = false
  grid: EditorInfiniteGridHelper
  raycaster: Raycaster
  raycastTargets: Intersection<Object3D>[] = []
  centerScreenSpace: Vector2
  transformGizmo: TransformGizmo
  gizmoEntity: Entity
  editorEntity: Entity
  onUpdateStats?: (info: WebGLInfo) => void
  renderMode: RenderModesType = RenderModes.SHADOW

  async initializeScene(projectFile: SceneJson): Promise<Error[] | void> {
    EngineRenderer.instance.disableUpdate = true
    if (this.isInitialized) this.dispose()

    this.isInitialized = false
    this.raycaster = new Raycaster()

    this.centerScreenSpace = new Vector2()

    if (!Engine.scene) Engine.scene = new Scene()

    // getting scene data
    await loadSceneFromJSON(projectFile)

    Engine.camera.position.set(0, 5, 10)
    Engine.camera.lookAt(new Vector3())
    Engine.camera.layers.enable(ObjectLayers.Scene)
    Engine.camera.layers.enable(ObjectLayers.NodeHelper)
    Engine.camera.layers.enable(ObjectLayers.Gizmos)

    this.grid = new EditorInfiniteGridHelper()
    this.transformGizmo = new TransformGizmo()

    this.gizmoEntity = createGizmoEntity(this.transformGizmo)
    Engine.activeCameraEntity = createCameraEntity()
    this.editorEntity = createEditorEntity()

    Engine.scene.add(Engine.camera)
    Engine.scene.add(this.grid)
    Engine.scene.add(this.transformGizmo)

    this.isInitialized = true

    return []
  }

  /**
   * Function onEmitSceneModified called when scene get modified.
   *
   * @author Robert Long
   */
  onEmitSceneModified() {
    store.dispatch(EditorAction.sceneModified(true))
  }

  /**
   * Function initializeRenderer used to render canvas.
   *
   * @author Robert Long
   * @param  {any} canvas [ contains canvas data ]
   */
  initializeRenderer(): void {
    console.log('initializeRenderer')
    try {
      ControlManager.instance.initControls()
      dispatchLocal(
        EngineActions.enableScene({
          renderer: true,
          physics: true
        }) as any
      )

      dispatchLocal(EngineActions.setPhysicsDebug(true) as any)

      const editorControlComponent = getComponent(this.editorEntity, EditorControlComponent)
      this.grid.setSize(editorControlComponent.translationSnap)

      configureEffectComposer()
      window.addEventListener('resize', this.onResize)

      store.dispatch(EditorAction.rendererInitialized(true))
      EngineRenderer.instance.disableUpdate = false

      accessEngineRendererState().automatic.set(false)
      dispatchLocal(EngineRendererAction.setQualityLevel(EngineRenderer.instance.maxQualityLevel))
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Function takeScreenshot used for taking screenshots.
   *
   * @author Robert Long
   * @param  {any}  width
   * @param  {any}  height
   * @return {Promise}        [generated screenshot according to height and width]
   */
  async takeScreenshot(width: number, height: number) {
    EngineRenderer.instance.disableUpdate = true
    const size = new Vector2()
    Engine.renderer.getSize(size)

    let scenePreviewCamera: PerspectiveCamera = null!
    const query = defineQuery([ScenePreviewCameraTagComponent])

    for (const entity of query()) {
      scenePreviewCamera = getComponent(entity, Object3DComponent).value as PerspectiveCamera
    }

    if (!scenePreviewCamera) {
      const entity = createEntity()
      deserializeScenePreviewCamera(entity, null!)

      scenePreviewCamera = getComponent(entity, Object3DComponent).value as PerspectiveCamera
      Engine.camera.matrix.decompose(
        scenePreviewCamera.position,
        scenePreviewCamera.quaternion,
        scenePreviewCamera.scale
      )
    }

    const prevAspect = scenePreviewCamera.aspect
    scenePreviewCamera.aspect = width / height
    scenePreviewCamera.updateProjectionMatrix()
    scenePreviewCamera.layers.disableAll()
    scenePreviewCamera.layers.set(ObjectLayers.Scene)
    Engine.renderer.setSize(width, height, false)
    Engine.renderer.render(Engine.scene, scenePreviewCamera)
    const blob = await getCanvasBlob(Engine.renderer.domElement)
    scenePreviewCamera.aspect = prevAspect
    scenePreviewCamera.updateProjectionMatrix()
    Engine.renderer.setSize(size.x, size.y, false)
    EngineRenderer.instance.disableUpdate = false
    return blob
  }

  changeRenderMode(mode: RenderModesType) {
    // revert any changes made by a render mode
    switch (this.renderMode) {
      case RenderModes.UNLIT:
        Engine.scene.traverse((obj: Light) => {
          if (obj.isLight && obj.userData.editor_disabled) {
            delete obj.userData.editor_disabled
            obj.visible = true
          }
        })
        break
      default:
        break
    }

    this.renderMode = mode

    const passes = Engine.effectComposer?.passes.filter((p) => p.name === 'RenderPass')
    const renderPass = passes ? passes[0] : undefined

    if (!renderPass) return

    switch (mode) {
      case RenderModes.UNLIT:
        Engine.renderer.shadowMap.enabled = false
        Engine.scene.traverse((obj: Light) => {
          if (obj.isLight && obj.visible) {
            obj.userData.editor_disabled = true
            obj.visible = false
          }
        })
        renderPass.overrideMaterial = null
        break
      case RenderModes.LIT:
        Engine.renderer.shadowMap.enabled = false
        renderPass.overrideMaterial = null
        break
      case RenderModes.SHADOW:
        Engine.renderer.shadowMap.enabled = true
        renderPass.overrideMaterial = null
        break
      case RenderModes.WIREFRAME:
        Engine.renderer.shadowMap.enabled = false
        renderPass.overrideMaterial = new MeshBasicMaterial({
          wireframe: true
        })
        break
      case RenderModes.NORMALS:
        Engine.renderer.shadowMap.enabled = false
        renderPass.overrideMaterial = new MeshNormalMaterial()
        break
    }
    Engine.renderer.shadowMap.needsUpdate = true
    store.dispatch(ModeAction.changedRenderMode())
  }

  /**
   * Function onResize event handler for resize containers.
   *
   * @author Robert Long
   */
  onResize = () => {
    ControlManager.instance.inputManager.onResize()
    CommandManager.instance.emit('resize')
  }

  /**
   * Function getSpawnPosition provides the postion of object inside scene.
   *
   * @author Robert Long
   * @param target
   * @return {any}        [Spwan position]
   */
  getSpawnPosition(target: Vector3) {
    return this.getScreenSpaceSpawnPosition(this.centerScreenSpace, target)
  }

  /**
   * Function reparentToSceneAtCursorPosition used to reparent scene at cursor position.
   *
   * @author Robert Long
   * @param objects
   * @param mousePos
   */
  reparentToSceneAtCursorPosition(objects, mousePos) {
    const newPosition = new Vector3()
    this.getCursorSpawnPosition(mousePos, newPosition)
    CommandManager.instance.executeCommand(EditorCommands.REPARENT, objects, {
      parents: useWorld().entityTree.rootNode,
      positions: newPosition
    })
  }

  /**
   * Function provides the cursor spawn position.
   *
   * @author Robert Long
   * @param mousePos
   * @param target
   * @returns
   */
  getCursorSpawnPosition(mousePos: Vector2, target = new Vector3()): Vector3 {
    const rect = Engine.renderer.domElement.getBoundingClientRect()
    const position = new Vector2()
    position.x = ((mousePos.x - rect.left) / rect.width) * 2 - 1
    position.y = ((mousePos.y - rect.top) / rect.height) * -2 + 1
    return this.getScreenSpaceSpawnPosition(position, target)
  }

  /**
   * Function provides the screen space spawn position.
   *
   * @author Robert Long
   * @param screenSpacePosition
   * @param target
   */
  getScreenSpaceSpawnPosition(screenSpacePosition: Vector2, target = new Vector3()): Vector3 {
    this.raycastTargets.length = 0
    const closestTarget = getIntersectingNodeOnScreen(this.raycaster, screenSpacePosition, this.raycastTargets)

    if (closestTarget && closestTarget.distance < 1000) {
      target.copy(closestTarget.point)
    } else {
      this.raycaster.ray.at(20, target)
    }

    const editorControlComponent = getComponent(this.editorEntity, EditorControlComponent)
    if (editorControlComponent.snapMode === SnapMode.Grid) {
      const translationSnap = editorControlComponent.translationSnap

      target.set(
        Math.round(target.x / translationSnap) * translationSnap,
        Math.round(target.y / translationSnap) * translationSnap,
        Math.round(target.z / translationSnap) * translationSnap
      )
    }

    return target
  }

  removeUnusedObjects = (object3d: Object3D) => {
    function hasExtrasOrExtensions(object) {
      const userData = object.userData
      const keys = Object.keys(userData)
      for (const key of keys) {
        if (typeof userData[key] !== 'undefined') {
          return true
        }
      }
      return false
    }

    function _removeUnusedObjects(object) {
      let canBeRemoved = !!object.parent
      const children = object.children?.slice(0)

      if (children) {
        for (const child of children) {
          if (!_removeUnusedObjects(child)) {
            canBeRemoved = false
          }
        }
      }

      if (
        canBeRemoved &&
        object.children.length === 0 &&
        (object.constructor === Object3D || object.constructor === Scene || object.constructor === Group) &&
        !hasExtrasOrExtensions(object)
      ) {
        object.parent?.remove(object)
        return true
      }

      return false
    }

    _removeUnusedObjects(this)
  }

  /**
   * Function exportScene used to export scene.
   *
   * @author Robert Long
   * @param  {any}  signal       [show the Network status]
   * @param  {Object}  [options={}]
   * @return {Promise}              [scene data as object]
   */
  async exportScene(options = {} as DefaultExportOptionsType) {
    const { combineMeshes, removeUnusedObjects } = Object.assign({}, SceneManager.DefaultExportOptions, options)

    CommandManager.instance.executeCommand(EditorCommands.REPLACE_SELECTION, [])

    if ((Engine.scene as any).entity == undefined) {
      ;(Engine.scene as any).entity = useWorld().entityTree.rootNode.entity
    }

    const clonedScene = serializeForGLTFExport(Engine.scene)

    if (combineMeshes) await MeshCombinationGroup.combineMeshes(clonedScene)
    if (removeUnusedObjects) this.removeUnusedObjects(clonedScene)

    const exporter = new GLTFExporter({
      mode: 'glb',
      onlyVisible: false,
      includeCustomExtensions: true,
      animations: getAnimationClips()
    })

    let chunks

    try {
      chunks = await exporter.exportChunks(clonedScene)
    } catch (error) {
      throw new RethrownError(`Error exporting scene`, error)
    }

    const json = chunks.json

    const nodeDefs = json.nodes
    if (nodeDefs) {
      const uuidToIndexMap = {}

      for (let i = 0; i < nodeDefs.length; i++) {
        const nodeDef = nodeDefs[i]

        if (nodeDef.extras && nodeDef.extras.editor_uuid) {
          uuidToIndexMap[nodeDef.extras.editor_uuid] = i
          delete nodeDef.extras.editor_uuid

          if (isEmptyObject(nodeDef.extras)) {
            delete nodeDef.extras
          }
        }
      }
    }

    try {
      const glbBlob = await exporter.exportGLBBlob(chunks)
      return { glbBlob, chunks }
    } catch (error) {
      throw new RethrownError('Error creating glb blob', error)
    }
  }

  updateOutlinePassSelection(): void {
    if (!Engine.effectComposer || !Engine.effectComposer[Effects.OutlineEffect]) return

    const meshes = [] as any[]
    for (let i = 0; i < CommandManager.instance.selectedTransformRoots.length; i++) {
      const obj3d = getComponent(CommandManager.instance.selectedTransformRoots[i].entity, Object3DComponent)?.value
      obj3d?.traverse((child: any) => {
        if (
          !child.userData.disableOutline &&
          !child.userData.isHelper &&
          (child.isMesh || child.isLine || child.isSprite || child.isPoints)
        ) {
          meshes.push(child)
        }
      })
    }

    Engine.effectComposer[Effects.OutlineEffect].selection.set(meshes)
  }

  dispose() {
    if (Engine.activeCameraEntity) removeEntity(Engine.activeCameraEntity, true)
    if (this.gizmoEntity) removeEntity(this.gizmoEntity, true)
    if (this.editorEntity) removeEntity(this.editorEntity, true)

    if (Engine.scene) {
      if (this.grid) Engine.scene.remove(this.grid)

      // Empty existing scene
      Engine.scene.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose()

        if (child.material) {
          if (child.material.length) {
            for (let i = 0; i < child.material.length; ++i) {
              child.material[i].dispose()
            }
          } else {
            child.material.dispose()
          }
        }
      })

      Engine.scene.clear()
    }

    this.isInitialized = false
  }
}

export default async function EditorInfoSystem(world: World) {
  return () => {
    if (SceneManager.instance.onUpdateStats) {
      Engine.renderer.info.reset()
      const renderStat = Engine.renderer.info.render as any
      renderStat.fps = 1 / world.delta
      renderStat.frameTime = world.delta * 1000
      SceneManager.instance.onUpdateStats(Engine.renderer.info)
    }
  }
}
