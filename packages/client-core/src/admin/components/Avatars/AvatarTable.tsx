import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarInterface } from '@xrengine/common/src/interfaces/AvatarInterface'

import { useAuthState } from '../../../user/services/AuthService'
import ConfirmModel from '../../common/ConfirmModel'
import TableComponent from '../../common/Table'
import { avatarColumns, AvatarData } from '../../common/variables/avatar'
import { AVATAR_PAGE_LIMIT } from '../../services/AvatarService'
import { useAvatarState } from '../../services/AvatarService'
import { AvatarService } from '../../services/AvatarService'
import { useStyles } from '../../styles/ui'
import ViewAvatar from './ViewAvatar'

if (!global.setImmediate) {
  global.setImmediate = setTimeout as any
}

interface Props {
  // locationState?: any
  search: string
}

const AvatarTable = (props: Props) => {
  const adminAvatarState = useAvatarState()
  const { search } = props
  const authState = useAuthState()
  const user = authState.user
  const adminAvatars = adminAvatarState.avatars
  const adminAvatarCount = adminAvatarState.total
  const classes = useStyles()
  const { t } = useTranslation()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(AVATAR_PAGE_LIMIT)
  const [popConfirmOpen, setPopConfirmOpen] = useState(false)
  const [avatarId, setAvatarId] = useState('')
  const [avatarName, setAvatarName] = useState('')
  const [viewModel, setViewModel] = useState(false)
  const [avatarAdmin, setAvatarAdmin] = useState<AvatarInterface | null>(null)

  const handlePageChange = (event: unknown, newPage: number) => {
    const incDec = page < newPage ? 'increment' : 'decrement'
    AvatarService.fetchAdminAvatars(incDec, newPage, null)
    setPage(newPage)
  }

  const handleCloseModel = () => {
    setPopConfirmOpen(false)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  useEffect(() => {
    if (user?.id.value && adminAvatarState.updateNeeded.value) {
      AvatarService.fetchAdminAvatars('increment', 0, null)
    }

    AvatarService.fetchAdminAvatars('increment', 0, search)
  }, [user?.id?.value, search, adminAvatarState.updateNeeded.value])

  const createData = (
    el: AvatarInterface,
    sid: string | undefined,
    name: string | undefined,
    key: string | undefined
  ): AvatarData => {
    return {
      el,
      sid,
      name,
      key,
      action: (
        <>
          <a
            href="#h"
            className={classes.actionStyle}
            onClick={() => {
              setAvatarAdmin(el)
              setViewModel(true)
            }}
          >
            <span className={classes.spanWhite}>{t('user:avatar.view')}</span>
          </a>
          <a
            href="#h"
            className={classes.actionStyle}
            onClick={() => {
              setPopConfirmOpen(true)
              setAvatarId(el.id)
              setAvatarName(name as any)
            }}
          >
            <span className={classes.spanDange}>{t('user:avatar.delete')}</span>
          </a>
        </>
      )
    }
  }

  const rows = adminAvatars.value.map((el) => {
    return createData(el, el.sid, el.name, el.key)
  })

  const submitRemoveAvatar = async () => {
    await AvatarService.removeAdminAvatar(avatarId)
    setPopConfirmOpen(false)
  }

  const closeViewModel = (open: boolean) => {
    setViewModel(open)
  }

  return (
    <React.Fragment>
      <TableComponent
        rows={rows}
        column={avatarColumns}
        page={page}
        rowsPerPage={rowsPerPage}
        count={adminAvatarCount.value}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
      />
      {/* {avatarSelectMenuOpen && (
          <AvatarSelectMenu changeActiveMenu={() => setAvatarSelectMenuOpen(false)} isPublicAvatar={true} />
        )} */}

      <ConfirmModel
        popConfirmOpen={popConfirmOpen}
        handleCloseModel={handleCloseModel}
        submit={submitRemoveAvatar}
        name={avatarName}
        label={'avatar'}
      />
      {avatarAdmin && viewModel && (
        <ViewAvatar openView={viewModel} avatarData={avatarAdmin} closeViewModel={closeViewModel} />
      )}
    </React.Fragment>
  )
}

export default AvatarTable
