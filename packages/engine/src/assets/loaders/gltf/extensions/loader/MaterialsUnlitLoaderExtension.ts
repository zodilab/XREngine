import { DoubleSide, MeshBasicMaterial, RGBAFormat, sRGBEncoding } from 'three'

import { LoaderExtension } from './LoaderExtension'

export const ALPHA_MODES = {
  OPAQUE: 'OPAQUE',
  MASK: 'MASK',
  BLEND: 'BLEND'
}

function getUnlitMaterial(materialDef) {
  return materialDef.extensions && materialDef.extensions[MaterialsUnlitLoaderExtension.extensionName]
}
function shouldCreateMaterial(materialDef) {
  return getUnlitMaterial(materialDef)
}
function shouldSetMaterialParams(_material, materialDef) {
  return getUnlitMaterial(materialDef)
}
export class MaterialsUnlitLoaderExtension extends LoaderExtension {
  static extensionName = 'KHR_materials_unlit'
  extensionNames = [MaterialsUnlitLoaderExtension.extensionName]
  onLoad() {
    if (this.loader.usesExtension(MaterialsUnlitLoaderExtension.extensionName)) {
      this.loader.addHook('createMaterial', shouldCreateMaterial, this.createMaterial)
      this.loader.addHook('setMaterialParams', shouldSetMaterialParams, this.setMaterialParams)
    }
  }
  createMaterial = async () => new MeshBasicMaterial()
  setMaterialParams = async (material, materialDef) => {
    const pending: any[] = []
    material.color.set(0xffffff)
    material.opacity = 1.0
    const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE
    const metallicRoughness = materialDef.pbrMetallicRoughness
    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor
        material.color.fromArray(array)
        material.opacity = array[3]
      }
      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(
          this.loader.assignTexture(material, 'map', metallicRoughness.baseColorTexture, sRGBEncoding, RGBAFormat)
        )
      }
    }
    if (materialDef.doubleSided === true) {
      material.side = DoubleSide
    }
    if (alphaMode === ALPHA_MODES.BLEND) {
      material.transparent = true
    } else {
      material.transparent = false
      if (alphaMode === ALPHA_MODES.MASK) {
        material.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5
      }
    }
    await Promise.all(pending)
  }
}
