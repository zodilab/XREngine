import { PortalDetail } from '@xrengine/common/src/interfaces/PortalInterface'
import { SceneData, SceneJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { isDev } from '@xrengine/common/src/utils/isDev'

import config from '../../appconfig'
import { getCachedAsset } from '../../media/storageprovider/getCachedAsset'

export const sceneRelativePathIdentifier = '__$project$__'
export const sceneCorsPathIdentifier = '__$cors-proxy$__'
export const corsPath =
  isDev || process.env.VITE_LOCAL_BUILD
    ? `https://${config.server.hostname}:${config.server.corsServerPort}`
    : `https://${config.server.hostname}/cors-proxy`

export const parseSceneDataCacheURLs = (sceneData: SceneJson, cacheDomain: string) => {
  for (const [key, val] of Object.entries(sceneData)) {
    if (val && typeof val === 'object') {
      sceneData[key] = parseSceneDataCacheURLs(val, cacheDomain)
    }
    if (typeof val === 'string') {
      if (val.includes(sceneRelativePathIdentifier)) {
        sceneData[key] = getCachedAsset(val.replace(sceneRelativePathIdentifier, '/projects'), cacheDomain)
      } else if (val.startsWith(sceneCorsPathIdentifier)) {
        sceneData[key] = val.replace(sceneCorsPathIdentifier, corsPath)
      }
    }
  }
  return sceneData
}

export const cleanSceneDataCacheURLs = (sceneData: SceneJson, cacheDomain: string) => {
  for (const [key, val] of Object.entries(sceneData)) {
    if (val && typeof val === 'object') {
      sceneData[key] = cleanSceneDataCacheURLs(val, cacheDomain)
    }
    if (typeof val === 'string') {
      if (val.includes('https://' + cacheDomain + '/projects')) {
        sceneData[key] = val.replace('https://' + cacheDomain + '/projects', sceneRelativePathIdentifier)
      } else if (val.startsWith(corsPath)) {
        sceneData[key] = val.replace(corsPath, sceneCorsPathIdentifier)
      }
    }
  }
  return sceneData
}

export const parseScenePortals = (scene: SceneData) => {
  const portals: PortalDetail[] = []
  for (const [entityId, entity] of Object.entries(scene.scene?.entities!)) {
    for (const component of entity.components)
      if (component.name === 'portal') {
        portals.push({
          sceneName: scene.name,
          portalEntityId: entityId,
          spawnPosition: component.props.spawnPosition,
          spawnRotation: component.props.spawnRotation
        })
      }
  }
  return portals
}
