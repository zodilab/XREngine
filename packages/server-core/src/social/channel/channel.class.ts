import { Paginated, Params } from '@feathersjs/feathers'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'
import _ from 'lodash'
import { Op } from 'sequelize'

import { Channel as ChannelInterface } from '@xrengine/common/src/interfaces/Channel'

import { Application } from '../../../declarations'
import logger from '../../logger'
import { extractLoggedInUserFromParams } from '../../user/auth-management/auth-management.utils'

export type ChannelDataType = ChannelInterface

export class Channel<T = ChannelDataType> extends Service<T> {
  app: Application
  docs: any
  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  /**
   * A method which find channel and display it
   *
   * @param params of query which contains items limit and numberr skip
   * @returns {@Array} which contains list of channel
   * @author Vyacheslav Solovjov
   */

  async find(params?: Params): Promise<T[] | Paginated<T>> {
    if (!params) params = {}
    const query = params.query!
    const skip = query?.skip || 0
    const limit = query?.limit || 10
    const loggedInUser = extractLoggedInUserFromParams(params)
    const userId = loggedInUser.id
    const Model = (this.app.service('channel') as any).Model
    try {
      const subParams = {
        subQuery: false,
        offset: skip,
        limit: limit,
        order: [['updatedAt', 'DESC']],
        include: [
          'user1',
          'user2',
          {
            model: (this.app.service('group') as any).Model,
            include: [
              {
                model: (this.app.service('group-user') as any).Model,
                include: [
                  {
                    model: (this.app.service('user') as any).Model
                  }
                ]
              }
            ]
          },
          {
            model: (this.app.service('party') as any).Model,
            include: [
              {
                model: (this.app.service('party-user') as any).Model,
                include: [
                  {
                    model: (this.app.service('user') as any).Model
                  }
                ]
              }
            ]
          },
          {
            model: (this.app.service('instance') as any).Model,
            include: [
              {
                model: (this.app.service('user') as any).Model
              }
            ]
          },
          {
            model: this.app.service('message').Model,
            limit: 20,
            order: [['createdAt', 'DESC']],
            include: [
              {
                model: (this.app.service('user') as any).Model,
                as: 'sender'
              }
            ]
          }
        ],
        where: {
          [Op.or]: [
            {
              [Op.or]: [
                {
                  userId1: userId
                },
                {
                  userId2: userId
                }
              ]
            },
            {
              '$group.group_users.userId$': userId
            },
            {
              '$party.party_users.userId$': userId
            },
            {
              '$instance.users.id$': userId
            }
          ]
        }
      }
      if (query.targetObjectType) (subParams.where as any).channelType = query.targetObjectType
      if (query.channelType) (subParams.where as any).channelType = query.channelType
      const results = await Model.findAndCountAll(subParams)

      if (query.findTargetId === true) {
        const match = _.find(results.rows, (result: any) =>
          query.targetObjectType === 'user'
            ? result.userId1 === query.targetObjectId || result.userId2 === query.targetObjectId
            : query.targetObjectType === 'group'
            ? result.groupId === query.targetObjectId
            : query.targetObjectType === 'instance'
            ? result.instanceId === query.targetObjectId
            : result.partyId === query.targetObjectId
        )
        return {
          data: [match] || [],
          total: match == null ? 0 : 1,
          skip: skip,
          limit: limit
        }
      } else {
        query.id = {
          $in: results.rows.map((channel) => channel.id)
        }
        return super.find(params)
      }
    } catch (err) {
      logger.error('Channel find failed')
      logger.error(err)
      throw err
    }
  }
}
