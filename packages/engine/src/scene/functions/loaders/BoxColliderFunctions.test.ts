import assert from 'assert'
import proxyquire from 'proxyquire'
import { Object3D, Quaternion, Vector3 } from 'three'

import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'

import { Engine } from '../../../ecs/classes/Engine'
import { Entity } from '../../../ecs/classes/Entity'
import { createWorld, World } from '../../../ecs/classes/World'
import { addComponent, getComponent } from '../../../ecs/functions/ComponentFunctions'
import { createEntity } from '../../../ecs/functions/EntityFunctions'
import { ColliderComponent } from '../../../physics/components/ColliderComponent'
import { CollisionComponent } from '../../../physics/components/CollisionComponent'
import { CollisionGroups, DefaultCollisionMask } from '../../../physics/enums/CollisionGroups'
import { TransformComponent } from '../../../transform/components/TransformComponent'
import { EntityNodeComponent } from '../../components/EntityNodeComponent'
import { Object3DComponent } from '../../components/Object3DComponent'
import { SCENE_COMPONENT_BOX_COLLIDER, SCENE_COMPONENT_BOX_COLLIDER_DEFAULT_VALUES } from './BoxColliderFunctions'

let transform2 = {
  translation: new Vector3(Math.random(), Math.random(), Math.random()),
  rotation: new Quaternion(Math.random(), Math.random(), Math.random(), Math.random())
}

describe('BoxColliderFunctions', () => {
  let world: World
  let entity: Entity
  let body: any
  let boxcolliderFunctions = proxyquire('./BoxColliderFunctions', {
    '../../../physics/functions/createCollider': { createBody: () => body },
    '../../../physics/classes/Physics': {
      setTriggerShape: () => {},
      isTriggerShape: () => sceneComponentData.isTrigger
    }
  })

  beforeEach(async () => {
    world = createWorld()
    Engine.currentWorld = world
    entity = createEntity()
    addComponent(entity, TransformComponent, {
      position: new Vector3(Math.random(), Math.random(), Math.random()),
      rotation: new Quaternion(Math.random(), Math.random(), Math.random(), Math.random()),
      scale: new Vector3(Math.random(), Math.random(), Math.random())
    })
    await Engine.currentWorld.physics.createScene({ verbose: true })

    world.physics = {
      createShape: () => ({ shape: 'box' }),
      getRigidbodyShapes: () => [{}]
    } as any

    body = {
      getGlobalPose: () => transform2,
      setGlobalPose: (t: any) => (transform2 = t),
      _debugNeedsUpdate: false
    }
  })

  afterEach(() => {
    Engine.currentWorld = null!
    delete (globalThis as any).PhysX
  })

  const sceneComponentData = {
    isTrigger: true,
    removeMesh: true,
    collisionLayer: DefaultCollisionMask,
    collisionMask: CollisionGroups.Avatars
  }

  const sceneComponent: ComponentJson = {
    name: SCENE_COMPONENT_BOX_COLLIDER,
    props: sceneComponentData
  }

  describe('deserializeBoxCollider()', () => {
    it('creates ColliderComponent and CollisionComponent', () => {
      boxcolliderFunctions.deserializeBoxCollider(entity, sceneComponent)

      const collider = getComponent(entity, ColliderComponent)
      const collision = getComponent(entity, CollisionComponent)

      assert(collider && collider.body === body, 'ColliderComponent is not created')
      assert(collision && collision.collisions.length <= 0, 'CollisionComponent is not created')
    })

    describe('Editor vs Location', () => {
      it('creates BoxCollider in Location', () => {
        addComponent(entity, EntityNodeComponent, { components: [] })

        const parent = new Object3D()
        const obj3d = new Object3D()
        parent.add(obj3d)

        addComponent(entity, Object3DComponent, { value: obj3d })

        sceneComponentData.removeMesh = true
        boxcolliderFunctions.deserializeBoxCollider(entity, sceneComponent)

        const entityNodeComponent = getComponent(entity, EntityNodeComponent)
        assert(!entityNodeComponent.components.includes(SCENE_COMPONENT_BOX_COLLIDER))
        assert(!getComponent(entity, Object3DComponent)?.value)
        assert(!parent.children.includes(obj3d))
      })

      it('creates BoxCollider in Editor', () => {
        Engine.isEditor = true

        addComponent(entity, EntityNodeComponent, { components: [] })

        boxcolliderFunctions.deserializeBoxCollider(entity, sceneComponent)

        const entityNodeComponent = getComponent(entity, EntityNodeComponent)
        assert(entityNodeComponent.components.includes(SCENE_COMPONENT_BOX_COLLIDER))

        assert(getComponent(entity, Object3DComponent)?.value)
        Engine.isEditor = false
      })
    })
  })

  describe('updateBoxCollider()', () => {
    it('should not update collider body', () => {
      boxcolliderFunctions.deserializeBoxCollider(entity, sceneComponent)
      boxcolliderFunctions.updateBoxCollider(entity, { isTrigger: true })

      const collider = getComponent(entity, ColliderComponent)
      const transform = getComponent(entity, TransformComponent)
      assert.deepEqual(collider.body.getGlobalPose(), { translation: transform.position, rotation: transform.rotation })
      assert(collider.body._debugNeedsUpdate)
    })
  })

  describe('serializeBoxCollider()', () => {
    it('should properly serialize boxcollider', () => {
      boxcolliderFunctions.deserializeBoxCollider(entity, sceneComponent)
      assert.deepEqual(boxcolliderFunctions.serializeBoxCollider(entity), {
        ...sceneComponent,
        props: { isTrigger: sceneComponentData.isTrigger }
      })
    })

    it('should return undefine if there is no boxcollider component', () => {
      assert(boxcolliderFunctions.serializeBoxCollider(entity) === undefined)
    })
  })

  describe('parseBoxColliderProperties()', () => {
    it('should use default component values', () => {
      const componentData = boxcolliderFunctions.parseBoxColliderProperties({})
      assert.deepEqual(componentData, SCENE_COMPONENT_BOX_COLLIDER_DEFAULT_VALUES)
    })

    it('should use passed values', () => {
      const componentData = boxcolliderFunctions.parseBoxColliderProperties({ ...sceneComponentData })
      assert.deepEqual(componentData, sceneComponentData)
    })
  })
})
