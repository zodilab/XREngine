import React from 'react'
import { useTranslation } from 'react-i18next'

import { List } from '@mui/icons-material'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { useStyles } from '../../styles/ui'
import CreateBot from './CreateBot'
import DisplayBots from './DisplayBots'

const Bots = () => {
  const classes = useStyles()
  const { t } = useTranslation()

  return (
    <div>
      <Grid container={true} spacing={4}>
        <Grid item xs={12} md={6} sm={12}>
          <CreateBot />
        </Grid>

        <Grid item xs={12} md={6} sm={12}>
          <Card className={classes.botRoot}>
            <Paper className={classes.botHeader}>
              <Typography className={classes.botTitle}>
                <List className={classes.pTop5} />
                <span className={classes.mLeft10}> {t('admin:components.bot.xrEngineBots')} </span>
              </Typography>
            </Paper>
            <DisplayBots />
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default Bots
