import dauria from 'dauria'
import express from 'express'
import blobService from 'feathers-blob'
import multer from 'multer'
import { v1 as uuidv1 } from 'uuid'

import { Application } from '../../../declarations'
import config from '../../appconfig'
import { useStorageProvider } from '../storageprovider/storageprovider'
import hooks from './upload-media.hooks'

const multipartMiddleware = multer()

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    media: any
  }
}

export default (app: Application): void => {
  const provider = useStorageProvider()

  /**
   * Initialize our service with any options it requires and docs
   *
   * @author Vyacheslav Solovjov
   */
  // @ts-ignore
  app.use(
    '/media',
    multipartMiddleware.fields([{ name: 'media' }, { name: 'thumbnail' }]),
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req?.feathers && req.method !== 'GET') {
        req.feathers.file = (req as any).files.media ? (req as any).files.media[0] : null
        req.feathers.body = (req as any).body
        req.feathers.body.fileId = req.feathers.body.fileId ?? uuidv1()
        req.feathers.mimeType = req.feathers.file.mimetype
        req.feathers.storageProvider = provider
        req.feathers.thumbnail = (req as any).files.thumbnail ? (req as any).files.thumbnail[0] : null
        req.feathers.uploadPath = req.feathers.body.uploadPath ?? req.feathers.body.fileId
        if (req.feathers.body.name) req.feathers.id = req.feathers.body.name
      }
      next()
    },
    blobService({ Model: provider.getStorage() }),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Only returns jpeg format image i.e. the ones uploaded to server.
      if (
        req.method === 'GET' &&
        config.server.storageProvider !== 'aws' &&
        res.data.id &&
        res.data.id.split('.')[1] === 'jpeg'
      ) {
        // Parse data uri 'Base64' to 'Buffer/Binary data'
        const { buffer } = dauria.parseDataURI(res.data.uri)
        res.setHeader('Content-Type', 'image/jpeg') // Set content-type header to image for client
        res.write(buffer, 'binary')
        res.end(null, 'binary')
      } else {
        next()
      }
    }
  )

  const service = app.service('media')

  ;(service as any).hooks(hooks)
}
