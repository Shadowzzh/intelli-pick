// apps/api/src/graphql/schema.ts

export const typeDefs = `
  type Source {
    id: ID!
    name: String!
    type: String!
  }

  type Entity {
    id: ID!
    name: String!
    type: String!
    url: String
    description: String
    mentionCount: Int!
    metadata: JSON
    firstMentionedAt: String
    lastMentionedAt: String
  }

  type Content {
    id: ID!
    title: String
    summary: String
    rawContent: String!
    url: String!
    author: String
    category: String
    tags: [String!]!
    keyPoints: [String!]!
    dataPoints: [String!]!
    publishedAt: String
    collectedAt: String!
    createdAt: String!
    source: Source!
    entities: [Entity!]!
    aiScore: Float
  }

  type Query {
    contents(
      limit: Int = 20
      offset: Int = 0
      sources: [String!]
      minScore: Float
      sortBy: String
      searchQuery: String
    ): [Content!]!

    content(id: ID!): Content

    entities(
      limit: Int = 20
      offset: Int = 0
    ): [Entity!]!

    entity(id: ID!): Entity
  }

  scalar JSON
`;
