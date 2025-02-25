import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'

import { ProjectService, useProjectState } from '../../../common/services/ProjectService'
import { useAuthState } from '../../../user/services/AuthService'
import { GithubAppService, useGithubAppState } from '../../services/GithubAppService'
import { useStyles } from '../../styles/ui'
import styles from './Projects.module.scss'
import ProjectTable from './ProjectTable'
import UploadProjectModal from './UploadProjectModal'

if (!global.setImmediate) {
  global.setImmediate = setTimeout as any
}

const Projects = () => {
  const classes = useStyles()
  const authState = useAuthState()
  const user = authState.user
  const adminProjectState = useProjectState()
  const githubAppState = useGithubAppState()
  const githubAppRepos = githubAppState.repos.value
  const { t } = useTranslation()
  const [uploadProjectsModalOpen, setUploadProjectsModalOpen] = useState(false)

  const onOpenUploadModal = () => {
    GithubAppService.fetchGithubAppRepos()
    setUploadProjectsModalOpen(true)
  }

  useEffect(() => {
    if (user?.id.value != null && adminProjectState.updateNeeded.value === true) {
      ProjectService.fetchProjects()
    }
  }, [adminProjectState.updateNeeded.value])

  return (
    <div>
      <Paper className={styles.adminRoot}>
        <Grid container spacing={3} className={styles.marginBottom}>
          <Grid item xs={6}>
            <Button
              className={styles['open-modal']}
              type="button"
              variant="contained"
              color="primary"
              onClick={onOpenUploadModal}
            >
              {t('admin:components.project.addProject')}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              className={styles['open-modal']}
              type="button"
              variant="contained"
              color="primary"
              onClick={ProjectService.triggerReload}
            >
              {t('admin:components.project.rebuild')}
            </Button>
          </Grid>
        </Grid>
        <div className={classes.rootTable}>
          <ProjectTable />
        </div>
        <UploadProjectModal
          repos={githubAppRepos}
          open={uploadProjectsModalOpen}
          handleClose={() => setUploadProjectsModalOpen(false)}
        />
      </Paper>
    </div>
  )
}

export default Projects
