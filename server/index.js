const express = require('express')
const graphQLHTTP = require('express-graphql')
const DataLoader = require('dataloader')

const schema = require('./schema')

const axios = require('axios')
const legacyUrl = 'https://evening-dusk-76317.herokuapp.com'
const PORT = process.env.port || 3999

const getPersonById = async id => {
  if (typeof id === 'object') return id
  const req = `${legacyUrl}/person/${id}`
  return axios.get(req).then(res => res.data)
}

const app = express()

app.use(
  graphQLHTTP(req => {
    const personLoader = new DataLoader(keys =>
      Promise.all(keys.map(getPersonById))
    )

    const loaders = { person: personLoader }

    return {
      context: { loaders },
      schema,
      graphiql: true
    }
  })
)

app.listen(PIRT, () => console.log(`Serving GraphQL on ${PORT}`))
