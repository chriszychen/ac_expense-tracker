const express = require('express')
const router = express.Router()
const Record = require('../../models/record')
const { getDefaultDate, getInputDateString, getUnixTime, inputValidation } = require('../../public/javascripts/functions')

// render new page
router.get('/new', (req, res) => {
  const date = getDefaultDate()
  res.render('new', { date })
})

// CREATE function
router.post('/', (req, res) => {
  const userId = req.user._id
  const newRecord = Object.assign({ userId }, req.body)
  let validationError = false
  if (!inputValidation(newRecord)) {
    // display alert for validation error
    validationError = true
    res.render('new', { record: newRecord, validationError, date: newRecord.date })
  } else {
    newRecord.date = getUnixTime(newRecord.date)
    return Record.create(newRecord)
      .then(() => res.redirect('/'))
      .catch(err => console.log(err))
  }
})

// render edit page
router.get('/:id/edit', (req, res) => {
  const userId = req.user._id
  const _id = req.params.id
  Record.findOne({ _id, userId })
    .lean()
    .then(record => {
      record.date = getInputDateString(record.date)
      res.render('edit', { record })
    })
    .catch(err => console.log(err))
})

// UPDATE function
router.put('/:id', (req, res) => {
  const userId = req.user._id
  const _id = req.params.id
  const editedRecord = Object.assign({ _id, userId }, req.body) // pass the id to view template for next submit route
  let validationError = false
  if (!inputValidation(editedRecord)) {
    // display alert for validation error
    validationError = true
    res.render('edit', { record: editedRecord, validationError })
  } else {
    return Record.findOne({ _id, userId })
      .then(record => {
        Object.assign(record, editedRecord)
        record.date = getUnixTime(record.date)
        return record.save()
      })
      .then(() => res.redirect('/'))
      .catch(err => console.log(err))
  }
})

// DELETE function
router.delete('/:id', (req, res) => {
  const userId = req.user._id
  const _id = req.params.id
  Record.findOne({ _id, userId })
    .then(record => record.remove())
    .then(() => res.redirect('/'))
    .catch(err => console.log(err))
})

module.exports = router
