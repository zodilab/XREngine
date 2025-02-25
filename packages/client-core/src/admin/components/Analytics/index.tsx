import clsx from 'clsx'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import DateAdapter from '@mui/lab/AdapterMoment'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import MobileDateTimePicker from '@mui/lab/MobileDateTimePicker'
import { Box, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { Theme } from '@mui/material/styles'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useAuthState } from '../../../user/services/AuthService'
import { useAnalyticsState } from '../../services/AnalyticsService'
import { AnalyticsService } from '../../services/AnalyticsService'
import ActivityGraph from './ActivityGraph'
import Card from './CardNumber'
import UserGraph from './UserGraph'

interface Props {}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
      height: '35rem',
      width: '99.9%',
      backgroundColor: '#323845'
    },
    mtopp: {
      marginTop: '20px'
    },
    btn: {
      color: 'white',
      borderColor: 'white',
      fontSize: '0.875rem',
      [theme.breakpoints.down('md')]: {
        fontSize: '0.6rem'
      }
    },
    btnSelected: {
      color: 'white !important',
      borderColor: 'white',
      backgroundColor: '#0000004d !important'
    },
    dashboardCardsContainer: {
      display: 'grid',
      gridGap: '10px',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      ['@media (max-width: 900px)']: {
        gridTemplateColumns: '1fr 1fr 1fr'
      },
      ['@media (max-width: 700px)']: {
        gridTemplateColumns: '1fr 1fr'
      },
      ['@media (max-width: 500px)']: {
        gridTemplateColumns: '1fr'
      }
    },
    datePickerContainer: {
      display: 'flex',
      margin: '10px 0px',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end'
    }
  })
)

/**
 * Function for analytics on admin dashboard
 *
 * @returns @ReactDomElements
 * @author Kevin KIMENYI <kimenyikevin@gmail.com>
 */

const Analytics = (props: Props) => {
  const [refetch, setRefetch] = useState(false)
  const { t } = useTranslation()
  const [graphSelector, setGraphSelector] = useState('activity')
  const analyticsState = useAnalyticsState()

  const [endDate, setEndDate] = useState(moment())
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days'))

  const activeLocations = analyticsState.activeLocations.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const activeParties = analyticsState.activeParties.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const activeScenes = analyticsState.activeScenes.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const activeInstances = analyticsState.activeInstances.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const instanceUsers = analyticsState.instanceUsers.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const channelUsers = analyticsState.channelUsers.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const dailyUsers = analyticsState.dailyUsers.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })
  const dailyNewUsers = analyticsState.dailyNewUsers.value.map((item) => {
    return [new Date(item.createdAt).getTime(), item.count]
  })

  const activityGraphData = [
    {
      name: t('admin:components.analytics.activeParties'),
      data: activeParties
    },
    {
      name: t('admin:components.analytics.activeLocations'),
      data: activeLocations
    },
    {
      name: t('admin:components.analytics.activeInstances'),
      data: activeInstances
    },
    {
      name: t('admin:components.analytics.activeScenes'),
      data: activeScenes
    },
    {
      name: t('admin:components.analytics.instanceUsers'),
      data: instanceUsers
    },
    {
      name: t('admin:components.analytics.channelUsers'),
      data: channelUsers
    }
  ]

  const userGraphData = [
    {
      name: t('admin:components.analytics.dailyUsers'),
      data: dailyUsers
    },
    {
      name: t('admin:components.analytics.dailyNewUsers'),
      data: dailyNewUsers
    }
  ]

  useEffect(() => {
    if (refetch === true && startDate < endDate) {
      AnalyticsService.fetchActiveParties(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchInstanceUsers(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchChannelUsers(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchActiveLocations(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchActiveScenes(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchActiveInstances(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchDailyUsers(startDate?.toDate(), endDate?.toDate())
      AnalyticsService.fetchDailyNewUsers(startDate?.toDate(), endDate?.toDate())
      setRefetch(false)
    }
  }, [refetch, startDate, endDate])

  const authState = useAuthState()

  useEffect(() => {
    if (authState.isLoggedIn.value) setRefetch(true)
  }, [authState.isLoggedIn.value])

  const onDateRangeStartChange = (value) => {
    setStartDate(value)
    setRefetch(true)
  }

  const onDateRangeEndChange = (value) => {
    setEndDate(value)
    setRefetch(true)
  }

  const classes = useStyles()
  const data = [
    {
      number: activeParties[activeParties.length - 1] ? activeParties[activeParties.length - 1][1] : 0,
      label: t('admin:components.analytics.activeParties'),
      color1: '#2c519d',
      color2: '#31288f'
    },
    {
      number: activeLocations[activeLocations.length - 1] ? activeLocations[activeLocations.length - 1][1] : 0,
      label: t('admin:components.analytics.activeLocations'),
      color1: '#77b2e9',
      color2: '#458bcc'
    },
    {
      number: activeScenes[activeScenes.length - 1] ? activeScenes[activeScenes.length - 1][1] : 0,
      label: t('admin:components.analytics.activeScenes'),
      color1: '#e3b76c',
      color2: '#df9b26'
    },
    {
      number: activeInstances[activeInstances.length - 1] ? activeInstances[activeInstances.length - 1][1] : 0,
      label: t('admin:components.analytics.activeInstances'),
      color1: '#ed7d7e',
      color2: '#c95859'
    },
    {
      number: dailyUsers[dailyUsers.length - 1] ? dailyUsers[dailyUsers.length - 1][1] : 0,
      label: t('admin:components.analytics.usersToday'),
      color1: '#53a7cd',
      color2: '#24779c'
    },
    {
      number: dailyNewUsers[dailyNewUsers.length - 1] ? dailyNewUsers[dailyNewUsers.length - 1][1] : 0,
      label: t('admin:components.analytics.newUsersToday'),
      color1: '#9771d3',
      color2: '#6945a1'
    }
  ]

  const tempStartDate = moment(startDate)
  const minEndDate = moment(tempStartDate.startOf('day').add(1, 'day'))

  return (
    <>
      <div className={classes.dashboardCardsContainer}>
        {data.map((el) => {
          return <Card key={el.label} data={el} />
        })}
      </div>
      <div className={classes.mtopp}>
        <div className={classes.paper}>
          <ToggleButtonGroup value={graphSelector} exclusive color="primary" aria-label="outlined primary button group">
            <ToggleButton
              className={clsx(classes.btn, {
                [classes.btnSelected]: graphSelector === 'activity'
              })}
              value="activity"
              onClick={() => setGraphSelector('activity')}
            >
              Activity
            </ToggleButton>
            <ToggleButton
              className={clsx(classes.btn, {
                [classes.btnSelected]: graphSelector === 'users'
              })}
              value="users"
              onClick={() => setGraphSelector('users')}
            >
              Users
            </ToggleButton>
          </ToggleButtonGroup>
          <div className={classes.datePickerContainer}>
            <LocalizationProvider dateAdapter={DateAdapter}>
              <MobileDateTimePicker
                value={startDate}
                onChange={(value) => onDateRangeStartChange(value)}
                renderInput={(params) => <TextField {...params} />}
              />
              <Box sx={{ mx: 2 }}> to </Box>
              <MobileDateTimePicker
                value={endDate}
                minDateTime={minEndDate}
                onChange={(value) => onDateRangeEndChange(value)}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </div>
          {graphSelector === 'activity' && (
            <ActivityGraph data={activityGraphData} startDate={startDate?.toDate()} endDate={endDate?.toDate()} />
          )}
          {graphSelector === 'users' && (
            <UserGraph data={userGraphData} startDate={startDate?.toDate()} endDate={endDate?.toDate()} />
          )}
        </div>
      </div>
    </>
  )
}

export default Analytics
