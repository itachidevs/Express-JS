const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const path = require('path')
const sqlite = require('sqlite3')
let db = null
const dbpath = path.join(__dirname, 'covid19India.db')
const initializeDbandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite.Database,
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
  app.listen(3000, () => {
    console.log('Server started')
  })
}
initializeDbandServer()
const convertStateDBObjectToObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictObjectToObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
// API 1
app.get('/states/', async (request, response) => {
  let query, states
  query = 'SELECT * FROM state'
  states = await db.all(query)
  response.send(states.map(each => convertStateDBObjectToObject(each)))
})
// API 2
app.get('/states/:stateId/', async (request, response) => {
  let {stateId} = request.params
  // console.log(stateId)
  let query = `SELECT * FROM state WHERE state_id=${stateId};`
  let result = await db.get(query)
  // console.log(result)
  response.send(convertStateDBObjectToObject(result))
})
// API 3
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  let query = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths) VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(query)
  response.send('District Successfully Added')
})

// API 4
app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `SELECT * FROM district WHERE district_id=${districtId};`
  let result = await db.get(query)
  response.send(convertDistrictObjectToObject(result))
})
module.exports = app
// API 5
app.delete('/districts/:districtId', async (request, response) => {
  let {districtId} = request.params
  console.log(districtId)
  let query = `DELETE FROM district WHERE district_id=${districtId};`
  await db.run(query)
  response.send('District Removed')
})
//API 6
app.put('/districts/:districtId', async (request, response) => {
  let {districtId} = request.params
  let districtDetails = request.body
  console.log(districtId)
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  let query = `UPDATE district SET district_name ='${districtName}', state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId};`
  await db.run(query)
  response.send('District Details Updated')
})
// APP 7
app.get('/states/:stateId/stats/', async (request, response) => {
  let {stateId} = request.params
  let query = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths FROM district WHERE state_id=${stateId}`
  let stats = await db.all(query)
  console.log(stats)
  response.send(stats[0])
})
// API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  let query = `SELECT state.state_name AS stateName FROM state 
  INNER JOIN district  ON state.state_id=district.state_id WHERE district.district_id=${districtId}`
  let result = await db.get(query)
  // console.log()
  response.send(result)
})
