const express = require('express')
const router = express.Router()
const moment = require('moment')
const Record = require('../../models/record')
const Category = require('../../models/category')
const { getAccountingFormat, getTotalAmount, getIconClassName } = require('../../public/javascripts/helpers')

// render index page
router.get('/', (req, res) => {
  const userId = req.user._id
  Promise.all([Record.find({ userId }).lean().sort('-date'), Category.find().lean()])
    .then((results) => {
      const [records, categories] = results
      const totalAmount = getAccountingFormat(getTotalAmount(records))
      const defaultStartDate = '2021-01-01'
      const today = moment().format('YYYY-MM-DD')
      records.forEach((record) => {
        record.iconClass = getIconClassName(record.category, categories)
        record.date = moment(record.date).format('YYYY-MM-DD')
      })
      res.render('index', { records, totalAmount, startDate: defaultStartDate, endDate: today })
    })
    .catch((err) => console.log(err))
})

module.exports = router
