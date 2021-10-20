import { makeStyles, createStyles, Theme } from '@material-ui/core/styles'

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    indicator: {
      backgroundColor: 'white'
    },
    root: {
      backgroundColor: '#1f252d !important',
      width: '10rem',
      flexGrow: 1,
      padding: '20px'
    },
    whiteIcon: {
      color: '#f1f1f1'
    },
    createInviteBtn: {
      padding: '30px',
      position: 'fixed',
      bottom: '3rem',
      right: '2.5rem',
      background: '#3A4149',
      boxShadow: '0 0 4px rgb(0 0 0 / 60%)'
    },
    acceptInviteBtn: {
      margin: 'auto 5px',
      background: 'transparent',
      border: '0.5px solid #3A4149',
      color: '#f1f1f1 !important',
      width: '8rem'
    },
    rejectedBtn: {
      color: '#FF8C00',
      border: '1px solid #FF8C00',
      margin: 'auto 5px',
      background: 'transparent',
      width: '8rem'
    },
    button: {
      display: 'block',
      marginTop: theme.spacing(2)
    },
    formControl: {
      margin: theme.spacing(5),
      minWidth: 120,
      backgroundColor: 'transparent'
    },
    select: {
      display: 'flex'
    },
    rootList: {
      width: '100%',
      backgroundColor: '#43484F',
      position: 'relative'
    },
    createInput: {
      padding: '10px 5px',
      marginBottom: '2rem',
      marginTop: '15px',
      background: '#343b41',
      border: '1px solid #23282c',
      color: '#f1f1f1 !important'
    },
    input: {
      padding: '15px 5px',
      marginBottom: '15px',
      marginTop: '15px',
      background: '#343b41',
      border: '1px solid #23282c',
      color: '#f1f1f1 !important'
    },
    createBtn: {
      height: '50px',
      margin: 'auto 5px',
      background: 'rgb(58, 65, 73)',
      color: '#f1f1f1 !important'
    },
    mb10: {
      marginTop: '10%',
      padding: '0px'
    }
  })
)

export const useStyle = makeStyles({
  paper: {
    width: '50rem',
    padding: '0px'
  },
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: '#1f252d !important'
  },
  marginBottom: {
    marginBottom: '10px'
  },
  selectPaper: {
    background: '#343b41',
    color: '#f1f1f1'
  }
})
