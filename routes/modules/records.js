const express = require('express')
const router = express.Router()
const Record = require('../../models/record')
const Category = require('../../models/category')
const { getAccountFormat, getTotalAmount, getIconClass, getDefaultDate, getInputDateString, getUnixTime, inputValidation } = require('../../public/javascripts/functions')

// render filtered records
router.get('/filter', (req, res) => {
  const categoryFilter = req.query.category
  let { startDate, endDate } = req.query
  startDate = startDate || '2018-01-01'
  endDate = endDate || getDefaultDate()
  if (getUnixTime(startDate) > getUnixTime(endDate)) {
    [startDate, endDate] = [endDate, startDate]
  }

  Promise.all([Record.find({ category: { $regex: categoryFilter }, date: { $gte: getUnixTime(startDate), $lt: getUnixTime(endDate) } }).lean().sort('-date'), Category.find().lean()])
    .then(results => {
      const [filteredRecords, categories] = results
      const totalAmount = getAccountFormat(getTotalAmount(filteredRecords))
      filteredRecords.forEach(record => {
        record.iconClass = getIconClass(record.category, categories)
        record.date = getInputDateString(record.date)
      })
      res.render('index', { records: filteredRecords, totalAmount, categoryFilter, startDate, endDate })
    })
    .catch(err => console.log(err))
})

// render new page
router.get('/new', (req, res) => {
  const date = getDefaultDate()
  res.render('new', { date })
})

// CREATE function
router.post('/', (req, res) => {
  const record = req.body
  let validationError = false
  if (!inputValidation(record)) {
    // display alert for validation error
    validationError = true
    res.render('new', { record, validationError, date: record.date })
  } else {
    record.date = getUnixTime(record.date)
    return Record.create(record)
      .then(() => res.redirect('/'))
      .catch(err => console.log(err))
  }
})

// render edit page
router.get('/:id/edit', (req, res) => {
  const id = req.params.id
  Record.findById(id)
    .lean()
    .then(record => {
      record.date = getInputDateString(record.date)
      res.render('edit', { record })
    })
    .catch(err => console.log(err))
})

// UPDATE function
router.put('/:id', (req, res) => {
  const id = req.params.id
  const editedRecord = Object.assign({ _id: id }, req.body) // pass the id to view template for next submit route
  let validationError = false
  if (!inputValidation(editedRecord)) {
    // display alert for validation error
    validationError = true
    res.render('edit', { record: editedRecord, validationError })
  } else {
    return Record.findById(id)
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
  const id = req.params.id
  Record.findById(id)
    .then(record => record.remove())
    .then(() => res.redirect('/'))
    .catch(err => console.log(err))
})

module.exports = router
