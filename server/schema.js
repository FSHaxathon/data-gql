const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require('graphql')

const logMe = (label, data) => {
  console.group(label)
  console.log(JSON.stringify(data, undefined, 2))
  console.groupEnd()
}

const toDate = dob => Date.parse(dob)

const noAncestors = person => {
  return person.id < 3 || (person.mother < 3 && person.father < 3)
}

const resolveSiblings = async (person, args, { loaders }) => {
  let father = person.father

  // We know this father has no siblings as a construct of our
  // generated data
  //
  if (father === undefined || noAncestors(father)) return []

  if (typeof father !== 'object') {
    father = await loaders.person.load(father)
  }

  const fathersChildren = await loaders.person.loadMany(father.children)
  const sibs = fathersChildren.filter(k => k.id !== person.id)

  return sibs
}

const PersonType = new GraphQLObjectType({
  name: 'Person',
  description: 'A human being who graced our world',

  fields: () => ({
    id: { type: GraphQLString },

    gender: { type: GraphQLString },

    firstName: { type: GraphQLString },

    lastName: { type: GraphQLString },

    email: { type: GraphQLString },

    dob: { type: GraphQLString },

    father: {
      type: PersonType,
      resolve: (person, args, { loaders }) => loaders.person.load(person.father)
    },

    mother: {
      type: PersonType,
      resolve: (person, args, { loaders }) => loaders.person.load(person.mother)
    },

    children: {
      type: new GraphQLList(PersonType),
      resolve: (person, args, { loaders }) =>
        loaders.person.loadMany(person.children)
    },

    siblings: {
      type: new GraphQLList(PersonType),
      resolve: resolveSiblings
    },

    // Father's older brothers
    // 伯父 bo2 fu3  / bakFu
    boFu: {
      type: new GraphQLList(PersonType),
      resolve: async (person, args, { loaders }) => {
        const father = await loaders.person.load(person.father)

        const siblingsOfFather = await resolveSiblings(father, args, {
          loaders
        })
        const ageFather = toDate(father.dob)

        // boFu are fathers older brothers
        return siblingsOfFather.filter(
          sibling => sibling.gender === 'M' && ageFather > toDate(sibling.dob)
        )
      }
    },

    // Father's younger brothers
    // 叔叔(shu1 shu1) /Suk Suk
    shuShu: {
      type: new GraphQLList(PersonType),
      resolve: async (person, args, { loaders }) => {
        const father = await loaders.person.load(person.father)

        // We know this father has no siblings as a construct of our
        // generated data
        //
        if (father.id === 1) return []

        const siblingsOfFather = await resolveSiblings(father, args, {
          loaders
        })
        const ageFather = toDate(father.dob)

        // shuShu are fathers younger brothers
        return siblingsOfFather.filter(
          sibling => sibling.gender === 'M' && ageFather < toDate(sibling.dob)
        )
      }
    },

    // Mother's father
    // Gung Gung
    //
    gungGung: {
      type: PersonType,
      resolve: async (person, args, { loaders }) => {
        // We know this father has no siblings as a construct of our
        // generated data
        //

        if (noAncestors(person)) return Sun

        const mother = await loaders.person.load(person.mother)
        if (noAncestors(mother)) return Sun

        const motherFather = await loaders.person.load(mother.father)
        return motherFather
      }
    },

    // Mother's Mother
    // Po Po
    //
    poPo: {
      type: new GraphQLList(PersonType),
      resolve: async (person, args, { loaders }) => {
        const father = await loaders.person.load(person.father)

        // We know this father has no siblings as a construct of our
        // generated data
        //
        if (father.id === 1) return []

        const siblingsOfFather = await resolveSiblings(father, args, {
          loaders
        })
        const ageFather = toDate(father.dob)

        // shuShu are fathers younger brothers
        return siblingsOfFather.filter(
          sibling => sibling.gender === 'M' && ageFather < toDate(sibling.dob)
        )
      }
    }
  })
})

const Family = new GraphQLObjectType({
  name: 'Family',
  description:
    "You didn't choose them, they didn't exactly choose you. FAMILY!",

  fields: () => ({
    person: {
      type: PersonType,
      args: {
        id: { type: GraphQLString }
      },
      resolve: (root, args, { loaders }) => loaders.person.load(args.id)
    }
  })
})

module.exports = new GraphQLSchema({
  // root Query
  query: Family
})
