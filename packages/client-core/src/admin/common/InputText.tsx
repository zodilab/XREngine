import _ from 'lodash'
import React from 'react'

import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'

import { useStyles } from '../styles/ui'

interface Props {
  value: string
  formErrors: string
  handleInputChange: (e: any) => void
  name: string
}

const InputText = ({ value, handleInputChange, formErrors, name }: Props) => {
  const classes = useStyles()
  return (
    <React.Fragment>
      <label>{_.upperFirst(name)}</label>
      <Paper component="div" className={formErrors.length > 0 ? classes.redBorder : classes.createInput}>
        <InputBase
          name={name}
          className={classes.input}
          placeholder={`Enter ${name}`}
          style={{ color: '#fff' }}
          value={value}
          onChange={handleInputChange}
        />
      </Paper>
    </React.Fragment>
  )
}

export default InputText
